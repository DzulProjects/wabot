require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Import enhanced AI system with database integration
const dbManager = require('./database');
const aiService = require('./ai_service');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for rate limiting (when behind reverse proxy/load balancer)
if (NODE_ENV === 'production' || process.env.TRUST_PROXY) {
    app.set('trust proxy', 1); // Trust first proxy
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"]
        }
    }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);
app.use('/webhook/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static('public', {
    maxAge: NODE_ENV === 'production' ? '1d' : '0'
}));

// Database initialization
let databaseReady = false;

// Initialize database connection on startup
async function initializeDatabase() {
    try {
        await dbManager.initialize();
        databaseReady = true;
        console.log('✅ Enhanced AI system with database ready');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️ Falling back to basic AI responses without database features');
        databaseReady = false;
    }
}

// Health check for deployment platforms
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
    });
});

// Main webhook - receives messages from n8n or WhatsApp services
app.post('/webhook/message', async (req, res) => {
    try {
        console.log('📨 Received message:', JSON.stringify(req.body, null, 2));
        
        const { message, from, to, messageId } = req.body;
        
        if (!message || !from) {
            return res.status(400).json({ 
                error: 'Missing required fields: message, from' 
            });
        }

        // Get enhanced AI response using RAG system
        let aiResponse, aiMetadata = {};
        
        if (databaseReady) {
            // Use enhanced AI with database integration
            const conversationHistory = await dbManager.getConversationHistory(from, 10);
            const enhancedResult = await aiService.getEnhancedResponse(message, from, conversationHistory);
            
            aiResponse = enhancedResult.response;
            aiMetadata = {
                intent: enhancedResult.intent,
                knowledgeUsed: enhancedResult.knowledgeUsed,
                responseTime: enhancedResult.responseTime,
                model: enhancedResult.model
            };
            
            console.log(`🤖 Enhanced AI Response - Intent: ${enhancedResult.intent}, Knowledge Used: ${enhancedResult.knowledgeUsed}, Model: ${enhancedResult.model}`);
        } else {
            // Fallback to basic AI response
            aiResponse = await getBasicAIResponse(message, from);
        }
        
        // Send response via n8n webhook if configured
        if (process.env.N8N_WEBHOOK_URL) {
            await sendToN8N({
                to: from,
                message: aiResponse,
                originalMessageId: messageId
            });
        }
        
        res.json({
            success: true,
            response: aiResponse,
            from: from,
            timestamp: new Date().toISOString(),
            metadata: databaseReady ? aiMetadata : { model: 'basic', databaseEnabled: false }
        });
        
    } catch (error) {
        console.error('❌ Error processing message:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message 
        });
    }
});

// Proxy endpoint for WhatsApp API to bypass CORS
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        console.log('📱 WhatsApp API Request:', JSON.stringify(req.body, null, 2));
        
        // Forward the request to wabot.my API
        const response = await axios.post('https://app.wabot.my/api/send', req.body, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WABOT-Proxy/1.0'
            },
            timeout: 30000
        });
        
        console.log('📱 WhatsApp API Response:', response.status, response.data);
        res.json(response.data);
        
    } catch (error) {
        console.error('📱 WhatsApp API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            status: 'error',
            message: error.response?.data?.message || error.message || 'Failed to send WhatsApp message'
        });
    }
});

// API endpoint to send messages directly
app.post('/api/send', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: to, message' 
            });
        }

        // Send to n8n
        const result = await sendToN8N({ to, message });
        
        res.json({
            success: true,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Send error:', error);
        res.status(500).json({ 
            error: 'Failed to send message',
            details: error.message 
        });
    }
});

// KWAP Pension Inquiry API endpoint
app.post('/api/kwap/inquiry', async (req, res) => {
    try {
        console.log('📋 KWAP inquiry request:', req.body);
        
        const { nokp } = req.body;
        
        if (!nokp) {
            return res.status(400).json({ 
                error: 'Missing required field: nokp (IC number)' 
            });
        }
        
        // Validate nokp format (minimum 4 digits, maximum 15 digits)
        if (!/^\d{4,15}$/.test(nokp)) {
            return res.status(400).json({ 
                error: 'Invalid IC number format. Must be between 4 and 15 digits.' 
            });
        }
        
        // Make SOAP request to KWAP API
        const pensionInfo = await getKWAPPensionInfo(nokp);
        
        if (!pensionInfo) {
            return res.status(404).json({ 
                error: 'No pension information found for this IC number' 
            });
        }
        
        res.json({
            success: true,
            pensionerInfo: pensionInfo,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ KWAP inquiry error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve pension information',
            details: error.message 
        });
    }
});

// Get conversation history
app.get('/api/conversation/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        
        if (databaseReady) {
            // Get history from database
            const history = await dbManager.getConversationHistory(phoneNumber, 20);
            const profile = await dbManager.getUserProfile(phoneNumber);
            
            res.json({ 
                phoneNumber,
                history: history,
                profile: profile ? {
                    name: profile.name,
                    totalMessages: profile.total_messages,
                    lastInteraction: profile.last_interaction
                } : null,
                databaseEnabled: true
            });
        } else {
            // Fallback to empty history
            res.json({ 
                phoneNumber,
                history: [],
                profile: null,
                databaseEnabled: false,
                message: 'Database not available - conversation history not stored'
            });
        }
    } catch (error) {
        console.error('❌ Conversation history error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve conversation history',
            details: error.message 
        });
    }
});

// Knowledge Base Management API endpoints
app.get('/api/admin/knowledge', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { category, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let sql = 'SELECT * FROM knowledge_base WHERE 1=1';
        let params = [];
        
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        
        if (search) {
            sql += ' AND (keywords LIKE ? OR question LIKE ? OR answer LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        sql += ' ORDER BY priority DESC, created_at DESC LIMIT ' + parseInt(limit) + ' OFFSET ' + offset;
        // params.push(parseInt(limit), offset);
        
        const results = await dbManager.query(sql, params);
        
        // Get total count for pagination
        let countSql = 'SELECT COUNT(*) as total FROM knowledge_base WHERE 1=1';
        let countParams = [];
        
        if (category) {
            countSql += ' AND category = ?';
            countParams.push(category);
        }
        
        if (search) {
            countSql += ' AND (keywords LIKE ? OR question LIKE ? OR answer LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        
        const countResult = await dbManager.query(countSql, countParams);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('❌ Knowledge base fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch knowledge base',
            details: error.message 
        });
    }
});

app.post('/api/admin/knowledge', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { category, keywords, question, answer, priority = 1 } = req.body;
        
        if (!category || !keywords || !question || !answer) {
            return res.status(400).json({ 
                error: 'Missing required fields: category, keywords, question, answer' 
            });
        }
        
        const result = await dbManager.addKnowledge(category, keywords, question, answer, priority);
        
        res.json({
            success: true,
            id: result.insertId,
            message: 'Knowledge base entry created successfully'
        });
        
    } catch (error) {
        console.error('❌ Knowledge base creation error:', error);
        res.status(500).json({ 
            error: 'Failed to create knowledge base entry',
            details: error.message 
        });
    }
});

app.put('/api/admin/knowledge/:id', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        const { category, keywords, question, answer, priority, is_active } = req.body;
        
        const sql = `
            UPDATE knowledge_base 
            SET category = ?, keywords = ?, question = ?, answer = ?, priority = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        await dbManager.query(sql, [category, keywords, question, answer, priority, is_active, id]);
        
        res.json({
            success: true,
            message: 'Knowledge base entry updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Knowledge base update error:', error);
        res.status(500).json({ 
            error: 'Failed to update knowledge base entry',
            details: error.message 
        });
    }
});

app.delete('/api/admin/knowledge/:id', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { id } = req.params;
        
        await dbManager.query('DELETE FROM knowledge_base WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Knowledge base entry deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Knowledge base deletion error:', error);
        res.status(500).json({ 
            error: 'Failed to delete knowledge base entry',
            details: error.message 
        });
    }
});

// Analytics API endpoints
app.get('/api/admin/analytics', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { startDate, endDate } = req.query;
        
        // Get various analytics metrics
        const [responseTime, knowledgeHits, intents, totalConversations, totalUsers] = await Promise.all([
            dbManager.getAnalytics('response_time', startDate, endDate),
            dbManager.getAnalytics('knowledge_base_hits', startDate, endDate),
            dbManager.getAnalytics('intent_detected', startDate, endDate),
            dbManager.query(`
                SELECT COUNT(*) as count 
                FROM conversations 
                WHERE created_at >= COALESCE(?, '1970-01-01') 
                AND created_at <= COALESCE(?, NOW())
            `, [startDate, endDate]),
            dbManager.query(`
                SELECT COUNT(DISTINCT phone_number) as count 
                FROM conversations 
                WHERE created_at >= COALESCE(?, '1970-01-01') 
                AND created_at <= COALESCE(?, NOW())
            `, [startDate, endDate])
        ]);
        
        res.json({
            success: true,
            analytics: {
                responseTime: responseTime || { avg_value: 0, count: 0 },
                knowledgeHits: knowledgeHits || { avg_value: 0, count: 0 },
                intents: intents || { avg_value: 0, count: 0 },
                totalConversations: totalConversations[0].count,
                totalUsers: totalUsers[0].count
            },
            period: { startDate, endDate }
        });
        
    } catch (error) {
        console.error('❌ Analytics fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch analytics',
            details: error.message 
        });
    }
});

// Database status endpoint
app.get('/api/admin/database-status', async (req, res) => {
    try {
        const status = await dbManager.getConnectionStatus();
        
        res.json({
            success: true,
            database: {
                connected: status.connected,
                ready: databaseReady,
                poolStats: status.pool_stats,
                error: status.error
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to check database status',
            details: error.message 
        });
    }
});

// User analytics endpoint
app.get('/api/admin/users/:phoneNumber/analytics', async (req, res) => {
    try {
        if (!databaseReady) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        const { phoneNumber } = req.params;
        const analytics = await aiService.getConversationAnalytics(phoneNumber);
        
        res.json({
            success: true,
            phoneNumber,
            analytics
        });
        
    } catch (error) {
        console.error('❌ User analytics error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user analytics',
            details: error.message 
        });
    }
});

// Basic AI Response Function (fallback when database is not available)
async function getBasicAIResponse(message, from) {
    try {
        // Create minimal conversation context for this request only
        const history = [{
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        }];
        
        // Prepare AI request based on configured service
        let aiResponse;
        
        if (process.env.OPENAI_API_KEY) {
            aiResponse = await getOpenAIResponse(history);
        } else if (process.env.GEMINI_API_KEY) {
            aiResponse = await getGeminiResponse(history);
        } else {
            // Fallback: Simple rule-based responses
            aiResponse = getSimpleResponse(message);
        }
        
        return aiResponse;
        
    } catch (error) {
        console.error('AI Response Error:', error);
        return "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment.";
    }
}

// OpenAI Integration
async function getOpenAIResponse(history) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: `You are a helpful AI assistant. Keep responses concise and friendly. 
                You're responding via WhatsApp, so keep messages under 300 characters when possible.
                Always be helpful, polite, and professional.`
            },
            ...history.map(h => ({
                role: h.role,
                content: h.content
            }))
        ],
        max_tokens: 500,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data.choices[0].message.content;
}

// Gemini Integration  
async function getGeminiResponse(history) {
    const prompt = history.map(h => `${h.role}: ${h.content}`).join('\n') + '\nassistant:';
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        contents: [{
            parts: [{
                text: `You are a helpful AI assistant responding via WhatsApp. Keep responses concise and friendly.\n\n${prompt}`
            }]
        }]
    });
    
    return response.data.candidates[0].content.parts[0].text;
}

// Simple fallback responses (no AI API needed)
function getSimpleResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return 'Hello! 👋 How can I help you today?';
    }
    
    if (msg.includes('help') || msg.includes('support')) {
        return `I'm here to help! You can ask me about:
• General questions
• Information requests  
• Simple conversations

What would you like to know?`;
    }
    
    if (msg.includes('time')) {
        return `Current time is: ${new Date().toLocaleString()}`;
    }
    
    if (msg.includes('weather')) {
        return "I don't have access to weather data right now, but I can help with other questions!";
    }
    
    if (msg.includes('bye') || msg.includes('goodbye')) {
        return 'Goodbye! 👋 Feel free to message me anytime if you need help.';
    }
    
    if (msg.includes('thank')) {
        return "You're welcome! 😊 Is there anything else I can help you with?";
    }
    
    // Default response
    return `Thanks for your message! I received: "${message}"

I'm a simple AI assistant. Try asking me about:
• General questions
• Current time
• Help or support

Or just say "hi" to start a conversation! 😊`;
}

// KWAP Pension Information Function
async function getKWAPPensionInfo(nokp) {
    const kwapApiKey = process.env.KWAP_API_KEY || 'b3551b34-68b1-4717-b290-0a26ac7f7bbc';
    const kwapApiUrl = process.env.KWAP_API_URL || 'https://apim.kwap.my/ws/PortalServiceInquireEmass/1.0';
    
    console.log('🏛️ Making KWAP API request for nokp:', nokp);
    
    try {
        // Create SOAP request
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soap:Header/>
   <soap:Body>
      <tem:InquireEmass>
         <tem:nokp>${nokp}</tem:nokp>
      </tem:InquireEmass>
   </soap:Body>
</soap:Envelope>`;
        
        // Make SOAP request
        const response = await axios.post(`${kwapApiUrl}?apikey=${kwapApiKey}`, soapEnvelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/InquireEmass'
            },
            timeout: 30000
        });
        
        console.log('✅ KWAP API Response received');
        
        // Parse XML response
        const parsedData = parseKWAPResponse(response.data);
        
        return parsedData;
        
    } catch (error) {
        console.error('❌ KWAP API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to retrieve pension information');
    }
}

// Parse KWAP SOAP XML Response
function parseKWAPResponse(xmlData) {
    try {
        // Simple XML parsing - extract data between tags
        const extractValue = (xml, tagName) => {
            const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i');
            const match = xml.match(regex);
            return match ? match[1].trim() : null;
        };
        
        const extractAllValues = (xml, tagName) => {
            const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'gi');
            const matches = xml.match(regex);
            return matches ? matches.map(match => {
                const valueMatch = match.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`, 'i'));
                return valueMatch ? valueMatch[1].trim() : null;
            }) : [];
        };
        
        // Check if response contains data
        if (!xmlData.includes('<InquireEmassResult>') || xmlData.includes('<InquireEmassResult/>')) {
            return null; // No data found
        }
        
        // Extract main pensioner information
        const pensionerInfo = {
            // Personal Information
            name: extractValue(xmlData, 'Name'),
            currentIdNo: extractValue(xmlData, 'CurrentIdNo'),
            oldIdNo: extractValue(xmlData, 'OldIdNo'),
            birthDate: extractValue(xmlData, 'BirthDate'),
            gender: extractValue(xmlData, 'Gender'),
            raceCode: extractValue(xmlData, 'RaceCode'),
            religionCode: extractValue(xmlData, 'ReligionCode'),
            deathSts: extractValue(xmlData, 'DeathSts'),
            deseaseDate: extractValue(xmlData, 'DeseaseDate'),
            
            // Service Information
            serviceTypeDesc: extractValue(xmlData, 'ServiceTypeDesc'),
            deptName: extractValue(xmlData, 'DeptName'),
            deptDesc: extractValue(xmlData, 'DeptDesc'),
            firstAppointDate: extractValue(xmlData, 'FirstAppointDate'),
            lastDesignation: extractValue(xmlData, 'LastDesignation'),
            lastSalary: extractValue(xmlData, 'LastSalary'),
            tpTotal: extractValue(xmlData, 'TpTotal'),
            
            // Pension Information
            pensionAccNo: extractValue(xmlData, 'PensionAccNo'),
            fileNo: extractValue(xmlData, 'FileNo'),
            pensionDate: extractValue(xmlData, 'PensionDate'),
            paymentStartDate: extractValue(xmlData, 'PaymentStartDate'),
            paymentStopDate: extractValue(xmlData, 'PaymentStopDate'),
            currentPaymentMethod: extractValue(xmlData, 'CurrentPaymentMethod'),
            recordSts: extractValue(xmlData, 'RecordSts'),
            retireTypeDesc: extractValue(xmlData, 'RetireTypeDesc'),
            pensionerType: extractValue(xmlData, 'PensionerType'),
            managingDeptCode: extractValue(xmlData, 'ManagingDeptCode')
        };
        
        // Extract dependent information
        const dependents = [];
        const dependentNames = extractAllValues(xmlData, 'DependantName');
        const dependentICs = extractAllValues(xmlData, 'DependantCurrentIdNo');
        const dependentGenders = extractAllValues(xmlData, 'DependantGender');
        const dependentRelationships = extractAllValues(xmlData, 'RelationShipDesc');
        const dependentBirthDates = extractAllValues(xmlData, 'DependantBirthDate');
        const dependentMarriageDates = extractAllValues(xmlData, 'MarriageDate');
        const dependentPensionAccNos = extractAllValues(xmlData, 'DependantPensionAccNo');
        
        for (let i = 0; i < dependentNames.length; i++) {
            if (dependentNames[i] && dependentNames[i] !== '') {
                dependents.push({
                    name: dependentNames[i],
                    currentIdNo: dependentICs[i] || null,
                    gender: dependentGenders[i] || null,
                    relationShipDesc: dependentRelationships[i] || null,
                    birthDate: dependentBirthDates[i] || null,
                    marriageDate: dependentMarriageDates[i] || null,
                    pensionAccNo: dependentPensionAccNos[i] || null
                });
            }
        }
        
        pensionerInfo.dependents = dependents;
        
        console.log('📋 Parsed pensioner info for:', pensionerInfo.name);
        return pensionerInfo;
        
    } catch (error) {
        console.error('❌ XML parsing error:', error);
        throw new Error('Failed to parse pension information');
    }
}

// Poslaju Tracking API
app.post('/api/poslaju/track', async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        
        if (!trackingNumber) {
            return res.status(400).json({ 
                error: 'Tracking number is required',
                success: false 
            });
        }
        
        // Validate tracking number format
        const sanitizedTrackingNumber = trackingNumber.toString().trim().toUpperCase();
        
        if (sanitizedTrackingNumber.length < 5) {
            return res.status(400).json({ 
                error: 'Tracking number must be at least 5 characters',
                success: false 
            });
        }
        
        console.log('📦 Poslaju tracking request for:', sanitizedTrackingNumber);
        
        // Get tracking information
        const trackingData = await getPoslajuTrackingInfo(sanitizedTrackingNumber);
        
        res.json({
            success: true,
            trackingNumber: sanitizedTrackingNumber,
            trackingInfo: trackingData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Poslaju tracking error:', error);
        
        // Handle different error types
        let statusCode = 500;
        let errorMessage = error.message || 'Failed to retrieve tracking information';
        
        if (error.message.includes('not found') || error.message.includes('404')) {
            statusCode = 404;
            errorMessage = 'Tracking number not found in Poslaju system';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
            statusCode = 401;
            errorMessage = 'Authentication error with Poslaju API';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
            statusCode = 503;
            errorMessage = 'Poslaju tracking service is temporarily unavailable';
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            trackingNumber: req.body.trackingNumber
        });
    }
});

// Poslaju Tracking Function
async function getPoslajuTrackingInfo(trackingNumber) {
    const poslajuClientId = process.env.POSLAJU_CLIENT_ID || '605840cf-ecd7-4803-b2cc-875469b7d548';
    const poslajuClientSecret = process.env.POSLAJU_CLIENT_SECRET || 'd41dd72c-d339-4060-8982-05065189269c';
    const poslajuApiUrl = process.env.POSLAJU_API_URL || 'https://api-dev.pos.com.my';
    
    console.log('📦 Making Poslaju API request for tracking number:', trackingNumber);
    
    try {
        // First, try to get an authentication token (if required)
        let authToken = null;
        
        // Try different authentication methods based on API documentation
        const authMethods = [
            // Method 1: Bearer token with client ID
            () => ({ 'Authorization': `Bearer ${poslajuClientId}` }),
            // Method 2: API Key header
            () => ({ 'X-API-Key': poslajuClientId }),
            // Method 3: Basic Auth
            () => ({ 'Authorization': `Basic ${Buffer.from(`${poslajuClientId}:${poslajuClientSecret}`).toString('base64')}` })
        ];
        
        // Try each authentication method
        for (const getHeaders of authMethods) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...getHeaders()
                };
                
                console.log('🔐 Trying authentication method...');
                
                // Make tracking request
                const response = await axios.get(
                    `${poslajuApiUrl}/as2corporate/tracking-event-list/v1/api/TrackingEventList`, 
                    {
                        headers,
                        params: {
                            trackingNumber: trackingNumber
                        },
                        timeout: 30000
                    }
                );
                
                console.log('✅ Poslaju API Response received:', response.status);
                
                // Parse the response
                const trackingData = parsePoslajuResponse(response.data, trackingNumber);
                return trackingData;
                
            } catch (authError) {
                console.log('❌ Auth method failed:', authError.response?.status || authError.message);
                
                // If it's not an auth error, break and throw
                if (authError.response?.status !== 401 && authError.response?.status !== 403) {
                    throw authError;
                }
                
                continue; // Try next auth method
            }
        }
        
        // If all auth methods failed, throw an auth error
        throw new Error('Unable to authenticate with Poslaju API. Please check credentials.');
        
    } catch (error) {
        console.error('❌ Poslaju API Error:', error.response?.data || error.message);
        
        // Handle specific error cases
        if (error.response?.status === 404) {
            throw new Error(`Tracking number ${trackingNumber} not found in Poslaju system`);
        } else if (error.response?.status === 401 || error.response?.status === 403) {
            throw new Error('Authentication failed with Poslaju API');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('Unable to connect to Poslaju tracking service');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - Poslaju service is not responding');
        }
        
        throw new Error(error.response?.data?.message || error.message || 'Failed to retrieve tracking information');
    }
}

// Parse Poslaju API Response
function parsePoslajuResponse(data, trackingNumber) {
    try {
        // Handle different response formats
        let trackingInfo = {};
        
        if (Array.isArray(data)) {
            // Response is an array of tracking events
            const events = data.map(event => ({
                status: event.status || event.eventDescription || 'Status Update',
                timestamp: event.eventDate || event.timestamp || new Date().toISOString(),
                location: event.location || event.office || event.eventLocation || 'Location not specified',
                description: event.description || event.eventDescription || 'No additional details'
            }));
            
            // Determine current status from latest event
            const latestEvent = events[0] || {};
            trackingInfo = {
                currentStatus: latestEvent.status || 'Unknown',
                currentLocation: latestEvent.location || 'Location not available',
                lastUpdate: latestEvent.timestamp || new Date().toISOString(),
                serviceType: data.serviceType || 'Poslaju Service',
                events: events
            };
            
        } else if (typeof data === 'object' && data !== null) {
            // Response is an object with tracking information
            trackingInfo = {
                currentStatus: data.currentStatus || data.status || 'Unknown',
                currentLocation: data.currentLocation || data.location || 'Location not available',
                lastUpdate: data.lastUpdate || data.timestamp || new Date().toISOString(),
                serviceType: data.serviceType || 'Poslaju Service',
                weight: data.weight,
                dimensions: data.dimensions,
                origin: data.origin || data.senderLocation,
                destination: data.destination || data.recipientLocation,
                estimatedDelivery: data.estimatedDelivery,
                events: data.events || data.trackingEvents || [],
                delivery: data.delivery || data.deliveryInfo || {}
            };
            
        } else {
            // Fallback for unexpected response format
            trackingInfo = {
                currentStatus: 'Unknown',
                currentLocation: 'Information not available',
                lastUpdate: new Date().toISOString(),
                serviceType: 'Poslaju Service',
                events: []
            };
        }
        
        console.log('📋 Parsed tracking info for:', trackingNumber);
        return trackingInfo;
        
    } catch (error) {
        console.error('❌ Response parsing error:', error);
        
        // Return basic tracking info if parsing fails
        return {
            currentStatus: 'Information Available',
            currentLocation: 'Processing Center',
            lastUpdate: new Date().toISOString(),
            serviceType: 'Poslaju Service',
            events: [{
                status: 'Tracking information received',
                timestamp: new Date().toISOString(),
                location: 'Poslaju System',
                description: 'Your parcel is being tracked in our system'
            }]
        };
    }
}

// Send response back to n8n
async function sendToN8N(data) {
    if (!process.env.N8N_WEBHOOK_URL) {
        console.log('⚠️ N8N_WEBHOOK_URL not configured');
        return { status: 'skipped', reason: 'no webhook configured' };
    }
    
    try {
        const response = await axios.post(process.env.N8N_WEBHOOK_URL, {
            ...data,
            timestamp: new Date().toISOString(),
            source: 'ai-chatbot'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log('✅ Sent to n8n:', response.status);
        return { status: 'success', statusCode: response.status };
        
    } catch (error) {
        console.error('❌ Failed to send to n8n:', error.message);
        throw error;
    }
}

// Start server with database initialization
async function startServer() {
    // Initialize database first
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🤖 Enhanced AI Chatbot running on port ${PORT}`);
        console.log(`📡 Webhook: http://localhost:${PORT}/webhook/message`);
        console.log(`🔍 Health: http://localhost:${PORT}/health`);
        console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
        
        // Log configuration
        console.log('\n📋 Configuration:');
        console.log(`- Database: ${databaseReady ? '✅ Connected with RAG system' : '❌ Not available (using fallback)'}`);
        console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- n8n Webhook: ${process.env.N8N_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- KWAP API: ${process.env.KWAP_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- Poslaju API: ${process.env.POSLAJU_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- Fallback: ✅ Enhanced responses available`);
        
        if (databaseReady) {
            console.log('\n🚀 Enhanced Features Enabled:');
            console.log('- 📚 Knowledge Base with RAG');
            console.log('- 🎯 Intent Detection');
            console.log('- 👤 User Profiles & Personalization');
            console.log('- 💾 Persistent Conversation Storage');
            console.log('- 📊 Advanced Analytics');
            console.log('- 🔧 Admin API Endpoints');
        }
    });
}

// Start the server
startServer().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

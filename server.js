require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

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

// Simple conversation memory (use database in production)
const conversations = new Map();

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

        // Get AI response
        const aiResponse = await getAIResponse(message, from);
        
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
            timestamp: new Date().toISOString()
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
app.get('/api/conversation/:phoneNumber', (req, res) => {
    const { phoneNumber } = req.params;
    const history = conversations.get(phoneNumber) || [];
    res.json({ 
        phoneNumber, 
        history: history.slice(-20) // Last 20 messages
    });
});

// AI Response Function
async function getAIResponse(message, from) {
    try {
        // Get conversation history
        const history = conversations.get(from) || [];
        
        // Add user message to history
        history.push({
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
        
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
        
        // Add AI response to history
        history.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
        });
        
        // Store conversation (keep last 50 messages)
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        conversations.set(from, history);
        
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
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 AI Chatbot running on port ${PORT}`);
    console.log(`📡 Webhook: http://localhost:${PORT}/webhook/message`);
    console.log(`🔍 Health: http://localhost:${PORT}/health`);
    
    // Log configuration
    console.log('\n📋 Configuration:');
    console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`- Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`- n8n Webhook: ${process.env.N8N_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`- Fallback: ✅ Simple responses available`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

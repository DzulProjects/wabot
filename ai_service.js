const axios = require('axios');
const dbManager = require('./database');

class EnhancedAIService {
    constructor() {
        this.intentPatterns = {
            greeting: /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
            pricing: /(price|pricing|cost|plan|subscription|fee|payment|money)/i,
            support: /(help|support|problem|issue|trouble|error|assistance)/i,
            company: /(about|company|business|service|what do you|who are you)/i,
            whatsapp: /(whatsapp|integration|connect|phone|message|send)/i,
            ai: /(ai|artificial intelligence|smart|intelligent|gpt|gemini)/i,
            kwap: /(kwap|pension|malaysia|retirement|inquiry|ic)/i,
            technical: /(api|integration|webhook|setup|configuration|install)/i,
            goodbye: /(bye|goodbye|see you|thanks|thank you)/i
        };
    }

    // Main AI response function with RAG integration
    async getEnhancedResponse(message, phoneNumber, conversationHistory = []) {
        const startTime = Date.now();
        
        try {
            // Step 1: Intent Detection
            const intent = this.detectIntent(message);
            console.log(`🎯 Detected intent: ${intent}`);

            // Step 2: Search Knowledge Base
            const knowledgeContext = await this.searchKnowledgeBase(message, intent);
            console.log(`📚 Found ${knowledgeContext.length} relevant knowledge entries`);

            // Step 3: Get User Profile for Personalization
            const userProfile = await dbManager.getUserProfile(phoneNumber);
            console.log(`👤 User profile: ${userProfile ? 'found' : 'new user'}`);

            // Step 4: Build Enhanced Context
            const enhancedContext = this.buildEnhancedContext({
                message,
                intent,
                knowledgeContext,
                userProfile,
                conversationHistory
            });

            // Step 5: Generate AI Response
            let aiResponse;
            const aiModel = this.getPreferredAIModel();
            
            if (process.env.OPENAI_API_KEY) {
                aiResponse = await this.getOpenAIResponse(enhancedContext, message);
            } else if (process.env.GEMINI_API_KEY) {
                aiResponse = await this.getGeminiResponse(enhancedContext, message);
            } else {
                // Enhanced fallback with knowledge base
                aiResponse = this.getEnhancedFallbackResponse(message, knowledgeContext);
            }

            // Step 6: Record Analytics
            const responseTime = Date.now() - startTime;
            await this.recordAnalytics(intent, aiModel, responseTime, knowledgeContext.length);

            // Step 7: Update User Profile
            await this.updateUserInteraction(phoneNumber, message, aiResponse, intent);

            return {
                response: aiResponse,
                intent: intent,
                knowledgeUsed: knowledgeContext.length > 0,
                responseTime: responseTime,
                model: aiModel
            };

        } catch (error) {
            console.error('❌ Enhanced AI Response Error:', error);
            
            // Fallback to simple response
            const fallbackResponse = this.getSimpleFallbackResponse(message);
            
            return {
                response: fallbackResponse,
                intent: 'error',
                knowledgeUsed: false,
                responseTime: Date.now() - startTime,
                model: 'fallback'
            };
        }
    }

    // Intent Detection using pattern matching
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
            if (pattern.test(lowerMessage)) {
                return intent;
            }
        }
        
        return 'general';
    }

    // Search knowledge base for relevant context
    async searchKnowledgeBase(query, intent = null) {
        try {
            // Determine category based on intent
            const categoryMap = {
                pricing: 'pricing',
                support: 'support',
                company: 'company',
                whatsapp: 'whatsapp',
                ai: 'ai',
                kwap: 'kwap',
                technical: 'integration'
            };

            const category = categoryMap[intent] || null;
            
            // Search with higher limit for better context
            const results = await dbManager.searchKnowledge(query, category, 3);
            
            return results.map(item => ({
                category: item.category,
                question: item.question,
                answer: item.answer,
                priority: item.priority
            }));

        } catch (error) {
            console.error('❌ Knowledge base search error:', error);
            return [];
        }
    }

    // Build enhanced context for AI
    buildEnhancedContext({ message, intent, knowledgeContext, userProfile, conversationHistory }) {
        let context = {
            systemPrompt: this.getEnhancedSystemPrompt(intent),
            userMessage: message,
            knowledgeBase: knowledgeContext,
            userProfile: userProfile,
            conversationHistory: conversationHistory.slice(-10), // Last 10 messages
            intent: intent
        };

        return context;
    }

    // Get enhanced system prompt based on intent and context
    getEnhancedSystemPrompt(intent) {
        const basePrompt = `You are WABOT AI Assistant - an intelligent, helpful, and professional AI chatbot specialized in WhatsApp automation and business communication solutions.

PERSONALITY: 
- Friendly, professional, and solution-oriented
- Keep responses concise but informative (ideally under 300 characters for WhatsApp)
- Use emojis appropriately to make conversations engaging
- Always aim to be helpful and provide actionable information

CAPABILITIES:
- Answer questions about WABOT's services and features
- Provide technical support and guidance
- Help with pricing and business inquiries  
- Assist with WhatsApp integration and setup
- Handle KWAP pension inquiry questions

RESPONSE GUIDELINES:
- If knowledge base information is provided, use it as the primary source of truth
- Personalize responses based on user profile if available
- Reference previous conversation context when relevant
- If you don't know something specific, be honest and offer to help find the information
- Always end with a helpful follow-up question or call-to-action when appropriate`;

        // Intent-specific enhancements
        const intentPrompts = {
            pricing: "Focus on providing clear pricing information and help the user choose the right plan.",
            support: "Be extra helpful and patient. Provide step-by-step guidance and offer multiple solution paths.",
            technical: "Provide detailed technical guidance. Break down complex processes into simple steps.",
            company: "Highlight WABOT's key benefits and unique value propositions.",
            whatsapp: "Focus on WhatsApp integration benefits and practical implementation guidance."
        };

        if (intentPrompts[intent]) {
            return `${basePrompt}\n\nSPECIAL FOCUS: ${intentPrompts[intent]}`;
        }

        return basePrompt;
    }

    // Enhanced OpenAI integration with RAG
    async getOpenAIResponse(context, originalMessage) {
        const messages = [
            {
                role: 'system',
                content: context.systemPrompt
            }
        ];

        // Add knowledge base context if available
        if (context.knowledgeBase && context.knowledgeBase.length > 0) {
            const knowledgeContent = context.knowledgeBase
                .map(kb => `Q: ${kb.question}\nA: ${kb.answer}`)
                .join('\n\n---\n\n');
            
            messages.push({
                role: 'system',
                content: `RELEVANT KNOWLEDGE BASE INFORMATION:\n${knowledgeContent}\n\nUse this information to provide accurate and helpful responses. If the user's question is directly addressed in the knowledge base, prioritize that information.`
            });
        }

        // Add user profile context
        if (context.userProfile) {
            messages.push({
                role: 'system',
                content: `USER PROFILE: User has sent ${context.userProfile.total_messages || 0} messages. ${context.userProfile.name ? `Name: ${context.userProfile.name}. ` : ''}Feel free to personalize the response appropriately.`
            });
        }

        // Add recent conversation history
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            context.conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.message_type === 'user' ? 'user' : 'assistant',
                    content: msg.message_text
                });
            });
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: originalMessage
        });

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    }

    // Enhanced Gemini integration with RAG
    async getGeminiResponse(context, originalMessage) {
        let prompt = context.systemPrompt + '\n\n';

        // Add knowledge base context
        if (context.knowledgeBase && context.knowledgeBase.length > 0) {
            const knowledgeContent = context.knowledgeBase
                .map(kb => `Q: ${kb.question}\nA: ${kb.answer}`)
                .join('\n\n---\n\n');
            
            prompt += `RELEVANT KNOWLEDGE BASE:\n${knowledgeContent}\n\n`;
        }

        // Add conversation history
        if (context.conversationHistory && context.conversationHistory.length > 0) {
            prompt += 'RECENT CONVERSATION:\n';
            context.conversationHistory.forEach(msg => {
                const role = msg.message_type === 'user' ? 'User' : 'Assistant';
                prompt += `${role}: ${msg.message_text}\n`;
            });
            prompt += '\n';
        }

        prompt += `User: ${originalMessage}\nAssistant:`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text.trim();
    }

    // Enhanced fallback response with knowledge base
    getEnhancedFallbackResponse(message, knowledgeContext) {
        // If we have knowledge base results, use them
        if (knowledgeContext && knowledgeContext.length > 0) {
            const bestMatch = knowledgeContext[0];
            return `${bestMatch.answer}\n\nIs there anything else you'd like to know about ${bestMatch.category}?`;
        }

        // Intent-based fallback responses
        const intent = this.detectIntent(message);
        const msg = message.toLowerCase();

        switch (intent) {
            case 'greeting':
                return "Hello! 👋 Welcome to WABOT - your AI-powered WhatsApp automation platform!\n\nI can help you with:\n• Platform information\n• Technical support\n• Pricing questions\n• Integration guidance\n\nWhat would you like to know?";

            case 'pricing':
                return "💰 Our pricing starts at $19/month for the Starter plan!\n\nWe offer:\n• Starter ($19/month) - Great for small businesses\n• Professional ($49/month) - Perfect for growing companies  \n• Enterprise (Custom) - Tailored solutions\n\n🎉 Plus a 14-day free trial!\n\nWant to know more about any specific plan?";

            case 'support':
                return "🛠️ I'm here to help!\n\nCommon solutions:\n• Check your API keys in .env file\n• Verify n8n workflows are active\n• Restart the application after changes\n• Review our documentation\n\nWhat specific issue can I help you with?";

            case 'company':
                return "🤖 WABOT is your all-in-one WhatsApp automation platform!\n\nWe provide:\n• AI Chatbot - Smart conversations\n• WhatsApp Sender - Message broadcasting  \n• KWAP Inquiry - Malaysian pension lookup\n• n8n Integration - Workflow automation\n\nHow can we help transform your WhatsApp communication?";

            case 'goodbye':
                return "Thanks for chatting with WABOT! 👋\n\nRemember, I'm available 24/7 to help with:\n• Questions about our platform\n• Technical support\n• Integration guidance\n\nFeel free to message anytime. Have a great day! 😊";

            default:
                return `Thanks for your message: "${message}"\n\n🤖 I'm WABOT AI Assistant! I can help with:\n• Platform information & features\n• Technical support & setup\n• Pricing & plans\n• WhatsApp integration\n\nWhat would you like to know more about?`;
        }
    }

    // Simple fallback for errors
    getSimpleFallbackResponse(message) {
        return "I apologize, but I'm having trouble processing your message right now. 😅\n\nPlease try again in a moment, or contact our support team if the issue persists.\n\nIs there anything else I can help you with?";
    }

    // Get preferred AI model based on configuration
    getPreferredAIModel() {
        if (process.env.OPENAI_API_KEY) return 'openai-gpt';
        if (process.env.GEMINI_API_KEY) return 'google-gemini';
        return 'fallback';
    }

    // Record analytics for performance monitoring
    async recordAnalytics(intent, model, responseTime, knowledgeCount) {
        try {
            await Promise.all([
                dbManager.recordMetric('response_time', responseTime, { model, intent }),
                dbManager.recordMetric('knowledge_base_hits', knowledgeCount, { intent }),
                dbManager.recordMetric('intent_detected', 1, { intent })
            ]);
        } catch (error) {
            console.error('❌ Analytics recording error:', error);
        }
    }

    // Update user interaction data
    async updateUserInteraction(phoneNumber, userMessage, aiResponse, intent) {
        try {
            // Update user profile with interaction
            await dbManager.updateUserProfile(phoneNumber, {
                contextData: { lastIntent: intent, lastInteraction: new Date().toISOString() }
            });

            // Save conversation to database
            await dbManager.saveConversation(phoneNumber, userMessage, 'user');
            await dbManager.saveConversation(phoneNumber, aiResponse, 'assistant', this.getPreferredAIModel());

        } catch (error) {
            console.error('❌ User interaction update error:', error);
        }
    }

    // Get conversation analytics
    async getConversationAnalytics(phoneNumber) {
        try {
            const profile = await dbManager.getUserProfile(phoneNumber);
            const recentConversations = await dbManager.getConversationHistory(phoneNumber, 50);
            
            const analytics = {
                totalMessages: profile?.total_messages || 0,
                lastInteraction: profile?.last_interaction,
                recentTopics: this.extractTopics(recentConversations),
                averageResponseTime: await this.getAverageResponseTime(phoneNumber)
            };

            return analytics;
        } catch (error) {
            console.error('❌ Conversation analytics error:', error);
            return null;
        }
    }

    // Extract topics from conversation history
    extractTopics(conversations) {
        const topics = new Map();
        
        conversations.forEach(msg => {
            if (msg.message_type === 'user') {
                const intent = this.detectIntent(msg.message_text);
                topics.set(intent, (topics.get(intent) || 0) + 1);
            }
        });

        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ topic, count }));
    }

    // Get average response time for user
    async getAverageResponseTime(phoneNumber) {
        try {
            const sql = `
                SELECT AVG(response_time_ms) as avg_time 
                FROM conversations 
                WHERE phone_number = ? 
                AND response_time_ms IS NOT NULL
                AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `;
            
            const result = await dbManager.query(sql, [phoneNumber]);
            return result[0]?.avg_time || null;
        } catch (error) {
            console.error('❌ Average response time error:', error);
            return null;
        }
    }
}

// Create singleton instance
const aiService = new EnhancedAIService();

module.exports = aiService;
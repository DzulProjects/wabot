require('dotenv').config();
const dbManager = require('./database');

const sampleKnowledgeData = [
    // Company Information
    {
        category: 'company',
        keywords: 'company, about us, who are you, business, services',
        question: 'What is your company about?',
        answer: 'We are WABOT - an AI-powered WhatsApp automation platform that helps businesses streamline their customer communication with intelligent chatbots, message broadcasting, and integrated services.',
        priority: 5
    },
    {
        category: 'company',
        keywords: 'services, what do you offer, products, features',
        question: 'What services do you offer?',
        answer: 'We offer three main services:\n• AI Chatbot - Intelligent conversational AI\n• WhatsApp Sender - Professional message broadcasting\n• KWAP Inquiry - Malaysian pension lookup system\n\nAll integrated with n8n workflows for seamless automation.',
        priority: 5
    },

    // Technical Support
    {
        category: 'support',
        keywords: 'help, support, problem, issue, trouble, error',
        question: 'I need technical support',
        answer: 'I\'m here to help! 🛠️\n\nFor technical issues:\n• Check our documentation\n• Verify your API keys are configured\n• Ensure your n8n workflows are active\n• Contact our support team if needed\n\nWhat specific issue are you experiencing?',
        priority: 4
    },
    {
        category: 'support',
        keywords: 'api key, configuration, setup, install',
        question: 'How do I set up API keys?',
        answer: 'To configure your API keys:\n\n1. Copy .env.example to .env\n2. Add your OpenAI or Gemini API key\n3. Configure your n8n webhook URL\n4. Restart the application\n\nNeed help with specific API setup? Let me know which service!',
        priority: 4
    },

    // Pricing and Plans
    {
        category: 'pricing',
        keywords: 'price, pricing, cost, plan, subscription, fee, payment',
        question: 'What are your pricing plans?',
        answer: 'Our pricing is flexible and scalable:\n\n💡 **Starter**: $19/month\n• 1,000 messages\n• Basic AI features\n• Email support\n\n🚀 **Professional**: $49/month\n• 10,000 messages\n• Advanced AI + Database\n• Priority support\n\n🏢 **Enterprise**: Custom pricing\n• Unlimited messages\n• Custom integrations\n• Dedicated support\n\nReady to get started?',
        priority: 3
    },
    {
        category: 'pricing',
        keywords: 'free trial, demo, test, try',
        question: 'Do you offer a free trial?',
        answer: 'Yes! 🎉 We offer a 14-day free trial with:\n\n• Full access to all features\n• 500 free messages\n• Complete documentation\n• Email support\n\nNo credit card required to start. Would you like me to help you get set up?',
        priority: 4
    },

    // WhatsApp Integration
    {
        category: 'whatsapp',
        keywords: 'whatsapp, integration, connect, phone, number',
        question: 'How do I connect WhatsApp?',
        answer: 'To connect WhatsApp to our platform:\n\n1. Sign up for a WhatsApp Business API account\n2. Get your API credentials\n3. Configure the webhook in your n8n workflow\n4. Test the integration with our chatbot\n\nWe support both WhatsApp Business API and third-party providers like wabot.my. Need specific setup guidance?',
        priority: 4
    },
    {
        category: 'whatsapp',
        keywords: 'broadcast, sender, message, send, bulk',
        question: 'Can I send bulk messages?',
        answer: 'Yes! Our WhatsApp Sender module allows you to:\n\n📨 Send targeted messages to specific numbers\n📝 Use message templates for consistency\n😀 Include emojis and rich formatting\n📊 Track message delivery and responses\n\nPerfect for marketing campaigns, announcements, and customer updates!',
        priority: 3
    },

    // AI Features
    {
        category: 'ai',
        keywords: 'ai, artificial intelligence, smart, intelligent, gpt, gemini',
        question: 'How smart is your AI?',
        answer: 'Our AI chatbot is powered by advanced language models:\n\n🧠 **OpenAI GPT** - Industry-leading conversational AI\n🚀 **Google Gemini** - Fast and efficient responses\n💾 **Memory System** - Remembers conversation context\n📊 **Learning Capability** - Improves from your data\n\nIt can handle complex conversations, understand context, and provide personalized responses based on your business needs.',
        priority: 4
    },
    {
        category: 'ai',
        keywords: 'customize, personalize, train, custom responses',
        question: 'Can I customize the AI responses?',
        answer: 'Absolutely! 🎯 You can customize your AI in several ways:\n\n• **Knowledge Base**: Add your own Q&A data\n• **Personality**: Adjust the AI\'s tone and style\n• **Context**: Include business-specific information\n• **Responses**: Create custom response templates\n• **Learning**: Train from conversation history\n\nThe AI becomes more tailored to your business over time!',
        priority: 4
    },

    // KWAP Service
    {
        category: 'kwap',
        keywords: 'kwap, pension, malaysia, retirement, inquiry, ic number',
        question: 'What is the KWAP inquiry service?',
        answer: 'KWAP Inquiry is our specialized service for Malaysian pension information:\n\n🏛️ **Direct Integration** - Real-time KWAP database access\n🔍 **IC Number Lookup** - Search by Malaysian identity card\n📄 **Comprehensive Data** - Personal, service, and pension details\n👨‍👩‍👧‍👦 **Family Information** - Dependent and beneficiary data\n\nPerfect for government agencies, HR departments, and pension advisory services.',
        priority: 3
    },

    // General Business
    {
        category: 'business',
        keywords: 'business hours, working hours, office, contact, location',
        question: 'What are your business hours?',
        answer: 'Our services are available 24/7! 🕐\n\n**AI Chatbot**: Always active\n**Support Team**: Monday-Friday, 9 AM - 6 PM (GMT+8)\n**Emergency Support**: Available for Enterprise customers\n\nFor urgent issues outside business hours, use our priority support channel or send us a message - we\'ll respond as soon as possible!',
        priority: 2
    },
    {
        category: 'business',
        keywords: 'contact, email, phone, reach, support team',
        question: 'How can I contact your support team?',
        answer: 'You can reach us through multiple channels:\n\n📧 **Email**: support@wabot.com\n💬 **WhatsApp**: This chatbot (you\'re already here!)\n📱 **Phone**: +60 12-345-6789 (Malaysia)\n🌐 **Website**: wabot.com/support\n\nOr just continue chatting with me - I can help with most questions immediately!',
        priority: 3
    },

    // Integration and Development
    {
        category: 'integration',
        keywords: 'api, integration, webhook, n8n, developer, code',
        question: 'Do you provide API for integration?',
        answer: 'Yes! We offer comprehensive APIs for developers:\n\n🔗 **REST API** - Full chatbot control\n📡 **Webhooks** - Real-time event notifications\n🛠️ **n8n Integration** - Visual workflow automation\n📚 **Documentation** - Complete developer guides\n🔧 **SDKs** - JavaScript, Python, PHP libraries\n\nCheck our developer documentation at wabot.com/docs for full API reference.',
        priority: 3
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Initialize database connection
        await dbManager.initialize();
        
        // Clear existing knowledge base data (optional)
        console.log('🗑️ Clearing existing knowledge base data...');
        await dbManager.query('DELETE FROM knowledge_base');
        
        // Insert sample data
        console.log('📝 Inserting sample knowledge base data...');
        
        for (const item of sampleKnowledgeData) {
            await dbManager.addKnowledge(
                item.category,
                item.keywords,
                item.question,
                item.answer,
                item.priority
            );
        }
        
        console.log(`✅ Successfully inserted ${sampleKnowledgeData.length} knowledge base entries`);
        
        // Add some sample analytics data
        console.log('📊 Adding sample analytics data...');
        await dbManager.recordMetric('response_time', 250, { model: 'gpt-3.5-turbo' });
        await dbManager.recordMetric('response_time', 180, { model: 'gemini-1.5-flash' });
        await dbManager.recordMetric('user_satisfaction', 4.5, { category: 'general' });
        await dbManager.recordMetric('knowledge_base_hits', 15, { category: 'company' });
        
        console.log('✅ Sample analytics data added');
        
        // Display summary
        const knowledgeCount = await dbManager.query('SELECT COUNT(*) as count FROM knowledge_base');
        const analyticsCount = await dbManager.query('SELECT COUNT(*) as count FROM bot_analytics');
        
        console.log('\n📋 Database Seeding Summary:');
        console.log(`- Knowledge Base Entries: ${knowledgeCount[0].count}`);
        console.log(`- Analytics Records: ${analyticsCount[0].count}`);
        console.log(`- Categories: ${[...new Set(sampleKnowledgeData.map(item => item.category))].join(', ')}`);
        
        // Test search functionality
        console.log('\n🔍 Testing search functionality...');
        const searchResults = await dbManager.searchKnowledge('pricing', null, 3);
        console.log(`Found ${searchResults.length} results for "pricing":`);
        searchResults.forEach(result => {
            console.log(`- ${result.question} (Category: ${result.category})`);
        });
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await dbManager.close();
        console.log('✅ Database seeding completed successfully!');
        process.exit(0);
    }
}

// Check if this script is run directly
if (require.main === module) {
    seedDatabase().catch(console.error);
}

module.exports = { sampleKnowledgeData, seedDatabase };
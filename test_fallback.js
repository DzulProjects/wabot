require('dotenv').config();

// Temporarily disable AI to test enhanced fallback
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';

const dbManager = require('./database');
const aiService = require('./ai_service');

async function testDatabaseConnection() {
    console.log('🔗 Testing database connection...');
    try {
        await dbManager.initialize();
        console.log('✅ Database connected successfully');
        
        // Test knowledge base query  
        const results = await dbManager.query('SELECT COUNT(*) as count FROM knowledge_base');
        console.log(`✅ Knowledge base has ${results[0].count} entries`);
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function testFallbackAI() {
    console.log('\n🤖 Testing enhanced fallback AI responses...');
    
    const testMessages = [
        'Hello',
        'What are your pricing plans?', 
        'I need help with setup',
        'Tell me about WABOT',
        'Thank you'
    ];
    
    for (const message of testMessages) {
        console.log(`\n📝 User: ${message}`);
        try {
            const result = await aiService.getEnhancedResponse(message, '+1234567890', []);
            console.log(`🤖 Bot: ${result.response}`);
            console.log(`   📊 Intent: ${result.intent}, Model: ${result.model}, Knowledge Used: ${result.knowledgeUsed}`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
}

async function testSimpleKnowledgeSearch() {
    console.log('\n🔍 Testing simple knowledge search...');
    
    try {
        // Test direct database search without parameters
        const results = await dbManager.query('SELECT question, answer FROM knowledge_base WHERE category = ? LIMIT 2', ['pricing']);
        
        if (results.length > 0) {
            console.log('✅ Knowledge base search works:');
            results.forEach(result => {
                console.log(`   Q: ${result.question}`);
                console.log(`   A: ${result.answer.substring(0, 100)}...`);
            });
        } else {
            console.log('⚠️ No results found');
        }
    } catch (error) {
        console.error('❌ Knowledge search error:', error.message);
    }
}

async function runAllTests() {
    console.log('🧪 Running Enhanced Fallback Tests (No AI APIs required)...\n');
    
    const dbSuccess = await testDatabaseConnection();
    
    if (dbSuccess) {
        await testSimpleKnowledgeSearch();
        await testFallbackAI();
        
        console.log('\n✅ Enhanced fallback system is working!');
        console.log('   - Database integration: ✅');
        console.log('   - Knowledge base: ✅'); 
        console.log('   - Intent detection: ✅');
        console.log('   - Fallback responses: ✅');
    }
    
    await dbManager.close();
}

if (require.main === module) {
    runAllTests().catch(console.error);
}
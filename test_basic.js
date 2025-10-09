require('dotenv').config();

// Test basic AI without database
async function testBasicAI() {
    const axios = require('axios');
    
    // Test if AI is working by calling Gemini directly
    console.log('🧪 Testing Gemini AI directly...');
    
    try {
        const prompt = 'You are a helpful AI assistant. Keep responses under 100 characters. User asks: What is WABOT?';
        
        // Try with different models
        const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
        let response;
        
        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 200
                        }
                    }
                );
                
                // If successful, break out of the loop
                break;
            } catch (modelError) {
                console.log(`❌ ${model} failed:`, modelError.response?.status);
                if (model === models[models.length - 1]) {
                    throw modelError; // Throw error for the last model
                }
            }
        }

        const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
        console.log('✅ Gemini AI Response:', aiResponse);
        
        return true;
    } catch (error) {
        console.error('❌ Gemini AI Error:', error.response?.data || error.message);
        return false;
    }
}

// Test simple webhook without database
async function testSimpleWebhook() {
    console.log('\n🧪 Testing webhook without database complexity...');
    
    const axios = require('axios');
    
    try {
        const response = await axios.post('http://localhost:3000/webhook/message', {
            message: 'hello',
            from: '+1234567890',
            to: '+chatbot',
            messageId: 'test_simple'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log('✅ Webhook Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Webhook Error:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Running Basic AI Tests...\n');
    
    const aiTest = await testBasicAI();
    
    if (aiTest) {
        console.log('\n🔄 Starting server for webhook test...');
        // Note: You need to start the server separately for this test
        console.log('Please run "npm run dev" in another terminal, then run this script again.');
    }
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testBasicAI, testSimpleWebhook };
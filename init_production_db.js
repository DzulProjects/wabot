#!/usr/bin/env node

/**
 * Production Database Initialization Script for Coolify
 * This script initializes the database schema and seeds knowledge base data
 * for the enhanced WABOT deployment.
 */

require('dotenv').config();
const dbManager = require('./database');
const { sampleKnowledgeData } = require('./seed_data');

async function initProductionDatabase() {
    console.log('🚀 Starting production database initialization...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    try {
        // Step 1: Connect to database
        console.log('\n🔗 Connecting to database...');
        await dbManager.initialize();
        console.log('✅ Database connected successfully');

        // Step 2: Check if knowledge base already has data
        const existingCount = await dbManager.query('SELECT COUNT(*) as count FROM knowledge_base');
        const currentCount = existingCount[0].count;
        
        console.log(`📊 Current knowledge base entries: ${currentCount}`);

        if (currentCount > 0) {
            console.log('⚠️ Knowledge base already contains data.');
            console.log('To reinitialize, use: npm run db:seed');
            
            // Just verify the data structure
            const categories = await dbManager.query(`
                SELECT category, COUNT(*) as count 
                FROM knowledge_base 
                GROUP BY category 
                ORDER BY count DESC
            `);
            
            console.log('\n📋 Current knowledge base structure:');
            categories.forEach(cat => {
                console.log(`  - ${cat.category}: ${cat.count} entries`);
            });
            
        } else {
            // Step 3: Initialize with sample data
            console.log('📝 Initializing knowledge base with sample data...');
            
            for (const item of sampleKnowledgeData) {
                await dbManager.addKnowledge(
                    item.category,
                    item.keywords,
                    item.question,
                    item.answer,
                    item.priority
                );
            }
            
            console.log(`✅ Successfully initialized ${sampleKnowledgeData.length} knowledge base entries`);
        }

        // Step 4: Verify all tables exist
        console.log('\n🔍 Verifying database structure...');
        const tables = await dbManager.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        const requiredTables = ['knowledge_base', 'conversations', 'user_profiles', 'bot_analytics'];
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
            console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
            throw new Error('Database schema incomplete');
        } else {
            console.log('✅ All required tables present');
        }

        // Step 5: Test basic functionality
        console.log('\n🧪 Testing database functionality...');
        
        // Test knowledge search
        const searchTest = await dbManager.searchKnowledge('pricing', null, 1);
        console.log(`✅ Knowledge search test: ${searchTest.length > 0 ? 'PASSED' : 'FAILED'}`);
        
        // Test user profile creation
        await dbManager.updateUserProfile('+test', { name: 'Test User' });
        const profileTest = await dbManager.getUserProfile('+test');
        console.log(`✅ User profile test: ${profileTest ? 'PASSED' : 'FAILED'}`);
        
        // Clean up test data
        await dbManager.query('DELETE FROM user_profiles WHERE phone_number = ?', ['+test']);

        // Step 6: Display configuration summary
        console.log('\n📋 Production Configuration Summary:');
        console.log(`- Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        console.log(`- AI Model: ${process.env.OPENAI_API_KEY ? 'OpenAI' : process.env.GEMINI_API_KEY ? 'Gemini' : 'Fallback'}`);
        console.log(`- n8n Webhook: ${process.env.N8N_WEBHOOK_URL ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`- CORS Origins: ${process.env.ALLOWED_ORIGINS || 'Not configured'}`);

        // Step 7: Production readiness check
        console.log('\n🎯 Production Readiness Checklist:');
        console.log(`- Database Schema: ✅ Ready`);
        console.log(`- Knowledge Base: ✅ ${currentCount || sampleKnowledgeData.length} entries`);
        console.log(`- AI Integration: ${process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY ? '✅ Ready' : '⚠️ Using fallback'}`);
        console.log(`- n8n Integration: ${process.env.N8N_WEBHOOK_URL ? '✅ Ready' : '❌ Needs configuration'}`);
        console.log(`- Security: ${process.env.SESSION_SECRET && process.env.ALLOWED_ORIGINS ? '✅ Configured' : '⚠️ Needs configuration'}`);

        console.log('\n🎉 Production database initialization completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Test the enhanced AI system via /health endpoint');
        console.log('2. Verify n8n webhook connectivity');
        console.log('3. Test WhatsApp integration end-to-end');
        console.log('4. Monitor application logs for any issues');

    } catch (error) {
        console.error('❌ Production database initialization failed:', error);
        console.error('\nTroubleshooting tips:');
        console.error('1. Check database credentials and connectivity');
        console.error('2. Ensure MySQL service is running and accessible');
        console.error('3. Verify network connectivity between services');
        console.error('4. Check Coolify logs for more details');
        
        process.exit(1);
    } finally {
        // Always close database connection
        await dbManager.close();
        console.log('🔌 Database connection closed');
    }
}

// Health check function for production monitoring
async function healthCheck() {
    try {
        await dbManager.initialize();
        
        // Basic connectivity test
        const result = await dbManager.query('SELECT 1 as test');
        if (result[0].test !== 1) {
            throw new Error('Database query failed');
        }
        
        // Check required tables
        const tables = await dbManager.query('SHOW TABLES');
        const tableCount = tables.length;
        if (tableCount < 4) {
            throw new Error(`Insufficient tables: ${tableCount}/4`);
        }
        
        console.log('✅ Database health check passed');
        return true;
        
    } catch (error) {
        console.error('❌ Database health check failed:', error.message);
        return false;
    } finally {
        await dbManager.close();
    }
}

// Export functions for use in other scripts
module.exports = { initProductionDatabase, healthCheck };

// Run initialization if called directly
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'health') {
        healthCheck()
            .then(success => process.exit(success ? 0 : 1))
            .catch(() => process.exit(1));
    } else {
        initProductionDatabase()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}
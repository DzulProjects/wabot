const mysql = require('mysql2/promise');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            // Create connection pool
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'wabot_ai',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                acquireTimeout: 60000,
                timeout: 60000
            });

            // Test connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            
            this.isConnected = true;
            console.log('✅ MySQL database connected successfully');
            
            // Initialize database schema
            await this.initializeSchema();
            
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    async initializeSchema() {
        try {
            // Create knowledge_base table for storing bot responses
            await this.query(`
                CREATE TABLE IF NOT EXISTS knowledge_base (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    category VARCHAR(100) NOT NULL,
                    keywords TEXT NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    priority INT DEFAULT 1,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_category (category),
                    INDEX idx_keywords (keywords(255)),
                    INDEX idx_active (is_active),
                    FULLTEXT KEY ft_keywords (keywords),
                    FULLTEXT KEY ft_question (question),
                    FULLTEXT KEY ft_answer (answer)
                )
            `);

            // Create conversations table for persistent chat history
            await this.query(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    phone_number VARCHAR(20) NOT NULL,
                    user_name VARCHAR(100) DEFAULT NULL,
                    message_text TEXT NOT NULL,
                    message_type ENUM('user', 'assistant', 'system') NOT NULL,
                    ai_model VARCHAR(50) DEFAULT NULL,
                    response_time_ms INT DEFAULT NULL,
                    metadata JSON DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_phone (phone_number),
                    INDEX idx_created (created_at),
                    INDEX idx_type (message_type)
                )
            `);

            // Create user_profiles table for enhanced personalization
            await this.query(`
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    phone_number VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) DEFAULT NULL,
                    email VARCHAR(100) DEFAULT NULL,
                    preferences JSON DEFAULT NULL,
                    context_data JSON DEFAULT NULL,
                    total_messages INT DEFAULT 0,
                    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_phone (phone_number),
                    INDEX idx_last_interaction (last_interaction)
                )
            `);

            // Create analytics table for bot performance tracking
            await this.query(`
                CREATE TABLE IF NOT EXISTS bot_analytics (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    metric_name VARCHAR(50) NOT NULL,
                    metric_value DECIMAL(10,2) NOT NULL,
                    dimensions JSON DEFAULT NULL,
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_metric (metric_name),
                    INDEX idx_recorded (recorded_at)
                )
            `);

            console.log('✅ Database schema initialized successfully');

        } catch (error) {
            console.error('❌ Schema initialization failed:', error.message);
            throw error;
        }
    }

    async query(sql, params = []) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        try {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('❌ Query error:', error.message, '\nSQL:', sql);
            throw error;
        }
    }

    // Knowledge Base Operations (Simplified for stability)
    async searchKnowledge(query, category = null, limit = 5) {
        try {
            // Simple approach - first try category match, then keyword search
            let results = [];
            
            if (category) {
                // Search by category first
                const categoryResults = await this.query(
                    'SELECT id, category, question, answer, priority FROM knowledge_base WHERE is_active = TRUE AND category = ? ORDER BY priority DESC LIMIT ?',
                    [category, parseInt(limit)]
                );
                results = categoryResults || [];
            }
            
            // If no results or no category, do a simple keyword search
            if (results.length === 0 && query) {
                const searchTerm = `%${query.toLowerCase()}%`;
                const keywordResults = await this.query(
                    'SELECT id, category, question, answer, priority FROM knowledge_base WHERE is_active = TRUE AND (LOWER(keywords) LIKE ? OR LOWER(question) LIKE ?) ORDER BY priority DESC LIMIT ?',
                    [searchTerm, searchTerm, parseInt(limit)]
                );
                results = keywordResults || [];
            }
            
            return results;

        } catch (error) {
            console.error('❌ Knowledge search error:', error.message);
            // Fallback: return all entries for the category or top entries
            try {
                if (category) {
                    return await this.query('SELECT id, category, question, answer, priority FROM knowledge_base WHERE category = ? LIMIT ?', [category, parseInt(limit)]);
                } else {
                    return await this.query('SELECT id, category, question, answer, priority FROM knowledge_base LIMIT ?', [parseInt(limit)]);
                }
            } catch (fallbackError) {
                console.error('❌ Fallback search error:', fallbackError.message);
                return [];
            }
        }
    }

    async addKnowledge(category, keywords, question, answer, priority = 1) {
        const sql = `
            INSERT INTO knowledge_base (category, keywords, question, answer, priority)
            VALUES (?, ?, ?, ?, ?)
        `;
        return await this.query(sql, [category, keywords, question, answer, priority]);
    }

    // Conversation Management
    async saveConversation(phoneNumber, messageText, messageType, aiModel = null, responseTime = null, metadata = null) {
        const sql = `
            INSERT INTO conversations (phone_number, message_text, message_type, ai_model, response_time_ms, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        return await this.query(sql, [phoneNumber, messageText, messageType, aiModel, responseTime, metadataJson]);
    }

    async getConversationHistory(phoneNumber, limit = 20) {
        try {
            const sql = `
                SELECT message_text, message_type, created_at, ai_model, response_time_ms
                FROM conversations 
                WHERE phone_number = ?
                ORDER BY created_at DESC
                LIMIT ${parseInt(limit)}
            `;
            const results = await this.query(sql, [phoneNumber]);
            return (results || []).reverse(); // Return in chronological order
        } catch (error) {
            console.error('❌ Conversation history error:', error.message);
            return [];
        }
    }

    // User Profile Management
    async updateUserProfile(phoneNumber, profileData) {
        const sql = `
            INSERT INTO user_profiles (phone_number, name, email, preferences, context_data, total_messages, last_interaction)
            VALUES (?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                name = COALESCE(VALUES(name), name),
                email = COALESCE(VALUES(email), email),
                preferences = COALESCE(VALUES(preferences), preferences),
                context_data = VALUES(context_data),
                total_messages = total_messages + 1,
                last_interaction = NOW(),
                updated_at = NOW()
        `;
        
        const preferences = profileData.preferences ? JSON.stringify(profileData.preferences) : null;
        const contextData = profileData.contextData ? JSON.stringify(profileData.contextData) : null;
        
        return await this.query(sql, [
            phoneNumber,
            profileData.name || null,
            profileData.email || null,
            preferences,
            contextData
        ]);
    }

    async getUserProfile(phoneNumber) {
        const sql = `
            SELECT * FROM user_profiles WHERE phone_number = ?
        `;
        const results = await this.query(sql, [phoneNumber]);
        const profile = results && results.length > 0 ? results[0] : null;
        
        if (profile) {
            // Parse JSON fields safely
            try {
                profile.preferences = profile.preferences ? 
                    (typeof profile.preferences === 'string' ? JSON.parse(profile.preferences) : profile.preferences) : {};
                profile.context_data = profile.context_data ? 
                    (typeof profile.context_data === 'string' ? JSON.parse(profile.context_data) : profile.context_data) : {};
            } catch (jsonError) {
                console.warn('JSON parse error for user profile:', jsonError.message);
                profile.preferences = {};
                profile.context_data = {};
            }
        }
        
        return profile;
    }

    // Analytics
    async recordMetric(metricName, value, dimensions = null) {
        const sql = `
            INSERT INTO bot_analytics (metric_name, metric_value, dimensions)
            VALUES (?, ?, ?)
        `;
        const dimensionsJson = dimensions ? JSON.stringify(dimensions) : null;
        return await this.query(sql, [metricName, value, dimensionsJson]);
    }

    async getAnalytics(metricName, startDate = null, endDate = null) {
        let sql = `
            SELECT AVG(metric_value) as avg_value, 
                   MIN(metric_value) as min_value,
                   MAX(metric_value) as max_value,
                   COUNT(*) as count
            FROM bot_analytics 
            WHERE metric_name = ?
        `;
        let params = [metricName];

        if (startDate) {
            sql += ` AND recorded_at >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND recorded_at <= ?`;
            params.push(endDate);
        }

        const results = await this.query(sql, params);
        return results && results.length > 0 ? results[0] : null;
    }

    // Utility Methods
    async getConnectionStatus() {
        try {
            if (!this.pool) return { connected: false, error: 'Pool not initialized' };
            
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            
            return { connected: true, pool_stats: await this.getPoolStats() };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    async getPoolStats() {
        if (!this.pool) return null;
        
        return {
            all_connections: this.pool._allConnections?.length || 0,
            free_connections: this.pool._freeConnections?.length || 0,
            queue_length: this.pool._connectionQueue?.length || 0
        };
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('🔌 Database connection closed');
        }
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
# 🚀 Enhanced AI Chatbot Setup Guide

This guide will help you set up the enhanced WABOT AI chatbot with MySQL database integration, RAG (Retrieval Augmented Generation) system, and advanced features.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **MySQL**: 8.0 or higher (or compatible MariaDB)
- **npm**: 8.0.0 or higher

### MySQL Database Setup
1. **Install MySQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   
   # macOS (with Homebrew)
   brew install mysql
   
   # Windows: Download from mysql.com
   ```

2. **Create Database and User**:
   ```sql
   -- Connect to MySQL as root
   mysql -u root -p
   
   -- Create database
   CREATE DATABASE wabot_ai;
   
   -- Create user (optional, you can use root)
   CREATE USER 'wabot_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON wabot_ai.* TO 'wabot_user'@'localhost';
   FLUSH PRIVILEGES;
   
   -- Exit
   EXIT;
   ```

## 🔧 Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or your preferred editor
```

### 3. Configure Environment Variables
Update your `.env` file with the following:

```env
# Database Configuration (REQUIRED)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wabot_ai

# AI Service Configuration (choose one)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo

# OR use Gemini instead
# GEMINI_API_KEY=your-gemini-key
# GEMINI_MODEL=gemini-1.5-flash

# n8n Integration (optional)
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/send-whatsapp

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Initialize Database
```bash
# Initialize and seed the database
npm run db:seed
```

This will:
- Create all required tables
- Populate the knowledge base with sample data
- Set up analytics tables
- Test the database connection

### 5. Start the Enhanced Chatbot
```bash
# Development mode
npm run dev

# Production mode
npm run prod
```

## 🎯 Features Overview

### Enhanced AI Capabilities
- **🧠 RAG System**: Retrieves relevant information from your knowledge base
- **🎯 Intent Detection**: Understands user intentions and routes responses accordingly
- **💾 Conversation Memory**: Maintains context across chat sessions
- **👤 User Profiles**: Personalizes responses based on user history

### Knowledge Base Management
- **📚 Searchable Knowledge**: Full-text search across questions, answers, and keywords
- **🏷️ Categorization**: Organize knowledge by categories (pricing, support, company, etc.)
- **⭐ Priority System**: Higher priority entries appear first in search results
- **✏️ Easy Management**: Add, edit, and delete knowledge entries via API

### Analytics & Monitoring
- **📊 Response Time Tracking**: Monitor AI performance
- **🎯 Intent Analytics**: Track most common user intents
- **👥 User Engagement**: Monitor active users and conversation patterns
- **📈 Knowledge Base Usage**: See which entries are most helpful

## 🌐 Web Interfaces

### Main Interfaces
- **🏠 Dashboard**: `http://localhost:3000/` - Main platform overview
- **🤖 AI Chatbot**: `http://localhost:3000/chatbot.html` - Enhanced chat interface
- **📱 WA Sender**: `http://localhost:3000/sender.html` - Message broadcaster
- **🏛️ KWAP Inquiry**: `http://localhost:3000/kwap-inquiry.html` - Pension lookup

### API Endpoints

#### Core Chat API
- `POST /webhook/message` - Main webhook with enhanced AI
- `GET /api/conversation/:phone` - Get conversation history with user profile
- `GET /health` - Health check with database status

#### Knowledge Base Management
- `GET /api/admin/knowledge` - List knowledge base entries (with pagination)
- `POST /api/admin/knowledge` - Add new knowledge entry
- `PUT /api/admin/knowledge/:id` - Update knowledge entry
- `DELETE /api/admin/knowledge/:id` - Delete knowledge entry

#### Analytics API
- `GET /api/admin/analytics` - Get system analytics
- `GET /api/admin/database-status` - Check database connection
- `GET /api/admin/users/:phone/analytics` - User-specific analytics

## 🎨 Sample Knowledge Base Entries

The system comes pre-loaded with knowledge about:

### Categories
- **company** - Information about WABOT platform
- **pricing** - Pricing plans and billing information  
- **support** - Technical support and troubleshooting
- **whatsapp** - WhatsApp integration guidance
- **ai** - AI capabilities and features
- **kwap** - Malaysian pension inquiry service
- **business** - Business hours and contact information
- **integration** - API and development resources

### Example Entry
```json
{
  "category": "pricing",
  "keywords": "price, pricing, cost, plan, subscription, fee, payment",
  "question": "What are your pricing plans?",
  "answer": "Our pricing is flexible and scalable:\n\n💡 **Starter**: $19/month\n• 1,000 messages\n• Basic AI features\n• Email support\n\n🚀 **Professional**: $49/month\n• 10,000 messages\n• Advanced AI + Database\n• Priority support\n\n🏢 **Enterprise**: Custom pricing\n• Unlimited messages\n• Custom integrations\n• Dedicated support\n\nReady to get started?",
  "priority": 3
}
```

## 🔧 Customization Guide

### Adding Custom Knowledge
1. **Via API** (recommended):
   ```bash
   curl -X POST http://localhost:3000/api/admin/knowledge \
     -H "Content-Type: application/json" \
     -d '{
       "category": "products",
       "keywords": "product, features, service, what we do",
       "question": "What products do you offer?",
       "answer": "We offer comprehensive WhatsApp automation solutions...",
       "priority": 5
     }'
   ```

2. **Via Database** (direct):
   ```sql
   INSERT INTO knowledge_base (category, keywords, question, answer, priority)
   VALUES ('custom', 'help, guide, tutorial', 'How do I get started?', 'Here is how to get started...', 4);
   ```

### Customizing AI Personality
Edit the system prompt in `ai_service.js`:

```javascript
const basePrompt = `You are [YOUR COMPANY] AI Assistant - customize this prompt to match your brand voice and specific use case...`;
```

### Adding New Intent Patterns
Update the `intentPatterns` in `ai_service.js`:

```javascript
this.intentPatterns = {
    // Existing patterns...
    customIntent: /(custom|pattern|keywords)/i,
    // Add your patterns here
};
```

## 📊 Monitoring & Analytics

### Key Metrics Tracked
- **Response Time**: Average time to generate responses
- **Knowledge Base Hits**: How often knowledge base is used
- **Intent Detection**: Most common user intents
- **User Engagement**: Active users and message volume
- **Model Performance**: Which AI models perform best

### Analytics Dashboard
Access analytics via API endpoints:
```bash
# System-wide analytics
curl http://localhost:3000/api/admin/analytics

# User-specific analytics
curl http://localhost:3000/api/admin/users/+1234567890/analytics

# Database status
curl http://localhost:3000/api/admin/database-status
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_USER=production_user
DB_PASSWORD=secure_production_password
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Performance Considerations
1. **Database Optimization**:
   - Use connection pooling (already configured)
   - Add appropriate indexes (already included)
   - Consider read replicas for high traffic

2. **Caching**:
   - Implement Redis for conversation caching
   - Cache frequently accessed knowledge base entries

3. **Monitoring**:
   - Set up log aggregation
   - Monitor database performance
   - Track API response times

### Docker Deployment
```bash
# Build and run with database
docker-compose up --build
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running: `sudo systemctl status mysql`
   - Verify credentials in `.env` file
   - Test connection: `mysql -u root -p wabot_ai`

2. **Knowledge Base Not Working**
   - Ensure database is seeded: `npm run db:seed`
   - Check database has data: `SELECT COUNT(*) FROM knowledge_base;`

3. **AI Responses Not Enhanced**
   - Verify database connection in logs
   - Check `databaseReady` status via `/api/admin/database-status`

4. **Poor Response Quality**
   - Add more specific knowledge base entries
   - Adjust AI model parameters
   - Review conversation logs for patterns

### Debug Commands
```bash
# Check database status
curl http://localhost:3000/api/admin/database-status

# Test knowledge search
curl "http://localhost:3000/api/admin/knowledge?search=pricing"

# View conversation logs
tail -f logs/application.log
```

## 📈 Next Steps

### Advanced Features to Consider
1. **Semantic Search**: Implement vector embeddings for better knowledge retrieval
2. **Multi-language Support**: Add language detection and translation
3. **Voice Integration**: Add speech-to-text capabilities
4. **Advanced Analytics**: Create visual dashboards
5. **A/B Testing**: Test different response strategies

### Integration Opportunities
1. **CRM Integration**: Connect with Salesforce, HubSpot
2. **E-commerce**: Integrate with Shopify, WooCommerce
3. **Calendar Systems**: Add appointment booking
4. **Payment Processing**: Handle transactions
5. **Social Media**: Expand to other platforms

## 🆘 Support

For technical support:
- Check the application logs
- Review database connection status
- Test API endpoints individually
- Consult the WARP.md file for development guidance

The enhanced AI chatbot is now ready to provide sophisticated, context-aware responses based on your business data!
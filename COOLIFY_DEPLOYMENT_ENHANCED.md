# 🚀 Enhanced WABOT Deployment Guide for Coolify

Deploy your enhanced RAG-enabled AI chatbot to Coolify with MySQL database and full n8n integration.

## 📋 Prerequisites

- Coolify server running and accessible
- GitHub repository with your enhanced WABOT code
- Domain name for your WABOT deployment
- n8n instance (already configured at n8ncontabo.duckdns.org)

## 🗄️ Step 1: Deploy MySQL Database Service

### 1.1 Create MySQL Service in Coolify

1. **Login to Coolify Dashboard**
2. **Create New Service** → **Database** → **MySQL**
3. **Configuration**:
   ```
   Service Name: wabot-mysql
   MySQL Version: 8.0
   Database Name: wabot_ai
   Username: wabot
   Password: [Generate secure password]
   Root Password: [Generate secure root password]
   Port: 3306
   ```

4. **Persistent Storage**:
   - Enable persistent storage for `/var/lib/mysql`
   - Storage size: 10GB (minimum for production)

5. **Deploy the MySQL Service**
   - Wait for deployment to complete
   - Note the internal hostname (usually: `wabot-mysql`)

### 1.2 Initialize Database Schema

Once MySQL is deployed, you'll need to initialize the schema. This can be done via:

**Option A: Connect via MySQL client and run:**
```sql
-- Connect to your MySQL instance
mysql -h your-mysql-host -u wabot -p wabot_ai

-- The schema will be auto-created by the application on first run
-- But you can also run the seed script manually if needed
```

**Option B: Let the application auto-initialize (recommended)**
- The enhanced WABOT automatically creates tables on startup
- It will also seed the knowledge base with sample data

## 🤖 Step 2: Deploy Enhanced WABOT Application

### 2.1 Create Application Service

1. **Create New Service** → **Application**
2. **Source Configuration**:
   ```
   Repository: your-github-username/wabot
   Branch: main (or your deployment branch)
   Build Pack: Docker
   ```

3. **Domain Configuration**:
   ```
   Domain: your-wabot-domain.com
   SSL: Enable (Let's Encrypt)
   ```

### 2.2 Environment Variables Configuration

**Critical Environment Variables** (add in Coolify):

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
TRUST_PROXY=true

# MySQL Database (REQUIRED for RAG)
DB_HOST=wabot-mysql
DB_PORT=3306
DB_USER=wabot
DB_PASSWORD=your_secure_mysql_password
DB_NAME=wabot_ai

# AI Service (Choose one)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-3.5-turbo
# OR
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-pro

# n8n Integration (UPDATE THIS)
N8N_WEBHOOK_URL=https://n8ncontabo.duckdns.org/webhook/whatsapps

# Security
ALLOWED_ORIGINS=https://your-wabot-domain.com
SESSION_SECRET=your-32-character-secure-session-secret

# Rate Limiting (Production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# KWAP Service (if using)
KWAP_API_KEY=your-kwap-api-key
KWAP_API_URL=https://apim.kwap.my/ws/PortalServiceInquireEmass/1.0

# WhatsApp API (if using direct API)
WABOT_INSTANCE_ID=your-whatsapp-instance-id
WABOT_ACCESS_TOKEN=your-whatsapp-access-token
```

### 2.3 Network Configuration

1. **Internal Network**: Ensure WABOT can connect to MySQL
   - Both services should be on the same Coolify network
   - Use service names for internal communication (`wabot-mysql`)

2. **Health Check Configuration**:
   ```
   Health Check URL: /health
   Health Check Port: 3000
   Health Check Interval: 30s
   ```

## 🔗 Step 3: Update n8n Integration

### 3.1 Update n8n Webhook URLs

In your n8n workflows, update the webhook URLs to point to your deployed WABOT:

**Current n8n setup**: `https://n8ncontabo.duckdns.org`
**New WABOT URL**: `https://your-wabot-domain.com`

**Update these endpoints in n8n**:
1. **Main webhook**: `https://your-wabot-domain.com/webhook/message`
2. **Health check**: `https://your-wabot-domain.com/health`

### 3.2 Test n8n → WABOT Connection

1. **Update n8n environment variables**:
   ```
   CHATBOT_URL=https://your-wabot-domain.com
   ```

2. **Test webhook connectivity**:
   - Send test message through n8n
   - Verify WABOT receives and processes the message
   - Confirm database storage is working

## 📊 Step 4: Verify Enhanced Features

### 4.1 Database Connectivity Test

**Test via API**:
```bash
curl https://your-wabot-domain.com/api/admin/database-status
```

**Expected Response**:
```json
{
  "success": true,
  "database": {
    "connected": true,
    "ready": true,
    "poolStats": {
      "all_connections": 0,
      "free_connections": 0,
      "queue_length": 0
    }
  }
}
```

### 4.2 RAG System Test

**Test knowledge base search**:
```bash
curl "https://your-wabot-domain.com/api/admin/knowledge?search=pricing"
```

**Test enhanced AI response**:
```bash
curl -X POST https://your-wabot-domain.com/webhook/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your pricing plans?",
    "from": "+1234567890",
    "to": "+chatbot",
    "messageId": "test_001"
  }'
```

### 4.3 Conversation Storage Test

**Check conversation history**:
```bash
curl "https://your-wabot-domain.com/api/conversation/+1234567890"
```

## 🔧 Step 5: Production Configuration

### 5.1 Logging Configuration

**View application logs in Coolify**:
- Navigate to your WABOT service
- Click on "Logs" tab
- Monitor for database connections and RAG functionality

**Key log messages to look for**:
```
✅ MySQL database connected successfully
✅ Enhanced AI system with database ready
🚀 Enhanced Features Enabled:
- 📚 Knowledge Base with RAG
- 🎯 Intent Detection
- 👤 User Profiles & Personalization
```

### 5.2 Monitoring Setup

**Health Check Endpoints**:
- Main health: `https://your-wabot-domain.com/health`
- Database status: `https://your-wabot-domain.com/api/admin/database-status`
- Analytics: `https://your-wabot-domain.com/api/admin/analytics`

### 5.3 Backup Strategy

**Database Backup**:
- Configure automated MySQL backups in Coolify
- Export knowledge base data regularly
- Backup conversation history for compliance

## 🧪 Step 6: Testing Checklist

### ✅ Deployment Tests

- [ ] MySQL service deployed and accessible
- [ ] WABOT application deployed successfully
- [ ] Health check passes (`/health` returns 200)
- [ ] Database connection successful
- [ ] Knowledge base initialized (14+ entries)

### ✅ RAG System Tests

- [ ] Intent detection working (test with pricing, support, company queries)
- [ ] Knowledge base search functional
- [ ] Enhanced fallback responses active
- [ ] Conversation history being stored
- [ ] User profiles being created

### ✅ n8n Integration Tests

- [ ] n8n can reach WABOT webhook
- [ ] WhatsApp → n8n → WABOT → n8n → WhatsApp flow working
- [ ] Messages processed and stored in database
- [ ] Analytics data being recorded

### ✅ Web Interface Tests

- [ ] Web chat interface accessible at `https://your-wabot-domain.com/chatbot.html`
- [ ] Real-time message exchange working
- [ ] Conversation history loading correctly

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL service status in Coolify
   # Verify environment variables
   # Check network connectivity between services
   ```

2. **n8n Integration Not Working**
   ```bash
   # Verify N8N_WEBHOOK_URL is correct
   # Check CORS settings (ALLOWED_ORIGINS)
   # Test webhook endpoint manually
   ```

3. **Knowledge Base Empty**
   ```bash
   # Check database initialization logs
   # Manually run seed script if needed
   # Verify MySQL permissions
   ```

### Debug Commands

**Check application status**:
```bash
curl https://your-wabot-domain.com/health
curl https://your-wabot-domain.com/api/admin/database-status
```

**Test enhanced features**:
```bash
# Test intent detection
curl -X POST https://your-wabot-domain.com/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"message": "pricing", "from": "+test", "to": "+bot", "messageId": "test"}'

# Check knowledge base
curl "https://your-wabot-domain.com/api/admin/knowledge?limit=5"
```

## 📈 Production Optimization

### Performance Settings

**Environment Variables for Production**:
```bash
# Database optimization
DB_CONNECTION_LIMIT=10
DB_TIMEOUT=30000

# Rate limiting for high traffic
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# Memory optimization
NODE_OPTIONS="--max-old-space-size=512"
```

### Scaling Considerations

1. **Database Scaling**: Consider MySQL replication for high availability
2. **Application Scaling**: Enable horizontal scaling in Coolify if needed
3. **Caching**: Consider Redis for conversation caching at scale

## 🎉 Success Criteria

Your enhanced WABOT deployment is successful when:

✅ **Database Integration**: MySQL connected with RAG system  
✅ **Knowledge Base**: 14+ entries loaded and searchable  
✅ **Intent Detection**: Smart routing of user queries  
✅ **Conversation Storage**: All chats stored persistently  
✅ **n8n Integration**: WhatsApp workflows working end-to-end  
✅ **Web Interface**: Chat interface accessible and functional  
✅ **Analytics**: Performance metrics being tracked  

**Your enhanced AI chatbot with RAG capabilities is now production-ready on Coolify!** 🚀
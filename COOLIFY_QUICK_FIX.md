# 🚀 Coolify Deployment Quick Fix

## 🔧 **Immediate Actions Required**

### **Issue 1: Database Connection** 
**Error**: `getaddrinfo ENOTFOUND wabot-mysql`

**Fix**: Update your Coolify environment variables:

1. **Go to Coolify Dashboard** → Your WABOT Application → **Environment Variables**

2. **Find MySQL Service Name**:
   - Go to your MySQL service in Coolify
   - Copy the **exact service name** (might be different from `wabot-mysql`)
   - Look for something like: `mysql-abc123-def456` or similar

3. **Update DB_HOST Environment Variable**:
   ```bash
   # Replace this in Coolify:
   DB_HOST=wabot-mysql
   
   # With the actual MySQL service name you found:
   DB_HOST=your-actual-mysql-service-name
   ```

4. **Alternative Hostnames to Try** (try these one by one):
   ```bash
   # Try these formats:
   DB_HOST=mysql
   DB_HOST=wabot-mysql.default
   DB_HOST=mysql-service
   ```

### **Issue 2: Gemini API Error**
**Error**: `Request failed with status code 404`

**Fix**: Update Gemini model in Coolify environment variables:

```bash
# Change this in Coolify:
GEMINI_MODEL=gemini-1.5-flash

# To this:
GEMINI_MODEL=gemini-1.5-pro
```

**Also add the correct API endpoint version** (this is already fixed in the code).

## 📋 **Complete Environment Variables for Coolify**

Copy these **exact** environment variables to your WABOT application in Coolify:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
TRUST_PROXY=true

# MySQL Database (CRITICAL - use your actual MySQL service name)
DB_HOST=your-actual-mysql-service-name
DB_PORT=3306
DB_USER=wabot
DB_PASSWORD=your_secure_mysql_password
DB_NAME=wabot_ai

# Gemini AI (FIXED VERSION)
GEMINI_API_KEY=AIzaSyBB5rIzSn6tJP4IYNkr4GhMcmlWQHop-X0
GEMINI_MODEL=gemini-1.5-pro

# n8n Integration
N8N_WEBHOOK_URL=https://n8ncontabo.duckdns.org/webhook/whatsapps

# Security
ALLOWED_ORIGINS=https://your-wabot-domain.com
SESSION_SECRET=your-32-character-secure-session-secret

# WhatsApp API
WABOT_INSTANCE_ID=687DA295BBCE4
WABOT_ACCESS_TOKEN=66d80dc8ab1e8

# KWAP Service
KWAP_API_KEY=b3551b34-68b1-4717-b290-0a26ac7f7bbc
KWAP_API_URL=https://apim.kwap.my/ws/PortalServiceInquireEmass/1.0

# Performance
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=900000
```

## 🚀 **Steps to Apply the Fix**

### Step 1: Update Code (if needed)
If you want the code fixes, pull the latest changes:
```bash
git pull origin main
```

### Step 2: Find Your MySQL Service Name
1. **Coolify Dashboard** → **Services**
2. **Click on your MySQL service**
3. **Copy the exact service name** from the URL or service details
4. **Note it down** - you'll need it for the next step

### Step 3: Update Environment Variables
1. **Coolify Dashboard** → Your WABOT application
2. **Environment Variables** tab
3. **Update DB_HOST** with the correct MySQL service name
4. **Update GEMINI_MODEL** to `gemini-1.5-pro`
5. **Save changes**

### Step 4: Restart Services
1. **Restart WABOT application** in Coolify
2. **Wait for deployment** to complete
3. **Check logs** for these success messages:
   ```
   ✅ MySQL database connected successfully
   ✅ Enhanced AI system with database ready
   ```

## 🧪 **Test After Fix**

### Test 1: Health Check
```bash
curl https://your-wabot-domain.com/health
```
**Expected**: `{"status":"healthy","timestamp":"..."}`

### Test 2: Database Status
```bash
curl https://your-wabot-domain.com/api/admin/database-status
```
**Expected**: `{"success":true,"database":{"connected":true}}`

### Test 3: Enhanced AI
```bash
curl -X POST https://your-wabot-domain.com/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"message":"hi","from":"+test","to":"+bot","messageId":"test1"}'
```
**Expected**: Intelligent response with intent detection

## 📊 **What Success Looks Like**

After applying the fix, your logs should show:
```
✅ MySQL database connected successfully
✅ Enhanced AI system with database ready
🚀 Enhanced Features Enabled:
- 📚 Knowledge Base with RAG
- 🎯 Intent Detection
- 👤 User Profiles & Personalization
- 💾 Persistent Conversation Storage
- 📊 Advanced Analytics
- 🔧 Admin API Endpoints

📋 Configuration:
- Database: ✅ Connected with RAG system
- OpenAI: ❌ Not configured
- Gemini: ✅ Configured
- n8n Webhook: ✅ Configured
- Fallback: ✅ Enhanced responses available
```

## 🚨 **If Issues Persist**

### Database Still Not Working?
1. **Check both services are in the same Coolify project**
2. **Verify MySQL service is running and healthy**
3. **Try using the MySQL container's IP address temporarily**
4. **Check Coolify network configuration**

### Gemini Still Not Working?
1. **Verify your Gemini API key is valid**
2. **Try using OpenAI instead**:
   ```bash
   OPENAI_API_KEY=sk-your-openai-key
   OPENAI_MODEL=gpt-3.5-turbo
   ```

### Need More Help?
**Check the logs** in Coolify for specific error messages and share them for further troubleshooting.

The enhanced fallback system will still work even if both database and AI fail, but you'll get basic responses instead of intelligent RAG-powered responses.
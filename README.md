# WABOT - AI-Powered WhatsApp Bot Platform

A modern, futuristic AI-powered chatbot platform with WhatsApp integration, featuring Gemini AI and a sleek glassmorphism UI.

## ✨ Features

- 🧠 **AI-Powered**: Supports OpenAI GPT and Google Gemini
- 📱 **WhatsApp Ready**: Built for WhatsApp integration via n8n
- 💾 **Conversation Memory**: Remembers chat history per user
- 🔄 **Fallback System**: Works even without AI API keys
- 🏛️ **KWAP Integration**: Malaysian pension inquiry system with SOAP API
- 🚀 **Deployment Ready**: Configured for Coolify/Docker deployment
- 🎯 **Simple Setup**: Multiple modules with unified interface

## 🏗️ Architecture

```
WhatsApp → n8n → AI Chatbot → n8n → WhatsApp
```

1. **WhatsApp message** received
2. **n8n workflow** forwards to chatbot
3. **AI processes** message with conversation context
4. **Response sent** back through n8n to WhatsApp

## 🚀 Quick Start

### 1. Install & Run Locally

```bash
# Clone and setup
git clone <your-repo>
cd wabot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start the chatbot
npm start
```

### 2. Test the Chatbot

- Open `http://localhost:3000` in your browser
- Enter a phone number and send a test message
- See AI responses in real-time

### 3. Deploy to Production

**Option A: Coolify (Recommended)**
1. Push code to GitHub
2. Create new app in Coolify
3. Set environment variables in Coolify dashboard
4. Deploy automatically

**Option B: Docker**
```bash
docker build -t ai-chatbot .
docker run -p 3000:3000 --env-file .env ai-chatbot
```

## 🔧 Configuration

### Environment Variables

```env
# AI Service (choose one)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo

# OR use Gemini instead
# GEMINI_API_KEY=your-gemini-key

# n8n Integration
N8N_RESPONSE_WEBHOOK=https://your-n8n.com/webhook/send-whatsapp
```

### n8n Setup

1. **Import the workflow**: `n8n-workflow.json`
2. **Set environment variables in n8n**:
   ```
   CHATBOT_URL=https://your-chatbot.com
   WHATSAPP_API_URL=https://your-whatsapp-api.com
   WHATSAPP_API_TOKEN=your-token
   ```
3. **Activate the workflow**

## 📡 API Endpoints

### `POST /webhook/message`
Main webhook that processes incoming messages
```json
{
  "message": "Hello, how are you?",
  "from": "+1234567890",
  "to": "+0987654321",
  "messageId": "msg_123"
}
```

### `GET /health`
Health check endpoint
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T08:30:00Z"
}
```

### `GET /api/conversation/:phoneNumber`
Get conversation history for a phone number

### `POST /api/send`
Send message directly to n8n webhook

### `POST /api/kwap/inquiry`
KWAP Pension Inquiry endpoint
```json
{
  "nokp": "440725085195"
}
```

Response:
```json
{
  "success": true,
  "pensionerInfo": {
    "name": "LAU CHAI AUN @ LOU CHAN DUN",
    "currentIdNo": "440725085195",
    "birthDate": "19440725",
    "serviceTypeDesc": "Perkhidmatan Awam Negeri",
    "deptName": "JABATAN KERJA RAYA, PERAK",
    "pensionAccNo": "00305732",
    "dependents": [...]
  },
  "timestamp": "2025-08-21T03:30:00Z"
}
```

## 🤖 AI Configuration

### OpenAI (Recommended)
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4
```

### Google Gemini
```env
GEMINI_API_KEY=your-gemini-key
```

### No AI (Fallback)
If no AI keys are provided, the bot uses simple rule-based responses for basic interactions.

## 🏛️ KWAP Pension Inquiry System

Integrated Malaysian pension inquiry system that connects directly to KWAP (Kumpulan Wang Persaraan) databases for real-time pension information retrieval.

### 🚀 Features

- **🔍 IC Number Lookup**: Query using 12-digit Malaysian Identity Card numbers
- **📄 Comprehensive Data**: Personal info, service history, pension details
- **👨‍👩‍👧‍👦 Dependent Information**: Family members and beneficiaries
- **⚡ Real-time**: Direct SOAP API integration with KWAP servers
- **🎨 Modern UI**: Futuristic glassmorphism interface
- **📱 Responsive**: Works on desktop and mobile devices

### 🔧 Configuration

```env
# KWAP Configuration
KWAP_API_KEY=your_kwap_api_key_here
KWAP_API_URL=https://apim.kwap.my/ws/PortalServiceInquireEmass/1.0
```

### 📋 Usage

1. **Web Interface**: Visit `http://localhost:3000/kwap-inquiry.html`
2. **API Direct**: POST to `/api/kwap/inquiry` with `{"nokp": "123456789012"}`
3. **Integration**: Embed in your own applications via REST API

### 📨 Data Retrieved

**Personal Information:**
- Full name, IC numbers (current/old)
- Birth date, gender, race, religion
- Death status and dates
- Contact information and address

**Service Information:**
- Government department and service type
- First appointment and retirement dates
- Last designation and salary information
- Total service period

**Pension Details:**
- Pension account numbers
- Payment start/stop dates
- Current payment method and status
- File numbers and references

**Dependent Information:**
- Spouse and children details
- Relationship types and descriptions
- Marriage, divorce, and adoption dates
- Dependent pension account information

### 🔒 Security & Compliance

- **Rate Limited**: Prevents API abuse
- **Input Validation**: Sanitizes and validates IC numbers
- **Error Handling**: Graceful error responses
- **Logging**: Comprehensive audit trail
- **HTTPS Only**: Secure data transmission

### 🛠️ Technical Details

- **Protocol**: SOAP 1.1 with XML parsing
- **Authentication**: API key-based authorization
- **Timeout**: 30-second request timeout
- **Format**: 12-digit Malaysian IC numbers (e.g., 440725085195)
- **Response**: Structured JSON with comprehensive pensioner data

## 🔄 How It Works

1. **Message Received**: n8n receives WhatsApp message
2. **Forward to AI**: n8n sends message to `/webhook/message`
3. **AI Processing**: 
   - Retrieves conversation history
   - Processes with AI (OpenAI/Gemini) or fallback
   - Stores response in memory
4. **Send Response**: AI response sent back to n8n
5. **WhatsApp Delivery**: n8n forwards response to WhatsApp

## 📝 Conversation Memory

- Conversations stored in memory (use Redis/database for production)
- Keeps last 50 messages per phone number
- Provides context for better AI responses
- Automatic cleanup of old conversations

## 🛠️ Customization

### Add Custom Responses
Edit the `getSimpleResponse()` function in `server.js`:

```javascript
function getSimpleResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('pricing')) {
        return 'Our pricing starts at $10/month. Would you like more details?';
    }
    
    // Add your custom logic here
    return 'Thank you for your message!';
}
```

### Modify AI Personality
Change the system prompt in `getOpenAIResponse()`:

```javascript
{
    role: 'system',
    content: `You are a helpful customer service assistant for [Your Company]. 
    Keep responses friendly, professional, and under 300 characters.
    Focus on helping customers with their questions and concerns.`
}
```

## 🔒 Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Consider adding webhook signature validation
- Implement rate limiting for production use

## 🚨 Troubleshooting

### Common Issues

1. **AI not responding**: Check API keys in environment variables
2. **n8n connection failed**: Verify webhook URLs are correct
3. **Memory issues**: Consider using Redis for conversation storage
4. **Rate limits**: Implement delays between API calls

### Debug Mode
```bash
NODE_ENV=development npm start
```

## 📊 Production Considerations

- **Database**: Use Redis/PostgreSQL for conversation storage
- **Rate Limiting**: Implement API rate limiting
- **Monitoring**: Add logging and health monitoring
- **Scaling**: Use PM2 or container orchestration
- **Security**: Add authentication and input validation

## 🎯 Use Cases

- **Customer Support**: Automated first-line support
- **Lead Generation**: Capture and qualify leads
- **Order Status**: Check order status and tracking
- **Appointment Booking**: Schedule appointments
- **FAQ Bot**: Answer common questions
- **Product Recommendations**: Suggest products based on queries

---

## 🆘 Support

- Check the test interface at `/` for debugging
- Review n8n execution logs for workflow issues
- Monitor server logs for API errors
- Use the `/health` endpoint to verify service status

This chatbot is designed to be simple, reliable, and easy to extend for your specific use case!

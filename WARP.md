# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

WABOT is an AI-powered WhatsApp bot platform with three main modules: AI Chatbot, WhatsApp Sender, and KWAP Pension Inquiry. Built with Node.js/Express and features a modern glassmorphism UI.

## Common Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server (with debugging)
npm run dev

# Start production server
npm run prod
# or simply
npm start

# Health check the running server
npm run health
```

### Docker Development & Testing
```bash
# Build Docker image
npm run docker:build
# or manually:
docker build -t wabot .

# Run with Docker (requires .env file)
npm run docker:run

# Run with Docker Compose (includes volumes and networking)
npm run docker:compose
# or manually:
docker-compose up --build
```

### Environment Setup
```bash
# Copy environment template and configure
cp .env.example .env

# For Docker testing, use test environment
cp .env.test .env
```

## Architecture Overview

### Core Components

1. **Express Server** (`server.js`) - Main application server with middleware stack
   - Security: Helmet.js with CSP, CORS with domain whitelist, rate limiting
   - Multi-AI support: OpenAI GPT and Google Gemini integration
   - Conversation memory: In-memory storage with cleanup (50 messages per user)
   - WhatsApp proxy: CORS bypass for wabot.my API
   - KWAP integration: SOAP API for Malaysian pension inquiries

2. **Frontend Modules** (`public/`)
   - Landing page (`index.html`) - Main platform dashboard
   - AI Chatbot (`chatbot.html`) - Real-time AI chat interface
   - WA Sender (`sender.html`) - WhatsApp message broadcaster
   - KWAP Inquiry (`kwap-inquiry.html`) - Pension lookup system

3. **API Architecture**
   - RESTful endpoints with rate limiting
   - Webhook system for n8n integration
   - SOAP client for KWAP pension API
   - WhatsApp API proxy to bypass CORS

### Message Flow Architecture
```
WhatsApp → n8n → /webhook/message → AI Processing → n8n → WhatsApp
```

1. WhatsApp message received by n8n workflow
2. n8n forwards to `/webhook/message` endpoint
3. AI processes message with conversation context
4. Response sent back through n8n to WhatsApp

### AI Integration Pattern
The system supports multiple AI providers with fallback:
1. **OpenAI GPT** (primary) - if `OPENAI_API_KEY` is set
2. **Google Gemini** (secondary) - if `GEMINI_API_KEY` is set
3. **Simple rule-based responses** (fallback) - if no AI keys configured

### KWAP Integration
Direct SOAP API integration with Malaysian pension system:
- XML request/response parsing
- Flexible IC number validation (4-15 digits)
- Comprehensive pensioner data extraction including dependents

## Key API Endpoints

### Core Endpoints
- `POST /webhook/message` - Main webhook for incoming messages
- `GET /health` - Health check (used by Docker/Coolify)
- `POST /api/send` - Send message directly to n8n
- `GET /api/conversation/:phoneNumber` - Get conversation history

### WhatsApp Integration
- `POST /api/whatsapp/send` - CORS proxy for wabot.my API

### KWAP Pension System
- `POST /api/kwap/inquiry` - Malaysian pension lookup by IC number

## Environment Variables

### Required for Production
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com
```

### AI Configuration (choose one)
```env
# OpenAI (recommended)
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo

# OR Gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
```

### WhatsApp Integration
```env
WHATSAPP_INSTANCE_ID=your-instance-id
WHATSAPP_ACCESS_TOKEN=your-access-token
```

### Optional Integrations
```env
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/id
KWAP_API_KEY=your-kwap-api-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Code Structure Guidelines

### Adding AI Responses
Modify the AI personality in `getOpenAIResponse()` or `getGeminiResponse()` by updating the system prompt.

### Adding Custom Fallback Responses
Edit `getSimpleResponse()` function to add rule-based responses when AI is unavailable.

### Adding New API Endpoints
Follow the existing pattern with:
- Rate limiting applied to `/api/` and `/webhook/` routes
- Input validation and sanitization
- Proper error handling with structured JSON responses
- Request/response logging

### Frontend Integration
All frontend pages are served from `public/` directory:
- Use `/api/` prefix for backend API calls
- WhatsApp API calls go through `/api/whatsapp/send` proxy
- Implement proper error handling and loading states

## Deployment Notes

### Docker Deployment
- Uses Node.js 18 Alpine image for security and size
- Runs as non-root user (`wabot:nodejs`)
- Health check endpoint configured
- Logs directory mounted for debugging

### Coolify Deployment
- Auto-deploys from GitHub repository
- Requires environment variables in Coolify dashboard
- SSL automatically configured
- Monitor logs via Coolify interface

### Security Considerations
- Never commit API keys to version control
- Use environment variables for all secrets
- Rate limiting is configured for production
- CORS whitelist configured for domains
- Security headers via Helmet.js
- Input validation on all endpoints

## Testing & Debugging

### Local Testing
1. Start server: `npm run dev`
2. Visit `http://localhost:3000` for main dashboard
3. Test each module independently
4. Check console logs for debugging info

### Health Monitoring
- Use `/health` endpoint for uptime monitoring
- Check application logs for errors
- Monitor API rate limits and usage

### N8N Integration Testing
Ensure n8n workflows are configured with:
- `CHATBOT_URL` pointing to your deployment
- `WHATSAPP_API_URL` for message delivery
- Proper webhook URLs in environment variables

## Development Workflow

1. **Local development**: Use `npm run dev` with development environment
2. **Docker testing**: Use `npm run docker:compose` to test containerized version
3. **Production deployment**: Push to GitHub and deploy via Coolify
4. **Health monitoring**: Use health check endpoint and log monitoring

## File Structure Patterns

- `server.js` - Main application logic and API endpoints
- `public/` - Frontend assets and HTML pages
- `public/js/` - JavaScript modules for each page
- `public/css/` - Stylesheets with glassmorphism design
- Docker files for containerization
- Environment templates for configuration
- Workflow JSON files for n8n integration
# Coolify Environment Variables Configuration

## Required Environment Variables for WABOT Deployment

Copy these variables into your Coolify environment variables section:

### Server Configuration
```
NODE_ENV=production
PORT=3000
```

### AI Service Configuration
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### WhatsApp API Configuration
```
WABOT_API_URL=https://wabot.my/api
WABOT_INSTANCE_ID=your_actual_instance_id_here
WABOT_ACCESS_TOKEN=your_actual_access_token_here
```

### CORS Configuration
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```
*Replace with your actual Coolify-provided domain or custom domain*

### Security & Rate Limiting
```
SESSION_SECRET=your_random_32_character_session_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Optional: n8n Integration
```
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```
*Only add if you have n8n workflow integration*

### Optional: KWAP Pension API
```
KWAP_API_KEY=b3551b34-68b1-4717-b290-0a26ac7f7bbc
KWAP_API_URL=https://apim.kwap.my/ws/PortalServiceInquireEmass/1.0
```
*KWAP API for Malaysian pension inquiries*

## How to Add in Coolify:

1. Go to your application settings
2. Find "Environment Variables" section
3. Add each variable as: 
   - Key: VARIABLE_NAME
   - Value: actual_value
4. Save each variable
5. Don't include quotes around values

## Important Notes:

- Replace all "your_actual_*" values with your real credentials
- Generate a random SESSION_SECRET (32+ characters)
- Update ALLOWED_ORIGINS with your Coolify domain
- Keep sensitive values secure in Coolify's environment system

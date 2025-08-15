# WABOT Deployment Guide

## Deploying to Coolify

This guide covers deploying your WABOT application to Coolify, a self-hosted PaaS platform.

### Prerequisites

1. A running Coolify instance
2. A GitHub repository with your WABOT code
3. Valid WhatsApp API credentials from wabot.my
4. Gemini AI API key from Google AI Studio

### Environment Variables

Before deploying, you'll need to configure the following environment variables in Coolify:

#### Required Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
WHATSAPP_INSTANCE_ID=your_wabot_instance_id
WHATSAPP_ACCESS_TOKEN=your_wabot_access_token

# CORS Configuration (replace with your actual domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

### Coolify Deployment Steps

1. **Create New Application**
   - Go to your Coolify dashboard
   - Click "New Application"
   - Select "GitHub Repository"

2. **Repository Configuration**
   - Connect your GitHub account if not already connected
   - Select your WABOT repository
   - Choose the main/master branch

3. **Build Configuration**
   - Coolify should auto-detect the Node.js application
   - Build command: `npm install` (auto-detected)
   - Start command: `npm start` (auto-detected)

4. **Environment Variables**
   - Navigate to the "Environment Variables" section
   - Add all the required environment variables listed above
   - Make sure to use your actual API keys and credentials

5. **Domain Configuration**
   - Set up your custom domain or use the provided Coolify subdomain
   - Update the `ALLOWED_ORIGINS` environment variable with your domain

6. **Deploy**
   - Click "Deploy" to start the deployment process
   - Monitor the build logs for any issues

### Docker Deployment (Alternative)

If you prefer Docker deployment:

1. **Build the Docker image locally:**
   ```bash
   npm run docker:build
   ```

2. **Test locally with Docker Compose:**
   ```bash
   # Create a .env file with your production values
   cp .env.example .env
   # Edit .env with your actual values
   
   # Run with Docker Compose
   npm run docker:compose
   ```

3. **Push to Docker Registry:**
   ```bash
   docker tag wabot your-registry/wabot:latest
   docker push your-registry/wabot:latest
   ```

4. **Deploy on Coolify:**
   - Choose "Docker Image" instead of GitHub repository
   - Use your pushed image: `your-registry/wabot:latest`

### Health Check

The application includes a health check endpoint at `/health` that Coolify can use to monitor the application status.

### SSL/TLS

Coolify will automatically provide SSL certificates for your domain. Make sure to:
- Use HTTPS URLs in your `ALLOWED_ORIGINS`
- Update any hardcoded HTTP URLs in your frontend code

### Monitoring

- Monitor your application logs in the Coolify dashboard
- Set up alerts for application downtime
- Monitor API usage to stay within rate limits

### Security Notes

- Never commit sensitive environment variables to your repository
- Use Coolify's built-in secret management for API keys
- Regularly rotate your API keys and access tokens
- Monitor your application for unusual traffic patterns

### Troubleshooting

#### Common Issues:

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Environment Variable Issues:**
   - Verify all required variables are set
   - Check for typos in variable names

3. **API Connection Issues:**
   - Verify API keys are correct and active
   - Check CORS configuration for your domain

4. **WhatsApp Integration Issues:**
   - Ensure WhatsApp instance is active on wabot.my
   - Verify instance ID and access token

#### Support

For deployment issues:
- Check Coolify documentation
- Review application logs in Coolify dashboard
- Test locally with Docker first

### Post-Deployment Checklist

- [ ] Application is accessible via your domain
- [ ] All three pages load correctly (landing, chatbot, sender)
- [ ] Chatbot responds to messages
- [ ] WhatsApp sender can send messages
- [ ] Health check endpoint responds
- [ ] SSL certificate is active
- [ ] Environment variables are properly set
- [ ] API integrations are working

## Local Development

To run locally for development:

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your development values

# Start development server
npm run dev
```

## Production Build Testing

To test the production build locally:

```bash
# Install production dependencies
npm install --production

# Run in production mode
npm run prod
```

## Updates and Maintenance

1. **Code Updates:**
   - Push changes to your GitHub repository
   - Coolify will auto-deploy if auto-deploy is enabled
   - Or manually trigger deployment in Coolify dashboard

2. **Dependency Updates:**
   - Regularly update npm packages for security
   - Test updates locally before deploying

3. **API Key Rotation:**
   - Update environment variables in Coolify
   - Restart the application after updating keys

---

For more information about Coolify, visit: https://coolify.io/docs

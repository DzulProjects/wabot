# Coolify Deployment Troubleshooting Guide

## "No Available Server" Error

This error typically occurs when Coolify cannot connect to your deployed application. Here are the most common causes and solutions:

### 1. Port Configuration Issues

**Problem**: The application is not binding to the correct port or Coolify cannot reach the application.

**Solution**:
- Ensure your application binds to `0.0.0.0` instead of `localhost` or `127.0.0.1`
- The server.js already uses `app.listen(PORT, '0.0.0.0', ...)` which is correct
- Make sure the PORT environment variable is set in Coolify (default: 3000)

### 2. Environment Variables Missing

**Problem**: Required environment variables are not set in Coolify.

**Critical Environment Variables**:
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-domain.com
```

**Optional but Recommended**:
```env
GEMINI_API_KEY=your_gemini_key
N8N_WEBHOOK_URL=your_n8n_webhook
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Health Check Failures

**Problem**: Coolify health checks are failing, causing the deployment to be marked as unhealthy.

**Solutions**:
- Check the application logs in Coolify dashboard
- The health check endpoint `/health` should return HTTP 200
- Health check timeout increased to 10s with 40s start period

### 4. Build Process Issues

**Problem**: The Docker build fails or the application doesn't start properly.

**Solutions**:
- Check build logs in Coolify for any npm install errors
- Ensure `package.json` and `package-lock.json` are committed
- Verify all dependencies are listed in `package.json`

### 5. CORS Configuration

**Problem**: CORS blocks requests to your application.

**Solution**:
- Set `ALLOWED_ORIGINS` to include your domain:
  ```env
  ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
  ```

## Step-by-Step Troubleshooting

### Step 1: Check Application Logs
1. Go to Coolify dashboard
2. Navigate to your application
3. Check the "Logs" tab for any error messages
4. Look for startup messages like "🤖 AI Chatbot running on port 3000"

### Step 2: Verify Environment Variables
1. Go to "Environment Variables" in Coolify
2. Ensure all required variables are set
3. Check for typos in variable names
4. Required: `NODE_ENV`, `PORT`, `ALLOWED_ORIGINS`

### Step 3: Test Health Endpoint
1. Try accessing `https://your-domain.com/health` directly
2. Should return JSON: `{"status":"healthy","timestamp":"..."}`
3. If this fails, the application isn't starting properly

### Step 4: Check Build Process
1. Review build logs in Coolify
2. Look for npm install errors
3. Ensure Docker build completes successfully
4. Check for file permission issues

### Step 5: Verify Port Binding
1. Check if application logs show "running on port 3000"
2. Ensure the app binds to `0.0.0.0:3000` not `localhost:3000`
3. Verify PORT environment variable is set correctly

## Quick Fixes

### Fix 1: Restart Deployment
Sometimes a simple restart resolves temporary issues:
1. Go to Coolify dashboard
2. Click "Restart" on your application
3. Monitor logs during startup

### Fix 2: Clear Build Cache
If build issues persist:
1. In Coolify, try "Force Rebuild"
2. This clears Docker build cache and starts fresh

### Fix 3: Check Resource Limits
Ensure your Coolify server has sufficient resources:
- Minimum 1GB RAM for Node.js applications
- Sufficient disk space for Docker images
- CPU resources for building and running

## Common Error Messages

### "Connection refused"
- Application not binding to correct interface (0.0.0.0)
- Port mismatch between Docker and application

### "Health check failed"
- Application taking too long to start
- `/health` endpoint not responding
- Internal application errors

### "Build failed"
- Missing dependencies in package.json
- Node.js version compatibility issues
- File permission problems

## Getting Help

### Check These First:
1. Application logs in Coolify
2. Build logs for any errors
3. Environment variables configuration
4. Domain/SSL configuration

### Useful Log Commands:
```bash
# Local testing
docker build -t wabot .
docker run -p 3000:3000 --env-file .env wabot

# Test health endpoint locally
curl http://localhost:3000/health
```

## Prevention

### Before Deploying:
1. Test Docker build locally
2. Verify all environment variables
3. Check that health endpoint works
4. Ensure CORS origins are correct
5. Test with production environment variables

### Regular Maintenance:
1. Monitor application logs
2. Keep dependencies updated
3. Rotate API keys regularly
4. Monitor resource usage

## Contact

If issues persist after following this guide:
1. Check Coolify documentation: https://coolify.io/docs
2. Review application logs for specific error messages
3. Test locally with Docker to isolate issues

---

**Last Updated**: 2025-08-21
**Version**: WABOT v1.0.0

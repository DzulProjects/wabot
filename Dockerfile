# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S wabot -u 1001

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/logs && \
    chown -R wabot:nodejs /app

# Switch to non-root user
USER wabot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]

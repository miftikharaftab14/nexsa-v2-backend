# Base stage for shared dependencies
FROM node:22-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "start:dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dev -u 1001

# Clean up development dependencies and build artifacts
RUN npm ci --only=production && \
    rm -rf /usr/src/app/src && \
    rm -rf /usr/src/app/test

# Set proper permissions
RUN chown -R dev:nodejs /usr/src/app

# Switch to non-root user
USER dev

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]

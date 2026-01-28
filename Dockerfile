# Install pnpm
FROM public.ecr.aws/docker/library/node:22-alpine AS pnpm-installer
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build dependencies
FROM public.ecr.aws/docker/library/node:22-alpine AS deps
WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Build application
FROM public.ecr.aws/docker/library/node:22-alpine AS build
WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Runtime image (production)
FROM public.ecr.aws/docker/library/node:22-alpine AS runtime
WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and full node_modules (keep dev deps for Nest CLI)
COPY --from=deps /usr/src/app/package.json ./package.json
COPY --from=deps /usr/src/app/pnpm-lock.yaml* ./
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy built application
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/public ./public

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /usr/src/app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check - verifies the /health endpoint returns 200
# Using node since it's already in the image
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))" || exit 1

# Start the application
CMD ["sh", "./start.sh"]

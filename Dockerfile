# Production Dockerfile for Reporunner
# Multi-stage build for optimal image size and security

# Base image with Node.js LTS
FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9.15.2

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
COPY packages/@reporunner/*/package.json ./packages/@reporunner/*/

# Install dependencies only
FROM base AS deps
RUN pnpm install --frozen-lockfile --prod=false

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build all packages
RUN pnpm build

# Production dependencies
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod

# Runtime stage
FROM node:18-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reporunner -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=reporunner:nodejs /app/dist ./dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/frontend/dist ./packages/frontend/dist

# Copy production dependencies
COPY --from=prod-deps --chown=reporunner:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=reporunner:nodejs /app/package.json ./package.json

# Copy necessary config files
COPY --chown=reporunner:nodejs package.json pnpm-workspace.yaml ./

# Switch to non-root user
USER reporunner

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => { process.exit(1) }); req.end();"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/index.js"]
# Production Dockerfile for Reporunner
# Multi-stage build for optimal image size and security
# Updated for 12-package monorepo structure

# Base image with Node.js LTS
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.18.2

# Set working directory
WORKDIR /app

# Copy workspace configuration first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for dependency installation
# This handles the complete monorepo structure (12 packages + subpackages)
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Copy @reporunner scoped packages
COPY packages/@reporunner/ai/package.json ./packages/@reporunner/ai/
COPY packages/@reporunner/auth/package.json ./packages/@reporunner/auth/
COPY packages/@reporunner/cli/package.json ./packages/@reporunner/cli/
COPY packages/@reporunner/core/package.json ./packages/@reporunner/core/
COPY packages/@reporunner/enterprise/package.json ./packages/@reporunner/enterprise/
COPY packages/@reporunner/integrations/package.json ./packages/@reporunner/integrations/
COPY packages/@reporunner/platform/package.json ./packages/@reporunner/platform/
COPY packages/@reporunner/services/package.json ./packages/@reporunner/services/
COPY packages/@reporunner/validation/package.json ./packages/@reporunner/validation/
COPY packages/@reporunner/workflow/package.json ./packages/@reporunner/workflow/

# Install dependencies stage
FROM base AS deps
RUN pnpm install --frozen-lockfile --prod=false

# Build stage
FROM base AS builder

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy all source code
COPY . .

# Build all packages
RUN pnpm build

# Production dependencies stage
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod

# Runtime stage
FROM node:20-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reporunner -u 1001

# Set working directory
WORKDIR /app

# Copy built application (backend and frontend)
COPY --from=builder --chown=reporunner:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy built @reporunner packages that have dist directories
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/ai/dist ./packages/@reporunner/ai/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/auth/dist ./packages/@reporunner/auth/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/cli/dist ./packages/@reporunner/cli/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/core/dist ./packages/@reporunner/core/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/enterprise/dist ./packages/@reporunner/enterprise/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/integrations/dist ./packages/@reporunner/integrations/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/platform/dist ./packages/@reporunner/platform/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/services/dist ./packages/@reporunner/services/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/validation/dist ./packages/@reporunner/validation/dist
COPY --from=builder --chown=reporunner:nodejs /app/packages/@reporunner/workflow/dist ./packages/@reporunner/workflow/dist

# Copy production dependencies and package.json files
COPY --from=prod-deps --chown=reporunner:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=reporunner:nodejs /app/packages/backend/package.json ./packages/backend/
COPY --from=prod-deps --chown=reporunner:nodejs /app/packages/shared/package.json ./packages/shared/

# Copy workspace configuration
COPY --chown=reporunner:nodejs package.json pnpm-workspace.yaml ./

# Switch to non-root user
USER reporunner

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => { process.exit(1) }); req.end();"

# Start application with dumb-init (FIXED: server.js not index.js)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/server.js"]

# Production Dockerfile for KlikkFlow
# Multi-stage build for optimal image size and security
# Updated for 12-package monorepo structure

# Base image with Node.js LTS
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10.18.1

# Set working directory
WORKDIR /app

# Copy workspace configuration first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for dependency installation
# This handles the complete monorepo structure (12 packages + subpackages)
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Copy @klikkflow scoped packages
COPY packages/@klikkflow/ai/package.json ./packages/@klikkflow/ai/
COPY packages/@klikkflow/auth/package.json ./packages/@klikkflow/auth/
COPY packages/@klikkflow/cli/package.json ./packages/@klikkflow/cli/
COPY packages/@klikkflow/core/package.json ./packages/@klikkflow/core/
COPY packages/@klikkflow/enterprise/package.json ./packages/@klikkflow/enterprise/
COPY packages/@klikkflow/integrations/package.json ./packages/@klikkflow/integrations/
COPY packages/@klikkflow/platform/package.json ./packages/@klikkflow/platform/
COPY packages/@klikkflow/services/package.json ./packages/@klikkflow/services/
COPY packages/@klikkflow/validation/package.json ./packages/@klikkflow/validation/
COPY packages/@klikkflow/workflow/package.json ./packages/@klikkflow/workflow/

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
    adduser -S klikkflow -u 1001

# Set working directory
WORKDIR /app

# Copy built application (backend and frontend)
COPY --from=builder --chown=klikkflow:nodejs /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy built @klikkflow packages that have dist directories
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/ai/dist ./packages/@klikkflow/ai/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/auth/dist ./packages/@klikkflow/auth/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/cli/dist ./packages/@klikkflow/cli/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/core/dist ./packages/@klikkflow/core/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/enterprise/dist ./packages/@klikkflow/enterprise/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/integrations/dist ./packages/@klikkflow/integrations/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/platform/dist ./packages/@klikkflow/platform/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/services/dist ./packages/@klikkflow/services/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/validation/dist ./packages/@klikkflow/validation/dist
COPY --from=builder --chown=klikkflow:nodejs /app/packages/@klikkflow/workflow/dist ./packages/@klikkflow/workflow/dist

# Copy production dependencies and package.json files
COPY --from=prod-deps --chown=klikkflow:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=klikkflow:nodejs /app/packages/backend/package.json ./packages/backend/
COPY --from=prod-deps --chown=klikkflow:nodejs /app/packages/shared/package.json ./packages/shared/

# Copy workspace configuration
COPY --chown=klikkflow:nodejs package.json pnpm-workspace.yaml ./

# Switch to non-root user
USER klikkflow

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }); req.on('error', () => { process.exit(1) }); req.end();"

# Start application with dumb-init (FIXED: server.js not index.js)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "packages/backend/dist/server.js"]

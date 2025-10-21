# 🐳 Open Source Docker Image Guide for KlikkFlow

**Complete checklist and best practices for distributing KlikkFlow as an open-source Docker image**

Last Updated: October 11, 2025

---

## 📋 Table of Contents

1. [Security Considerations](#security-considerations)
2. [Image Distribution Strategy](#image-distribution-strategy)
3. [Documentation Requirements](#documentation-requirements)
4. [Configuration Management](#configuration-management)
5. [Size & Performance Optimization](#size--performance-optimization)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Multi-Architecture Support](#multi-architecture-support)
8. [Licensing & Compliance](#licensing--compliance)
9. [Monitoring & Observability](#monitoring--observability)
10. [User Experience](#user-experience)
11. [Versioning Strategy](#versioning-strategy)
12. [Testing & Quality Assurance](#testing--quality-assurance)

---

## 🔒 Security Considerations

### ✅ **CRITICAL: Must-Have Security Practices**

#### 1. **No Secrets in Images**
```dockerfile
# ❌ NEVER DO THIS
ENV JWT_SECRET=my-secret-key
ENV DATABASE_PASSWORD=password123

# ✅ DO THIS INSTEAD
# Require secrets via environment variables at runtime
ENV JWT_SECRET=""
ENV DATABASE_PASSWORD=""
```

**Action Items:**
- [ ] Remove all hardcoded credentials from Dockerfile
- [ ] Remove all secrets from `.env` files in the image
- [ ] Add `.env*` to `.dockerignore`
- [ ] Document all required environment variables
- [ ] Create `.env.example` with placeholder values

#### 2. **Non-Root User** ✅ Already Implemented
```dockerfile
# Current implementation is good:
RUN addgroup -g 1001 -S nodejs && \
    adduser -S klikkflow -u 1001
USER klikkflow
```

#### 3. **Minimal Base Image** ✅ Using Alpine
```dockerfile
# Good choice: node:18-alpine
# Consider future upgrade to node:20-alpine
```

#### 4. **Security Scanning**
```bash
# Add to CI/CD pipeline
docker scan klikkflow:latest
trivy image klikkflow:latest
snyk container test klikkflow:latest
```

**Action Items:**
- [ ] Set up automated security scanning in GitHub Actions
- [ ] Add Trivy or Snyk to CI pipeline
- [ ] Create security policy (SECURITY.md) with vulnerability disclosure process
- [ ] Set up Dependabot for dependency updates
- [ ] Monitor CVE databases for base image vulnerabilities

#### 5. **Image Signing & Verification**
```bash
# Sign images with Docker Content Trust
export DOCKER_CONTENT_TRUST=1
docker push klikkflow/klikkflow:latest

# Or use Cosign
cosign sign klikkflow/klikkflow:latest
```

**Action Items:**
- [ ] Set up Docker Content Trust
- [ ] Consider Cosign for image signing
- [ ] Document verification process for users

#### 6. **Secure Defaults**
- [ ] Disable unnecessary services
- [ ] Use read-only root filesystem where possible
- [ ] Set resource limits (CPU, memory)
- [ ] Enable security options in docker-compose

```yaml
# Example secure docker-compose.yml
services:
  klikkflow:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

---

## 📦 Image Distribution Strategy

### **Recommended: Multi-Registry Approach**

#### 1. **Docker Hub** (Primary)
```
klikkflow/klikkflow:latest
klikkflow/klikkflow:1.0.0
klikkflow/klikkflow:1.0.0-alpine
```

**Setup:**
- [ ] Create Docker Hub organization: `klikkflow`
- [ ] Set up automated builds
- [ ] Configure README from GitHub
- [ ] Add badges to README

#### 2. **GitHub Container Registry** (Recommended)
```
ghcr.io/klikkflow/klikkflow:latest
ghcr.io/klikkflow/klikkflow:1.0.0
```

**Benefits:**
- Integrated with GitHub
- Free for public images
- Better rate limits
- Source code proximity

**Setup:**
- [ ] Enable GitHub Container Registry
- [ ] Add GHCR workflow to `.github/workflows/`
- [ ] Configure package visibility
- [ ] Link to repository

#### 3. **Multi-Registry Push**
```yaml
# GitHub Actions example
- name: Push to multiple registries
  run: |
    docker tag klikkflow:latest klikkflow/klikkflow:latest
    docker tag klikkflow:latest ghcr.io/klikkflow/klikkflow:latest
    docker push klikkflow/klikkflow:latest
    docker push ghcr.io/klikkflow/klikkflow:latest
```

### **Image Variants to Publish**

```
# Recommended variants
klikkflow/klikkflow:latest          # Latest stable
klikkflow/klikkflow:1.0.0           # Specific version
klikkflow/klikkflow:1.0            # Minor version
klikkflow/klikkflow:1               # Major version
klikkflow/klikkflow:edge            # Development branch
klikkflow/klikkflow:1.0.0-alpine   # Explicit base
```

**Action Items:**
- [ ] Decide on tagging strategy
- [ ] Set up automated tagging in CI/CD
- [ ] Document which tags are available
- [ ] Set up tag cleanup policy for old versions

---

## 📚 Documentation Requirements

### **Must-Have Documentation Files**

#### 1. **README.md** (Root)
Should include:
- [ ] Quick start with Docker
- [ ] `docker pull` command
- [ ] Simple `docker run` example
- [ ] Link to full documentation
- [ ] Badges for Docker pulls, stars, build status

```markdown
## 🐳 Quick Start with Docker

Pull the latest image:
\`\`\`bash
docker pull klikkflow/klikkflow:latest
\`\`\`

Run with defaults:
\`\`\`bash
docker run -p 3000:3000 klikkflow/klikkflow:latest
\`\`\`

Or use docker-compose:
\`\`\`bash
curl -o docker-compose.yml https://raw.githubusercontent.com/klikkflow/klikkflow/main/docker-compose.yml
docker-compose up
\`\`\`
```

#### 2. **docs/docker/DOCKER.md** (Detailed Guide)
Should include:
- [ ] All available image tags
- [ ] Supported architectures
- [ ] Environment variables (complete list)
- [ ] Volume mounts
- [ ] Network configuration
- [ ] Resource requirements
- [ ] Upgrade procedures
- [ ] Troubleshooting guide
- [ ] Advanced configuration examples

#### 3. **docker-compose.yml** (Production-Ready Example)
- [ ] Create `docker-compose.yml` in root
- [ ] Create `docker-compose.prod.yml` for production
- [ ] Create `docker-compose.dev.yml` for development
- [ ] Include all required services (MongoDB, PostgreSQL, Redis)
- [ ] Document each service
- [ ] Add health checks
- [ ] Include volume persistence

#### 4. **.env.example**
```bash
# Application
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://mongo:27017/klikkflow
POSTGRES_URL=postgres://postgres:password@postgres:5432/klikkflow
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your-secret-key-here-minimum-32-characters
JWT_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# AI Services (Optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Object Storage (Optional)
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

**Action Items:**
- [ ] Create comprehensive `.env.example`
- [ ] Document all environment variables
- [ ] Indicate which are required vs optional
- [ ] Provide default values where appropriate
- [ ] Add validation for required env vars at startup

#### 5. **Docker Hub README**
- [ ] Create `README.docker.md` specifically for Docker Hub
- [ ] Include quick start
- [ ] List all tags
- [ ] Link to full documentation
- [ ] Add usage examples

---

## ⚙️ Configuration Management

### **Environment Variables Strategy**

#### 1. **Required Variables**
These must be set or the application should fail to start:
```bash
JWT_SECRET
MONGODB_URI
POSTGRES_URL
```

#### 2. **Optional with Defaults**
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

#### 3. **Validation at Startup**
```typescript
// packages/backend/src/config/validate.ts
export function validateConfig() {
  const required = ['JWT_SECRET', 'MONGODB_URI', 'POSTGRES_URL'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n📖 See: https://docs.klikkflow.com/docker/env-vars');
    process.exit(1);
  }
}
```

### **Configuration Files**

#### 1. **Config Directory Structure**
```
/app/config/
├── default.json          # Default configuration
├── production.json       # Production overrides
├── development.json      # Development overrides
└── custom.json          # User-provided config (volume mount)
```

#### 2. **Volume Mount for Config**
```yaml
services:
  klikkflow:
    volumes:
      - ./config:/app/config/custom:ro
      - klikkflow-data:/app/data
```

**Action Items:**
- [ ] Create config management system
- [ ] Support config files via volume mounts
- [ ] Document config file precedence
- [ ] Validate config at startup
- [ ] Provide JSON schema for config validation

---

## 🎯 Size & Performance Optimization

### **Current Status**
- Previous images: 50.4MB (backend), 50.2MB (frontend)
- Expected with 12 packages: 60-80MB

### **Optimization Strategies**

#### 1. **Multi-Stage Build** ✅ Already Implemented
```dockerfile
# Good current approach:
FROM node:18-alpine AS base
FROM base AS deps
FROM base AS builder
FROM base AS prod-deps
FROM node:18-alpine AS runtime
```

#### 2. **Layer Optimization**
```dockerfile
# Good practices already applied:
# - Copy package.json files first (better caching)
# - Install dependencies in separate stage
# - Copy only dist directories to runtime
# - Use --frozen-lockfile for deterministic builds
```

#### 3. **Additional Optimizations**

```dockerfile
# Consider adding:
# Remove unnecessary files after build
RUN rm -rf /root/.npm /root/.pnpm-store /tmp/*

# Use exact versions
RUN npm install -g pnpm@9.15.2

# Combine RUN commands
RUN apk add --no-cache dumb-init \
    && rm -rf /var/cache/apk/*
```

#### 4. **Image Size Targets**
- [ ] Backend + Frontend: <100MB
- [ ] Backend only: <80MB
- [ ] With all dependencies: <150MB

#### 5. **Performance Optimizations**
```dockerfile
# Add build-time optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Runtime optimizations
CMD ["node", "--max-old-space-size=2048", "packages/backend/dist/server.js"]
```

**Action Items:**
- [ ] Measure current image size
- [ ] Set up size tracking in CI
- [ ] Add size budgets
- [ ] Monitor layer sizes with `dive`
- [ ] Optimize largest layers

---

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflow**

#### 1. **Build & Push Workflow**
```yaml
# .github/workflows/docker.yml
name: Docker Build & Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            klikkflow/klikkflow
            ghcr.io/klikkflow/klikkflow
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### 2. **Security Scanning**
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t klikkflow:test .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: klikkflow:test
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

#### 3. **Testing**
```yaml
# .github/workflows/test-docker.yml
name: Docker Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t klikkflow:test .

      - name: Start services
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Wait for health
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

      - name: Run tests
        run: docker exec klikkflow-test npm test

      - name: Check logs
        if: failure()
        run: docker-compose logs
```

**Action Items:**
- [ ] Create `.github/workflows/docker.yml`
- [ ] Create `.github/workflows/security.yml`
- [ ] Set up Docker Hub secrets
- [ ] Configure automated builds
- [ ] Add build status badges to README
- [ ] Set up notifications for failed builds

---

## 🌐 Multi-Architecture Support

### **Target Architectures**
- ✅ `linux/amd64` (Intel/AMD x86_64)
- ✅ `linux/arm64` (ARM 64-bit - Apple Silicon, AWS Graviton)
- ⚠️ `linux/arm/v7` (ARM 32-bit - Raspberry Pi) - Optional

### **Build Multi-Arch Images**

```bash
# Set up buildx
docker buildx create --name multiarch --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t klikkflow/klikkflow:latest \
  --push \
  .
```

### **GitHub Actions** (Already in workflow above)
```yaml
platforms: linux/amd64,linux/arm64
```

### **Testing Multi-Arch**
```bash
# Test on different architectures
docker run --platform linux/amd64 klikkflow/klikkflow:latest
docker run --platform linux/arm64 klikkflow/klikkflow:latest
```

**Action Items:**
- [ ] Enable Docker Buildx
- [ ] Build multi-arch images in CI
- [ ] Test on ARM hardware (Mac M1/M2 or AWS Graviton)
- [ ] Document supported architectures
- [ ] Add architecture badges to Docker Hub

---

## ⚖️ Licensing & Compliance

### **License Visibility**

#### 1. **Include License in Image**
```dockerfile
# Add to Dockerfile
COPY --chown=klikkflow:nodejs LICENSE /app/LICENSE
COPY --chown=klikkflow:nodejs README.md /app/README.md
```

#### 2. **License Labels**
```dockerfile
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="KlikkFlow"
LABEL org.opencontainers.image.description="Open-source workflow automation platform"
LABEL org.opencontainers.image.url="https://github.com/klikkflow/klikkflow"
LABEL org.opencontainers.image.source="https://github.com/klikkflow/klikkflow"
LABEL org.opencontainers.image.vendor="KlikkFlow Team"
```

#### 3. **Third-Party Licenses**
```bash
# Generate license file
npx license-checker --production --json > licenses.json

# Include in image
COPY licenses.json /app/licenses.json
```

### **Compliance Checks**
- [ ] Scan for license incompatibilities
- [ ] Document all dependencies
- [ ] Include NOTICE file if required
- [ ] Check for GPL-licensed dependencies
- [ ] Document license in Docker Hub description

**Action Items:**
- [ ] Add LICENSE file to image
- [ ] Add image labels
- [ ] Generate third-party license report
- [ ] Create NOTICE file if needed
- [ ] Add license badge to README

---

## 📊 Monitoring & Observability

### **Health Checks** ✅ Already Implemented
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); ..."
```

### **Improve Health Check Endpoint**
```typescript
// packages/backend/src/routes/health.ts
export async function healthCheck(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      postgres: await checkPostgres()
    }
  };

  const allHealthy = Object.values(health.services).every(s => s.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
}
```

### **Logging Best Practices**
```typescript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: 'klikkflow' },
  transports: [
    new winston.transports.Console()
  ]
});

// Log to stdout (Docker best practice)
logger.info('Server started', { port: 3000 });
```

### **Metrics Exposure**
```typescript
// Expose metrics endpoint
import prometheus from 'prom-client';

// /metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### **Container Labels for Monitoring**
```dockerfile
LABEL com.datadoghq.ad.check_names='["klikkflow"]'
LABEL com.datadoghq.ad.init_configs='[{}]'
LABEL com.datadoghq.ad.instances='[{"prometheus_url": "http://%%host%%:3000/metrics"}]'
```

**Action Items:**
- [ ] Implement comprehensive health check
- [ ] Add /metrics endpoint
- [ ] Use structured logging (JSON)
- [ ] Log to stdout/stderr only
- [ ] Add monitoring labels
- [ ] Document monitoring setup
- [ ] Create Grafana dashboard for Docker metrics

---

## 🎨 User Experience

### **One-Command Quick Start**

```bash
# Goal: User should be able to run this and have working system
docker run -d \
  --name klikkflow \
  -p 3000:3000 \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -v klikkflow-data:/app/data \
  klikkflow/klikkflow:latest

echo "🎉 KlikkFlow started! Visit http://localhost:3000"
```

### **Docker Compose Quick Start**
```yaml
# docker-compose.quickstart.yml
version: '3.8'

services:
  klikkflow:
    image: klikkflow/klikkflow:latest
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
      - MONGODB_URI=mongodb://mongo:27017/klikkflow
      - POSTGRES_URL=postgres://postgres:password@postgres:5432/klikkflow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - postgres
      - redis
    volumes:
      - klikkflow-data:/app/data

  mongo:
    image: mongo:7-alpine
    volumes:
      - mongo-data:/data/db

  postgres:
    image: pgvector/pgvector:pg16-alpine
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  klikkflow-data:
  mongo-data:
  postgres-data:
  redis-data:
```

### **Interactive Setup Script**
```bash
# setup.sh
#!/bin/bash
echo "🐳 KlikkFlow Docker Setup"
echo "=========================="

# Generate JWT secret
if [ -z "$JWT_SECRET" ]; then
  echo "Generating JWT secret..."
  export JWT_SECRET=$(openssl rand -base64 32)
fi

# Create .env file
cat > .env << EOF
JWT_SECRET=$JWT_SECRET
MONGODB_URI=mongodb://mongo:27017/klikkflow
POSTGRES_URL=postgres://postgres:password@postgres:5432/klikkflow
REDIS_URL=redis://redis:6379
EOF

echo "✅ Configuration created!"
echo "Starting services..."
docker-compose up -d

echo "🎉 Done! Visit http://localhost:3000"
```

### **Helpful Startup Messages**
```typescript
// Display helpful information on startup
console.log(`
🚀 KlikkFlow is starting...

📋 Configuration:
   - Environment: ${process.env.NODE_ENV}
   - Port: ${process.env.PORT}
   - MongoDB: ${process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@')}
   - Redis: ${process.env.REDIS_URL}

📖 Documentation: https://docs.klikkflow.com
🐛 Issues: https://github.com/klikkflow/klikkflow/issues
💬 Community: https://discord.gg/klikkflow

Waiting for database connections...
`);
```

**Action Items:**
- [ ] Create one-command quick start
- [ ] Create docker-compose.quickstart.yml
- [ ] Create interactive setup script
- [ ] Add helpful startup messages
- [ ] Create troubleshooting guide
- [ ] Add "Getting Started" video tutorial

---

## 🏷️ Versioning Strategy

### **Semantic Versioning**
```
MAJOR.MINOR.PATCH
1.0.0
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### **Docker Tag Strategy**
```
klikkflow/klikkflow:latest          # Latest stable
klikkflow/klikkflow:1                # Major version
klikkflow/klikkflow:1.0              # Minor version
klikkflow/klikkflow:1.0.0            # Patch version
klikkflow/klikkflow:edge             # Development
klikkflow/klikkflow:1.0.0-alpine    # Base image variant
klikkflow/klikkflow:sha-abc123      # Git commit
```

### **Release Process**
1. Update version in package.json
2. Create git tag: `git tag -a v1.0.0 -m "Release 1.0.0"`
3. Push tag: `git push origin v1.0.0`
4. GitHub Actions automatically builds and pushes
5. Update CHANGELOG.md
6. Create GitHub Release with notes

### **Upgrade Path Documentation**
```markdown
## Upgrading

### From 0.x to 1.0
1. Backup your data
2. Update docker-compose.yml
3. Pull new image: `docker pull klikkflow/klikkflow:1.0`
4. Run migrations: `docker exec klikkflow npm run migrate`
5. Restart: `docker-compose up -d`

### Breaking Changes in 1.0
- Environment variable `DATABASE_URL` renamed to `MONGODB_URI`
- Default port changed from 3001 to 3000
```

**Action Items:**
- [ ] Document versioning strategy
- [ ] Create release checklist
- [ ] Set up automated releases
- [ ] Create upgrade guides
- [ ] Document breaking changes
- [ ] Maintain CHANGELOG.md

---

## 🧪 Testing & Quality Assurance

### **Automated Testing**

#### 1. **Build Testing**
```bash
# Test build succeeds
docker build -t klikkflow:test .

# Test image size
SIZE=$(docker images klikkflow:test --format "{{.Size}}")
echo "Image size: $SIZE"
```

#### 2. **Container Testing**
```yaml
# container-structure-test.yaml
schemaVersion: 2.0.0

commandTests:
  - name: "Check Node version"
    command: "node"
    args: ["--version"]
    expectedOutput: ["v18.*"]

  - name: "Check pnpm installed"
    command: "pnpm"
    args: ["--version"]

  - name: "Check server.js exists"
    command: "test"
    args: ["-f", "/app/packages/backend/dist/server.js"]

fileExistenceTests:
  - name: "License file"
    path: "/app/LICENSE"
    shouldExist: true

  - name: "README file"
    path: "/app/README.md"
    shouldExist: true

metadataTest:
  env:
    - key: NODE_ENV
      value: production

  exposedPorts: ["3000"]

  user: "klikkflow"

  workdir: "/app"
```

#### 3. **Integration Testing**
```bash
# test-docker-image.sh
#!/bin/bash
set -e

echo "Testing Docker image..."

# Start container
docker-compose -f docker-compose.test.yml up -d

# Wait for health
timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'

# Run API tests
curl http://localhost:3000/api/workflows | jq .

# Run smoke tests
npm run test:smoke

# Cleanup
docker-compose -f docker-compose.test.yml down

echo "✅ All tests passed!"
```

### **Quality Gates**

```yaml
# GitHub Actions quality gates
- name: Check image size
  run: |
    SIZE=$(docker images klikkflow:test --format "{{.Size}}" | sed 's/MB//')
    if (( $(echo "$SIZE > 150" | bc -l) )); then
      echo "❌ Image too large: ${SIZE}MB (max: 150MB)"
      exit 1
    fi

- name: Security scan
  run: |
    trivy image --severity HIGH,CRITICAL --exit-code 1 klikkflow:test
```

**Action Items:**
- [ ] Create container structure tests
- [ ] Add integration tests for Docker
- [ ] Set up quality gates in CI
- [ ] Test on different platforms
- [ ] Test upgrade scenarios
- [ ] Document testing procedures

---

## ✅ Complete Checklist

### **Phase 1: Security & Foundation** 🔒
- [ ] Remove all hardcoded secrets
- [ ] Create comprehensive .env.example
- [ ] Set up security scanning (Trivy/Snyk)
- [ ] Implement startup validation for required env vars
- [ ] Add image signing
- [ ] Create SECURITY.md with disclosure process

### **Phase 2: Distribution** 📦
- [ ] Create Docker Hub organization
- [ ] Set up GitHub Container Registry
- [ ] Configure automated builds
- [ ] Implement multi-registry push
- [ ] Set up image tagging strategy
- [ ] Add Docker Hub README

### **Phase 3: Documentation** 📚
- [ ] Update root README.md with Docker quick start
- [ ] Create comprehensive Docker documentation
- [ ] Create production-ready docker-compose.yml
- [ ] Document all environment variables
- [ ] Create troubleshooting guide
- [ ] Add usage examples

### **Phase 4: Optimization** ⚡
- [ ] Measure and optimize image size
- [ ] Set up size tracking in CI
- [ ] Optimize layer caching
- [ ] Add performance tuning options
- [ ] Document resource requirements

### **Phase 5: CI/CD** 🔄
- [ ] Create GitHub Actions workflows
- [ ] Set up automated testing
- [ ] Configure multi-arch builds
- [ ] Add quality gates
- [ ] Set up release automation
- [ ] Add status badges

### **Phase 6: Monitoring** 📊
- [ ] Enhance health check endpoint
- [ ] Add /metrics endpoint
- [ ] Implement structured logging
- [ ] Add monitoring labels
- [ ] Create Grafana dashboard
- [ ] Document monitoring setup

### **Phase 7: User Experience** 🎨
- [ ] Create one-command quick start
- [ ] Create interactive setup script
- [ ] Add helpful startup messages
- [ ] Create video tutorials
- [ ] Set up community support channels
- [ ] Add examples repository

### **Phase 8: Compliance & Quality** ✅
- [ ] Add license to image
- [ ] Generate third-party licenses
- [ ] Create container tests
- [ ] Test upgrade paths
- [ ] Document versioning strategy
- [ ] Create release checklist

---

## 📈 Success Metrics

Track these metrics to measure success:

1. **Docker Hub Pulls**: Target 10k+ downloads in first year
2. **Build Success Rate**: >95% successful builds
3. **Image Size**: <100MB for standard image
4. **Security Scan**: Zero HIGH/CRITICAL vulnerabilities
5. **Build Time**: <15 minutes for multi-arch
6. **User Feedback**: >4.5 stars on Docker Hub
7. **Documentation**: >90% of issues answered by docs

---

## 🔗 Resources

- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **OCI Image Spec**: https://github.com/opencontainers/image-spec
- **Hadolint (Dockerfile linter)**: https://github.com/hadolint/hadolint
- **Container Structure Tests**: https://github.com/GoogleContainerTools/container-structure-test
- **Trivy Security Scanner**: https://github.com/aquasecurity/trivy
- **Docker Compose Best Practices**: https://docs.docker.com/compose/production/

---

**Status**: 📋 Planning Complete - Ready for Implementation
**Next Steps**: Begin Phase 1 (Security & Foundation)
**Estimated Timeline**: 4-6 weeks for complete implementation
**Priority**: HIGH - Required for public release

---

*This guide is a living document. Update it as new best practices emerge.*

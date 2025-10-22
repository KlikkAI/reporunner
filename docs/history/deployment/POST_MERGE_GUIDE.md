# KlikkFlow Rebranding - Post-Merge Deployment Guide

**Status**: Ready for execution after PR #3 merge
**Created**: October 21, 2025
**Estimated Time**: 2-3 hours

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying the KlikkFlow rebrand after merging PR #3.

**Pull Request**: https://github.com/KlikkAI/reporunner/pull/3

---

## ✅ Pre-Merge Checklist

Before merging the PR, ensure:

- [ ] All CI/CD checks pass
- [ ] Code review completed by at least 2 reviewers
- [ ] All breaking changes documented
- [ ] Migration guide reviewed
- [ ] Communication plan ready

---

## 🚀 Immediate Post-Merge Actions

### Step 1: Update Local Repository

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Verify rebranding
grep -r "reporunner" . --exclude-dir=node_modules | wc -l
# Should output: 0

# Reinstall dependencies
pnpm install
```

### Step 2: Rename GitHub Repository (Admin Required)

**Option A: Same Organization (KlikkAI)**
1. Go to: https://github.com/KlikkAI/reporunner/settings
2. Scroll to "Repository name"
3. Change from `reporunner` to `klikkflow`
4. Click "Rename"
5. **GitHub will automatically set up redirects**

**Option B: New Organization (Recommended)**
1. Create new GitHub organization: `klikkflow`
2. Transfer repository to new org
3. Rename to `klikkflow`
4. Final URL: `github.com/klikkflow/klikkflow`

**Update local remotes:**
```bash
git remote set-url origin https://github.com/klikkflow/klikkflow.git
git remote -v  # Verify
```

### Step 3: Create NPM Organization & Publish Packages

**A. Create NPM Organization**
```bash
# Login to NPM
npm login

# Create @klikkflow organization
# Visit: https://www.npmjs.com/org/create
# Organization name: klikkflow
# Choose plan (free for open source)
```

**B. Build & Publish Packages**
```bash
# Build all packages
pnpm run build

# Publish packages one by one or all at once
# Verify build output first
ls -la packages/@klikkflow/*/dist

# Publish all @klikkflow packages
pnpm -r --filter "@klikkflow/*" publish --access public

# Or publish individually if needed
pnpm --filter @klikkflow/core publish --access public
pnpm --filter @klikkflow/sdk publish --access public
# ... etc
```

**C. Verify Publication**
```bash
# Check if packages are available
npm view @klikkflow/sdk
npm view @klikkflow/core
```

### Step 4: Update Docker Images

**A. Build New Images**
```bash
# Frontend
docker build -t ghcr.io/klikkflow/frontend:latest -f Dockerfile.frontend .
docker build -t ghcr.io/klikkflow/frontend:$(git describe --tags) -f Dockerfile.frontend .

# Backend
docker build -t ghcr.io/klikkflow/backend:latest -f Dockerfile.backend .
docker build -t ghcr.io/klikkflow/backend:$(git describe --tags) -f Dockerfile.backend .

# Worker
docker build -t ghcr.io/klikkflow/worker:latest -f Dockerfile.worker .
docker build -t ghcr.io/klikkflow/worker:$(git describe --tags) -f Dockerfile.worker .
```

**B. Push to Registry**
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push all images
docker push ghcr.io/klikkflow/frontend:latest
docker push ghcr.io/klikkflow/backend:latest
docker push ghcr.io/klikkflow/worker:latest

# Push versioned tags
docker push ghcr.io/klikkflow/frontend:$(git describe --tags)
docker push ghcr.io/klikkflow/backend:$(git describe --tags)
docker push ghcr.io/klikkflow/worker:$(git describe --tags)
```

**C. Verify Images**
```bash
docker pull ghcr.io/klikkflow/frontend:latest
docker images | grep klikkflow
```

### Step 5: Update CI/CD Environment Variables

**GitHub Actions Secrets** (Settings → Secrets → Actions):
```
Update or add:
- KLIKKFLOW_API_KEY (if exists, rename from REPORUNNER_API_KEY)
- KLIKKFLOW_JWT_SECRET (rename from REPORUNNER_JWT_SECRET)
- KLIKKFLOW_ENCRYPTION_KEY (rename from REPORUNNER_ENCRYPTION_KEY)
- NPM_TOKEN (for publishing @klikkflow packages)
- DOCKER_USERNAME (for ghcr.io/klikkflow)
- DOCKER_PASSWORD
```

**Verify Workflows**:
```bash
# Check if workflows use new variables
grep -r "REPORUNNER" .github/workflows/
# Should output: nothing

# Test a workflow
git push origin main  # Trigger CI
```

---

## 📦 SDK Publishing

### TypeScript SDK
```bash
cd sdks/typescript
pnpm build
pnpm publish --access public
# Published as: @klikkflow/sdk
```

### Python SDK
```bash
cd sdks/python
python setup.py sdist bdist_wheel
twine upload dist/*
# Published as: klikkflow-sdk
```

### Go SDK
```bash
cd sdks/go
# Tag the release
git tag sdks/go/v1.0.0
git push origin sdks/go/v1.0.0

# Users can then: go get github.com/klikkflow/klikkflow/go-sdk@v1.0.0
```

### Rust SDK
```bash
cd sdks/rust
cargo publish
# Published as: klikkflow-sdk
```

### Java SDK
```bash
cd sdks/java
mvn clean deploy
# Published to Maven Central as: com.klikkflow:klikkflow-java-sdk
```

### PHP SDK
```bash
cd sdks/php
# Ensure composer.json is updated
composer validate
# Submit to Packagist.org: klikkflow/php-sdk
```

### .NET SDK
```bash
cd sdks/dotnet
dotnet pack
dotnet nuget push ./bin/Release/KlikkFlow.Sdk.*.nupkg --source https://api.nuget.org/v3/index.json
# Published as: KlikkFlow.Sdk
```

---

## 🌐 External Services Updates

### A. Domain & DNS (if applicable)
```bash
# Update DNS records
# If using klikkflow.com or similar:
A     klikkflow.com          → YOUR_SERVER_IP
CNAME www.klikkflow.com      → klikkflow.com
CNAME api.klikkflow.com      → klikkflow.com
CNAME docs.klikkflow.com     → klikkflow.com
```

### B. Documentation Sites

**Update**:
- [ ] Main documentation site
- [ ] API documentation
- [ ] SDK documentation (all 7 languages)
- [ ] Community wiki
- [ ] Blog/announcement posts

**Deploy Updated Docs**:
```bash
cd docs-site  # If you have a separate docs repo
git pull origin main
npm run build
npm run deploy
```

### C. Social Media & Community

**Update Profiles**:
- [ ] GitHub organization profile
- [ ] Twitter/X handle
- [ ] Discord server name and branding
- [ ] LinkedIn page
- [ ] Dev.to/Hashnode profiles

**Announcements**:
- [ ] GitHub Discussions post
- [ ] Discord announcement
- [ ] Twitter/X thread
- [ ] Blog post on website
- [ ] Newsletter to subscribers

### D. Package Registry Badges

Update README badges:
```markdown
<!-- NPM -->
![npm](https://img.shields.io/npm/v/@klikkflow/sdk)

<!-- Docker -->
![Docker](https://img.shields.io/docker/v/klikkflow/frontend?label=docker)

<!-- PyPI -->
![PyPI](https://img.shields.io/pypi/v/klikkflow-sdk)

<!-- crates.io -->
![Crates.io](https://img.shields.io/crates/v/klikkflow-sdk)
```

---

## 📢 User Communication

### Migration Guide for Users

Create and publish this guide:

**File**: `MIGRATION_KLIKKFLOW.md`

```markdown
# Migration Guide: Reporunner → KlikkFlow

## Package Updates

### NPM/pnpm/Yarn
\`\`\`bash
# Uninstall old packages
npm uninstall @reporunner/sdk @reporunner/core

# Install new packages
npm install @klikkflow/sdk @klikkflow/core
\`\`\`

Update package.json:
\`\`\`diff
{
  "dependencies": {
-   "@reporunner/sdk": "^1.0.0"
+   "@klikkflow/sdk": "^1.0.0"
  }
}
\`\`\`

### Environment Variables
\`\`\`diff
- REPORUNNER_API_KEY=your-key
+ KLIKKFLOW_API_KEY=your-key

- REPORUNNER_DB_URL=mongodb://...
+ KLIKKFLOW_DB_URL=mongodb://...
\`\`\`

### Docker Images
\`\`\`diff
- docker pull ghcr.io/klikkai/frontend:latest
+ docker pull ghcr.io/klikkflow/frontend:latest
\`\`\`

### Code Imports
\`\`\`diff
- import { WorkflowClient } from '@reporunner/sdk';
+ import { WorkflowClient } from '@klikkflow/sdk';
\`\`\`
```

### Announcement Template

**Subject**: Introducing KlikkFlow - Our New Brand Identity

```markdown
# 🎨 Introducing KlikkFlow

We're excited to announce that **Reporunner** has been rebranded to **KlikkFlow**!

## What's Changing?
- **Package names**: `@reporunner/*` → `@klikkflow/*`
- **Repository**: `github.com/KlikkAI/reporunner` → `github.com/klikkflow/klikkflow`
- **Docker images**: `reporunner/*` → `klikkflow/*`
- **Environment variables**: `REPORUNNER_*` → `KLIKKFLOW_*`

## What's NOT Changing?
- All features remain the same
- API endpoints are backward compatible
- Your existing workflows continue to work
- No data migration required

## Migration Guide
See our complete migration guide: [MIGRATION_KLIKKFLOW.md](link)

## Timeline
- **October 21, 2025**: Rebranding complete
- **October 28, 2025**: All packages published
- **November 1, 2025**: Old packages deprecated
- **January 1, 2026**: Old packages archived (but still available)

Questions? Join our Discord or open a GitHub discussion.
```

---

## ✅ Verification Checklist

After completing all steps, verify:

### Code & Repository
- [ ] GitHub repository renamed
- [ ] All remotes updated
- [ ] README and docs reference KlikkFlow
- [ ] No "reporunner" references in codebase

### Packages & Distribution
- [ ] NPM packages published and accessible
- [ ] Docker images available on ghcr.io
- [ ] All 7 SDKs published to respective registries
- [ ] Package badges updated

### Infrastructure
- [ ] CI/CD pipelines working with new names
- [ ] Environment variables updated in all environments
- [ ] Deployment scripts using new image names
- [ ] Monitoring/observability using new labels

### External Services
- [ ] DNS records updated (if applicable)
- [ ] Documentation sites updated
- [ ] Social media profiles updated
- [ ] Community channels notified

### User Communication
- [ ] Migration guide published
- [ ] Announcement posted
- [ ] Old packages deprecated (with warnings)
- [ ] Support channels ready for questions

---

## 🆘 Rollback Plan

If critical issues arise:

### Quick Rollback (Git)
```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Package Rollback
```bash
# Unpublish if within 24 hours (NPM policy)
npm unpublish @klikkflow/sdk --force

# Otherwise, deprecate and point to old packages
npm deprecate @klikkflow/sdk "Use @reporunner/sdk instead"
```

### Docker Rollback
```bash
# Old images should still be available
docker pull ghcr.io/klikkai/frontend:latest
```

---

## 📞 Support Contacts

**For Questions**:
- GitHub Discussions: https://github.com/klikkflow/klikkflow/discussions
- Discord: [Your Discord link]
- Email: support@klikkflow.com

**For Issues**:
- GitHub Issues: https://github.com/klikkflow/klikkflow/issues
- Critical bugs: support@klikkflow.com

---

## 📊 Success Metrics

Track these metrics post-deployment:

- [ ] NPM download counts for @klikkflow packages
- [ ] Docker pull counts for new images
- [ ] GitHub repository stars/forks
- [ ] User migration rate (monitor old package downloads)
- [ ] Support ticket volume
- [ ] Community sentiment (social media, discussions)

**Target Goals** (30 days):
- 80%+ users migrated to new packages
- < 5% increase in support tickets
- Positive community feedback
- All CI/CD green for 7 consecutive days

---

**Last Updated**: October 21, 2025
**Document Version**: 1.0
**Status**: Ready for execution

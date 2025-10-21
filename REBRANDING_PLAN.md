# Rebranding Plan: Reporunner → KlikkAI

**Date**: October 21, 2025
**Status**: Planning Phase
**Scope**: Complete rebrand from Reporunner to KlikkAI

---

## Overview

This document outlines the comprehensive plan to rebrand the project from **Reporunner** to **KlikkAI**.

**Statistics**:
- **5,819 occurrences** across **517 files**
- **1,121 occurrences** in **78 documentation files**
- **85 markdown files** in `docs/` directory
- **9 root-level markdown files**

---

## Phase 1: Documentation Update (Start Here)

### Files to Update

#### Root Documentation (9 files)
- `README.md` - Main project description
- `CLAUDE.md` - AI context file
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community guidelines
- `GOVERNANCE.md` - Project governance
- `MAINTAINERS.md` - Team structure
- `SECURITY.md` - Security policy
- `DOCKER.md` - Docker quick start
- `CHANGELOG.md` - Version history

#### Documentation Directory (85 files)
- `docs/README.md` - Docs index
- `docs/user-guide/*` - User documentation (3 files)
  - GETTING_STARTED.md
  - INTEGRATIONS_GUIDE.md
  - WORKFLOW_EXAMPLES.md
- `docs/deployment/*` - Deployment guides (10+ files)
- `docs/api/*` - API documentation (3 files)
- `docs/project-planning/*` - Planning docs (30+ files)
- `docs/features/*` - Feature documentation (2 files)
- `docs/history/*` - Historical records (30+ files)
- `docs/development/*` - Development guides (3 files)

### Replacement Strategy

**Case-sensitive replacements**:
```bash
Reporunner → KlikkAI      # Product name (proper noun)
reporunner → klikkai      # Lowercase (URLs, packages, paths)
REPORUNNER → KLIKKAI      # Constants, env vars
@reporunner → @klikkai    # NPM package scope
```

### Commands to Execute

```bash
# Step 1: Find all markdown files (preview)
find . -name "*.md" -type f | wc -l

# Step 2: Backup before changes
git checkout -b rebrand-to-klikkai

# Step 3: Replace in all markdown files
find . -name "*.md" -type f -exec sed -i 's/Reporunner/KlikkAI/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/reporunner/klikkai/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/REPORUNNER/KLIKKAI/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/@reporunner/@klikkai/g' {} \;

# Step 4: Verify changes
grep -r "reporunner" --include="*.md" -i | wc -l  # Should be minimal

# Step 5: Commit
git add .
git commit -m "docs: rebrand from Reporunner to KlikkAI"
```

### Special Cases to Handle Manually

**Preserve these**:
- GitHub repository URL: `github.com/KlikkAI/reporunner` (if repo name stays)
- Git remote URLs
- Historical references in CHANGELOG.md (optional)

**Update these carefully**:
- API endpoints: `/api/reporunner/v1` → `/api/klikkai/v1`
- Docker image names: `reporunner/backend` → `klikkai/backend`
- Environment variable prefixes: `REPORUNNER_` → `KLIKKAI_`

---

## Phase 2: Code Files Update

### Package Names (12 packages)

**Current structure**:
```
packages/
├── frontend/              # @reporunner/frontend
├── backend/               # @reporunner/backend
├── shared/                # @reporunner/shared
└── @reporunner/           # 9 scoped packages
    ├── ai/                # @reporunner/ai
    ├── auth/              # @reporunner/auth
    ├── cli/               # @reporunner/cli
    ├── core/              # @reporunner/core
    ├── enterprise/        # @reporunner/enterprise
    ├── integrations/      # @reporunner/integrations
    ├── platform/          # @reporunner/platform
    ├── services/          # @reporunner/services
    └── workflow/          # @reporunner/workflow
```

**Proposed structure**:
```
packages/
├── frontend/              # @klikkai/frontend
├── backend/               # @klikkai/backend
├── shared/                # @klikkai/shared
└── @klikkai/              # Rename directory
    ├── ai/                # @klikkai/ai
    ├── auth/              # @klikkai/auth
    ├── cli/               # @klikkai/cli
    ├── core/              # @klikkai/core
    ├── enterprise/        # @klikkai/enterprise
    ├── integrations/      # @klikkai/integrations
    ├── platform/          # @klikkai/platform
    ├── services/          # @klikkai/services
    └── workflow/          # @klikkai/workflow
```

### Files to Update (Estimated)

**package.json files** (~50 files):
- Root `package.json`
- All package `package.json` files
- Update `name`, `description`, scripts, dependencies

**TypeScript/JavaScript files** (~400 files):
- Import statements: `@reporunner/*` → `@klikkai/*`
- Comments and JSDoc
- String literals with "reporunner"

**Configuration files** (~30 files):
- `tsconfig.json`, `tsconfig.base.json`
- `turbo.json`
- `.env.example`
- Docker files
- CI/CD workflows

**Frontend files** (~200 files):
- UI text: "Reporunner" → "KlikkAI"
- Meta tags, titles
- Logo references

### Replacement Commands

```bash
# Update package.json files
find . -name "package.json" -type f -exec sed -i 's/"@reporunner/"@klikkai/g' {} \;
find . -name "package.json" -type f -exec sed -i 's/"reporunner"/"klikkai"/g' {} \;

# Update TypeScript/JavaScript imports
find packages -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i "s/@reporunner/@klikkai/g"

# Update configuration files
sed -i 's/reporunner/klikkai/g' tsconfig.base.json
sed -i 's/reporunner/klikkai/g' turbo.json
sed -i 's/REPORUNNER/KLIKKAI/g' .env.example
```

---

## Phase 3: Directory Rename

### Critical Directory Rename

```bash
# Rename the main scoped package directory
git mv packages/@reporunner packages/@klikkai

# Update pnpm workspace configuration
sed -i 's/@reporunner/@klikkai/g' pnpm-workspace.yaml

# Reinstall dependencies
pnpm install
```

---

## Phase 4: Infrastructure & Deployment

### Docker Configuration

**Files to update**:
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `Dockerfile.worker`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`

**Changes**:
```dockerfile
# FROM reporunner/base → FROM klikkai/base
# LABEL maintainer="Reporunner Team" → LABEL maintainer="KlikkAI Team"
# ENV REPORUNNER_* → ENV KLIKKAI_*
```

### Kubernetes/Helm

**Files to update**:
- `infrastructure/kubernetes/helm/Chart.yaml`
- `infrastructure/kubernetes/helm/values.yaml`
- All template files

### CI/CD Workflows

**Files to update**:
- `.github/workflows/*.yml` (10+ files)
- Update workflow names, environment variables
- Update Docker image names

---

## Phase 5: SDK Updates (7 SDKs)

### Official SDKs

**TypeScript** (`sdks/typescript/`):
- Package name: `@reporunner/sdk` → `@klikkai/sdk`
- Class names: `ReporunnerClient` → `KlikkAIClient`

**Python** (`sdks/python/`):
- Package name: `reporunner-sdk` → `klikkai-sdk`
- Module: `import reporunner` → `import klikkai`

**Go** (`sdks/go/`):
- Module: `github.com/reporunner/reporunner/go-sdk` → `github.com/KlikkAI/klikkai/go-sdk`
- Package: `package reporunner` → `package klikkai`

**Rust** (`sdks/rust/`):
- Crate: `reporunner-sdk` → `klikkai-sdk`
- Cargo.toml updates

**Java** (`sdks/java/`):
- Group ID: `com.reporunner` → `com.klikkai`
- Artifact ID: `reporunner-java-sdk` → `klikkai-java-sdk`

**PHP** (`sdks/php/`):
- Namespace: `Reporunner\` → `KlikkAI\`
- Package: `reporunner/php-sdk` → `klikkai/php-sdk`

**.NET** (`sdks/dotnet/`):
- Namespace: `Reporunner.Sdk` → `KlikkAI.Sdk`
- NuGet package: `Reporunner.Sdk` → `KlikkAI.Sdk`

---

## Phase 6: Database & Data Layer

### Database Names

**Decision Required**: Rename database collections/tables?

**Option A: Rename Everything** (Complete rebrand)
```javascript
// MongoDB collections
db.reporunner_workflows.renameCollection("klikkai_workflows")
db.reporunner_executions.renameCollection("klikkai_executions")
db.reporunner_credentials.renameCollection("klikkai_credentials")
// ... etc
```

**Option B: Keep Database Names** (Recommended)
- Only change code/UI references
- Maintain backward compatibility
- No migration scripts needed

### Environment Variables

```bash
# Old → New
REPORUNNER_DB_URL → KLIKKAI_DB_URL
REPORUNNER_API_KEY → KLIKKAI_API_KEY
REPORUNNER_JWT_SECRET → KLIKKAI_JWT_SECRET
REPORUNNER_REDIS_URL → KLIKKAI_REDIS_URL
```

---

## Phase 7: Repository & URLs

### GitHub Repository

**Option A**: Keep `KlikkAI/reporunner`
- Pros: No broken links, backward compatible
- Cons: Mixed branding

**Option B**: Rename to `KlikkAI/klikkai`
- Pros: Complete rebrand
- Cons: Breaks existing clones, requires redirect setup

### Update URLs in Code

```bash
# Find all GitHub URLs
grep -r "github.com.*reporunner" --include="*.ts" --include="*.tsx" --include="*.md"

# Update to new URLs
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i 's|github.com/reporunner/reporunner|github.com/KlikkAI/klikkai|g' {} \;
```

---

## Testing Checklist

After each phase:

- [ ] **Phase 1**: Verify documentation renders correctly
- [ ] **Phase 2**: TypeScript compilation succeeds
- [ ] **Phase 3**: `pnpm install` completes without errors
- [ ] **Phase 4**: Docker builds succeed
- [ ] **Phase 5**: SDK tests pass
- [ ] **Phase 6**: Database connections work
- [ ] **Phase 7**: All URLs accessible

### Build Verification

```bash
# Type check all packages
pnpm run type-check

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Lint
pnpm run quality
```

---

## Rollback Plan

If issues occur:

```bash
# Revert all changes
git reset --hard origin/main

# Or revert specific commit
git revert <commit-hash>

# Or switch back to backup branch
git checkout main
git branch -D rebrand-to-klikkai
```

---

## Commit Strategy

**Option A: Single Large Commit**
```bash
git add .
git commit -m "rebrand: complete rebrand from Reporunner to KlikkAI"
```

**Option B: Phased Commits** (Recommended)
```bash
# Commit 1
git commit -m "docs: rebrand documentation from Reporunner to KlikkAI"

# Commit 2
git commit -m "refactor: rename @reporunner packages to @klikkai"

# Commit 3
git commit -m "refactor: rename directory packages/@reporunner to packages/@klikkai"

# Commit 4
git commit -m "build: update Docker and CI/CD for KlikkAI rebrand"

# Commit 5
git commit -m "refactor: rebrand SDKs to KlikkAI"
```

---

## Breaking Changes Notice

**For Users/Contributors**:

1. **Package names changed**: `@reporunner/*` → `@klikkai/*`
2. **Import statements**: Update all imports
3. **Environment variables**: `REPORUNNER_*` → `KLIKKAI_*`
4. **Docker images**: `reporunner/*` → `klikkai/*`
5. **SDKs**: New package names across all 7 languages

**Migration Guide Required**: Create `MIGRATION.md` to help users upgrade

---

## Timeline Estimate

- **Phase 1 (Docs)**: 30 minutes
- **Phase 2 (Code)**: 2-3 hours
- **Phase 3 (Directory)**: 30 minutes
- **Phase 4 (Infrastructure)**: 1-2 hours
- **Phase 5 (SDKs)**: 2-3 hours
- **Phase 6 (Database)**: 1 hour (if renaming)
- **Phase 7 (URLs)**: 30 minutes
- **Testing**: 2-3 hours

**Total**: 10-15 hours of work

---

## Notes

- Current GitHub repository: `KlikkAI/reporunner`
- Working directory: `/home/margon/Reporunner/reporunner/`
- Total occurrences to replace: ~5,819
- Critical: Test thoroughly after each phase
- Recommend: Create backup branch before starting

---

**Last Updated**: October 21, 2025
**Created By**: Claude Code Assistant

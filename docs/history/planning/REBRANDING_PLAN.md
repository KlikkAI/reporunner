# Rebranding Plan: KlikkFlow → KlikkFlow

**Date**: October 21, 2025
**Status**: In Progress
**Scope**: Complete rebrand from KlikkFlow to KlikkFlow

---

## Overview

This document outlines the comprehensive plan to rebrand the project from **KlikkFlow** to **KlikkFlow**.

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
KlikkFlow → KlikkFlow    # Product name (proper noun)
klikkflow → klikkflow    # Lowercase (URLs, packages, paths)
KLIKKFLOW → KLIKKFLOW    # Constants, env vars
@klikkflow → @klikkflow  # NPM package scope
```

### Commands to Execute

```bash
# Step 1: Find all markdown files (preview)
find . -name "*.md" -type f | wc -l

# Step 2: Backup before changes
git checkout -b rebrand-to-klikkflow

# Step 3: Replace in all markdown files
find . -name "*.md" -type f -exec sed -i 's/KlikkFlow/KlikkFlow/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/klikkflow/klikkflow/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/KLIKKFLOW/KLIKKFLOW/g' {} \;
find . -name "*.md" -type f -exec sed -i 's/@klikkflow/@klikkflow/g' {} \;

# Step 4: Verify changes
grep -r "klikkflow" --include="*.md" -i | wc -l  # Should be minimal

# Step 5: Commit
git add .
git commit -m "docs: rebrand from KlikkFlow to KlikkFlow"
```

### Special Cases to Handle Manually

**Preserve these**:
- GitHub repository URL: `github.com/KlikkFlow/klikkflow` (if repo name stays)
- Git remote URLs
- Historical references in CHANGELOG.md (optional)

**Update these carefully**:
- API endpoints: `/api/klikkflow/v1` → `/api/klikkflow/v1`
- Docker image names: `klikkflow/backend` → `klikkflow/backend`
- Environment variable prefixes: `KLIKKFLOW_` → `KLIKKFLOW_`

---

## Phase 2: Code Files Update

### Package Names (12 packages)

**Current structure**:
```
packages/
├── frontend/              # @klikkflow/frontend
├── backend/               # @klikkflow/backend
├── shared/                # @klikkflow/shared
└── @klikkflow/           # 9 scoped packages
    ├── ai/                # @klikkflow/ai
    ├── auth/              # @klikkflow/auth
    ├── cli/               # @klikkflow/cli
    ├── core/              # @klikkflow/core
    ├── enterprise/        # @klikkflow/enterprise
    ├── integrations/      # @klikkflow/integrations
    ├── platform/          # @klikkflow/platform
    ├── services/          # @klikkflow/services
    └── workflow/          # @klikkflow/workflow
```

**Proposed structure**:
```
packages/
├── frontend/              # @klikkflow/frontend
├── backend/               # @klikkflow/backend
├── shared/                # @klikkflow/shared
└── @klikkflow/              # Rename directory
    ├── ai/                # @klikkflow/ai
    ├── auth/              # @klikkflow/auth
    ├── cli/               # @klikkflow/cli
    ├── core/              # @klikkflow/core
    ├── enterprise/        # @klikkflow/enterprise
    ├── integrations/      # @klikkflow/integrations
    ├── platform/          # @klikkflow/platform
    ├── services/          # @klikkflow/services
    └── workflow/          # @klikkflow/workflow
```

### Files to Update (Estimated)

**package.json files** (~50 files):
- Root `package.json`
- All package `package.json` files
- Update `name`, `description`, scripts, dependencies

**TypeScript/JavaScript files** (~400 files):
- Import statements: `@klikkflow/*` → `@klikkflow/*`
- Comments and JSDoc
- String literals with "klikkflow"

**Configuration files** (~30 files):
- `tsconfig.json`, `tsconfig.base.json`
- `turbo.json`
- `.env.example`
- Docker files
- CI/CD workflows

**Frontend files** (~200 files):
- UI text: "KlikkFlow" → "KlikkFlow"
- Meta tags, titles
- Logo references

### Replacement Commands

```bash
# Update package.json files
find . -name "package.json" -type f -exec sed -i 's/"@klikkflow/"@klikkflow/g' {} \;
find . -name "package.json" -type f -exec sed -i 's/"klikkflow"/"klikkflow"/g' {} \;

# Update TypeScript/JavaScript imports
find packages -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs sed -i "s/@klikkflow/@klikkflow/g"

# Update configuration files
sed -i 's/klikkflow/klikkflow/g' tsconfig.base.json
sed -i 's/klikkflow/klikkflow/g' turbo.json
sed -i 's/KLIKKFLOW/KLIKKFLOW/g' .env.example
```

---

## Phase 3: Directory Rename

### Critical Directory Rename

```bash
# Rename the main scoped package directory
git mv packages/@klikkflow packages/@klikkflow

# Update pnpm workspace configuration
sed -i 's/@klikkflow/@klikkflow/g' pnpm-workspace.yaml

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
# FROM klikkflow/base → FROM klikkflow/base
# LABEL maintainer="KlikkFlow Team" → LABEL maintainer="KlikkFlow Team"
# ENV KLIKKFLOW_* → ENV KLIKKFLOW_*
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
- Package name: `@klikkflow/sdk` → `@klikkflow/sdk`
- Class names: `KlikkFlowClient` → `KlikkFlowClient`

**Python** (`sdks/python/`):
- Package name: `klikkflow-sdk` → `klikkflow-sdk`
- Module: `import klikkflow` → `import klikkflow`

**Go** (`sdks/go/`):
- Module: `github.com/klikkflow/klikkflow/go-sdk` → `github.com/KlikkFlow/klikkflow/go-sdk`
- Package: `package klikkflow` → `package klikkflow`

**Rust** (`sdks/rust/`):
- Crate: `klikkflow-sdk` → `klikkflow-sdk`
- Cargo.toml updates

**Java** (`sdks/java/`):
- Group ID: `com.klikkflow` → `com.klikkflow`
- Artifact ID: `klikkflow-java-sdk` → `klikkflow-java-sdk`

**PHP** (`sdks/php/`):
- Namespace: `KlikkFlow\` → `KlikkFlow\`
- Package: `klikkflow/php-sdk` → `klikkflow/php-sdk`

**.NET** (`sdks/dotnet/`):
- Namespace: `KlikkFlow.Sdk` → `KlikkFlow.Sdk`
- NuGet package: `KlikkFlow.Sdk` → `KlikkFlow.Sdk`

---

## Phase 6: Database & Data Layer

### Database Names

**Decision Required**: Rename database collections/tables?

**Option A: Rename Everything** (Complete rebrand)
```javascript
// MongoDB collections
db.klikkflow_workflows.renameCollection("klikkflow_workflows")
db.klikkflow_executions.renameCollection("klikkflow_executions")
db.klikkflow_credentials.renameCollection("klikkflow_credentials")
// ... etc
```

**Option B: Keep Database Names** (Recommended)
- Only change code/UI references
- Maintain backward compatibility
- No migration scripts needed

### Environment Variables

```bash
# Old → New
KLIKKFLOW_DB_URL → KLIKKFLOW_DB_URL
KLIKKFLOW_API_KEY → KLIKKFLOW_API_KEY
KLIKKFLOW_JWT_SECRET → KLIKKFLOW_JWT_SECRET
KLIKKFLOW_REDIS_URL → KLIKKFLOW_REDIS_URL
```

---

## Phase 7: Repository & URLs

### GitHub Repository

**Option A**: Keep `KlikkFlow/klikkflow`
- Pros: No broken links, backward compatible
- Cons: Mixed branding

**Option B**: Rename to `KlikkFlow/klikkflow`
- Pros: Complete rebrand
- Cons: Breaks existing clones, requires redirect setup

### Update URLs in Code

```bash
# Find all GitHub URLs
grep -r "github.com.*klikkflow" --include="*.ts" --include="*.tsx" --include="*.md"

# Update to new URLs
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i 's|github.com/klikkflow/klikkflow|github.com/KlikkFlow/klikkflow|g' {} \;
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
git branch -D rebrand-to-klikkflow
```

---

## Commit Strategy

**Option A: Single Large Commit**
```bash
git add .
git commit -m "rebrand: complete rebrand from KlikkFlow to KlikkFlow"
```

**Option B: Phased Commits** (Recommended)
```bash
# Commit 1
git commit -m "docs: rebrand documentation from KlikkFlow to KlikkFlow"

# Commit 2
git commit -m "refactor: rename @klikkflow packages to @klikkflow"

# Commit 3
git commit -m "refactor: rename directory packages/@klikkflow to packages/@klikkflow"

# Commit 4
git commit -m "build: update Docker and CI/CD for KlikkFlow rebrand"

# Commit 5
git commit -m "refactor: rebrand SDKs to KlikkFlow"
```

---

## Breaking Changes Notice

**For Users/Contributors**:

1. **Package names changed**: `@klikkflow/*` → `@klikkflow/*`
2. **Import statements**: Update all imports
3. **Environment variables**: `KLIKKFLOW_*` → `KLIKKFLOW_*`
4. **Docker images**: `klikkflow/*` → `klikkflow/*`
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

- Current GitHub repository: `KlikkFlow/klikkflow`
- Working directory: `/home/margon/KlikkFlow/klikkflow/`
- Total occurrences to replace: ~5,819
- Critical: Test thoroughly after each phase
- Recommend: Create backup branch before starting

---

**Last Updated**: October 21, 2025
**Created By**: Claude Code Assistant

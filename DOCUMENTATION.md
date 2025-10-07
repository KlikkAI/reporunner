# Reporunner Documentation Guide

**Quick navigation to all project documentation**

**Last Updated**: October 7, 2025
**Platform Status**: Production-Ready (92/100)
**Package Count**: 13 packages (3 main + 10 @reporunner/*)

---

## 🎯 Start Here

### For New Developers
1. **[README.md](./README.md)** - Project overview, quick start, SDK examples
2. **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project context (768 lines)
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
4. **[docs/README.md](./docs/README.md)** - Complete documentation hub

### For Users
1. **[README.md](./README.md)** - Get started with Reporunner
2. **[docs/user-guide/GETTING_STARTED.md](./docs/user-guide/GETTING_STARTED.md)** - First workflow tutorial
3. **[docs/user-guide/INTEGRATIONS_GUIDE.md](./docs/user-guide/INTEGRATIONS_GUIDE.md)** - Available integrations

### For Architects
1. **[CLAUDE.md](./CLAUDE.md)** - Complete architecture overview
2. **[docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md](./docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md)** - System design
3. **[docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md](./docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md)** - Current status & priorities

---

## 📁 Documentation Structure

### Root Level (Standard Open Source Files)
```
README.md                      # Project overview and quick start
CLAUDE.md                      # Comprehensive AI assistant context (768 lines)
DOCUMENTATION.md               # This file - documentation navigation
CONTRIBUTING.md                # How to contribute
SECURITY.md                    # Security policy
CODE_OF_CONDUCT.md             # Community guidelines
GOVERNANCE.md                  # Project governance
MAINTAINERS.md                 # Team structure
CHANGELOG.md                   # Version history
COMPLETION_ROADMAP.md          # Package consolidation progress
```

### Documentation Directories

#### `docs/` - Complete Documentation Hub
**[docs/README.md](./docs/README.md)** - Main documentation index with full navigation

#### `docs/project-planning/` - Active Planning & Strategy
**[INDEX.md](./docs/project-planning/INDEX.md)** - Planning documentation index

**Key Documents**:
- **[ACTIVE_ROADMAP.md](./docs/project-planning/roadmaps/ACTIVE_ROADMAP.md)** - Current priorities
- **[PLATFORM_GAP_ANALYSIS_2025.md](./docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md)** - Active gaps (v6.0)
- **[POST_LAUNCH_STRATEGY.md](./docs/project-planning/strategies/POST_LAUNCH_STRATEGY.md)** - Go-to-market plan
- **[ENTERPRISE_ARCHITECTURE.md](./docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md)** - System design
- **[INTEGRATION_ECOSYSTEM_PLAN.md](./docs/project-planning/roadmaps/03_INTEGRATION_ECOSYSTEM_PLAN.md)** - 50+ planned integrations

#### `docs/history/` - Historical Documentation
**[INDEX.md](./docs/history/INDEX.md)** - History documentation index

**Key Sections**:
- **[phases/](./docs/history/phases/)** - Phase B, C, D implementation summaries
- **[consolidation/](./docs/history/consolidation/)** - Package consolidation history (58.6% reduction)
- **[gap-analysis/](./docs/history/gap-analysis/)** - Archived gap analyses (v4.0, v5.1)
- **[sessions/](./docs/history/sessions/)** - Development session summaries
- **[migrations/](./docs/history/migrations/)** - Monorepo migration guides
- **[analysis/](./docs/history/analysis/)** - Architectural analyses

#### `docs/api/` - API Documentation
- **[OPENAPI_README.md](./docs/api/OPENAPI_README.md)** - OpenAPI 3.0.3 specification (30+ endpoints)
- **[PLUGIN_MARKETPLACE_API.md](./docs/api/PLUGIN_MARKETPLACE_API.md)** - Marketplace API reference
- **[WORKFLOW_OPTIMIZATION_API.md](./docs/api/WORKFLOW_OPTIMIZATION_API.md)** - AI optimization API

#### `docs/deployment/` - Deployment Guides
- **[docker/](./docs/deployment/docker/)** - Docker Compose deployment
- **[kubernetes/](./docs/deployment/kubernetes/)** - Kubernetes + Helm deployment
- **[cloud-providers/](./docs/deployment/cloud-providers/)** - AWS, GCP, Azure guides (26 Terraform modules)

#### `docs/operations/` - Operations & Monitoring
- **[monitoring/](./docs/operations/monitoring/)** - Prometheus, Grafana (7 dashboards)
- **[logging/](./docs/operations/logging/)** - ELK Stack, centralized logging
- **[tracing/](./docs/operations/tracing/)** - OpenTelemetry, Jaeger
- **[scaling/](./docs/operations/scaling/)** - Horizontal scaling strategies
- **[backup-recovery/](./docs/operations/backup-recovery/)** - Disaster recovery

#### `docs/user-guide/` - User Documentation
- **[GETTING_STARTED.md](./docs/user-guide/GETTING_STARTED.md)** - First workflow tutorial
- **[INTEGRATIONS_GUIDE.md](./docs/user-guide/INTEGRATIONS_GUIDE.md)** - Available integrations
- **[WORKFLOW_EXAMPLES.md](./docs/user-guide/WORKFLOW_EXAMPLES.md)** - Example workflows

---

## 📊 Current Platform Status (October 2025)

### Overall Score: 92/100 (Production-Ready)

**Perfect Scores** ✨:
- **Infrastructure**: 100/100 - Multi-cloud ready (AWS, GCP, Azure)
- **Code Quality**: 100/100 - Zero linting errors, full TypeScript strict mode

**Strong Scores**:
- **Observability**: 95/100 - 7 Grafana dashboards, Prometheus, ELK, OpenTelemetry
- **Documentation**: 90/100 - Comprehensive technical and user docs
- **Testing**: 85/100 - 106+ tests (60 infrastructure + 46 E2E)
- **Community**: 85/100 - Complete governance, CODE_OF_CONDUCT, templates

**Critical Gap** ⚠️:
- **Integration Ecosystem**: 30/100 - Only 1-2 integrations vs. 50+ needed

### Production Readiness Checklist
✅ **Multi-cloud deployment** (26 Terraform modules across AWS, GCP, Azure)
✅ **Zero code quality defects** (Biome 2.2.5 + TypeScript 5.9.3 strict)
✅ **Comprehensive monitoring** (Grafana, Prometheus, Jaeger, ELK)
✅ **Automated testing** (106+ tests with Vitest + Playwright)
✅ **Enterprise architecture** (13-package monorepo with Turborepo)
✅ **SDK ecosystem** (7 official SDKs: TypeScript, Python, Go, Rust, Java, PHP, .NET)
✅ **Documentation** (Complete technical, API, user, and operations docs)

### Next Priority: Integration Ecosystem (Q1-Q2 2026)
🎯 **Q1 2026**: 10 Tier 1 integrations (Slack, GitHub, Stripe, Google Workspace, Salesforce, AWS, Discord, Teams, HubSpot, Notion)
🎯 **Q2 2026**: Complete 30 integrations + 30+ workflow templates

---

## 🏗️ Architecture Quick Reference

### Monorepo Structure (13 Packages)

```
packages/
├── frontend/              # React 19 web application
├── backend/               # Express.js API server (includes common, database, monitoring)
├── shared/                # Shared utilities, types, validation, API definitions
└── @reporunner/           # Scoped packages (10 total):
    ├── ai/                # AI/ML capabilities and services
    ├── auth/              # Authentication & security services
    ├── cli/               # CLI tools and dev utilities
    ├── core/              # Core utilities and base classes
    ├── enterprise/        # Enterprise SSO, RBAC, compliance
    ├── integrations/      # Integration framework & plugins
    ├── platform/          # Platform services (gateway, real-time, upload, marketplace)
    ├── services/          # Microservices (analytics, audit, tenant, workflow)
    ├── validation/        # Architecture validation framework
    └── workflow/          # Workflow execution engine
```

### Technology Stack
- **Frontend**: React 19, TypeScript 5.9, Vite 7, React Flow 11, Zustand 5, Ant Design 5, Tailwind
- **Backend**: Express 4.19, MongoDB 6, PostgreSQL + pgvector, Redis, BullMQ, Socket.IO 4.7
- **Build**: Turborepo 2.5, pnpm 9.15, Biome 2.2 (all-in-one linting/formatting)
- **Testing**: Vitest 3.2, Playwright (106+ tests)
- **Deployment**: Docker, Kubernetes, AWS, GCP, Azure (26 Terraform modules)

---

## 🔍 Quick Reference by Role

### Developer (Writing Code)
→ **[CLAUDE.md](./CLAUDE.md)** - Complete project context, commands, architecture
→ **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
→ **[docs/project-planning/guides/](./docs/project-planning/guides/)** - Implementation guides

### DevOps (Deploying & Operating)
→ **[docs/deployment/](./docs/deployment/)** - Deployment guides (Docker, K8s, cloud)
→ **[docs/operations/](./docs/operations/)** - Monitoring, logging, scaling
→ **[infrastructure/](./infrastructure/)** - IaC (Docker, K8s, Terraform)

### Architect (Designing Systems)
→ **[docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md](./docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md)** - System design
→ **[docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md](./docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md)** - Current state & gaps
→ **[CLAUDE.md](./CLAUDE.md)** - Complete architecture overview

### Product Manager (Planning Features)
→ **[docs/project-planning/roadmaps/ACTIVE_ROADMAP.md](./docs/project-planning/roadmaps/ACTIVE_ROADMAP.md)** - Current priorities
→ **[docs/project-planning/strategies/POST_LAUNCH_STRATEGY.md](./docs/project-planning/strategies/POST_LAUNCH_STRATEGY.md)** - GTM strategy
→ **[docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md](./docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md)** - Feature gaps

### User (Using Reporunner)
→ **[README.md](./README.md)** - Quick start guide
→ **[docs/user-guide/GETTING_STARTED.md](./docs/user-guide/GETTING_STARTED.md)** - First workflow
→ **[docs/user-guide/INTEGRATIONS_GUIDE.md](./docs/user-guide/INTEGRATIONS_GUIDE.md)** - Available integrations

### Community Member (Contributing)
→ **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
→ **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Community guidelines
→ **[GOVERNANCE.md](./GOVERNANCE.md)** - Project governance

---

## 🚀 Development Workflow Quick Commands

```bash
# Installation & Setup
pnpm install                      # Install all workspace dependencies

# Development
pnpm dev                          # Start all services
turbo run dev                     # Start with Turborepo caching

# Building
pnpm build                        # Build all packages
turbo run build                   # Build with caching

# Testing
pnpm run test                     # Run all tests
pnpm run test:e2e                 # E2E tests with Playwright

# Code Quality
pnpm run quality:fix              # Fix linting, formatting, imports
biome check --apply .             # Run Biome auto-fix

# Architecture Validation
pnpm --filter @reporunner/validation architecture:validate  # Complete validation

# Deployment
cd infrastructure/docker && docker-compose up -d            # Local deployment
cd infrastructure/kubernetes && helm install reporunner ... # K8s deployment
```

---

## 📞 Getting Help

### Documentation Issues
- **Missing Info?** Open an issue: [GitHub Issues](https://github.com/reporunner/reporunner/issues)
- **Broken Links?** Submit a PR to fix documentation
- **Unclear?** Ask in Discord: [Community Chat](https://discord.gg/reporunner)

### Development Support
- **Bug Reports**: [GitHub Issues](https://github.com/reporunner/reporunner/issues/new?template=bug_report.md)
- **Feature Requests**: [GitHub Issues](https://github.com/reporunner/reporunner/issues/new?template=feature_request.md)
- **Questions**: [GitHub Discussions](https://github.com/reporunner/reporunner/discussions)
- **Real-time Chat**: [Discord Community](https://discord.gg/reporunner)

### Enterprise Support
- **Email**: enterprise@reporunner.com
- **Commercial Support**: Professional services and SLA available

---

## 📈 Documentation Statistics

- **Total Docs**: 60+ markdown files
- **CLAUDE.md**: 768 lines (comprehensive project context)
- **API Docs**: 30+ endpoints, 36+ schemas (OpenAPI 3.0.3)
- **Infrastructure**: 26 Terraform modules (AWS, GCP, Azure)
- **Monitoring**: 7 Grafana dashboards
- **Tests**: 106+ automated tests
- **SDKs**: 7 official languages

---

**Last Updated**: October 7, 2025
**Maintained By**: Reporunner Development Team
**Format**: Markdown
**Encoding**: UTF-8

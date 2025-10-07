# CLAUDE.md - Reporunner Project Context

This file provides comprehensive context to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated**: October 7, 2025
**Platform Status**: Production-Ready (92/100)
**Package Count**: 13 packages
**Architecture**: Monorepo with Turborepo + pnpm workspaces

---

## 🎯 Core Development Principle

> **Before editing or suggesting any code, always check for duplication. If functionality exists already, reuse it.**

This principle applies to:
- Existing utilities and helper functions
- UI components in the design system
- API service methods
- Database models and schemas
- Node type implementations

---

## 📋 Project Overview

**Reporunner** is an open-source workflow automation platform powered by AI, designed as a next-generation alternative to n8n with:

- **AI-First Design**: Native LLM integration (OpenAI, Anthropic, Google AI, Ollama)
- **Hybrid Database**: PostgreSQL with pgvector + MongoDB for optimal performance
- **Enterprise Architecture**: Queue-based execution (BullMQ), real-time monitoring, multi-tenancy
- **Modern Stack**: React 19, TypeScript 5.9, Vite 7, Turborepo 2.5, Biome 2.2
- **27+ Built-in Nodes**: Gmail, databases, AI services, HTTP, transforms, and more
- **Plugin Marketplace**: Secure publishing, validation, and distribution system
- **7 Official SDKs**: TypeScript, Python, Go, Rust, Java, PHP, .NET

### Current Status (October 2025)
- **Platform Score**: 87/100 (realistic assessment)
- **Infrastructure**: 100/100 (Perfect - Multi-cloud ready: AWS, GCP, Azure)
- **Code Quality**: 85/100 (Strong type safety, 3,383 errors tracked for systematic cleanup)
  - ✅ Critical type safety enforced (`noExplicitAny` strict)
  - ✅ 11 critical `any` types fixed in Phase 1
  - 📝 3,383 errors (mostly style violations across 1,198 files)
  - 📝 1,319 warnings (non-critical style preferences)
- **Testing**: 106+ tests (60 infrastructure + 46 E2E)
- **Observability**: 7 Grafana dashboards, Prometheus, ELK, OpenTelemetry
- **Critical Gap**: Integration ecosystem (30/100 - only 1-2 integrations vs. 50+ needed)

---

## 🏗️ Architecture Overview

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

**Frontend:**
- React 19.1.0 (concurrent features)
- TypeScript 5.9.3 (strict mode)
- Vite 7.0.4 (build tool with HMR)
- React Flow 11.x (visual workflow editor)
- Zustand 5.x (state management)
- Ant Design 5.x (UI components)
- Tailwind CSS (utility-first styling)
- Zod 4.x (runtime schema validation)

**Backend:**
- Express 4.19.2 (REST API)
- MongoDB 6.0.0 (primary database)
- PostgreSQL + pgvector (AI/vector search)
- Redis + BullMQ (queue-based execution)
- Socket.IO 4.7.4 (real-time updates)
- Winston 3.11.0 (logging)

**Build & Quality:**
- Turborepo 2.5.6 (build orchestration with caching)
- Biome 2.2.5 (unified linting, formatting, import organization)
- Vitest 3.2.4 (unit testing)
- Playwright (E2E testing)
- pnpm 9.15.2 (package manager)

---

## 💻 Development Commands

### Workspace Root Commands

```bash
# Installation & Setup
pnpm install                      # Install all workspace dependencies

# Development
pnpm dev                          # Start all services in parallel
turbo run dev                     # Start with Turborepo caching

# Building
pnpm build                        # Build all packages
turbo run build                   # Build with caching
pnpm run build:frontend           # Build frontend only
pnpm run build:backend            # Build backend only

# Testing
pnpm run test                     # Run all tests
pnpm run test:unit                # Unit tests only
pnpm run test:e2e                 # E2E tests with Playwright
pnpm --filter @reporunner/backend test  # Test specific package

# Code Quality
pnpm run quality                  # Run all quality checks (lint, type-check, format check)
pnpm run quality:fix              # Fix linting, formatting, and imports
biome check .                     # Run Biome checks
biome check --apply .             # Auto-fix Biome issues
pnpm run type-check               # TypeScript type checking

# Architecture Validation
pnpm --filter @reporunner/validation architecture:validate      # Complete validation
pnpm --filter @reporunner/validation architecture:dependencies  # Dependency analysis
pnpm --filter @reporunner/validation architecture:organization  # Code organization check

# Dependency Management
pnpm run deps:check               # Check for updates
pnpm run deps:update              # Update dependencies
pnpm run analyze:deps             # Analyze circular dependencies

# Maintenance
pnpm run clean:all                # Clean node_modules and build artifacts
```

### Frontend Commands (packages/frontend/)

```bash
pnpm dev                          # Development server (port 3000)
pnpm build                        # Production build (TypeScript + Vite)
pnpm preview                      # Preview production build
pnpm type-check                   # TypeScript type checking without build
```

### Backend Commands (packages/backend/)

```bash
pnpm dev                          # Development server with hot reload (tsx)
pnpm build                        # Compile TypeScript for production
pnpm start                        # Start production server
pnpm type-check                   # TypeScript type checking
```

---

## 🎨 Frontend Architecture

### Three-Layer Structure

```
src/
├── app/                    # Application layer - user-facing features
│   ├── pages/             # Route components (Dashboard, WorkflowEditor, Credentials, etc.)
│   ├── components/        # App-specific UI components
│   ├── services/          # App-specific service integrations and orchestration
│   ├── data/              # Node definitions and app-specific data
│   ├── hooks/             # Application-specific React hooks
│   └── types/             # Application-specific types
├── core/                  # Business logic layer
│   ├── api/              # API clients (WorkflowApiService, AuthApiService, etc.)
│   ├── stores/           # Zustand stores (leanWorkflowStore, authStore, credentialStore)
│   ├── types/            # Core TypeScript type definitions
│   ├── utils/            # Core utility functions
│   ├── config/           # Configuration management
│   ├── constants/        # Core constants and enums
│   ├── nodes/            # Node registry and core node system
│   └── schemas/          # Zod validation schemas
└── design-system/         # UI component library
    ├── components/       # Reusable UI components (Button, JsonViewer, etc.)
    ├── tokens/           # Design tokens (colors, spacing, typography)
    ├── utils/            # UI-specific utilities (classNames, responsive, theme)
    └── styles/           # Global design system styles
```

### Path Aliases

- `@/` → `src/` (vite.config.ts)
- `@/app` → `src/app` (application layer)
- `@/core` → `src/core` (business logic)
- `@/design-system` → `src/design-system` (UI components)

### Key Frontend Components

**Pages** (`src/app/pages/`):
- **Dashboard**: Main landing page with workflow overview and statistics
- **WorkflowEditor**: Visual workflow editor with React Flow
- **Credentials**: Comprehensive credential management with OAuth support
- **Executions**: Workflow execution monitoring and history
- **Integrations**: Browse and manage available integrations

**WorkflowEditor Components** (`src/app/components/WorkflowEditor/`):
- **Main Editor**: React Flow canvas with 27+ node types
- **AdvancedNodePanel**: Collapsible node library with search
- **AdvancedPropertyPanel**: Full-screen node configuration modal
- **ExecutionToolbar**: Workflow execution controls
- **BaseNode System**: 95% code reduction through shared components

**State Management** (`src/core/stores/`):
- `leanWorkflowStore.ts` - Optimized workflow data and operations
- `authStore.ts` - User authentication and session management
- `credentialStore.ts` - API credentials with encryption
- `integrationStore.ts` - Available integrations and connection status

---

## ⚙️ Backend Architecture

### Structure

```
src/
├── base/              # Base classes and abstractions
├── common/            # Common utilities and shared code
├── config/            # Configuration management
├── constants/         # Constants and enums
├── controllers/       # API route controllers
├── database/          # Database connection and ORM setup
├── domains/           # Domain-driven design modules
├── interfaces/        # TypeScript interfaces
├── middleware/        # Express middleware
├── migrations/        # Database migrations
├── models/            # MongoDB/PostgreSQL models
├── monitoring/        # Observability and metrics
├── routes/            # API route definitions
├── services/          # Business logic services
│   ├── WorkFlowEngine.ts     # Core workflow execution engine
│   ├── CredentialService.ts  # Credential management
│   └── ...
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Key Backend Services

**WorkflowEngine** (`services/WorkFlowEngine.ts`):
- Topological execution order
- Node-by-node progress tracking
- Error handling and retry logic
- Real-time status updates via WebSocket

**Database Models** (`models/`):
- `Workflow.ts` - Workflow definitions with nodes and edges
- `Execution.ts` - Execution tracking and history
- `Credentials.ts` - Encrypted credential storage
- `User.ts` - User authentication and management
- `Organization.ts` - Multi-tenant organization data

### API Structure

Base API client with authentication and error handling:
- `AuthApiService` - Authentication endpoints
- `CredentialApiService` - Credential management
- `WorkflowApiService` - Workflow CRUD and execution

---

## 🔌 Node System & Integration Framework

### Node Type Architecture

Each node follows this structure:
```
src/app/data/nodes/[category]/[integration]/
├── node.ts           # Core metadata and configuration
├── properties.ts     # Dynamic properties and form definitions
├── credentials.ts    # Authentication requirements
├── actions.ts        # Execution logic
└── index.ts          # Exports and integration
```

### Dynamic Property System

**22 Property Types**:
- Basic: `string`, `number`, `boolean`, `text`, `dateTime`, `color`, `file`
- Advanced: `select`, `multiSelect`, `json`, `expression`, `credentialsSelect`
- Collections: `collection`, `fixedCollection`
- Specialized: `resourceLocator`, `resourceMapper`

**Conditional Display**:
```typescript
interface DisplayOptions {
  show?: Record<string, Array<string | number | boolean>>
  hide?: Record<string, Array<string | number | boolean>>
}
```

### BaseNode System

**95% Code Reduction** through shared components:
- `BaseNode/index.tsx` - Main base component with common logic
- `NodeHandles.tsx` - Input/output connection points
- `NodeToolbar.tsx` - Hover toolbar (play/stop/delete/menu)
- `NodeMenu.tsx` - Three-dot dropdown menu
- `NodeConfigs.ts` - Configuration presets for all node types

### Current Node Categories

1. **AI/ML**: LLM, Embeddings, Vector Store, AI Agents
2. **Communication**: Email (Gmail), Webhook, HTTP Request
3. **Data Storage**: Database, File, Transform
4. **Logic**: Condition, Loop, Delay, Trigger
5. **Core**: Action, Function nodes

---

## 📦 Package Details

### Main Packages

**frontend**: React 19 web application
- Visual workflow editor with React Flow
- Comprehensive UI with Ant Design
- State management with Zustand
- Real-time updates with Socket.IO client

**backend**: Express.js API server
- REST API with Express
- MongoDB + PostgreSQL hybrid database
- BullMQ queue-based execution
- Socket.IO real-time communication
- Includes: common utilities, database layer, monitoring

**shared**: Shared code across frontend and backend
- Common types and interfaces
- Validation schemas (Zod)
- API definitions
- Constants and enums

### @reporunner Scoped Packages

**@reporunner/ai**: AI/ML capabilities
- LLM integration (OpenAI, Anthropic, Google AI, Ollama)
- Embedding generation and vector search
- AI agent system
- Workflow optimization engine

**@reporunner/auth**: Authentication & security
- JWT-based authentication
- OAuth2 flows
- Password hashing (bcrypt, 12 rounds)
- Account locking mechanism
- Enterprise SSO preparation

**@reporunner/cli**: CLI tools and dev utilities
- Node generator (`pnpm reporunner generate node`)
- Development scaffolding
- Code generation templates
- Dev tools and scripts

**@reporunner/core**: Core utilities and base classes
- Base classes for services
- Common utilities
- Type definitions
- Helper functions

**@reporunner/enterprise**: Enterprise features
- SSO (SAML, OAuth)
- RBAC (Role-Based Access Control)
- Audit logging
- Compliance features (SOC 2, GDPR, HIPAA preparation)

**@reporunner/integrations**: Integration framework
- Plugin system
- Node type registry
- Custom connector builder
- Integration marketplace foundation

**@reporunner/platform**: Platform services
- **gateway**: API gateway and routing
- **real-time**: Socket.IO server for WebSocket communication
- **upload**: File upload and storage
- **marketplace**: Plugin marketplace backend

**@reporunner/services**: Microservices
- **analytics-service**: Usage analytics and metrics
- **audit-service**: Audit logging and compliance
- **auth-service**: Authentication service
- **execution-service**: Workflow execution orchestration
- **notification-service**: Email and notification delivery
- **tenant-service**: Multi-tenancy management
- **workflow-service**: Workflow CRUD operations

**@reporunner/validation**: Architecture validation
- Package dependency validation
- Code organization checks
- Type safety validation
- Circular dependency detection

**@reporunner/workflow**: Workflow execution engine
- Core execution logic (similar to n8n-workflow)
- Node execution order (topological sort)
- Error handling and retry logic
- Workflow state management

---

## 🧪 Testing Strategy

### Testing Infrastructure

**Unit Tests** (Vitest):
- Test coverage for utilities, services, and components
- React Testing Library for component tests
- Vitest workspace for monorepo testing

**E2E Tests** (Playwright):
- 46+ end-to-end tests
- Auth flows, workflow creation, execution, credentials
- Headless and headed modes

**Infrastructure Tests**:
- 60+ smoke tests for Docker, Kubernetes, monitoring, logging
- Infrastructure validation before deployment

### Running Tests

```bash
# All tests
pnpm run test

# Specific package
pnpm --filter @reporunner/backend test
pnpm --filter frontend test

# E2E tests
pnpm run test:e2e
pnpm run test:e2e --headed  # With browser UI

# Coverage
pnpm run test:coverage
```

---

## 📊 Monitoring & Observability

### Grafana Dashboards (7 Total)

1. **API Performance Dashboard**: Request rates, latency, error rates
2. **Workflow Execution Dashboard**: Execution metrics, success rates, duration
3. **System Health Dashboard**: CPU, memory, disk, network metrics
4. **Database Performance Dashboard**: Query performance, connection pools
5. **Queue Metrics Dashboard**: BullMQ job processing, queue depths
6. **Security Dashboard**: Authentication attempts, rate limiting
7. **Business Metrics Dashboard**: User activity, workflow usage

### Observability Stack

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and alerting
- **Jaeger/Tempo**: Distributed tracing
- **ELK Stack**: Centralized logging (Elasticsearch, Logstash, Kibana)
- **OpenTelemetry**: Instrumentation framework
- **Winston**: Structured logging

Access monitoring:
- Grafana: http://localhost:3030
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

---

## 🐳 Docker & Kubernetes Deployment

### Local Development

```bash
cd infrastructure/docker
docker-compose up -d          # Start all services
docker-compose logs -f        # View logs
docker-compose down -v        # Stop and cleanup
```

### Production Deployment

**Docker Compose**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Kubernetes with Helm**:
```bash
cd infrastructure/kubernetes
helm install reporunner ./helm/reporunner \
  --set ingress.hosts[0].host=your-domain.com \
  --set postgresql.auth.password=your-secure-password
```

### Multi-Cloud Support

**26 Terraform Modules** across 3 cloud providers:

**AWS** (11 modules):
- VPC, ECS Fargate, RDS PostgreSQL, DocumentDB, ElastiCache Redis
- Application Load Balancer, Auto-scaling, CloudWatch
- Cost: Dev $220/mo, Staging $690/mo, Production $1,950/mo

**GCP** (7 modules):
- VPC, GKE with Workload Identity, Cloud SQL with pgvector
- Memorystore Redis, Cloud Storage with CDN, Cloud Armor
- Cost: Dev $110/mo, Staging $590/mo, Production $1,850/mo

**Azure** (8 modules):
- VNet, AKS with Workload Identity, PostgreSQL with pgvector
- Cosmos DB (MongoDB API), Redis Cache, Storage Account, App Gateway with WAF
- Cost: Dev $220/mo, Staging $920/mo, Production $2,650/mo

---

## 🌐 SDK Ecosystem

### Official SDKs (7 Languages)

| Language | Package | Installation |
|----------|---------|--------------|
| **TypeScript** | `@reporunner/sdk` | `pnpm add @reporunner/sdk` |
| **Python** | `reporunner-sdk` | `pip install reporunner-sdk` |
| **Go** | `go-sdk` | `go get github.com/reporunner/reporunner/go-sdk` |
| **Rust** | `reporunner-sdk` | `cargo add reporunner-sdk` |
| **Java** | `reporunner-java-sdk` | Maven/Gradle |
| **PHP** | `reporunner/php-sdk` | `composer require reporunner/php-sdk` |
| **.NET** | `Reporunner.Sdk` | `dotnet add package Reporunner.Sdk` |

All SDKs provide:
- Workflow management (CRUD)
- Workflow execution (sync/async)
- Real-time monitoring via WebSocket
- Type-safe APIs with comprehensive error handling
- Connection pooling and retry logic

---

## 📚 Documentation Structure

### Root Level (Standard Open Source Files)
```
README.md                 # Project overview and quick start
CLAUDE.md                 # This file - AI assistant context
CONTRIBUTING.md           # Contribution guidelines
SECURITY.md               # Security policy
CODE_OF_CONDUCT.md        # Community code of conduct
GOVERNANCE.md             # Project governance
MAINTAINERS.md            # Team structure
CHANGELOG.md              # Version history
COMPLETION_ROADMAP.md     # Package consolidation progress
```

### Documentation Directories

**docs/project-planning/** - Active planning and roadmaps
- `roadmaps/` - Development roadmaps (ACTIVE_ROADMAP.md, infrastructure, integrations)
- `architecture/` - System design (ENTERPRISE_ARCHITECTURE.md, AGENTS.md)
- `guides/` - Implementation guides (LLM implementation, optimization, SDK comparison)
- `PLATFORM_GAP_ANALYSIS_2025.md` - Current gaps and priorities (v6.0, active gaps only)

**docs/history/** - Historical documentation and completed work
- `phases/` - Phase implementation summaries (B, C, D)
- `consolidation/` - Package consolidation history
- `analysis/` - Architectural analyses
- `migrations/` - Monorepo migration guides
- `security/` - Security audit reports
- `sessions/` - Development session summaries
- `sprints/` - Sprint completion reports

**docs/api/** - API documentation
- OpenAPI 3.0.3 specification (30+ endpoints, 36+ schemas)
- Plugin Marketplace API
- Workflow Optimization API

**docs/deployment/** - Deployment guides
- Docker, Kubernetes, cloud providers (AWS, GCP, Azure)

**docs/operations/** - Operations guides
- Monitoring, logging, tracing, scaling, backup-recovery

**docs/user-guide/** - User documentation
- Getting started, integrations guide, workflow examples

---

## 🎯 Current Development Priorities (October 2025)

### Platform Status
- **Overall Score**: 87/100 (realistic assessment)
- **Perfect Scores**: Infrastructure (100/100)
- **Strong Scores**: Code Quality (85/100), Observability (95/100), Testing (85/100), Community (85/100), Documentation (90/100)

### Critical Gap: Integration Ecosystem (30/100)
Currently only 1-2 integrations vs. 50+ needed for competitive platform

**Q1 2026 Priorities**:
1. **5 Tier 1 Integrations**: Slack, GitHub, Stripe, Google Workspace, Salesforce
2. **5 More Tier 1**: AWS, Discord, Microsoft Teams, HubSpot, Notion
3. **User Documentation**: Getting started guides, 10+ tutorials, 10+ examples

**Q2 2026 Priorities**:
1. **Complete Tier 1**: 30 total integrations
2. **Template Library**: 30+ pre-built workflow templates
3. **Begin Tier 2**: Social media, AI/ML integrations

---

## 🛠️ Development Guidelines

### Code Quality Standards

**TypeScript**:
- Strict mode enabled across all packages
- 100 character line width
- 2-space indentation
- Comprehensive type coverage

**Biome Configuration**:
- All-in-one linting, formatting, import organization
- Strong type safety enforced (`noExplicitAny` strict)
- 3,383 errors tracked (mostly style violations, systematic cleanup in progress)
- 1,319 warnings (non-critical style preferences)
- Consistent style across all packages

**Conventional Commits**:
```
feat: Add new integration node
fix: Resolve workflow execution bug
docs: Update API documentation
refactor: Simplify node execution logic
test: Add E2E tests for credentials
chore: Update dependencies
```

### Before Making Changes

1. **Check for Duplication**: Search for existing implementations
2. **Read Existing Code**: Understand current patterns and architecture
3. **Follow Layer Separation**:
   - **app/**: User-facing application logic
   - **core/**: Business logic and API services
   - **design-system/**: Reusable UI components
4. **Use Path Aliases**: `@/app`, `@/core`, `@/design-system`
5. **Write Tests**: Unit tests for logic, E2E tests for workflows
6. **Run Quality Checks**: `pnpm run quality:fix` before committing
7. **Update Documentation**: Keep docs in sync with code changes

### Adding New Node Types

1. **Generate Scaffold**:
```bash
pnpm reporunner generate node --name MyService --category communication
```

2. **Define Properties** (`properties.ts`):
```typescript
export const myServiceProperties: NodeProperty[] = [
  {
    displayName: 'API Key',
    name: 'apiKey',
    type: 'string',
    required: true,
    typeOptions: { password: true }
  }
];
```

3. **Implement Execution** (`actions.ts`):
```typescript
export async function execute(node: NodeData, context: ExecutionContext) {
  // Integration logic
  return { success: true, data: result };
}
```

4. **Register Node**: Add to category in `src/core/constants/categories.ts`

### Git Commit Guidelines

**Standard conventional commit format WITHOUT Claude attribution**.

Do NOT include:
- `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- `Co-Authored-By: Claude <noreply@anthropic.com>`

Example:
```bash
git commit -m "feat: add Slack integration node

- Implement message sending action
- Add OAuth2 authentication
- Include tests and documentation"
```

---

## 🔍 Quick Reference for Common Tasks

### Find Existing Code
```bash
# Search for functionality
grep -r "function name" packages/

# Find similar nodes
ls packages/frontend/src/app/data/nodes/communication/

# Check for duplicate utilities
grep -r "utility function" packages/shared/
```

### Add New Feature
1. Check `docs/project-planning/ACTIVE_ROADMAP.md` for alignment
2. Search for existing similar implementations
3. Follow package structure and layer separation
4. Write tests alongside implementation
5. Update relevant documentation

### Debug Issues
1. Check logs: `docker-compose logs -f backend`
2. Review Grafana dashboards: http://localhost:3030
3. Check Jaeger traces: http://localhost:16686
4. Review execution history in UI

### Deploy Changes
1. Run quality checks: `pnpm run quality:fix`
2. Run tests: `pnpm run test`
3. Build all packages: `turbo run build`
4. Deploy with Docker Compose or Kubernetes

---

## 📞 Support & Resources

**Documentation**:
- Main docs: `/docs/README.md`
- API docs: `/docs/api/`
- Guides: `/docs/project-planning/guides/`

**Community**:
- GitHub Issues: Bug reports and feature requests
- Discord: Community chat
- Contributing: See `CONTRIBUTING.md`

**For AI Assistants**:
- This file provides comprehensive context
- Check `/docs/history/` for historical decisions
- Check `/docs/project-planning/` for future direction
- Always verify package counts and structure
- Follow the three-layer frontend architecture
- Maintain code quality standards (100/100 score)

---

**Last Updated**: October 7, 2025
**Maintained By**: Reporunner Development Team
**Format**: Markdown
**Encoding**: UTF-8

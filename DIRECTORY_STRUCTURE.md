# Reporunner Directory Structure

This document outlines the reorganized directory structure of the Reporunner project for better maintainability and logical organization.

## 📁 Top-Level Structure

```
reporunner/
├── packages/                    # Main application packages (monorepo)
│   ├── backend/                # Backend API server
│   ├── frontend/               # React frontend application
│   ├── core/                   # Shared core libraries
│   └── @reporunner/           # Scoped packages
├── infrastructure/             # Infrastructure as Code
│   ├── docker/                # Docker Compose configurations
│   ├── kubernetes/            # Kubernetes manifests and Helm charts
│   ├── monitoring/            # Prometheus + Grafana setup
│   ├── observability/         # OpenTelemetry + Jaeger/Tempo
│   └── logging/               # ELK Stack configuration
├── sdks/                      # All official SDKs in one place
│   ├── typescript/            # TypeScript/JavaScript SDK (Primary)
│   ├── python/                # Python SDK with async support
│   ├── go/                    # Go SDK for high-performance
│   ├── java/                  # Java SDK for enterprise
│   ├── dotnet/                # C#/.NET SDK
│   ├── php/                   # PHP SDK for web apps
│   ├── rust/                  # Rust SDK for system performance
│   └── connector/             # Connector SDK for custom integrations
├── development/               # Development tools and scripts
│   ├── scripts/               # Build and development scripts
│   └── tools/                 # Development tooling
├── documentation/             # Project documentation
│   ├── project-docs/          # Technical documentation
│   ├── api-docs/              # API documentation
│   └── guides/                # User guides and tutorials
├── .github/                   # GitHub workflows and templates
├── .husky/                    # Git hooks
├── .turbo/                    # Turborepo cache
├── .vscode/                   # VS Code configurations
└── node_modules/              # Dependencies
```

## 🏗️ Package Architecture

### Core Packages (`packages/`)

#### `packages/backend/`
- **Purpose**: Main backend API server
- **Tech**: Node.js, Express, TypeScript
- **Contains**: API routes, services, models, middleware

#### `packages/frontend/`
- **Purpose**: React frontend application
- **Tech**: React 19, TypeScript, Vite, Tailwind CSS
- **Contains**: React components, pages, stores, styles

#### `packages/core/`
- **Purpose**: Shared libraries and utilities
- **Contains**: Common types, utilities, shared business logic

#### `packages/@reporunner/`
Scoped packages for modular functionality:
- `@reporunner/ai` - AI/ML integrations
- `@reporunner/auth` - Authentication services
- `@reporunner/workflow-engine` - Workflow execution engine
- `@reporunner/database` - Database abstractions
- `@reporunner/api` - API utilities and middleware
- And many more specialized packages

### Infrastructure (`infrastructure/`)

#### `infrastructure/docker/`
- **docker-compose.yml** - Local development environment
- **docker-compose.prod.yml** - Production configuration
- **docker-compose.monitoring.yml** - Monitoring stack

#### `infrastructure/kubernetes/`
- **helm/** - Helm charts for Kubernetes deployment
- **manifests/** - Raw Kubernetes YAML files
- **Chart.yaml** - Helm chart metadata

#### `infrastructure/monitoring/`
- **prometheus/** - Metrics collection configuration
- **grafana/** - Dashboards and data sources
- **alertmanager/** - Alert routing and management
- **blackbox/** - Blackbox monitoring configuration

#### `infrastructure/observability/`
- **otel-collector/** - OpenTelemetry collector config
- **jaeger/** - Distributed tracing setup
- **tempo/** - Trace storage configuration
- **loki/** - Log aggregation setup

#### `infrastructure/logging/`
- **elasticsearch/** - Search and analytics engine
- **logstash/** - Log processing pipeline
- **kibana/** - Log visualization and analysis
- **filebeat/** - Log shipping configuration
- **elastalert/** - Log-based alerting rules

### Development Tools (`development/`)

#### `development/sdks/`
- **python/** - Python SDK with async support
- **go/** - Go SDK for enterprise performance
- **java/** - Java SDK for enterprise environments

#### `development/scripts/`
- **biome-migration.sh** - Code formatter migration
- **build-sdks.sh** - SDK build automation
- **setup-env.js** - Environment setup
- **setup-node.js** - Node.js environment configuration

#### `development/tools/`
- Build tools and utilities
- ESLint configurations
- Development environment setup

### Documentation (`documentation/`)

#### `documentation/project-docs/`
- Technical architecture documentation
- Implementation guides
- Development process documentation

#### `documentation/api-docs/`
- API reference documentation
- OpenAPI specifications
- Integration examples

#### `documentation/guides/`
- User guides and tutorials
- Getting started documentation
- Best practices

## 🔧 Configuration Files

### Root Level Configuration
- **package.json** - Root package configuration and scripts
- **pnpm-workspace.yaml** - PNPM workspace configuration
- **turbo.json** - Turborepo build configuration
- **tsconfig.base.json** - Base TypeScript configuration
- **eslint.config.js** - ESLint configuration
- **biome.json** - Biome linter/formatter configuration
- **jest.config.js** - Jest testing configuration

### Environment Configuration
- **.env.example** - Environment variable template
- **.env** - Local environment variables (gitignored)

### Git Configuration
- **.gitignore** - Git ignore patterns
- **.gitattributes** - Git attributes configuration
- **lefthook.yml** - Git hooks configuration

## 🚀 Key Improvements

### Before Reorganization Issues:
❌ Duplicate directories (`k8s/` + `helm/`, `monitoring/` + `observability/`)
❌ 58+ empty placeholder directories
❌ Infrastructure scattered across root level
❌ No logical grouping of related functionality
❌ Confusing mix of deployment methods

### After Reorganization Benefits:
✅ **Unified Infrastructure**: All infrastructure code in one place
✅ **Clear Separation**: Development tools separated from production infrastructure
✅ **Logical Grouping**: Related functionality grouped together
✅ **Scalable Structure**: Easy to add new components without confusion
✅ **Better Navigation**: Developers can quickly find what they need
✅ **Reduced Duplication**: No more duplicate directories serving the same purpose

## 📋 Migration Notes

### Updated Paths:
- `k8s/` → `infrastructure/kubernetes/`
- `helm/` → `infrastructure/kubernetes/helm/`
- `monitoring/` → `infrastructure/monitoring/`
- `observability/` → `infrastructure/observability/`
- `logging/` → `infrastructure/logging/`
- `development/sdks/` + `packages/sdk/` + `packages/@reporunner/*-sdk/` → `sdks/`
- `scripts/` → `development/scripts/`
- `tools/` → `development/tools/`
- `docs/` → `documentation/project-docs/`

### Files Requiring Updates:
- CI/CD pipeline references in `.github/workflows/`
- Docker Compose file paths
- Documentation links
- Package.json script paths
- README.md references

## 🔗 Quick Access

### Development:
```bash
# Start development environment
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Setup infrastructure
cd infrastructure/docker && docker-compose up -d
```

### Infrastructure:
```bash
# Deploy to Kubernetes
cd infrastructure/kubernetes && helm install reporunner ./helm/

# Start monitoring stack
cd infrastructure/monitoring && docker-compose up -d

# Setup logging
cd infrastructure/logging && ./scripts/setup-elk.sh
```

### SDKs:
```bash
# Build Python SDK
cd development/sdks/python && pip install -e .

# Build Go SDK
cd development/sdks/go && go build ./...

# Build all SDKs
./development/scripts/build-sdks.sh
```

This reorganized structure provides a clean, scalable foundation for the Reporunner platform that separates concerns appropriately and eliminates the confusion from duplicate and empty directories.
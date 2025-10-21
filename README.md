# KlikkFlow 🚀

> **Open-source workflow automation platform powered by AI**
> The next-generation alternative to n8n with built-in AI/ML capabilities, modern architecture, and enterprise-grade scaling.

[![CI/CD](https://github.com/klikkflow/klikkflow/actions/workflows/ci.yml/badge.svg)](https://github.com/klikkflow/klikkflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## ✨ Key Features

### 🤖 AI-First Design
- **Native LLM Integration**: OpenAI, Anthropic, Google AI, and Ollama support
- **Vector Search**: PostgreSQL with pgvector for semantic workflows
- **AI Agents**: Intelligent automation with memory and tools
- **Smart Workflow Optimization**: AI-powered performance analysis and suggestions

### 🏪 Plugin Marketplace
- **Comprehensive Plugin Registry**: Secure publishing, validation, and distribution
- **Advanced Security Scanning**: Automated vulnerability detection and code analysis
- **Developer-Friendly Publishing**: Step-by-step wizard with validation pipeline
- **Community-Driven**: Reviews, ratings, and featured plugin showcase

### 🏗️ Enterprise Architecture
- **Hybrid Database**: PostgreSQL + MongoDB for optimal performance
- **Queue-Based Execution**: BullMQ with Redis for scalable processing
- **Real-time Monitoring**: WebSocket-based execution tracking
- **Multi-tenancy**: Organization-based isolation and resource quotas

### 🎨 Modern Developer Experience
- **React 19** with concurrent features
- **TypeScript** throughout with strict type checking
- **Turborepo** monorepo with optimized builds
- **Hot Reload** development environment

### 🔧 Extensible Integration System
- **27+ Built-in Nodes**: Gmail, databases, AI services, and more
- **Dynamic Property System**: n8n-inspired conditional forms
- **Custom Node Development**: CLI tools and hot reload support
- **Multi-language SDKs**: TypeScript, Python, Go, Rust, Java, PHP, and .NET

### 📊 Advanced Analytics & Optimization
- **AI-Powered Workflow Analysis**: Intelligent bottleneck detection and optimization suggestions
- **Performance Monitoring**: Real-time metrics with historical trend analysis
- **Cost Optimization**: Resource usage analysis and efficiency recommendations
- **Reliability Enhancement**: Error pattern detection and retry logic suggestions
- **Interactive Dashboards**: Real-time performance metrics with Chart.js visualizations

## 🚀 Quick Start

### ⚡ One-Command Installation (Recommended)

**Get KlikkFlow running in 60 seconds** with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/KlikkAI/klikkflow/main/scripts/install.sh | sh
```

**That's it!** The installer will:
- ✅ Automatically check Docker prerequisites
- ✅ Download the latest KlikkFlow images
- ✅ Generate secure JWT secrets and encryption keys
- ✅ Start all 6 core services (Frontend, Backend, Worker, MongoDB, PostgreSQL, Redis)
- ✅ Wait for services to become healthy
- ✅ Open http://localhost:3000 in your browser

**Default credentials**: `admin@klikkflow.local` / `admin123`

**What you get**:
- React 19 frontend with real-time updates
- Express.js API with JWT authentication
- MongoDB + PostgreSQL hybrid database
- Redis + BullMQ queue-based execution
- Automated database initialization

**Manual Installation** (if you prefer):
```bash
# Download and run installer locally
wget https://raw.githubusercontent.com/KlikkAI/klikkflow/main/scripts/install.sh
chmod +x install.sh
./install.sh

# Or specify custom ports
FRONTEND_PORT=3001 BACKEND_PORT=3002 ./install.sh
```

### 🔧 Alternative: Docker Compose

If you prefer to build from source or customize your deployment:

```bash
# Clone and start
git clone https://github.com/klikkflow/klikkflow.git
cd klikkflow
docker-compose up -d

# Access the platform
open http://localhost:3000
```

### 🎯 Progressive Deployment Profiles

Choose your deployment complexity:

#### Solo Developer (6 containers, ~2GB RAM)
```bash
docker-compose up -d
# Core services only - perfect for local development
```

#### Team Development (12 containers, ~4GB RAM)
```bash
docker-compose --profile monitoring up -d
# Adds: Prometheus, Grafana (7 dashboards), AlertManager, exporters
# Access Grafana: http://localhost:3030 (admin/admin)
```

#### Production Ready (10 containers, ~6GB RAM)
```bash
docker-compose --profile ha up -d
# Adds: Load balancer, automated backups, multiple backend/worker instances
```

#### Enterprise Full Stack (22 containers, ~12GB RAM)
```bash
docker-compose --profile full up -d
# Complete platform: Monitoring + HA + Logging (ELK) + Dev Tools
```

#### Custom Mix & Match
```bash
docker-compose --profile monitoring --profile ha up -d
# Mix profiles as needed for your use case
```

### 📦 What's Included Out-of-the-Box

**Core Platform (Always Included)**:
- **Frontend**: Nginx + React 19 SPA (~25MB image)
- **Backend**: Express.js API server (~80MB image)
- **Worker**: BullMQ workflow executor (~85MB image)
- **MongoDB**: Primary database for workflows & users
- **PostgreSQL + pgvector**: AI/ML database for embeddings
- **Redis**: Queue management and caching

**Monitoring Profile** (adds 6 containers):
- **Prometheus**: Metrics collection (15s scrape interval)
- **Grafana**: 7 pre-configured dashboards (API, workflows, system, DB, queues, security, business)
- **AlertManager**: Alert routing and silencing
- **Exporters**: node-exporter, redis-exporter, mongodb-exporter

**High Availability Profile** (adds 4 containers):
- **Nginx Load Balancer**: Round-robin to multiple backends
- **Backup Service**: Automated daily backups (MongoDB + PostgreSQL) with S3 support
- **Backend-2**: Additional backend instance for redundancy
- **Worker-2**: Additional worker instance for parallel execution

**Logging Profile** (adds 3 containers):
- **Elasticsearch**: Centralized log storage
- **Kibana**: Log visualization and analysis
- **Filebeat**: Log shipper from all services

**Dev Tools Profile** (adds 3 containers):
- **MailHog**: Email testing (catches all outbound emails)
- **Adminer**: Database management UI (MongoDB + PostgreSQL)
- **Redis Commander**: Redis key/value browser

### 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | demo@klikkflow.com / demo123 |
| **API** | http://localhost:3001 | - |
| **Grafana** | http://localhost:3030 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Kibana** | http://localhost:5601 | - |
| **MailHog** | http://localhost:8025 | - |
| **Adminer** | http://localhost:8080 | - |

### 🔧 Development Setup (Without Docker)

```bash
# Clone the repository
git clone https://github.com/klikkflow/klikkflow.git
cd klikkflow

# Install dependencies
pnpm install

# Start databases with Docker
docker-compose up -d mongo postgres redis

# Start development servers
pnpm dev

# Visit http://localhost:3000
```

### 🚢 Production Deployment Options

Comprehensive deployment guide available at [DEPLOYMENT.md](./DEPLOYMENT.md) covering:

- **Docker Compose**: 5 deployment scenarios (solo → enterprise)
- **Kubernetes**: Helm charts with auto-scaling
- **AWS**: ECS Fargate ($220-$1,950/mo) or EKS
- **GCP**: Cloud Run ($110-$1,850/mo) or GKE
- **Azure**: Container Instances ($220-$2,650/mo) or AKS

## 📁 Project Structure

```
klikkflow/
├── packages/              # Optimized monorepo (12 packages, 58.6% reduction)
│   ├── frontend/          # React 19 web application
│   ├── backend/           # Express.js API server (includes common, database, monitoring)
│   ├── shared/            # Shared utilities, types, validation, API definitions
│   └── @klikkflow/       # Scoped packages (9 total)
│       ├── ai/            # AI/ML capabilities and services
│       ├── auth/          # Authentication & security services
│       ├── cli/           # CLI tools and dev utilities
│       ├── core/          # Core utilities and base classes
│       ├── enterprise/    # Enterprise SSO, RBAC, compliance
│       ├── integrations/  # Integration framework & plugins
│       ├── platform/      # Platform services (gateway, real-time, upload, etc.)
│       ├── services/      # Microservices (analytics, audit, tenant, workflow, etc.)
│       └── workflow/      # Workflow execution engine and core logic
├── infrastructure/        # Infrastructure as Code
│   ├── docker/            # Docker Compose configurations
│   ├── kubernetes/        # Kubernetes manifests and Helm charts
│   ├── monitoring/        # Prometheus + Grafana setup
│   ├── observability/     # OpenTelemetry + Jaeger/Tempo
│   └── logging/           # ELK Stack configuration
├── sdks/                  # All official SDKs (TypeScript, Python, Go, Java, C#, PHP, Rust)
├── development/           # Development tools and scripts
│   ├── scripts/           # Build and development scripts
│   └── tools/             # Development tooling
└── docs/                  # Project documentation
    ├── project-planning/  # Planning and roadmaps
    ├── history/           # Historical documentation and analysis
    └── api/               # API documentation
```

> 📋 **See [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) for detailed documentation of the reorganized structure.**

## 🛠️ Development

### Package Scripts

```bash
# Development
pnpm run dev              # Start all services
pnpm run dev:frontend     # Frontend only
pnpm run dev:backend      # Backend only

# Building
pnpm run build            # Build all packages
pnpm run build:frontend   # Build frontend
pnpm run build:backend    # Build backend

# Testing
pnpm run test             # Run all tests
pnpm run test:unit        # Unit tests only
pnpm run test:e2e         # E2E tests with Playwright

# Code Quality
pnpm run lint             # Biome linting
pnpm run type-check       # TypeScript checking
pnpm run format           # Biome formatting
pnpm run organize-imports # Organize imports with Biome
pnpm run quality          # Run all quality checks
pnpm run quality:fix      # Fix linting, formatting, and imports
pnpm run validate         # Full validation including security

# Architecture Validation
pnpm --filter @klikkflow/validation architecture:validate      # Complete architecture validation
pnpm --filter @klikkflow/validation architecture:dependencies # Dependency analysis
pnpm --filter @klikkflow/validation architecture:organization # Code organization validation
pnpm --filter @klikkflow/validation architecture:types        # Type safety validation

# Dependency Management
pnpm run deps:check       # Check for dependency updates
pnpm run deps:update      # Update dependencies
pnpm run analyze:deps     # Analyze circular dependencies

# Maintenance
pnpm run clean:all        # Clean all node_modules and build artifacts
```

### Adding New Integrations

1. **Generate Node Scaffold**
```bash
pnpm klikkflow generate node --name MyService --category communication
```

2. **Define Node Properties**
```typescript
// packages/@klikkflow/nodes/src/communication/myservice/properties.ts
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

3. **Implement Execution Logic**
```typescript
// packages/@klikkflow/nodes/src/communication/myservice/actions.ts
export async function execute(node: NodeData, context: ExecutionContext) {
  // Your integration logic here
  return { success: true, data: result };
}
```

## 🧪 Testing

We maintain comprehensive test coverage across all packages:

- **Unit Tests**: Vitest with Testing Library
- **Integration Tests**: Real database and API testing
- **E2E Tests**: Playwright for full workflow testing
- **Performance Tests**: Load testing for scalability

```bash
# Run specific test suites
pnpm run test:unit --filter=@klikkflow/backend
pnpm run test:integration --filter=@klikkflow/workflow
pnpm run test:e2e --headed
```
## 🐳 Docker & Kubernetes

### Docker Compose (Recommended for Most Users)

KlikkFlow's Docker Compose setup is **production-complete** from day one:

```bash
# Core services (60 seconds)
docker-compose up -d

# Add monitoring (90 seconds total)
docker-compose --profile monitoring up -d

# Production HA setup (120 seconds total)
docker-compose --profile ha up -d

# Everything (180 seconds total)
docker-compose --profile full up -d
```

**Why Docker Compose First?**
- **No complexity** - Single command deployment
- **Production-ready** - Same config from dev to prod
- **Progressive scaling** - Start small, grow as needed
- **Local parity** - Develop exactly as deployed
- **Cost-effective** - $0-$50/mo on a single VPS

### Kubernetes (For Advanced Scaling)

Deploy with Helm when you need:
- **Auto-scaling** based on CPU/memory/custom metrics
- **Multi-region** deployments with failover
- **100+ workflows** executing concurrently
- **Enterprise compliance** (SOC 2, HIPAA, etc.)

```bash
# Add Helm repo
helm repo add klikkflow https://charts.klikkflow.com
helm repo update

# Install with defaults
helm install klikkflow klikkflow/klikkflow \
  --namespace klikkflow \
  --create-namespace

# Production install with custom values
helm install klikkflow klikkflow/klikkflow \
  --namespace klikkflow \
  --create-namespace \
  --values production-values.yaml
```

### Common Docker Commands

```bash
# Start/Stop
docker-compose up -d                          # Start all core services
docker-compose --profile full up -d           # Start all services
docker-compose down                           # Stop (keep data)
docker-compose down -v                        # Stop and delete data

# View logs
docker-compose logs -f                        # All services
docker-compose logs -f backend                # Specific service
docker-compose logs --tail=100 worker         # Last 100 lines

# Health & Status
docker-compose ps                             # Service status
docker stats                                  # Resource usage
curl http://localhost:3000/health             # Frontend health
curl http://localhost:3001/api/health         # Backend health

# Scale services
docker-compose up -d --scale worker=5         # Scale workers to 5 instances
docker-compose up -d --scale backend=3        # Scale backends to 3 instances

# Database access
docker-compose exec mongo mongosh             # MongoDB shell
docker-compose exec postgres psql -U postgres # PostgreSQL shell
docker-compose exec redis redis-cli           # Redis shell

# Restart services
docker-compose restart backend                # Restart backend
docker-compose restart                        # Restart all

# Update to latest images
docker-compose pull                           # Pull latest images
docker-compose up -d                          # Recreate containers
```

## 📊 Monitoring & Observability

### 7 Production-Ready Grafana Dashboards

KlikkFlow includes **7 pre-configured Grafana dashboards** - no setup required:

1. **API Performance Dashboard**
   - Request rates, latency (p50, p95, p99), error rates
   - Status code distribution, active connections
   - Top 10 slowest endpoints with response times
   - **Alerts**: High error rate (>5%), slow response time (>2s)

2. **Workflow Execution Dashboard**
   - Execution rates by status (success/error/pending)
   - Success rate gauge with color thresholds
   - Average execution duration and p95 latency
   - Node execution time breakdown by type
   - Failed workflow analysis table

3. **System Health Dashboard**
   - CPU usage per instance with 80% alert threshold
   - Memory usage percentage
   - Disk usage gauge with 85% warning
   - Network I/O (transmit/receive)
   - Container health status table
   - System uptime

4. **Database Performance Dashboard**
   - MongoDB: operations/sec, connections, query latency, memory usage
   - PostgreSQL: connection pool, transaction rate, cache hit ratio (95%+ target)
   - Database sizes table with growth trends

5. **Queue Metrics Dashboard**
   - BullMQ job processing rate (completed/failed)
   - Queue depth (waiting/active/delayed) with 1000-job alert
   - Job processing time (p50/p95)
   - Redis connection pool usage
   - Redis memory usage and commands/sec
   - Active worker count

6. **Security Dashboard**
   - Authentication attempts (successful/failed)
   - Failed login rate with 50% alert threshold
   - Rate limiting violations
   - Active sessions count
   - Account lockouts
   - Top failed login IPs
   - OAuth token grants
   - Invalid token attempts

7. **Business Metrics Dashboard**
   - Daily Active Users (DAU) trend
   - Total workflows and active workflows
   - Total executions (24h window)
   - Workflow creation trend
   - Execution success rate
   - Average workflows per user
   - Top 10 most active users
   - Top 10 most used integrations

**Access**: http://localhost:3030 (default: `admin` / `admin`)

### Prometheus Metrics

**50+ custom metrics** collected at 15-second intervals:

```promql
# API Performance
http_requests_total{service="backend"}
http_request_duration_seconds{service="backend"}

# Workflow Execution
workflow_executions_total{status="success|error|pending"}
workflow_execution_duration_seconds

# Queue Metrics
bullmq_queue_waiting{service="worker"}
bullmq_jobs_completed_total{service="worker"}

# System Resources
node_cpu_seconds_total
node_memory_MemAvailable_bytes
redis_connected_clients
mongodb_opcounters_total
```

**Access**: http://localhost:9090

### Logging Stack (ELK)

Enable with `--profile logging`:

- **Elasticsearch**: Centralized log storage (7 days default retention)
- **Kibana**: Log analysis and visualization
- **Filebeat**: Automatic log shipping from all services

**Access**: http://localhost:5601

### Distributed Tracing

**OpenTelemetry + Jaeger** for distributed tracing (optional):

```bash
docker-compose --profile tracing up -d
```

**Access**: http://localhost:16686

## 🌐 API & SDK Ecosystem

### REST API
```bash
# Get workflows
GET /api/workflows

# Execute workflow
POST /api/executions
{
  "workflowId": "workflow-123",
  "inputData": { "email": "user@example.com" }
}
```

### Multi-Language SDK Support

| Language | Package | Installation |
|----------|---------|--------------|
| **TypeScript/Node.js** | `@klikkflow/sdk` | `pnpm add @klikkflow/sdk` |
| **Python** | `klikkflow-sdk` | `pip install klikkflow-sdk` |
| **Go** | `go-sdk` | `go get github.com/klikkflow/klikkflow/go-sdk` |
| **Rust** | `klikkflow-sdk` | `cargo add klikkflow-sdk` |
| **Java** | `klikkflow-java-sdk` | Maven/Gradle |
| **PHP** | `klikkflow/php-sdk` | `composer require klikkflow/php-sdk` |
| **.NET** | `KlikkFlow.Sdk` | `dotnet add package KlikkFlow.Sdk` |

### TypeScript SDK
```typescript
import { KlikkFlowClient } from '@klikkflow/sdk';

const client = new KlikkFlowClient({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key'
});

const execution = await client.executeWorkflow('workflow-123', {
  email: 'user@example.com'
});
```

### Python SDK
```python
from klikkflow import KlikkFlowClient

async with KlikkFlowClient(
    base_url='http://localhost:3001',
    api_key='your-api-key'
) as client:
    execution = await client.execute_workflow('workflow-123', {
        'email': 'user@example.com'
    })
```

### Go SDK
```go
client := klikkflow.NewClient(klikkflow.ClientOptions{
    BaseURL: "http://localhost:3001",
    APIKey:  "your-api-key",
})

execution, err := client.ExecuteWorkflow(ctx, "workflow-123",
    map[string]interface{}{
        "email": "user@example.com",
    }, true)
```

### Rust SDK
```rust
let client = Client::new("http://localhost:3001")
    .with_api_key("your-api-key");

let execution = client.execute_workflow(
    "workflow-123",
    HashMap::from([("email".to_string(), "user@example.com".into())]),
    true
).await?;
```

### Java SDK
```java
KlikkFlowClient client = new KlikkFlowClient(
    "http://localhost:3001",
    "your-api-key"
);

ExecutionResult execution = client.executeWorkflow(
    "workflow-123",
    Map.of("email", "user@example.com")
);
```

### PHP SDK
```php
$client = new KlikkFlowClient(
    'http://localhost:3001',
    'your-api-key'
);

$execution = $client->executeWorkflow('workflow-123', [
    'email' => 'user@example.com'
]);
```

### .NET SDK
```csharp
var client = new KlikkFlowClient(httpClient, options, logger);

var execution = await client.ExecuteWorkflowAsync("workflow-123",
    new Dictionary<string, object> {
        ["email"] = "user@example.com"
    });
```

## 📚 Documentation

Comprehensive documentation is available to help you get the most out of KlikkFlow:

### 🚀 Getting Started
- **[DOCKER.md](DOCKER.md)** - One-command Docker installation guide
- **[docs/user-guide/GETTING_STARTED.md](docs/user-guide/GETTING_STARTED.md)** - Your first workflow tutorial
- **[docs/user-guide/INTEGRATIONS_GUIDE.md](docs/user-guide/INTEGRATIONS_GUIDE.md)** - Available integrations and how to use them

### 🏗️ Deployment & Operations
- **[docs/deployment/](docs/deployment/)** - Complete deployment guides
  - [Docker Deployment](docs/deployment/docker/README.md) - Profile-based Docker deployments
  - [Kubernetes](docs/deployment/kubernetes/README.md) - K8s + Helm charts
  - [Cloud Providers](docs/deployment/cloud-providers/README.md) - AWS, GCP, Azure
- **[docs/operations/](docs/operations/)** - Operations guides
  - [Monitoring](docs/operations/monitoring/README.md) - Prometheus, Grafana dashboards
  - [Logging](docs/operations/logging/README.md) - ELK stack setup
  - [Backup & Recovery](docs/operations/backup-recovery/README.md) - Data protection

### 🔧 Development
- **[CLAUDE.md](CLAUDE.md)** - Comprehensive AI assistant context (architecture, commands, guidelines)
- **[docs/development/](docs/development/)** - Development guides
  - [Code Quality](docs/development/CODE_QUALITY.md) - Standards and best practices
  - [Development Setup](docs/development/README.md) - Local environment setup
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

### 🎨 Features
- **[docs/features/PLUGIN_MARKETPLACE.md](docs/features/PLUGIN_MARKETPLACE.md)** - Plugin system documentation
- **[docs/features/AI_WORKFLOW_OPTIMIZATION.md](docs/features/AI_WORKFLOW_OPTIMIZATION.md)** - AI optimization features

### 📖 API Reference
- **[docs/api/](docs/api/)** - API documentation
  - [OpenAPI Specification](docs/api/OPENAPI_README.md) - 30+ endpoints
  - [Plugin Marketplace API](docs/api/PLUGIN_MARKETPLACE_API.md)
  - [Workflow Optimization API](docs/api/WORKFLOW_OPTIMIZATION_API.md)

### 📋 Planning & Architecture
- **[docs/project-planning/](docs/project-planning/)** - Project roadmaps and architecture
  - [Active Roadmap](docs/project-planning/roadmaps/ACTIVE_ROADMAP.md) - Current priorities
  - [Enterprise Architecture](docs/project-planning/architecture/ENTERPRISE_ARCHITECTURE.md) - System design
  - [Platform Gap Analysis](docs/project-planning/PLATFORM_GAP_ANALYSIS_2025.md) - Status & priorities

For the complete documentation index, see **[docs/README.md](docs/README.md)**.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **Biome**: All-in-one linting, formatting, and import organization
- **Conventional Commits**: Standardized commit messages
- **Consistent Style**: 100 character line width, 2-space indentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [n8n](https://n8n.io) for workflow automation inspiration
- [LangChain](https://langchain.com) for AI integration patterns
- [React Flow](https://reactflow.dev) for visual workflow editor
- [Turborepo](https://turbo.build) for monorepo architecture

## 📞 Support & Community

- **Documentation**: [docs.klikkflow.com](https://docs.klikkflow.com)
- **GitHub Issues**: [Bug reports and features](https://github.com/klikkflow/klikkflow/issues)
- **Discord**: [Community chat](https://discord.gg/klikkflow)
- **Twitter**: [@klikkflow](https://twitter.com/klikkflow)

---

<p align="center">
  <strong>⭐ If you find KlikkFlow helpful, please star the repository!</strong>
</p>

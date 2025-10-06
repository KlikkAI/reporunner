# Reporunner 🚀

> **Open-source workflow automation platform powered by AI**
> The next-generation alternative to n8n with built-in AI/ML capabilities, modern architecture, and enterprise-grade scaling.

[![CI/CD](https://github.com/reporunner/reporunner/actions/workflows/ci.yml/badge.svg)](https://github.com/reporunner/reporunner/actions/workflows/ci.yml)
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

### Prerequisites
- **Node.js** 18+ and **pnpm** 9+
- **Docker** and **Docker Compose**
- **Git**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/reporunner/reporunner.git
cd reporunner

# Install dependencies
pnpm install

# Start development environment
pnpm dev

# Install dependencies
pnpm install

# Start development environment
cd infrastructure/docker && docker-compose up -d

# Start frontend and backend
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the web interface.

### Production Deployment

```bash
# Using Docker Compose
cd infrastructure/docker && docker-compose -f docker-compose.prod.yml up -d

# Using Kubernetes with Helm
cd infrastructure/kubernetes && helm install reporunner ./helm/reporunner \
  --set ingress.hosts[0].host=your-domain.com \
  --set postgresql.auth.password=your-secure-password
```

## 📁 Project Structure

```
reporunner/
├── packages/              # Optimized monorepo (12 packages, 58.6% reduction)
│   ├── frontend/          # React 19 web application
│   ├── backend/           # Express.js API server (includes common, database, monitoring)
│   ├── shared/            # Shared utilities, types, validation, API definitions
│   └── @reporunner/       # Scoped packages (9 total)
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
pnpm --filter @reporunner/validation architecture:validate      # Complete architecture validation
pnpm --filter @reporunner/validation architecture:dependencies # Dependency analysis
pnpm --filter @reporunner/validation architecture:organization # Code organization validation
pnpm --filter @reporunner/validation architecture:types        # Type safety validation

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
pnpm reporunner generate node --name MyService --category communication
```

2. **Define Node Properties**
```typescript
// packages/@reporunner/nodes/src/communication/myservice/properties.ts
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
// packages/@reporunner/nodes/src/communication/myservice/actions.ts
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
pnpm run test:unit --filter=@reporunner/backend
pnpm run test:integration --filter=@reporunner/workflow
pnpm run test:e2e --headed
```

## 🐳 Docker & Kubernetes

### Local Development
```bash
docker-compose up -d        # Start all services
docker-compose logs -f      # View logs
docker-compose down -v      # Stop and cleanup
```

### Production Deployment
```bash
# Helm deployment
helm repo add reporunner https://charts.reporunner.com
helm install reporunner reporunner/reporunner
```

## 📊 Monitoring & Observability

Reporunner includes comprehensive monitoring out of the box:

- **Prometheus** for metrics collection
- **Grafana** for visualization and alerting
- **Jaeger** for distributed tracing
- **Winston** for structured logging

Access monitoring dashboards:
- Grafana: [http://localhost:3030](http://localhost:3030)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Jaeger: [http://localhost:16686](http://localhost:16686)

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
| **TypeScript/Node.js** | `@reporunner/sdk` | `pnpm add @reporunner/sdk` |
| **Python** | `reporunner-sdk` | `pip install reporunner-sdk` |
| **Go** | `go-sdk` | `go get github.com/reporunner/reporunner/go-sdk` |
| **Rust** | `reporunner-sdk` | `cargo add reporunner-sdk` |
| **Java** | `reporunner-java-sdk` | Maven/Gradle |
| **PHP** | `reporunner/php-sdk` | `composer require reporunner/php-sdk` |
| **.NET** | `Reporunner.Sdk` | `dotnet add package Reporunner.Sdk` |

### TypeScript SDK
```typescript
import { ReporunnerClient } from '@reporunner/sdk';

const client = new ReporunnerClient({
  apiUrl: 'http://localhost:3001',
  apiKey: 'your-api-key'
});

const execution = await client.executeWorkflow('workflow-123', {
  email: 'user@example.com'
});
```

### Python SDK
```python
from reporunner import ReporunnerClient

async with ReporunnerClient(
    base_url='http://localhost:3001',
    api_key='your-api-key'
) as client:
    execution = await client.execute_workflow('workflow-123', {
        'email': 'user@example.com'
    })
```

### Go SDK
```go
client := reporunner.NewClient(reporunner.ClientOptions{
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
ReporunnerClient client = new ReporunnerClient(
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
$client = new ReporunnerClient(
    'http://localhost:3001',
    'your-api-key'
);

$execution = $client->executeWorkflow('workflow-123', [
    'email' => 'user@example.com'
]);
```

### .NET SDK
```csharp
var client = new ReporunnerClient(httpClient, options, logger);

var execution = await client.ExecuteWorkflowAsync("workflow-123",
    new Dictionary<string, object> {
        ["email"] = "user@example.com"
    });
```

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

- **Documentation**: [docs.reporunner.com](https://docs.reporunner.com)
- **GitHub Issues**: [Bug reports and features](https://github.com/reporunner/reporunner/issues)
- **Discord**: [Community chat](https://discord.gg/reporunner)
- **Twitter**: [@reporunner](https://twitter.com/reporunner)

---

<p align="center">
  <strong>⭐ If you find Reporunner helpful, please star the repository!</strong>
</p>

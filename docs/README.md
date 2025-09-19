# 📚 Reporunner Documentation

Enterprise-grade visual workflow automation platform with AI capabilities.

## 📋 Table of Contents

### 🎯 Strategic Documents

- **[Enterprise Scaling Plan](./ENTERPRISE_SCALING_PLAN.md)** - Comprehensive roadmap for scaling to enterprise level
- **[Architecture Comparison](./ARCHITECTURE_COMPARISON.md)** - Comparison with n8n and SIM platforms
- **[Database Architecture](./DATABASE_ARCHITECTURE.md)** - Hybrid MongoDB + PostgreSQL architecture

### 🏗️ Architecture Documentation

- [System Overview](./diagrams/architecture/system-overview.svg) - High-level system architecture
- [Monorepo Structure](./diagrams/architecture/monorepo-structure.svg) - Package organization and dependencies
- [Large Scale Architecture](./LARGE_SCALE_ARCHITECTURE.md) - Scalability considerations

### 🔄 Workflow Documentation

- [Execution Flow](./diagrams/workflows/execution-flow.svg) - How workflows are processed
- [Node Types](./nodes/) - Available workflow nodes and integrations
- [Workflow Editor Features](./WORKFLOW_EDITOR_FEATURES_ANALYSIS.md) - Editor capabilities analysis

### 🔌 API Documentation

- [SDK Integration](./diagrams/api/sdk-integration.svg) - SDK usage patterns
- [API Reference](./api/) - Complete TypeDoc API documentation

## 🚀 Quick Start Guides

### For Developers

1. **[Getting Started](../README.md#quick-start)** - Set up your development environment
2. **[Building Integrations](./development/integrations.md)** - Create custom workflow nodes
3. **[Contributing](../CONTRIBUTING.md)** - How to contribute to the project

### For Users

1. **[CLI Usage](./cli/getting-started.md)** - Command-line interface guide
2. **[SDK Usage](./sdk/getting-started.md)** - Programmatic access with TypeScript
3. **[Web Interface](./web/user-guide.md)** - Using the visual workflow editor

## 📦 Package Documentation

### Core Packages

- **[@reporunner/core](./api/core/)** - Shared types, utilities, and validation schemas
- **[@reporunner/backend](./api/backend/)** - Express.js API server with MongoDB
- **[@reporunner/frontend](./api/frontend/)** - React-based workflow editor
- **[@reporunner/cli](./api/cli/)** - Command-line interface tools
- **[@reporunner/sdk](./api/sdk/)** - TypeScript SDK for programmatic access

### Integration Packages

- **[@reporunner/nodes-base](./api/nodes-base/)** - Core workflow nodes
- **[@reporunner/workflow-engine](./api/workflow-engine/)** - Execution engine

## 🛠️ Development Tools

### Code Quality

- **Renovate** - Automated dependency updates ([Config](../renovate.json))
- **Codecov** - Code coverage tracking ([Config](../codecov.yml))
- **TypeDoc** - API documentation generation ([Config](../typedoc.json))
- **PlantUML** - Architecture diagrams ([Source](./diagrams/))

### Build & Deploy

- **Turborepo** - Monorepo build orchestration
- **pnpm Workspaces** - Package management
- **GitHub Actions** - CI/CD pipelines
- **Husky** - Git hooks for quality gates

## 🔧 Configuration Files

| File                                            | Purpose                      |
| ----------------------------------------------- | ---------------------------- |
| [`renovate.json`](../renovate.json)             | Dependency update automation |
| [`codecov.yml`](../codecov.yml)                 | Code coverage configuration  |
| [`typedoc.json`](../typedoc.json)               | API documentation settings   |
| [`turbo.json`](../turbo.json)                   | Monorepo build configuration |
| [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) | Workspace definition         |

## 📊 Project Metrics

[![Coverage](https://codecov.io/gh/your-org/reporunner/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/reporunner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Pull request process
- Issue reporting
- Feature requests

## 📞 Support

- 📖 [Documentation](https://docs.reporunner.dev)
- 💬 [Discord Community](https://discord.gg/reporunner)
- 🐛 [GitHub Issues](https://github.com/your-org/reporunner/issues)
- 📧 [Email Support](mailto:support@reporunner.dev)

---

_Last updated: $(date)_
_Generated with ❤️ by the Reporunner team_

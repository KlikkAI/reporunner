# 🚀 Reporunner

> Open-source workflow automation platform with native AI capabilities - The n8n alternative

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)

Reporunner is a powerful, open-source workflow automation platform that combines visual workflow building with native AI capabilities. Built from the ground up with TypeScript, React, and modern web technologies.

## ✨ Features

- 🎨 **Visual Workflow Editor** - Drag & drop interface powered by React Flow
- 🤖 **Native AI Integration** - Built-in support for OpenAI, Anthropic, Google AI
- 🔧 **400+ Integrations** - Gmail, databases, webhooks, and more
- 🏢 **Enterprise Ready** - Self-hosted with advanced security features
- 🚀 **High Performance** - Built with modern stack for speed and reliability
- 🌐 **Open Source** - MIT licensed with active community

## 🎯 Why Reporunner?

| Feature | n8n | Reporunner |
|---------|-----|------------|
| **Modern Stack** | Vue 2 | React 19 + TypeScript 5.3 |
| **AI Native** | Third-party | Built-in AI capabilities |
| **Performance** | Good | Optimized for scale |
| **Type Safety** | Partial | 100% TypeScript |
| **Monorepo** | Yes | Yes (Turborepo + pnpm) |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB 4.4+
- Redis 6+ (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/reporunner.git
cd reporunner

# Install dependencies and setup environment
pnpm setup

# Configure environment variables
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Edit the .env files with your configuration
# Add your API keys, database URLs, etc.

# Start the development environment
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
reporunner/
├── packages/
│   ├── core/                 # Shared types, utilities, schemas
│   ├── backend/              # Express.js API server
│   ├── frontend/             # React workflow editor
│   ├── nodes-base/           # Core workflow nodes
│   └── workflow-engine/      # Execution engine
├── apps/
│   ├── web/                  # Main web application
│   └── docs/                 # Documentation site
├── tools/
│   ├── eslint-config/        # Shared linting configuration
│   └── build-tools/          # Build utilities
└── docs/                     # Project documentation
```

## 🛠 Development

### Available Scripts

```bash
# Development
pnpm dev                      # Start all services in development mode
pnpm build                    # Build all packages
pnpm test                     # Run all tests

# Package-specific development
pnpm build:backend           # Build only backend
pnpm build:frontend          # Build only frontend
pnpm dev --filter=@reporunner/backend    # Start only backend

# Quality & Maintenance
pnpm lint                    # Lint all packages
pnpm type-check             # TypeScript type checking
pnpm clean                  # Clean build outputs
```

### Environment Variables

#### Root (.env)
```env
DATABASE_URL=mongodb://localhost:27017/reporunner
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here_minimum_32_chars
ENCRYPTION_KEY=your_encryption_key_32_chars
```

#### Backend (packages/backend/.env)
```env
PORT=3001
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

#### Frontend (packages/frontend/.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_ENABLE_AI_FEATURES=true
```

## 🏗 Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Ant Design
- **Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO
- **Workflow Engine**: Custom execution engine with queue-based processing
- **AI Integration**: OpenAI, Anthropic, Google AI native support
- **Build System**: Turborepo, pnpm workspaces
- **Testing**: Vitest, Testing Library

### Core Packages

- **@reporunner/core** - Shared types, utilities, and validation schemas
- **@reporunner/backend** - Express.js API server with MongoDB
- **@reporunner/frontend** - React-based workflow editor
- **@reporunner/workflow-engine** - Workflow execution engine

## 🔧 Integration Development

### Creating a New Integration

1. **Define the node type**:
```typescript
// packages/nodes-base/src/my-integration/node.ts
export const myIntegrationNode: NodeType = {
  id: 'my-integration',
  name: 'My Integration',
  type: 'action',
  properties: [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'credentials',
      required: true
    }
  ]
};
```

2. **Implement the execution logic**:
```typescript
// packages/nodes-base/src/my-integration/actions.ts
export async function execute(node: WorkflowNode, context: ExecutionContext) {
  // Your integration logic here
}
```

3. **Register the integration**:
```typescript
// packages/nodes-base/src/index.ts
import { myIntegrationNode } from './my-integration';

export const integrations = [
  myIntegrationNode,
  // ... other integrations
];
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build production images
docker build --target backend -t reporunner-backend .
docker build --target frontend -t reporunner-frontend .

# Run with Docker Compose
docker-compose up -d
```

### Selective Deployment

```bash
# Deploy only backend (faster for API changes)
pnpm deploy:backend

# Deploy only frontend (faster for UI changes)
pnpm deploy:frontend

# Deploy everything
pnpm deploy:all
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Setup

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `pnpm install`
4. Make your changes
5. Run tests: `pnpm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [Development Guide](docs/development.md)
- [API Documentation](docs/api/)
- [Integration Development](docs/integrations.md)
- [Deployment Guide](docs/deployment.md)

## 🔒 Security

Please report security vulnerabilities to [security@reporunner.dev](mailto:security@reporunner.dev). See our [Security Policy](SECURITY.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Inspired by [n8n](https://n8n.io/) for workflow automation concepts
- Built with amazing open-source technologies
- Thanks to all our contributors

## 📞 Support

- 📖 [Documentation](https://docs.reporunner.dev)
- 💬 [Discord Community](https://discord.gg/reporunner)
- 🐛 [GitHub Issues](https://github.com/your-org/reporunner/issues)
- 📧 [Email Support](mailto:support@reporunner.dev)

---

<div align="center">
  <strong>⭐ Star us on GitHub if you find Reporunner useful!</strong>
</div>

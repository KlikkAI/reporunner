# Contributing to KlikkFlow

Thank you for your interest in contributing to KlikkFlow! This guide will help you get started.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/klikkflow.git
   cd klikkflow
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Set up environment**:
   ```bash
   pnpm setup
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Style

- **TypeScript**: We use strict TypeScript with comprehensive type checking
- **ESLint + Prettier**: All code must pass linting and formatting
- **Conventional Commits**: Use conventional commit messages

### Testing

- Write tests for new features using Vitest
- Ensure all tests pass: `pnpm test`
- Maintain test coverage above 80%

### Pull Request Process

1. **Create descriptive PR title**: Use conventional commit format
2. **Fill out PR template**: Provide context and testing instructions
3. **Link issues**: Reference related issues with `Fixes #123`
4. **Request review**: Tag relevant maintainers
5. **Address feedback**: Respond to review comments promptly

## 🏗 Project Structure

### Monorepo Organization

```
packages/
├── core/           # Shared types and utilities
├── backend/        # Express.js API server
├── frontend/       # React workflow editor
├── nodes-base/     # Core workflow nodes
└── workflow-engine/ # Execution engine
```

### Development Commands

```bash
# Start everything in development
pnpm dev

# Work on specific packages
pnpm dev --filter=@klikkflow/frontend
pnpm build --filter=@klikkflow/backend

# Quality checks
pnpm lint
pnpm type-check
pnpm test
```

## 🔧 Adding New Integrations

### 1. Create Node Definition

```typescript
// packages/nodes-base/src/integrations/my-service/node.ts
export const myServiceNode: NodeType = {
  id: 'my-service',
  name: 'My Service',
  description: 'Integration with My Service API',
  type: 'action',
  icon: 'my-service-icon.svg',
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'select',
      options: [
        { name: 'Get Data', value: 'getData' },
        { name: 'Send Data', value: 'sendData' }
      ],
      default: 'getData'
    }
  ]
};
```

### 2. Implement Actions

```typescript
// packages/nodes-base/src/integrations/my-service/actions.ts
export async function execute(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const { operation } = node.data;

  switch (operation) {
    case 'getData':
      return await getData(context);
    case 'sendData':
      return await sendData(context);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
```

### 3. Add Credentials (if needed)

```typescript
// packages/nodes-base/src/integrations/my-service/credentials.ts
export const myServiceCredentials: CredentialType = {
  id: 'myServiceApi',
  name: 'My Service API',
  properties: [
    {
      name: 'apiKey',
      displayName: 'API Key',
      type: 'password',
      required: true
    }
  ]
};
```

### 4. Register Integration

```typescript
// packages/nodes-base/src/index.ts
import { myServiceNode } from './integrations/my-service';

export const integrations = [
  myServiceNode,
  // ... other integrations
];
```

## 🐛 Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, browser)
- **Screenshots or videos** if applicable

## 💡 Feature Requests

For feature requests:

- **Search existing issues** first
- **Describe the use case** clearly
- **Explain the proposed solution**
- **Consider implementation complexity**

## 🔒 Security

- **Never commit secrets** (API keys, passwords, etc.)
- **Use environment variables** for configuration
- **Follow OWASP guidelines** for web security
- **Report vulnerabilities** privately to security@klikkflow.dev

## 📝 Documentation

- **Update README** for new features
- **Add JSDoc comments** for public APIs
- **Include examples** in documentation
- **Keep documentation current** with code changes

## 🎯 Coding Standards

### TypeScript

```typescript
// ✅ Good: Strict typing
interface WorkflowNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
}

// ❌ Bad: Any types
const node: any = getNode();
```

### React Components

```tsx
// ✅ Good: Functional components with proper typing
interface Props {
  workflow: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
}

export const WorkflowEditor: FC<Props> = ({ workflow, onSave }) => {
  // Component implementation
};
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  logger.error('API call failed', { error: error.message });
  return { success: false, error: error.message };
}
```

## 🤝 Community

- **Be respectful** and inclusive
- **Help others** learn and contribute
- **Share knowledge** through issues and discussions
- **Follow code of conduct** at all times

## 📞 Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Real-time chat with the community
- **Documentation**: Check docs first for common questions
- **Maintainers**: Tag maintainers for complex technical issues

## 🎉 Recognition

Contributors are recognized in:

- **README acknowledgments**
- **Release notes** for significant contributions
- **Contributor badge** in GitHub
- **Annual contributor showcase**

Thank you for contributing to KlikkFlow! 🚀
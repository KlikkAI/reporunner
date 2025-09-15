# @reporunner/core

Core types, utilities, and shared code for the Reporunner workflow automation platform.

## Overview

This package provides the foundational building blocks used across all Reporunner packages:

- **TypeScript Types** - Comprehensive type definitions for workflows, nodes, executions, and API responses
- **Validation Schemas** - Zod schemas for runtime validation and type safety
- **Utility Functions** - Common helper functions for workflow processing
- **Constants** - Shared constants and enums used throughout the platform

## Installation

```bash
npm install @reporunner/core
# or
pnpm add @reporunner/core
```

## Usage

### Types

```typescript
import {
  WorkflowDefinition,
  NodeType,
  ExecutionResult,
} from "@reporunner/core";

const workflow: WorkflowDefinition = {
  id: "example-workflow",
  name: "My Workflow",
  nodes: [],
  edges: [],
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Validation

```typescript
import { WorkflowDefinitionSchema } from "@reporunner/core";

try {
  const validWorkflow = WorkflowDefinitionSchema.parse(workflowData);
} catch (error) {
  console.error("Validation failed:", error.errors);
}
```

### Utilities

```typescript
import { generateId, validateEmail, formatDate } from "@reporunner/core";

const id = generateId(); // Generate unique ID
const isValid = validateEmail("user@example.com"); // Validate email
const formatted = formatDate(new Date()); // Format date
```

## API Reference

See the [full API documentation](../../docs/api/core/) for detailed information about all exports.

## Package Structure

```
src/
├── types/          # TypeScript type definitions
├── schemas/        # Zod validation schemas
├── utils/          # Utility functions
├── constants/      # Shared constants
└── index.ts        # Main exports
```

## Contributing

This package follows strict TypeScript standards and comprehensive testing. All new functionality should include:

- TypeScript type definitions
- Zod validation schemas where applicable
- Unit tests with Vitest
- JSDoc documentation

See the [Contributing Guide](../../CONTRIBUTING.md) for more details.

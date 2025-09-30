# @reporunner/types

**Centralized TypeScript type definitions for the Reporunner platform.**

This package serves as the single source of truth for all TypeScript types across the entire Reporunner monorepo. By consolidating type definitions here, we eliminate duplication, ensure consistency, and make the codebase easier to maintain.

## 📦 Installation

```bash
pnpm add @reporunner/types
```

## 🎯 Purpose

- **Single Source of Truth**: All type definitions in one place
- **Zero Duplication**: Eliminate redundant type definitions across packages
- **Type Safety**: Consistent types across frontend, backend, and all packages
- **Better DX**: Auto-completion and type checking in all packages
- **Version Control**: Track type changes in one location

## 📚 Type Categories

### Common Types
Base types used across all domains:
- `ID`, `Timestamp`, `JSONValue`
- `Result<T, E>`, `PaginatedResult<T>`
- `BaseEntity`, `AuditFields`
- `APIResponse<T>`

```typescript
import type { ID, PaginatedResult, APIResponse } from '@reporunner/types';

interface MyData {
  id: ID;
  name: string;
}

const response: APIResponse<PaginatedResult<MyData>> = {
  success: true,
  data: {
    data: [...],
    pagination: { page: 1, pageSize: 10, total: 100, totalPages: 10 }
  }
};
```

### Workflow Types
Workflow definitions and structure:
- `IWorkflow`, `INode`, `IEdge`
- `IWorkflowSettings`, `IWorkflowStats`
- `NodeSchema`, `EdgeSchema`, `WorkflowSchema` (Zod)

```typescript
import type { IWorkflow, INode, IEdge } from '@reporunner/types';

const workflow: IWorkflow = {
  id: 'wf-123',
  name: 'My Workflow',
  nodes: [...],
  edges: [...],
  active: true,
  status: 'active',
  ownerId: 'user-456',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};
```

### Execution Types
Workflow execution and results:
- `IExecution`, `IExecutionData`
- `ExecutionStatus`, `IExecutionError`
- `INodeExecutionData`, `IExecutionProgress`

```typescript
import type {
  IExecution,
  ExecutionStatus,
  isExecutionTerminal
} from '@reporunner/types';

const execution: IExecution = {
  id: 'exec-789',
  workflowId: 'wf-123',
  status: 'running',
  mode: 'manual',
  startedAt: '2025-01-01T00:00:00Z',
  finished: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

if (isExecutionTerminal(execution.status)) {
  console.log('Execution finished');
}
```

### Node Types
Node definitions and integrations:
- `INodeType`, `IIntegration`
- `INodeProperty`, `ICredentialRequirement`
- `PropertyType`, `NodeCategory`

```typescript
import type { INodeType, PropertyType } from '@reporunner/types';

const nodeType: INodeType = {
  id: 'node-email-send',
  name: 'emailSend',
  displayName: 'Send Email',
  description: 'Send an email via SMTP',
  category: 'communication',
  version: 1,
  properties: [
    {
      name: 'to',
      displayName: 'To',
      type: 'string' as PropertyType,
      required: true,
      description: 'Email recipient'
    }
  ]
};
```

### Credential Types
Authentication and API credentials:
- `ICredential`, `ICredentialData`
- `CredentialType`, `IOAuthConfig`
- `ICredentialTestResult`

```typescript
import type { ICredential, CredentialType } from '@reporunner/types';

const credential: ICredential = {
  id: 'cred-001',
  name: 'My Gmail Account',
  type: 'oauth2' as CredentialType,
  credentialType: 'gmailOAuth2Api',
  data: {
    accessToken: 'xxx',
    refreshToken: 'yyy',
    expiresAt: '2025-01-02T00:00:00Z'
  },
  ownerId: 'user-456',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};
```

### User Types
Users, organizations, and authentication:
- `IUser`, `IUserProfile`
- `IOrganization`, `IOrganizationMember`
- `UserRole`, `AuthProvider`
- `IAuthToken`, `ILoginCredentials`

```typescript
import type { IUser, UserRole, IAuthToken } from '@reporunner/types';

const user: IUser = {
  id: 'user-456',
  email: 'user@example.com',
  role: 'member' as UserRole,
  status: 'active',
  authProvider: 'local',
  emailVerified: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};

const token: IAuthToken = {
  accessToken: 'jwt-token-here',
  tokenType: 'Bearer',
  expiresIn: 3600,
  expiresAt: '2025-01-01T01:00:00Z'
};
```

### Integration Types
Third-party service integrations:
- `IIntegration`, `IIntegrationListing`
- `IntegrationCategory`, `IntegrationStatus`
- `IUserIntegrationConnection`

```typescript
import type {
  IIntegration,
  IntegrationCategory
} from '@reporunner/types';

const integration: IIntegration = {
  id: 'int-gmail',
  name: 'gmail',
  displayName: 'Gmail',
  description: 'Google Gmail integration',
  category: 'communication' as IntegrationCategory,
  status: 'available',
  version: '1.0.0',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z'
};
```

## 🛡️ Type Guards

Built-in runtime type checking utilities:

```typescript
import {
  isWorkflow,
  isExecution,
  isNode,
  isExecutionTerminal,
  isExecutionActive
} from '@reporunner/types';

const data: unknown = getDataFromAPI();

if (isWorkflow(data)) {
  // TypeScript now knows data is IWorkflow
  console.log(data.name);
}

if (isExecution(data)) {
  if (isExecutionTerminal(data.status)) {
    console.log('Execution completed');
  }

  if (isExecutionActive(data.status)) {
    console.log('Execution still running');
  }
}
```

## 📋 Zod Schemas

Zod schemas are included for runtime validation:

```typescript
import { WorkflowSchema, NodeSchema, EdgeSchema, z } from '@reporunner/types';

// Validate workflow data
const workflowData = {
  id: 'wf-123',
  name: 'My Workflow',
  nodes: [...],
  edges: [...],
  active: true
};

try {
  const validatedWorkflow = WorkflowSchema.parse(workflowData);
  console.log('Valid workflow:', validatedWorkflow);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:', error.errors);
  }
}

// Use Zod types
type Workflow = z.infer<typeof WorkflowSchema>;
type Node = z.infer<typeof NodeSchema>;
type Edge = z.infer<typeof EdgeSchema>;
```

## 🚀 Migration from Legacy Types

### Before (Duplicated Types)
```typescript
// packages/frontend/src/types/workflow.ts
interface Workflow {
  id: string;
  name: string;
  // ... duplicate definition
}

// packages/backend/src/types/workflow.ts
interface Workflow {
  id: string;
  name: string;
  // ... another duplicate definition (might differ!)
}
```

### After (Centralized Types)
```typescript
// Both frontend and backend
import type { IWorkflow } from '@reporunner/types';

// Use the same type everywhere
const workflow: IWorkflow = { ... };
```

## 📖 Best Practices

### 1. Always Import from @reporunner/types
```typescript
// ✅ Good
import type { IWorkflow, IExecution } from '@reporunner/types';

// ❌ Bad - Don't create duplicate types
interface Workflow { ... }  // This creates duplication!
```

### 2. Use Type Imports
```typescript
// ✅ Good - Use 'type' keyword for type-only imports
import type { IWorkflow } from '@reporunner/types';

// ⚠️ Acceptable but less explicit
import { IWorkflow } from '@reporunner/types';
```

### 3. Extend Types When Needed
```typescript
// ✅ Good - Extend centralized types for specific use cases
import type { IWorkflow } from '@reporunner/types';

interface WorkflowWithStats extends IWorkflow {
  executionCount: number;
  lastExecutedAt: string;
}
```

### 4. Use Type Guards for Unknown Data
```typescript
// ✅ Good - Validate external data
import { isWorkflow } from '@reporunner/types';

const data = await fetchFromAPI();
if (isWorkflow(data)) {
  // Safe to use as IWorkflow
  processWorkflow(data);
}
```

## 🔄 Updating Types

When you need to add or modify types:

1. **Update this package** - All type changes happen here
2. **Run type-check** - Ensure no breaking changes
3. **Update dependent packages** - Fix any type errors
4. **Document changes** - Add comments for complex types

```bash
# Check for type errors
pnpm --filter @reporunner/types type-check

# Build the package
pnpm --filter @reporunner/types build

# Check all packages for type errors
turbo run type-check
```

## 📦 Package Structure

```
@reporunner/types/
├── src/
│   ├── common/          # Base types
│   ├── workflow/        # Workflow types
│   ├── execution/       # Execution types
│   ├── node/            # Node types
│   ├── credential/      # Credential types
│   ├── user/            # User types
│   ├── integration/     # Integration types
│   └── index.ts         # Main export with type guards
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

When adding new types:

1. Place them in the appropriate category directory
2. Export them from that directory's `index.ts`
3. Re-export from main `src/index.ts`
4. Add usage examples to this README
5. Consider adding type guards if needed

## 📄 License

MIT License - See root LICENSE file

---

**Made with ❤️ by the Reporunner team**
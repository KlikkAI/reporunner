# Foundation Packages Migration Guide

**Migrating to @reporunner/types and @reporunner/core**

This guide provides step-by-step instructions for migrating your packages to use the foundational packages (`@reporunner/types` and `@reporunner/core`) instead of duplicated implementations.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Type Migration](#phase-1-type-migration)
4. [Phase 2: Utility Migration](#phase-2-utility-migration)
5. [Phase 3: Validation](#phase-3-validation)
6. [Troubleshooting](#troubleshooting)
7. [Rollback Strategy](#rollback-strategy)

---

## Overview

### Why Migrate?

- **Eliminate 15-20% code duplication** across packages
- **Single source of truth** for types and utilities
- **Consistent behavior** across all packages
- **Easier maintenance** - update once, benefit everywhere
- **Better type safety** - no version drift between packages

### What Changes?

**@reporunner/types:**
- All TypeScript type definitions
- Zod schemas for validation
- Type guards for runtime checking

**@reporunner/core:**
- Error handling utilities
- Logger implementation
- Validation utilities
- Base classes and interfaces

---

## Prerequisites

### 1. Install Foundational Packages

Add to your package's dependencies:

```bash
# In your package directory
cd packages/@reporunner/your-package

# Add dependencies
pnpm add @reporunner/types @reporunner/core
```

Or add to `package.json`:

```json
{
  "dependencies": {
    "@reporunner/types": "workspace:*",
    "@reporunner/core": "workspace:*"
  }
}
```

Then run:
```bash
pnpm install
```

### 2. Check Current Type/Utility Usage

Search for duplicated code in your package:

```bash
# Find custom type definitions
grep -r "interface.*Workflow\|interface.*Execution\|type.*Status" src/

# Find custom error handlers
grep -r "class.*ErrorHandler\|function.*handleError" src/

# Find custom loggers
grep -r "class.*Logger\|console\\.log\|console\\.error" src/

# Find custom validators
grep -r "validate.*Email\|validate.*URL\|\.test\\(" src/
```

---

## Phase 1: Type Migration

**Goal:** Replace all custom type definitions with `@reporunner/types`

**Risk Level:** 🟢 LOW (Type-only changes, easy to rollback)

**Time Estimate:** 2-4 hours per package

### Step 1.1: Identify Type Duplicates

Look for these common duplicates:

```typescript
// ❌ Custom types to remove
interface Workflow { ... }
interface IWorkflow { ... }
interface WorkflowData { ... }

interface Execution { ... }
interface ExecutionStatus { ... }

interface Node { ... }
interface Edge { ... }

interface Credential { ... }
interface User { ... }
```

### Step 1.2: Replace with Centralized Types

```typescript
// ✅ Import from @reporunner/types
import type {
  IWorkflow,
  IExecution,
  ExecutionStatus,
  INode,
  IEdge,
  ICredential,
  IUser
} from '@reporunner/types';
```

### Step 1.3: Update Type References

**Before:**
```typescript
// src/types/workflow.ts
export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

// src/services/WorkflowService.ts
import { Workflow } from '../types/workflow';

class WorkflowService {
  async getWorkflow(id: string): Promise<Workflow> {
    // ...
  }
}
```

**After:**
```typescript
// Remove src/types/workflow.ts entirely

// src/services/WorkflowService.ts
import type { IWorkflow } from '@reporunner/types';

class WorkflowService {
  async getWorkflow(id: string): Promise<IWorkflow> {
    // ...
  }
}
```

### Step 1.4: Handle Type Extensions

If you have package-specific extensions:

```typescript
// ✅ Extend centralized types
import type { IWorkflow } from '@reporunner/types';

// Add package-specific fields
interface WorkflowWithCache extends IWorkflow {
  cacheKey: string;
  cachedAt: string;
}

// Or use intersection types
type EnrichedWorkflow = IWorkflow & {
  executionCount: number;
  lastExecutedAt: string;
};
```

### Step 1.5: Run Type Check

```bash
# Check for type errors
pnpm type-check

# If errors occur, fix them before proceeding
```

### Step 1.6: Remove Old Type Files

After confirming everything works:

```bash
# Remove old type definition files
rm src/types/workflow.ts
rm src/types/execution.ts
rm src/types/user.ts
# etc...
```

### Migration Checklist - Types

- [ ] Install `@reporunner/types` dependency
- [ ] Search for duplicate type definitions
- [ ] Replace imports with `@reporunner/types`
- [ ] Run `pnpm type-check` successfully
- [ ] Update all test files
- [ ] Remove old type definition files
- [ ] Update package documentation

---

## Phase 2: Utility Migration

**Goal:** Replace custom utilities with `@reporunner/core`

**Risk Level:** 🟡 MEDIUM (Runtime code changes, needs testing)

**Time Estimate:** 4-6 hours per package

### 2A: Error Handler Migration

#### Step 2A.1: Find Custom Error Handling

Search for:
```bash
grep -r "try.*catch\|handleError\|ErrorHandler" src/
```

#### Step 2A.2: Replace Custom Error Handlers

**Before (Custom Implementation):**
```typescript
// src/utils/errorHandler.ts
export class CustomErrorHandler {
  async retry(fn: Function, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await sleep(Math.pow(2, i) * 1000);
      }
    }
  }
}

// Usage
import { CustomErrorHandler } from './utils/errorHandler';
const handler = new CustomErrorHandler();
const result = await handler.retry(() => fetchData());
```

**After (@reporunner/core):**
```typescript
// Remove src/utils/errorHandler.ts

// Usage
import { ErrorHandler } from '@reporunner/core';

const errorHandler = new ErrorHandler({ maxRetries: 3 });
const result = await errorHandler.handleAsync(
  () => fetchData(),
  'Fetching data'
);
```

#### Step 2A.3: Update All Error Handling Callsites

Find all usages:
```bash
grep -r "CustomErrorHandler\|errorHandler\\.retry" src/
```

Replace with `@reporunner/core` ErrorHandler.

### 2B: Logger Migration

#### Step 2B.1: Find Logging Code

Search for:
```bash
grep -r "console\\.log\|console\\.error\|Logger" src/
```

#### Step 2B.2: Replace with Centralized Logger

**Before (Console.log):**
```typescript
// Scattered throughout code
console.log(`[${new Date().toISOString()}] User ${userId} logged in`);
console.error('Error fetching workflow:', error);
console.warn('Rate limit approaching');
```

**After (@reporunner/core):**
```typescript
// src/services/logger.ts
import { Logger } from '@reporunner/core';

export const logger = new Logger('YourPackage', {
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Usage throughout package
import { logger } from './services/logger';

logger.info('User logged in', { userId });
logger.error('Error fetching workflow', error);
logger.warn('Rate limit approaching', { remaining: 10 });
```

#### Step 2B.3: Create Package Logger Instance

Create a single logger instance for your package:

```typescript
// src/services/logger.ts
import { Logger } from '@reporunner/core';

export const logger = new Logger('YourPackageName');

// Export child loggers for sub-contexts
export const dbLogger = logger.child('Database');
export const apiLogger = logger.child('API');
```

#### Step 2B.4: Replace Console Statements

**Search and replace patterns:**

```typescript
// Replace console.log
console.log(message) → logger.info(message)

// Replace console.error
console.error(message, error) → logger.error(message, error)

// Replace console.warn
console.warn(message) → logger.warn(message)

// Replace console.debug
console.debug(message) → logger.debug(message)
```

### 2C: Validator Migration

#### Step 2C.1: Find Custom Validation

Search for:
```bash
grep -r "validate.*Email\|validate.*URL\|\.test\\(\|if.*@\|if.*http" src/
```

#### Step 2C.2: Replace with Centralized Validators

**Before (Custom Validation):**
```typescript
// Scattered validation logic
if (!email || !email.includes('@') || !email.includes('.')) {
  throw new Error('Invalid email');
}

if (typeof age !== 'number' || age < 0 || age > 120) {
  throw new Error('Invalid age');
}

const urlPattern = /^https?:\\/\\//;
if (!urlPattern.test(url)) {
  throw new Error('Invalid URL');
}
```

**After (@reporunner/core):**
```typescript
// src/validators/common.ts
import { Validator } from '@reporunner/core';

export const validators = {
  email: new Validator<string>()
    .required('Email is required')
    .email('Invalid email format'),

  age: new Validator<number>()
    .required('Age is required')
    .number('Age must be a number')
    .min(0, 'Age must be positive')
    .max(120, 'Age must be realistic'),

  url: new Validator<string>()
    .required('URL is required')
    .url('Invalid URL format')
};

// Usage
import { validators } from './validators/common';

await validators.email.validate(email, 'email');
await validators.age.validate(age, 'age');
await validators.url.validate(url, 'webhookUrl');
```

#### Step 2C.3: Create Reusable Validators

Group common validators:

```typescript
// src/validators/user.ts
import { Validator, SchemaValidator } from '@reporunner/core';

export const userValidators = {
  email: new Validator<string>().required().email(),

  username: new Validator<string>()
    .required()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),

  password: new Validator<string>()
    .required()
    .minLength(8)
    .custom(
      (value) => /[A-Z]/.test(value),
      'Must contain uppercase letter'
    )
    .custom(
      (value) => /[0-9]/.test(value),
      'Must contain number'
    )
};

export const userSchema = new SchemaValidator({
  email: {
    type: 'string',
    required: true,
    validator: userValidators.email
  },
  username: {
    type: 'string',
    required: true,
    validator: userValidators.username
  },
  password: {
    type: 'string',
    required: true,
    validator: userValidators.password
  }
});
```

### Migration Checklist - Utilities

- [ ] Install `@reporunner/core` dependency
- [ ] Migrate error handling
  - [ ] Replace custom ErrorHandler
  - [ ] Update all try/catch blocks
  - [ ] Test retry logic
- [ ] Migrate logging
  - [ ] Create package logger instance
  - [ ] Replace all console.log/error/warn
  - [ ] Test log output
- [ ] Migrate validation
  - [ ] Create common validators
  - [ ] Replace scattered validation logic
  - [ ] Test validation errors
- [ ] Remove old utility files
- [ ] Run full test suite
- [ ] Update package documentation

---

## Phase 3: Validation

**Goal:** Ensure everything works correctly

### Step 3.1: Run Type Checking

```bash
# Check your package
pnpm type-check

# Check all packages
turbo run type-check
```

### Step 3.2: Run Tests

```bash
# Run your package tests
pnpm test

# Run all tests
turbo run test
```

### Step 3.3: Run Linting

```bash
# Lint your package
pnpm lint

# Lint all packages
turbo run lint
```

### Step 3.4: Build the Package

```bash
# Build your package
pnpm build

# Build all packages
turbo run build
```

### Step 3.5: Manual Testing

Test key scenarios:
- Create/update/delete operations
- Error scenarios (retry logic)
- Validation (valid/invalid inputs)
- Logging output

---

## Troubleshooting

### Issue: Type Errors After Migration

**Problem:**
```
Error: Type 'Workflow' is not assignable to type 'IWorkflow'
```

**Solution:**
Check if you're mixing old and new types:
```typescript
// ❌ Mixing types
import { Workflow } from './old-types';
import type { IWorkflow } from '@reporunner/types';

// ✅ Use only new types
import type { IWorkflow } from '@reporunner/types';
```

### Issue: Validator Errors Not Showing

**Problem:**
Validation passes when it should fail.

**Solution:**
Ensure you're awaiting async validation:
```typescript
// ❌ Not awaiting
validator.validate(value); // Returns Promise!

// ✅ Await the validation
await validator.validate(value);
```

### Issue: Logger Not Showing Debug Messages

**Problem:**
Debug logs not appearing in console.

**Solution:**
Check log level configuration:
```typescript
const logger = new Logger('MyService', {
  minLevel: 'debug' // Change from 'info' to 'debug'
});
```

### Issue: Circular Dependencies

**Problem:**
```
Error: Circular dependency detected
```

**Solution:**
Use type-only imports:
```typescript
// ✅ Type-only import
import type { IWorkflow } from '@reporunner/types';

// Not
import { IWorkflow } from '@reporunner/types';
```

---

## Rollback Strategy

If you need to rollback during migration:

### Rollback Types (Low Risk)

```bash
# Revert the files
git checkout HEAD -- src/

# Reinstall old dependencies if needed
pnpm install
```

### Rollback Utilities (Medium Risk)

1. Keep old utility files temporarily:
```typescript
// Keep old file as *.old.ts
mv src/utils/errorHandler.ts src/utils/errorHandler.old.ts
```

2. If issues occur:
```bash
# Restore old file
mv src/utils/errorHandler.old.ts src/utils/errorHandler.ts

# Revert imports
git checkout HEAD -- src/services/
```

3. After successful migration (1 week later):
```bash
# Remove old files
rm src/**/*.old.ts
```

---

## Migration Timeline

**Recommended approach:** Migrate one package at a time

### Week 1: Frontend Package
- Day 1-2: Type migration
- Day 3-4: Utility migration
- Day 5: Testing and validation

### Week 2: Backend Package
- Day 1-2: Type migration
- Day 3-4: Utility migration
- Day 5: Testing and validation

### Week 3: Scoped Packages
- Migrate 2-3 small packages per day
- Focus on packages with most duplication

### Week 4: Cleanup and Documentation
- Remove all old utility files
- Update package documentation
- Create usage examples

---

## Success Metrics

Track your migration progress:

- [ ] **Type Migration**: All packages use `@reporunner/types`
- [ ] **Utility Migration**: All packages use `@reporunner/core`
- [ ] **Code Reduction**: 15-20% reduction in codebase size
- [ ] **Zero Type Drift**: Same types used everywhere
- [ ] **Consistent Logging**: Structured logs across all packages
- [ ] **Unified Error Handling**: Same retry logic everywhere
- [ ] **All Tests Pass**: No regressions introduced

---

## Need Help?

- Check package READMEs:
  - `packages/@reporunner/types/README.md`
  - `packages/@reporunner/core/README.md`
- Review code examples in the READMEs
- Ask in team chat

---

**Remember:** Migrate incrementally, test thoroughly, and celebrate the reduced maintenance burden! 🎉
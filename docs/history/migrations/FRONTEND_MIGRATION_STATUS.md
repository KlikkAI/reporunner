# Frontend Package Migration Status

**Package**: `@reporunner/frontend`
**Started**: 2025-09-30
**Status**: 🟡 In Progress

## ✅ Completed Steps

### 1. Dependencies Installed
- ✅ Added `@reporunner/types`: workspace:*
- ✅ Added `@reporunner/core`: workspace:*
- ✅ Ran `pnpm install` successfully

## 📊 Migration Analysis

### Type Definitions Found

**Core Type Files** (`src/core/types/`):
```
✓ authentication.ts     - 9.8 KB - User/auth types
✓ collaboration.ts      - 13.7 KB - Real-time collab types
✓ containerNodes.ts     - 5.8 KB - Container node types
✓ credentials.ts        - 8.9 KB - Credential types
✓ debugging.ts          - 5.7 KB - Debug types
✓ edge.ts               - 5.2 KB - Edge types
✓ node.ts               - 99 B - Node types
✓ nodeTypes.ts          - 1.6 KB - Node type definitions
✓ security.ts           - 15.4 KB - Security types
✓ workflow.ts           - 3.1 KB - Workflow types
```

**Total Custom Type Files**: ~73 KB of type definitions

**Files Using These Types**: 78+ files across:
- Services (15+ files)
- Stores (5+ files)
- Components (50+ files)
- Hooks (5+ files)
- Node extensions (10+ files)

### Duplication Assessment

| Category | Custom Types | @reporunner/types Equivalent | Migration Priority |
|----------|--------------|------------------------------|-------------------|
| Workflow | WorkflowConnection, WorkflowNodeData | IWorkflow, INode | 🔴 HIGH |
| Execution | (Various execution types) | IExecution, ExecutionStatus | 🔴 HIGH |
| Credentials | (Various credential types) | ICredential, ICredentialData | 🟡 MEDIUM |
| User/Auth | (Various auth types) | IUser, IAuthToken | 🟡 MEDIUM |
| Node Types | (Various node types) | INodeType, INodeProperty | 🟢 LOW (specialized) |
| Frontend-Specific | WorkflowNodeData callbacks | N/A | ⚪ KEEP (frontend-only) |

### Custom Utilities Found

**Error Handling**:
```bash
# Search results pending
```

**Logging**:
```bash
✓ src/core/services/LoggingService.ts - Custom logging service
```

**Validation**:
```bash
# Search results pending
```

## 🎯 Migration Strategy

### Phase 1: Type Foundation (CURRENT)
**Goal**: Replace common types with `@reporunner/types`
**Time**: 4-6 hours
**Risk**: 🟢 LOW

**Steps**:
1. ✅ Install dependencies
2. 🔄 Audit current type usage
3. ⏳ Create type mapping document
4. ⏳ Replace imports incrementally
5. ⏳ Run type-check after each batch

### Phase 2: Extend Types
**Goal**: Extend centralized types for frontend-specific needs
**Time**: 2-3 hours
**Risk**: 🟢 LOW

**Example**:
```typescript
// frontend/src/core/types/workflow.ts
import type { IWorkflow, INode } from '@reporunner/types';

// Extend with frontend-specific properties
export interface FrontendWorkflowNode extends INode {
  // Keep frontend-only properties
  onDelete?: (nodeId: string) => void;
  onConnect?: (sourceNodeId: string) => void;
  hasOutgoingConnection?: boolean;
  isSelected?: boolean;
}
```

### Phase 3: Utility Migration
**Goal**: Replace custom utilities with `@reporunner/core`
**Time**: 4-6 hours
**Risk**: 🟡 MEDIUM

**Steps**:
1. Replace LoggingService with `Logger` from `@reporunner/core`
2. Search and replace error handling
3. Create package-level logger instance
4. Replace console.log statements

### Phase 4: Validation & Testing
**Goal**: Ensure everything works
**Time**: 2-3 hours
**Risk**: 🟢 LOW

**Steps**:
1. Run `pnpm type-check`
2. Run `pnpm build`
3. Manual testing of key workflows
4. Fix any type errors

## 📋 Next Immediate Steps

### Option A: Quick Win - Replace Common Types
**Time**: 1-2 hours
**Impact**: Immediate code reduction

1. Replace workflow types in stores
2. Replace execution types in services
3. Run type-check

### Option B: Comprehensive Migration
**Time**: 12-15 hours total
**Impact**: 15-20% code reduction

1. Complete type migration (Phase 1-2)
2. Utility migration (Phase 3)
3. Full testing (Phase 4)

### Option C: Incremental Service-by-Service
**Time**: 2-3 hours per service
**Impact**: Gradual, safe migration

1. Pick one service (e.g., workflow store)
2. Migrate all its types and utilities
3. Test thoroughly
4. Move to next service

## 🚧 Challenges Identified

### 1. Frontend-Specific Type Extensions
**Issue**: Many types have React-specific callbacks
**Solution**: Extend centralized types, don't replace

### 2. Large Codebase
**Issue**: 78+ files need updates
**Solution**: Batch migrations by feature area

### 3. Type Compatibility
**Issue**: React Flow types vs. our types
**Solution**: Create adapter types where needed

## 📈 Expected Impact

After full migration:
- **Code Reduction**: ~73 KB of duplicate type definitions removed
- **Maintenance**: Single source of truth for types
- **Consistency**: Same types across frontend/backend
- **Type Safety**: No more type drift

## 🔄 Rollback Plan

If issues occur:
1. Revert package.json changes
2. Run `pnpm install`
3. All old code still intact (no deletions yet)

## 📝 Notes

- Keep frontend-specific types (React callbacks, UI state)
- Extend centralized types, don't replace everything
- Test incrementally, don't batch all changes
- Document any type incompatibilities found

---

**Next Action**: Choose migration approach (A, B, or C) and begin
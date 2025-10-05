# Package Consolidation Plan

## Current State
- 25+ packages in `@reporunner/*` scope
- 590 total package.json files
- 2.1GB node_modules

## Consolidation Strategy

### Phase 1: Immediate Merges (Low Risk)
1. **@reporunner/constants** → **@reporunner/types**
   - Both are small, type-related packages
   - No external dependencies
   - Used together frequently

2. **@reporunner/validation** → **@reporunner/core**
   - Validation is core functionality
   - Reduces circular dependencies
   - Simplifies imports

### Phase 2: Related Package Merges (Medium Risk)
3. **@reporunner/backend-common** → **@reporunner/services**
   - Both are backend utilities
   - Often used together
   - Reduces package overhead

4. **@reporunner/auth** + **@reporunner/security** → **@reporunner/auth**
   - Security is primarily auth-related
   - Logical grouping
   - Reduces auth complexity

### Phase 3: Infrastructure Consolidation (Higher Risk)
5. **@reporunner/monitoring** + **@reporunner/real-time** → **@reporunner/platform**
   - Platform-level concerns
   - Shared infrastructure
   - Better separation of concerns

6. **@reporunner/gateway** → **@reporunner/api**
   - API gateway is part of API layer
   - Reduces network packages
   - Cleaner architecture

### Phase 4: Specialized Packages (Evaluate)
7. **@reporunner/enterprise** - Keep separate (licensing)
8. **@reporunner/cli** - Keep separate (distribution)
9. **@reporunner/design-system** - Keep separate (frontend)
10. **@reporunner/ai** - Keep separate (optional feature)

## Expected Benefits
- Reduce from 25+ to ~15 packages
- Decrease node_modules size by ~20-30%
- Simplify dependency management
- Faster builds and installs
- Easier maintenance

## Implementation Steps
1. Create migration scripts
2. Update import paths
3. Consolidate package.json files
4. Update build configurations
5. Test thoroughly
6. Update documentation

## Risk Mitigation
- Gradual rollout by phase
- Comprehensive testing
- Rollback plan for each phase
- Monitor build performance
- Team communication

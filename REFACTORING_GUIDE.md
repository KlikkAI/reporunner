# Microservices Refactoring Guide

## Overview
Transform monolithic service files (1,000-1,500 lines each) into modular, maintainable components following Domain-Driven Design (DDD) and Clean Architecture principles.

## Current State
- 5 microservices with 1,000-1,500 lines each
- Single file containing all logic per service
- Mixed concerns (business logic, data access, validation, etc.)

## Target Architecture

### Service Structure Pattern
```
packages/@reporunner/services/{service-name}/
├── src/
│   ├── index.ts                 # Service bootstrap (50 lines)
│   ├── config/
│   │   ├── index.ts             # Configuration loader
│   │   ├── database.config.ts   # DB configuration
│   │   ├── redis.config.ts      # Cache configuration
│   │   └── service.config.ts    # Service-specific config
│   ├── domain/
│   │   ├── entities/            # Business entities
│   │   ├── value-objects/       # Value objects
│   │   ├── events/              # Domain events
│   │   └── exceptions/          # Domain exceptions
│   ├── application/
│   │   ├── use-cases/           # Business use cases
│   │   ├── services/            # Application services
│   │   ├── dto/                 # Data transfer objects
│   │   └── mappers/             # Entity-DTO mappers
│   ├── infrastructure/
│   │   ├── repositories/        # Data access layer
│   │   ├── cache/               # Caching layer
│   │   ├── queue/               # Queue management
│   │   ├── events/              # Event bus integration
│   │   └── monitoring/          # Metrics and logging
│   ├── presentation/
│   │   ├── controllers/         # HTTP controllers
│   │   ├── validators/          # Request validation
│   │   ├── middleware/          # Express middleware
│   │   └── routes/              # Route definitions
│   └── shared/
│       ├── interfaces/          # Shared interfaces
│       ├── constants/           # Service constants
│       └── utils/               # Utility functions
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── fixtures/                # Test fixtures
└── package.json
```

## Refactoring Strategy

### Phase 1: Extract Core Components

#### 1. Configuration Management
```typescript
// config/service.config.ts
export class ServiceConfig {
  private static instance: ServiceConfig;
  
  private constructor(
    public readonly port: number,
    public readonly environment: string,
    public readonly logLevel: string
  ) {}
  
  static getInstance(): ServiceConfig {
    if (!this.instance) {
      this.instance = new ServiceConfig(
        parseInt(process.env.PORT || '3000'),
        process.env.NODE_ENV || 'development',
        process.env.LOG_LEVEL || 'info'
      );
    }
    return this.instance;
  }
}
```

#### 2. Domain Entities
```typescript
// domain/entities/tenant.entity.ts
export class Tenant {
  constructor(
    private readonly id: string,
    private name: string,
    private plan: TenantPlan,
    private status: TenantStatus
  ) {}
  
  changePlan(newPlan: TenantPlan): void {
    // Business logic for plan change
    this.plan = newPlan;
    this.emit(new PlanChangedEvent(this.id, newPlan));
  }
  
  suspend(): void {
    if (this.status === TenantStatus.SUSPENDED) {
      throw new AlreadySuspendedException();
    }
    this.status = TenantStatus.SUSPENDED;
  }
}
```

#### 3. Use Cases
```typescript
// application/use-cases/create-tenant.use-case.ts
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly eventBus: EventBus,
    private readonly validator: TenantValidator
  ) {}
  
  async execute(dto: CreateTenantDto): Promise<TenantResponseDto> {
    await this.validator.validate(dto);
    
    const tenant = TenantFactory.create(dto);
    await this.tenantRepo.save(tenant);
    
    await this.eventBus.publish('tenant.created', {
      tenantId: tenant.id,
      name: tenant.name
    });
    
    return TenantMapper.toDto(tenant);
  }
}
```

#### 4. Repository Pattern
```typescript
// infrastructure/repositories/tenant.repository.ts
export class MongoTenantRepository implements TenantRepository {
  constructor(
    private readonly db: Db,
    private readonly cache: RedisCache
  ) {}
  
  async findById(id: string): Promise<Tenant | null> {
    const cached = await this.cache.get(`tenant:${id}`);
    if (cached) return TenantMapper.toDomain(cached);
    
    const doc = await this.db.collection('tenants').findOne({ id });
    if (!doc) return null;
    
    const tenant = TenantMapper.toDomain(doc);
    await this.cache.set(`tenant:${id}`, doc, 3600);
    
    return tenant;
  }
  
  async save(tenant: Tenant): Promise<void> {
    const doc = TenantMapper.toPersistence(tenant);
    await this.db.collection('tenants').replaceOne(
      { id: tenant.id },
      doc,
      { upsert: true }
    );
    await this.cache.invalidate(`tenant:${tenant.id}`);
  }
}
```

### Phase 2: Service Decomposition

#### Example: TenantService Refactoring

**Before: 1,486 lines in single file**
**After: Multiple focused modules**

```
tenant-service/
├── src/
│   ├── index.ts (80 lines)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── tenant.entity.ts (120 lines)
│   │   │   ├── member.entity.ts (80 lines)
│   │   │   └── invitation.entity.ts (60 lines)
│   │   ├── value-objects/
│   │   │   ├── tenant-plan.vo.ts (40 lines)
│   │   │   ├── billing-info.vo.ts (50 lines)
│   │   │   └── sso-config.vo.ts (60 lines)
│   │   └── events/
│   │       ├── tenant-created.event.ts (20 lines)
│   │       ├── plan-changed.event.ts (20 lines)
│   │       └── member-invited.event.ts (20 lines)
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-tenant.use-case.ts (60 lines)
│   │   │   ├── update-tenant.use-case.ts (50 lines)
│   │   │   ├── invite-member.use-case.ts (70 lines)
│   │   │   ├── accept-invitation.use-case.ts (80 lines)
│   │   │   └── change-plan.use-case.ts (90 lines)
│   │   ├── services/
│   │   │   ├── billing.service.ts (100 lines)
│   │   │   ├── notification.service.ts (80 lines)
│   │   │   └── usage-tracker.service.ts (120 lines)
│   │   └── dto/
│   │       ├── create-tenant.dto.ts (30 lines)
│   │       └── tenant-response.dto.ts (40 lines)
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── tenant.repository.ts (150 lines)
│   │   │   └── invitation.repository.ts (100 lines)
│   │   ├── cache/
│   │   │   └── redis-cache.service.ts (80 lines)
│   │   └── queue/
│   │       └── tenant-queue.processor.ts (100 lines)
│   └── presentation/
│       ├── controllers/
│       │   ├── tenant.controller.ts (120 lines)
│       │   └── member.controller.ts (80 lines)
│       └── validators/
│           └── tenant.validator.ts (60 lines)
```

**Total: ~1,500 lines split into 25+ focused files**

### Phase 3: Shared Libraries

#### Create Shared Packages
```
packages/@reporunner/shared/
├── common/
│   ├── base-entity.ts
│   ├── base-repository.ts
│   ├── base-use-case.ts
│   └── base-controller.ts
├── infrastructure/
│   ├── database/
│   │   ├── mongo-connection.ts
│   │   └── postgres-connection.ts
│   ├── cache/
│   │   └── redis-client.ts
│   └── queue/
│       └── bull-queue.ts
└── utils/
    ├── logger.ts
    ├── error-handler.ts
    └── validator.ts
```

## Implementation Plan

### Week 1: Core Infrastructure
- [ ] Extract shared database connections
- [ ] Create base repository classes
- [ ] Setup shared cache layer
- [ ] Implement common error handling

### Week 2: Service Refactoring
- [ ] Refactor TenantService
- [ ] Refactor WorkflowService
- [ ] Refactor ExecutionService
- [ ] Refactor NotificationService
- [ ] Refactor AuditService
- [ ] Refactor AnalyticsService

### Week 3: Testing & Documentation
- [ ] Unit tests for each module
- [ ] Integration tests for use cases
- [ ] API documentation
- [ ] Architecture diagrams

## Benefits

### Maintainability
- **Single Responsibility**: Each file has one clear purpose
- **Easy Navigation**: Find code quickly by following the structure
- **Reduced Merge Conflicts**: Smaller files = fewer conflicts

### Testability
- **Isolated Testing**: Test individual components in isolation
- **Mock Dependencies**: Easy to mock external dependencies
- **Better Coverage**: Easier to achieve high test coverage

### Scalability
- **Team Collaboration**: Multiple developers can work on different modules
- **Feature Addition**: Add new features without touching existing code
- **Performance**: Lazy loading and code splitting opportunities

### Performance Optimizations
- **Reduced Memory Footprint**: Load only required modules
- **Better Caching**: Granular cache invalidation
- **Optimized Imports**: Tree-shaking unused code

## Code Quality Metrics

### Before Refactoring
- Average file size: 1,300 lines
- Cyclomatic complexity: 45-60
- Test coverage: ~30%
- Build time: 45 seconds

### After Refactoring
- Average file size: 80 lines
- Cyclomatic complexity: 5-10
- Test coverage target: 80%
- Build time target: 15 seconds

## Migration Checklist

### For Each Service:
- [ ] Create new folder structure
- [ ] Extract domain entities
- [ ] Create use cases
- [ ] Implement repositories
- [ ] Setup controllers
- [ ] Add validation layer
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update imports
- [ ] Remove old monolithic file
- [ ] Update documentation
- [ ] Deploy and test

## Tools & Scripts

### Automated Refactoring Script
```bash
#!/bin/bash
# refactor-service.sh

SERVICE_NAME=$1
SOURCE_FILE=$2

# Create directory structure
mkdir -p packages/@reporunner/services/$SERVICE_NAME/{src/{config,domain/{entities,value-objects,events},application/{use-cases,services,dto},infrastructure/{repositories,cache,queue},presentation/{controllers,validators,middleware}},tests/{unit,integration}}

# Extract components (pseudo-code)
npm run extract-entities $SOURCE_FILE
npm run extract-use-cases $SOURCE_FILE
npm run extract-repositories $SOURCE_FILE
npm run generate-tests $SERVICE_NAME

echo "Service $SERVICE_NAME refactored successfully!"
```

## Conclusion

This refactoring will transform your monolithic services into a clean, maintainable architecture that:
- Reduces cognitive load
- Improves team productivity
- Enables faster feature development
- Facilitates easier testing and debugging
- Provides better performance through optimization opportunities

The investment in refactoring will pay dividends in reduced maintenance costs and faster time-to-market for new features.
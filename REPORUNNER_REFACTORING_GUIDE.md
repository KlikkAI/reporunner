# Reporunner Refactoring Guide

## Overview
This guide provides a comprehensive plan to refactor the Reporunner codebase to improve maintainability, separation of concerns, and reusability, using Biome as the sole linting and formatting tool.

## Current State Analysis
- **Total TypeScript files**: 18,241 files
- **Large files identified**: Multiple files > 600 lines
- **Key issues**: 
  - Monolithic service files (600+ lines)
  - Mixed concerns in single files
  - Lack of consistent code organization
  - Insufficient modularization

## Refactoring Principles

### 1. Single Responsibility Principle
- Each file should have ONE primary responsibility
- Maximum file size: 200 lines (preferred: 100-150 lines)
- Each function: Maximum 50 lines

### 2. Separation of Concerns
```
/service
  ├── /domain           # Business logic & entities
  ├── /application      # Use cases & orchestration
  ├── /infrastructure   # External integrations
  └── /presentation     # API & transport layer
```

### 3. Dependency Injection Pattern
- Use interfaces for all dependencies
- Constructor injection for mandatory dependencies
- Factory pattern for complex object creation

## Refactoring Strategy

### Phase 1: Setup & Configuration (Week 1)

#### 1.1 Biome Configuration
```bash
# Replace current biome.json with enhanced version
mv biome.enhanced.json biome.json

# Install Biome globally
npm install -g @biomejs/biome

# Add scripts to package.json
"scripts": {
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "check": "biome check --write --unsafe .",
  "analyze": "biome check --reporter=json > biome-report.json"
}
```

#### 1.2 Remove ESLint and Prettier
```bash
# Remove ESLint and Prettier configs
rm .eslintrc.js .prettierrc*

# Uninstall packages
npm uninstall eslint prettier eslint-* @typescript-eslint/* prettier-*
```

### Phase 2: Core Architecture (Week 2)

#### 2.1 Create Shared Core
```typescript
// packages/@reporunner/core/src/index.ts
export * from './base/BaseEntity';
export * from './base/BaseRepository';
export * from './base/BaseService';
export * from './base/BaseController';
export * from './interfaces/IRepository';
export * from './interfaces/IService';
export * from './utils/logger';
export * from './utils/errors';
```

#### 2.2 Base Classes

```typescript
// packages/@reporunner/core/src/base/BaseService.ts
export abstract class BaseService<T> {
  protected logger: ILogger;
  protected cache: ICache;
  
  constructor(dependencies: ServiceDependencies) {
    this.logger = dependencies.logger;
    this.cache = dependencies.cache;
  }
  
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    retries = 3
  ): Promise<R> {
    // Retry logic
  }
  
  protected async executeWithCache<R>(
    key: string,
    operation: () => Promise<R>,
    ttl = 3600
  ): Promise<R> {
    // Cache logic
  }
}
```

### Phase 3: Service Refactoring (Week 3-4)

#### Example: Refactoring CollaborationService

**Before**: 658 lines in single file
**After**: Multiple focused modules

```
/collaboration
  ├── /domain
  │   ├── entities/
  │   │   ├── Session.entity.ts (50 lines)
  │   │   ├── Participant.entity.ts (40 lines)
  │   │   └── Operation.entity.ts (45 lines)
  │   ├── value-objects/
  │   │   ├── SessionConfig.vo.ts (30 lines)
  │   │   └── ParticipantRole.vo.ts (20 lines)
  │   └── events/
  │       ├── SessionCreated.event.ts (15 lines)
  │       └── ParticipantJoined.event.ts (15 lines)
  ├── /application
  │   ├── use-cases/
  │   │   ├── CreateSession.use-case.ts (80 lines)
  │   │   ├── JoinSession.use-case.ts (70 lines)
  │   │   └── HandleOperation.use-case.ts (90 lines)
  │   └── services/
  │       └── SessionOrchestrator.service.ts (100 lines)
  ├── /infrastructure
  │   ├── repositories/
  │   │   ├── SessionRepository.ts (120 lines)
  │   │   └── OperationRepository.ts (100 lines)
  │   └── websocket/
  │       └── SocketHandler.ts (150 lines)
  └── /presentation
      ├── controllers/
      │   └── CollaborationController.ts (100 lines)
      └── dto/
          ├── CreateSessionDto.ts (25 lines)
          └── JoinSessionDto.ts (25 lines)
```

#### 3.1 Domain Layer
```typescript
// domain/entities/Session.entity.ts
import type { Participant } from './Participant.entity';
import type { SessionConfig } from '../value-objects/SessionConfig.vo';

export class Session {
  private readonly id: string;
  private participants: Participant[] = [];
  private config: SessionConfig;
  private version = 0;
  
  constructor(props: SessionProps) {
    this.id = props.id;
    this.config = props.config;
  }
  
  addParticipant(participant: Participant): void {
    if (this.isFull()) {
      throw new SessionFullError();
    }
    this.participants.push(participant);
    this.incrementVersion();
  }
  
  private isFull(): boolean {
    return this.participants.length >= this.config.maxParticipants;
  }
  
  private incrementVersion(): void {
    this.version++;
  }
}
```

#### 3.2 Application Layer
```typescript
// application/use-cases/JoinSession.use-case.ts
export class JoinSessionUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger
  ) {}
  
  async execute(dto: JoinSessionDto): Promise<JoinSessionResult> {
    this.logger.info('Joining session', { workflowId: dto.workflowId });
    
    let session = await this.sessionRepo.findByWorkflowId(dto.workflowId);
    
    if (!session) {
      session = Session.create({
        workflowId: dto.workflowId,
        config: dto.config,
      });
    }
    
    const participant = new Participant(dto.participant);
    session.addParticipant(participant);
    
    await this.sessionRepo.save(session);
    
    await this.eventBus.publish(new ParticipantJoinedEvent({
      sessionId: session.id,
      participant,
    }));
    
    return {
      session,
      participantCount: session.getParticipantCount(),
    };
  }
}
```

#### 3.3 Infrastructure Layer
```typescript
// infrastructure/repositories/SessionRepository.ts
import { BaseRepository } from '@reporunner/core';

export class SessionRepository extends BaseRepository<Session> implements ISessionRepository {
  async findByWorkflowId(workflowId: string): Promise<Session | null> {
    const cached = await this.cache.get(`session:${workflowId}`);
    if (cached) return cached;
    
    const doc = await this.db.collection('sessions').findOne({ workflowId });
    if (!doc) return null;
    
    const session = SessionMapper.toDomain(doc);
    await this.cache.set(`session:${workflowId}`, session);
    
    return session;
  }
}
```

### Phase 4: Testing Strategy (Week 5)

#### 4.1 Unit Tests Structure
```typescript
// tests/unit/domain/Session.entity.test.ts
describe('Session Entity', () => {
  describe('addParticipant', () => {
    it('should add participant when session is not full', () => {
      // Test
    });
    
    it('should throw error when session is full', () => {
      // Test
    });
  });
});
```

#### 4.2 Integration Tests
```typescript
// tests/integration/JoinSession.test.ts
describe('Join Session Use Case', () => {
  let useCase: JoinSessionUseCase;
  let mockRepo: jest.Mocked<ISessionRepository>;
  
  beforeEach(() => {
    mockRepo = createMockRepository();
    useCase = new JoinSessionUseCase(mockRepo, mockEventBus, mockLogger);
  });
  
  it('should create new session when none exists', async () => {
    // Test
  });
});
```

## Implementation Checklist

### Week 1: Setup
- [ ] Update Biome configuration
- [ ] Remove ESLint/Prettier
- [ ] Setup package.json scripts
- [ ] Create base architecture folders

### Week 2: Core Libraries
- [ ] Create @reporunner/core package
- [ ] Implement base classes
- [ ] Create shared interfaces
- [ ] Setup dependency injection

### Week 3-4: Service Refactoring
- [ ] Refactor CollaborationService
- [ ] Refactor VersionControlService
- [ ] Refactor DebugTools
- [ ] Refactor ErrorTracker
- [ ] Refactor HealthCheck
- [ ] Refactor OperationalTransformService
- [ ] Refactor PerformanceMonitor
- [ ] Refactor EmbeddingsService
- [ ] Refactor PermissionService
- [ ] Refactor DatabaseService

### Week 5: Testing
- [ ] Setup test structure
- [ ] Write unit tests for entities
- [ ] Write integration tests for use cases
- [ ] Setup test coverage reporting

### Week 6: Documentation & Cleanup
- [ ] Update API documentation
- [ ] Create architecture diagrams
- [ ] Remove old code
- [ ] Performance testing

## Biome Commands Reference

```bash
# Check all files
biome check .

# Fix all auto-fixable issues
biome check --write .

# Format all files
biome format --write .

# Check specific path
biome check packages/backend

# Generate detailed report
biome check --reporter=json > report.json

# Check with unsafe fixes
biome check --write --unsafe .

# Organize imports
biome check --write --formatter-enabled=false --linter-enabled=false --organize-imports-enabled=true .

# CI mode
biome ci .
```

## File Size Guidelines

| Component Type | Max Lines | Preferred Lines |
|----------------|-----------|-----------------|
| Entity | 150 | 50-100 |
| Value Object | 50 | 20-30 |
| Use Case | 150 | 80-120 |
| Repository | 200 | 100-150 |
| Controller | 150 | 80-120 |
| Service | 200 | 100-150 |
| Utility | 100 | 30-50 |
| Interface | 50 | 20-30 |
| DTO | 50 | 20-30 |
| Test File | 300 | 150-250 |

## Success Metrics

### Before Refactoring
- Average file size: 400+ lines
- Cognitive complexity: 20-30
- Test coverage: Unknown
- Code duplication: High

### After Refactoring
- Average file size: 100-150 lines
- Cognitive complexity: < 10
- Test coverage: > 80%
- Code duplication: < 5%

## Common Patterns

### 1. Factory Pattern
```typescript
export class SessionFactory {
  static create(props: CreateSessionProps): Session {
    return new Session({
      id: generateId(),
      ...props,
      createdAt: new Date(),
    });
  }
}
```

### 2. Repository Pattern
```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 3. Use Case Pattern
```typescript
export interface IUseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
```

### 4. Event Pattern
```typescript
export abstract class DomainEvent {
  readonly occurredAt = new Date();
  abstract readonly eventType: string;
}
```

## Monitoring Progress

Track refactoring progress with:
```bash
# Count files > 200 lines
find packages -name "*.ts" -type f -exec wc -l {} \; | awk '$1 > 200' | wc -l

# Generate complexity report
biome check --reporter=json | jq '.diagnostics[] | select(.rule == "noExcessiveCognitiveComplexity")'

# Check test coverage
npm run test:coverage
```

## Conclusion

This refactoring will transform the Reporunner codebase into a maintainable, scalable, and testable architecture. The use of Biome as the sole tool for linting and formatting ensures consistency across the entire codebase.

Estimated completion time: 6 weeks
Expected improvement: 70% reduction in file sizes, 80% improvement in maintainability
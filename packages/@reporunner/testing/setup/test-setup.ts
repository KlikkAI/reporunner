import 'reflect-metadata';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis-mock';
import { container } from '@reporunner/shared/di/container';
import { TYPES } from '@reporunner/shared/di/container';
import { EventEmitter } from 'events';
import { logger } from '@reporunner/shared/utils/logger';

// Test environment configuration
export interface TestConfig {
  database?: {
    inMemory?: boolean;
    url?: string;
  };
  cache?: {
    mock?: boolean;
    url?: string;
  };
  eventBus?: {
    mock?: boolean;
  };
  logging?: {
    enabled?: boolean;
    level?: string;
  };
}

// Test context for sharing state between tests
export class TestContext {
  private static instance: TestContext;

  mongoServer: MongoMemoryServer | null = null;
  mongoClient: MongoClient | null = null;
  database: Db | null = null;
  redisClient: any = null;
  eventBus: EventEmitter | null = null;
  config: TestConfig;

  private constructor() {
    this.config = {
      database: { inMemory: true },
      cache: { mock: true },
      eventBus: { mock: true },
      logging: { enabled: false },
    };
  }

  static getInstance(): TestContext {
    if (!TestContext.instance) {
      TestContext.instance = new TestContext();
    }
    return TestContext.instance;
  }

  async setup(config?: TestConfig): Promise<void> {
    this.config = { ...this.config, ...config };

    // Setup logging
    if (!this.config.logging?.enabled) {
      logger.silent = true;
    }

    // Setup database
    await this.setupDatabase();

    // Setup cache
    await this.setupCache();

    // Setup event bus
    await this.setupEventBus();

    // Initialize DI container
    await this.setupDIContainer();
  }

  private async setupDatabase(): Promise<void> {
    if (this.config.database?.inMemory) {
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();
      this.mongoClient = new MongoClient(mongoUri);
      await this.mongoClient.connect();
      this.database = this.mongoClient.db('test');
    } else if (this.config.database?.url) {
      this.mongoClient = new MongoClient(this.config.database.url);
      await this.mongoClient.connect();
      this.database = this.mongoClient.db('test');
    }
  }

  private async setupCache(): Promise<void> {
    if (this.config.cache?.mock) {
      this.redisClient = new Redis();
    } else if (this.config.cache?.url) {
      const Redis = require('ioredis');
      this.redisClient = new Redis(this.config.cache.url);
    }
  }

  private async setupEventBus(): Promise<void> {
    if (this.config.eventBus?.mock) {
      this.eventBus = new EventEmitter();
    }
  }

  private async setupDIContainer(): Promise<void> {
    await container.initialize({
      environment: 'test',
      serviceName: 'test-service',
      version: '1.0.0',
    });

    // Override with test implementations
    if (this.database) {
      container.register({
        identifier: TYPES.Database,
        implementation: null,
        factory: () => this.database,
      });
    }

    if (this.redisClient) {
      container.register({
        identifier: TYPES.Cache,
        implementation: null,
        factory: () => this.redisClient,
      });
    }

    if (this.eventBus) {
      container.register({
        identifier: TYPES.EventBus,
        implementation: null,
        factory: () => this.eventBus,
      });
    }
  }

  async teardown(): Promise<void> {
    // Close database connections
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.mongoClient = null;
      this.database = null;
    }

    if (this.mongoServer) {
      await this.mongoServer.stop();
      this.mongoServer = null;
    }

    // Close cache connections
    if (this.redisClient && typeof this.redisClient.quit === 'function') {
      await this.redisClient.quit();
      this.redisClient = null;
    }

    // Clean up event bus
    if (this.eventBus) {
      this.eventBus.removeAllListeners();
      this.eventBus = null;
    }

    // Dispose DI container
    await container.dispose();

    // Re-enable logging
    logger.silent = false;
  }

  async cleanDatabase(): Promise<void> {
    if (this.database) {
      const collections = await this.database.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  }

  async cleanCache(): Promise<void> {
    if (this.redisClient && typeof this.redisClient.flushall === 'function') {
      await this.redisClient.flushall();
    }
  }

  async clean(): Promise<void> {
    await this.cleanDatabase();
    await this.cleanCache();
  }
}

// Test data builders for creating test fixtures
export class TestDataBuilder {
  static createTenant(overrides?: any) {
    return {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      slug: 'test-tenant',
      organizationId: 'test-org-id',
      plan: {
        type: 'starter',
        limits: {
          users: 10,
          workflows: 100,
          executions: 1000,
        },
        features: {
          sso: false,
          api: true,
          customDomain: false,
        },
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: 'test-user-id',
      ...overrides,
    };
  }

  static createWorkflow(overrides?: any) {
    return {
      id: 'test-workflow-id',
      name: 'Test Workflow',
      description: 'Test workflow description',
      tenantId: 'test-tenant-id',
      nodes: [
        {
          id: 'node1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { trigger: 'manual' },
        },
        {
          id: 'node2',
          type: 'action',
          position: { x: 300, y: 100 },
          data: { action: 'send-email' },
        },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user-id',
      ...overrides,
    };
  }

  static createUser(overrides?: any) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      tenantId: 'test-tenant-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createExecution(overrides?: any) {
    return {
      id: 'test-execution-id',
      workflowId: 'test-workflow-id',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      input: { test: 'data' },
      output: { result: 'success' },
      ...overrides,
    };
  }
}

// Mock factories for creating mock implementations
export class MockFactory {
  static createMockRepository<T>(): any {
    return {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
    };
  }

  static createMockService(): any {
    return {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
  }

  static createMockEventBus(): any {
    return {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };
  }

  static createMockCache(): any {
    return {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };
  }

  static createMockLogger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
  }
}

// Test utilities
export class TestUtils {
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await TestUtils.sleep(interval);
    }

    throw new Error('Timeout waiting for condition');
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static randomId(): string {
    return Math.random().toString(36).substring(7);
  }

  static randomEmail(): string {
    return `test-${this.randomId()}@example.com`;
  }

  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }
}

// Base test class for common setup/teardown
export abstract class BaseTest {
  protected context: TestContext;

  constructor() {
    this.context = TestContext.getInstance();
  }

  async beforeAll(): Promise<void> {
    await this.context.setup(this.getTestConfig());
  }

  async afterAll(): Promise<void> {
    await this.context.teardown();
  }

  async beforeEach(): Promise<void> {
    await this.context.clean();
  }

  async afterEach(): Promise<void> {
    // Override in child classes if needed
  }

  protected getTestConfig(): TestConfig {
    // Override in child classes to customize
    return {};
  }

  protected getDatabase(): Db {
    if (!this.context.database) {
      throw new Error('Database not initialized');
    }
    return this.context.database;
  }

  protected getCache(): any {
    if (!this.context.redisClient) {
      throw new Error('Cache not initialized');
    }
    return this.context.redisClient;
  }

  protected getEventBus(): EventEmitter {
    if (!this.context.eventBus) {
      throw new Error('Event bus not initialized');
    }
    return this.context.eventBus;
  }
}

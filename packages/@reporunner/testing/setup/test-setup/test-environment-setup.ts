import 'reflect-metadata';
import type { EventEmitter } from 'node:events';
import { logger } from '@reporunner/shared/utils/logger';
import Redis from 'ioredis-mock';
import { type Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
      logging: { enabled: false }
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

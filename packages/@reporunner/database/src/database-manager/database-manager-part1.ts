import { MongoDBConnection } from './mongodb/connection';
import { PostgreSQLConnection } from './postgresql/connection';
import { RedisConnection } from './redis/connection';
import type { DatabaseConfig } from './types';

/**
 * Hybrid database manager that orchestrates MongoDB, PostgreSQL, and Redis connections
 *
 * Architecture:
 * - MongoDB: Primary database for workflows, executions, users, organizations
 * - PostgreSQL: AI database with pgvector for embeddings and vector search
 * - Redis: Caching, sessions, and queue management
 */
export class DatabaseManager {
  private mongodb: MongoDBConnection;
  private postgresql: PostgreSQLConnection;
  private redis: RedisConnection;
  private isInitialized = false;

  constructor(config: DatabaseConfig) {
    this.mongodb = new MongoDBConnection(config.mongodb);
    this.postgresql = new PostgreSQLConnection(config.postgresql);
    this.redis = new RedisConnection(config.redis);
  }

  /**
   * Initialize all database connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    await this.mongodb.connect();
    await this.postgresql.connect();
    await this.postgresql.enableVectorExtension();
    await this.redis.connect();

    this.isInitialized = true;
  }

  /**
   * Shutdown all database connections gracefully
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.mongodb.disconnect(),
      this.postgresql.disconnect(),
      this.redis.disconnect(),
    ]);

    this.isInitialized = false;
  }

  /**
   * Check health of all database connections
   */
  async healthCheck(): Promise<{
    mongodb: boolean;
    postgresql: boolean;
    redis: boolean;
    overall: boolean;
  }> {
    const [mongoHealth, pgHealth, redisHealth] = await Promise.allSettled([
      this.mongodb.ping(),
      this.postgresql.ping(),
      this.redis.ping(),
    ]);

    const health = {
      mongodb: mongoHealth.status === 'fulfilled' && mongoHealth.value,
      postgresql: pgHealth.status === 'fulfilled' && pgHealth.value,
      redis: redisHealth.status === 'fulfilled' && redisHealth.value,
      overall: false,
    };

    health.overall = health.mongodb && health.postgresql && health.redis;
    return health;
  }

  /**
   * Get MongoDB connection instance
   */
  getMongoDB(): MongoDBConnection {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.mongodb;
  }

  /**
   * Get PostgreSQL connection instance
   */
  getPostgreSQL(): PostgreSQLConnection {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.postgresql;
  }

/**

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

  constructor(private config: DatabaseConfig) {
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

    try {
      console.log('🔄 Initializing database connections...');

      // Initialize MongoDB (Primary Database)
      console.log('📦 Connecting to MongoDB...');
      await this.mongodb.connect();
      console.log('✅ MongoDB connected');

      // Initialize PostgreSQL (AI Database)
      console.log('🧠 Connecting to PostgreSQL (AI Database)...');
      await this.postgresql.connect();
      await this.postgresql.enableVectorExtension();
      console.log('✅ PostgreSQL connected with pgvector extension');

      // Initialize Redis (Cache & Sessions)
      console.log('⚡ Connecting to Redis...');
      await this.redis.connect();
      console.log('✅ Redis connected');

      this.isInitialized = true;
      console.log('🎉 All database connections initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Shutdown all database connections gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down database connections...');

    try {
      await Promise.all([
        this.mongodb.disconnect(),
        this.postgresql.disconnect(),
        this.redis.disconnect(),
      ]);

      this.isInitialized = false;
      console.log('✅ All database connections closed');
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      throw error;
    }
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
   * Get Redis connection instance
   */
  getRedis(): RedisConnection {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.redis;
  }

  /**
   * Transaction support across databases
   */
  async transaction<T>(
    operations: {
      mongodb?: () => Promise<any>;
      postgresql?: () => Promise<any>;
    },
    options: {
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { retries = 3, timeout = 30000 } = options;
    let attempt = 0;

    while (attempt < retries) {
      try {
        const results: any[] = [];

        // Execute MongoDB operations in transaction
        if (operations.mongodb) {
          const mongoResult = await this.mongodb.transaction(operations.mongodb);
          results.push(mongoResult);
        }

        // Execute PostgreSQL operations in transaction
        if (operations.postgresql) {
          const pgResult = await this.postgresql.transaction(operations.postgresql);
          results.push(pgResult);
        }

        return results.length === 1 ? results[0] : results;
      } catch (error) {
        attempt++;
        if (attempt >= retries) {
          throw error;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }

    throw new Error('Transaction failed after maximum retries');
  }

  /**
   * Migrate databases to latest schema
   */
  async migrate(): Promise<void> {
    console.log('🔄 Running database migrations...');

    try {
      // Run MongoDB migrations
      await this.mongodb.migrate();
      console.log('✅ MongoDB migrations completed');

      // Run PostgreSQL migrations
      await this.postgresql.migrate();
      console.log('✅ PostgreSQL migrations completed');

      console.log('🎉 All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Seed databases with initial data
   */
  async seed(): Promise<void> {
    console.log('🔄 Seeding databases...');

    try {
      // Seed MongoDB
      await this.mongodb.seed();
      console.log('✅ MongoDB seeding completed');

      // Seed PostgreSQL
      await this.postgresql.seed();
      console.log('✅ PostgreSQL seeding completed');

      console.log('🎉 Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    mongodb: {
      collections: number;
      documents: number;
      dataSize: number;
      indexSize: number;
    };
    postgresql: {
      tables: number;
      rows: number;
      dataSize: number;
      indexSize: number;
    };
    redis: {
      keys: number;
      memory: number;
      connections: number;
    };
  }> {
    const [mongoStats, pgStats, redisStats] = await Promise.all([
      this.mongodb.getStats(),
      this.postgresql.getStats(),
      this.redis.getStats(),
    ]);

    return {
      mongodb: mongoStats,
      postgresql: pgStats,
      redis: redisStats,
    };
  }
}

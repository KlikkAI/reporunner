import type { IExecution, IOrganization, IUser, IWorkflow } from '@reporunner/api-types';
import { MongoClient, type Db as MongoDb } from 'mongodb';
import { Pool } from 'pg';
import { createClient, type RedisClientType } from 'redis';
import type { Logger } from 'winston';

export interface DatabaseConfig {
  mongodb: {
    uri: string;
    database: string;
    options?: any;
  };
  postgresql: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections?: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

export class DatabaseService {
  private mongoClient: MongoClient | null = null;
  private mongoDb: MongoDb | null = null;
  private pgPool: Pool | null = null;
  private redisClient: RedisClientType | null = null;
  private logger: Logger;
  private config: DatabaseConfig;
  public isConnected: boolean = false;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize all database connections
   */
  async connect(): Promise<void> {
    try {
      // Connect to MongoDB
      await this.connectMongoDB();

      // Connect to PostgreSQL
      await this.connectPostgreSQL();

      // Connect to Redis
      await this.connectRedis();

      this.isConnected = true;
      this.logger.info('All database connections established successfully');
    } catch (error) {
      this.logger.error('Failed to establish database connections', error);
      throw error;
    }
  }

  /**
   * Connect to MongoDB
   */
  private async connectMongoDB(): Promise<void> {
    try {
      this.mongoClient = new MongoClient(this.config.mongodb.uri, this.config.mongodb.options);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db(this.config.mongodb.database);

      // Create indexes
      await this.createMongoIndexes();

      this.logger.info('MongoDB connection established');
    } catch (error) {
      this.logger.error('MongoDB connection failed', error);
      throw error;
    }
  }

  /**
   * Connect to PostgreSQL with pgvector extension
   */
  private async connectPostgreSQL(): Promise<void> {
    try {
      this.pgPool = new Pool({
        host: this.config.postgresql.host,
        port: this.config.postgresql.port,
        database: this.config.postgresql.database,
        user: this.config.postgresql.user,
        password: this.config.postgresql.password,
        max: this.config.postgresql.maxConnections || 20,
      });

      // Test connection
      const client = await this.pgPool.connect();

      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create tables
      await this.createPostgreSQLTables(client);

      client.release();
      this.logger.info('PostgreSQL connection established with pgvector');
    } catch (error) {
      this.logger.error('PostgreSQL connection failed', error);
      throw error;
    }
  }

  /**
   * Connect to Redis for caching and pub/sub
   */
  private async connectRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        socket: {
          host: this.config.redis.host,
          port: this.config.redis.port,
        },
        password: this.config.redis.password,
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis error', err);
      });

      await this.redisClient.connect();
      this.logger.info('Redis connection established');
    } catch (error) {
      this.logger.error('Redis connection failed', error);
      throw error;
    }
  }

  /**
   * Create MongoDB indexes for performance
   */
  private async createMongoIndexes(): Promise<void> {
    if (!this.mongoDb) return;

    // Workflow indexes
    await this.mongoDb.collection('workflows').createIndex({ organizationId: 1, createdAt: -1 });
    await this.mongoDb.collection('workflows').createIndex({ status: 1, updatedAt: -1 });
    await this.mongoDb.collection('workflows').createIndex({ tags: 1 });

    // Execution indexes
    await this.mongoDb.collection('executions').createIndex({ workflowId: 1, startedAt: -1 });
    await this.mongoDb.collection('executions').createIndex({ status: 1, startedAt: -1 });

    // User indexes
    await this.mongoDb.collection('users').createIndex({ email: 1 }, { unique: true });
    await this.mongoDb.collection('users').createIndex({ organizationId: 1 });

    // Organization indexes
    await this.mongoDb.collection('organizations').createIndex({ slug: 1 }, { unique: true });
  }

  /**
   * Create PostgreSQL tables for AI and analytics
   */
  private async createPostgreSQLTables(client: any): Promise<void> {
    // Embeddings table for semantic search
    await client.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index on embeddings for similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
      ON embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Analytics events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        user_id VARCHAR(255),
        organization_id VARCHAR(255),
        workflow_id VARCHAR(255),
        properties JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // AI knowledge base table
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        category VARCHAR(100),
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // AI conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        workflow_id VARCHAR(255),
        messages JSONB NOT NULL,
        context JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * MongoDB Operations
   */
  get mongo() {
    if (!this.mongoDb) {
      throw new Error('MongoDB not connected');
    }

    return {
      workflows: this.mongoDb.collection<IWorkflow>('workflows'),
      executions: this.mongoDb.collection<IExecution>('executions'),
      users: this.mongoDb.collection<IUser>('users'),
      organizations: this.mongoDb.collection<IOrganization>('organizations'),
      credentials: this.mongoDb.collection('credentials'),
      nodes: this.mongoDb.collection('nodes'),
      integrations: this.mongoDb.collection('integrations'),

      // Direct database access for custom operations
      db: this.mongoDb,
    };
  }

  /**
   * PostgreSQL Operations
   */
  get postgres() {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }

    return {
      // Execute raw query
      query: async (text: string, params?: any[]) => {
        return await this.pgPool!.query(text, params);
      },

      // Get client for transactions
      getClient: async () => {
        return await this.pgPool!.connect();
      },

      // Store embedding
      storeEmbedding: async (
        resourceType: string,
        resourceId: string,
        embedding: number[],
        metadata?: any
      ) => {
        const query = `
          INSERT INTO embeddings (resource_type, resource_id, embedding, metadata)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (resource_id) DO UPDATE
          SET embedding = $3, metadata = $4, updated_at = NOW()
        `;
        return await this.pgPool!.query(query, [resourceType, resourceId, embedding, metadata]);
      },

      // Semantic search
      searchSimilar: async (embedding: number[], limit: number = 10, threshold: number = 0.8) => {
        const query = `
          SELECT resource_id, resource_type, metadata,
                 1 - (embedding <=> $1) AS similarity
          FROM embeddings
          WHERE 1 - (embedding <=> $1) > $3
          ORDER BY embedding <=> $1
          LIMIT $2
        `;
        return await this.pgPool!.query(query, [embedding, limit, threshold]);
      },

      // Log analytics event
      logEvent: async (eventType: string, userId?: string, properties?: any) => {
        const query = `
          INSERT INTO analytics_events (event_type, user_id, properties)
          VALUES ($1, $2, $3)
        `;
        return await this.pgPool!.query(query, [eventType, userId, properties]);
      },
    };
  }

  /**
   * Redis Operations
   */
  get redis(): any {
    if (!this.redisClient) {
      throw new Error('Redis not connected');
    }

    return {
      // Cache operations
      cache: {
        get: async (key: string) => {
          const value = await this.redisClient!.get(key);
          return value ? JSON.parse(value) : null;
        },

        set: async (key: string, value: any, ttl?: number) => {
          const serialized = JSON.stringify(value);
          if (ttl) {
            await this.redisClient!.setEx(key, ttl, serialized);
          } else {
            await this.redisClient!.set(key, serialized);
          }
        },

        del: async (key: string) => {
          await this.redisClient!.del(key);
        },
      },

      // Pub/Sub operations
      pubsub: {
        publish: async (channel: string, message: any) => {
          await this.redisClient!.publish(channel, JSON.stringify(message));
        },

        subscribe: async (channel: string, callback: (message: any) => void) => {
          const subscriber = this.redisClient!.duplicate();
          await subscriber.connect();
          await subscriber.subscribe(channel, (message) => {
            callback(JSON.parse(message));
          });
          return subscriber;
        },
      },

      // Direct client access
      client: this.redisClient,
    };
  }

  /**
   * Intelligent routing based on data type
   */
  async saveWorkflow(workflow: IWorkflow): Promise<void> {
    // Save to MongoDB (primary storage)
    await this.mongo.workflows.insertOne(workflow);

    // Cache in Redis for quick access
    await this.redis.cache.set(`workflow:${workflow.id}`, workflow, 3600);

    // If workflow has description, create embedding for semantic search
    if (workflow.description) {
      // This would call an embedding service (OpenAI, etc.)
      // const embedding = await this.createEmbedding(workflow.description);
      // await this.postgres.storeEmbedding('workflow', workflow.id, embedding, { name: workflow.name });
    }
  }

  /**
   * Disconnect all databases
   */
  async disconnect(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.logger.info('MongoDB disconnected');
      }

      if (this.pgPool) {
        await this.pgPool.end();
        this.logger.info('PostgreSQL disconnected');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.info('Redis disconnected');
      }

      // this.isConnected = false; // Removed isConnected tracking
    } catch (error) {
      this.logger.error('Error disconnecting databases', error);
      throw error;
    }
  }

  /**
   * Health check for all databases
   */
  async healthCheck(): Promise<{
    mongodb: boolean;
    postgresql: boolean;
    redis: boolean;
  }> {
    const health = {
      mongodb: false,
      postgresql: false,
      redis: false,
    };

    try {
      // Check MongoDB
      if (this.mongoClient) {
        await this.mongoClient.db('admin').command({ ping: 1 });
        health.mongodb = true;
      }

      // Check PostgreSQL
      if (this.pgPool) {
        const result = await this.pgPool.query('SELECT 1');
        health.postgresql = result.rows.length > 0;
      }

      // Check Redis
      if (this.redisClient) {
        const pong = await this.redisClient.ping();
        health.redis = pong === 'PONG';
      }
    } catch (error) {
      this.logger.error('Health check failed', error);
    }

    return health;
  }
}

export default DatabaseService;

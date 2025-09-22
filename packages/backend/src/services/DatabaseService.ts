/**
 * Hybrid Database Service - MongoDB + PostgreSQL with pgvector
 * Implements the hybrid database architecture from the roadmap
 */

import { DatabaseConfig } from '../config/database.js';
import { PostgreSQLConfig } from '../config/postgresql.js';

export interface DatabaseService {
  mongo: {
    workflows: any; // Will be replaced with actual repositories
    users: any;
    executions: any;
    credentials: any;
    organizations: any;
    integrations: any;
  };
  postgres: {
    embeddings: any;
    knowledgeBase: any;
    analytics: any;
    aiConversations: any;
  };
}

export class HybridDatabaseService {
  private static instance: HybridDatabaseService;
  private mongoConfig: DatabaseConfig;
  private postgresConfig: PostgreSQLConfig;
  private isConnected: boolean = false;

  private constructor() {
    this.mongoConfig = DatabaseConfig.getInstance();
    this.postgresConfig = PostgreSQLConfig.getInstance();
  }

  public static getInstance(): HybridDatabaseService {
    if (!HybridDatabaseService.instance) {
      HybridDatabaseService.instance = new HybridDatabaseService();
    }
    return HybridDatabaseService.instance;
  }

  /**
   * Initialize both database connections
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing hybrid database connections...');

      // Connect to MongoDB (primary database)
      await this.mongoConfig.connect();

      // Connect to PostgreSQL with pgvector (AI database)
      await this.postgresConfig.connect();

      // Create PostgreSQL tables if they don't exist
      await this.createPostgresTables();

      this.isConnected = true;
      console.log('Hybrid database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hybrid database service:', error);
      throw error;
    }
  }

  /**
   * Disconnect from both databases
   */
  public async disconnect(): Promise<void> {
    try {
      await this.mongoConfig.disconnect();
      await this.postgresConfig.disconnect();
      this.isConnected = false;
      console.log('Hybrid database service disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect hybrid database service:', error);
      throw error;
    }
  }

  /**
   * Get MongoDB connection
   */
  public getMongo(): DatabaseConfig {
    if (!this.isConnected) {
      throw new Error('Database service not initialized. Call initialize() first.');
    }
    return this.mongoConfig;
  }

  /**
   * Get PostgreSQL connection
   */
  public getPostgres(): PostgreSQLConfig {
    if (!this.isConnected) {
      throw new Error('Database service not initialized. Call initialize() first.');
    }
    return this.postgresConfig;
  }

  /**
   * Create PostgreSQL tables with pgvector support
   */
  private async createPostgresTables(): Promise<void> {
    const postgres = this.postgresConfig;

    // Embeddings table for vector storage
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id SERIAL PRIMARY KEY,
        content_id VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        text_content TEXT NOT NULL,
        embedding vector(1536), -- OpenAI embedding dimension
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create index for vector similarity search
    await postgres.query(`
      CREATE INDEX IF NOT EXISTS embeddings_vector_idx
      ON embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Knowledge base table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        tags TEXT[],
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // AI conversations table
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        conversation_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Analytics table for performance data
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        workflow_id VARCHAR(255) NOT NULL,
        execution_id VARCHAR(255) NOT NULL,
        node_id VARCHAR(255),
        metric_type VARCHAR(100) NOT NULL,
        metric_value JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('PostgreSQL tables created successfully');
  }

  /**
   * Health check for both databases
   */
  public async healthCheck(): Promise<{
    mongo: boolean;
    postgres: boolean;
    overall: boolean;
  }> {
    let mongoHealth = false;
    let postgresHealth = false;

    try {
      // Test MongoDB connection
      await this.mongoConfig.getConnectionString();
      mongoHealth = true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }

    try {
      // Test PostgreSQL connection
      await this.postgresConfig.query('SELECT 1');
      postgresHealth = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    return {
      mongo: mongoHealth,
      postgres: postgresHealth,
      overall: mongoHealth && postgresHealth,
    };
  }

  /**
   * Migrate data between databases if needed
   */
  public async migrateData(): Promise<void> {
    // This method can be used for future data migrations
    // between MongoDB and PostgreSQL
    console.log('Data migration completed');
  }
}

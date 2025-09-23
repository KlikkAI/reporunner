import { EventEmitter } from 'events';
import { Pool, type PoolClient, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

export interface PostgreSQLConfig extends PoolConfig {
  enablePgVector?: boolean;
  vectorDimensions?: number;
  connectionRetryDelay?: number;
  maxRetries?: number;
}

export class PostgreSQLConnection extends EventEmitter {
  private pool: Pool | null = null;
  private config: PostgreSQLConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor(config: PostgreSQLConfig) {
    super();
    this.config = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config,
      vectorDimensions: config.vectorDimensions || 1536, // OpenAI embedding dimension
      connectionRetryDelay: config.connectionRetryDelay || 5000,
      maxRetries: config.maxRetries || 10,
    };
  }

  /**
   * Connect to PostgreSQL
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.pool) {
        console.log('PostgreSQL already connected');
        return;
      }

      console.log('Connecting to PostgreSQL...');
      this.pool = new Pool(this.config);

      // Setup event listeners
      this.setupEventListeners();

      // Test connection
      await this.ping();

      // Initialize pgvector if enabled
      if (this.config.enablePgVector) {
        await this.initializePgVector();
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('Connected to PostgreSQL');
      this.emit('connected');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      this.emit('error', error);
      this.handleConnectionError();
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.pool) return;

    this.pool.on('connect', (client) => {
      console.log('PostgreSQL client connected');
      this.emit('clientConnected', client);
    });

    this.pool.on('acquire', (client) => {
      this.emit('clientAcquired', client);
    });

    this.pool.on('error', (error, _client) => {
      console.error('PostgreSQL pool error:', error);
      this.emit('error', error);
      this.handleConnectionError();
    });

    this.pool.on('remove', (client) => {
      console.log('PostgreSQL client removed');
      this.emit('clientRemoved', client);
    });
  }

  /**
   * Initialize pgvector extension
   */
  private async initializePgVector(): Promise<void> {
    try {
      console.log('Initializing pgvector extension...');

      // Create extension if not exists
      await this.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create helper functions for vector operations
      await this.query(
        `
        CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
        RETURNS float
        AS $$
        SELECT 1.0 - (a <=> b);
        $$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;
      `
      ).catch(() => {}); // Ignore if already exists

      console.log('pgvector extension initialized');
    } catch (error) {
      console.error('Failed to initialize pgvector:', error);
      throw error;
    }
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void {
    if (this.reconnectInterval) return;

    this.isConnected = false;

    if (this.reconnectAttempts >= (this.config.maxRetries || 10)) {
      console.error('Max reconnection attempts reached. Giving up.');
      this.emit('reconnectFailed');
      return;
    }

    const delay = this.config.connectionRetryDelay || 5000;
    console.log(`Attempting to reconnect to PostgreSQL in ${delay}ms...`);

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      this.reconnectAttempts++;

      try {
        await this.connect();
      } catch (error) {
        console.error('PostgreSQL reconnection attempt failed:', error);
      }
    }, delay);
  }

  /**
   * Ping the database
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      console.error('PostgreSQL ping failed:', error);
      return false;
    }
  }

  /**
   * Execute a query
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected. Call connect() first.');
    }

    try {
      const result = await this.pool.query<T>(text, params);
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected. Call connect() first.');
    }

    return this.pool.connect();
  }

  /**
   * Run a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create vector table
   */
  async createVectorTable(tableName: string, dimensions?: number): Promise<void> {
    const dim = dimensions || this.config.vectorDimensions || 1536;

    const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        content TEXT,
        metadata JSONB,
        embedding vector(${dim}),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx 
      ON ${tableName} 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
      
      CREATE INDEX IF NOT EXISTS ${tableName}_metadata_idx
      ON ${tableName}
      USING GIN (metadata);
    `;

    await this.query(query);
    console.log(`Created vector table: ${tableName}`);
  }

  /**
   * Store embedding
   */
  async storeEmbedding(
    tableName: string,
    content: string,
    embedding: number[],
    metadata?: any
  ): Promise<number> {
    const query = `
      INSERT INTO ${tableName} (content, embedding, metadata)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const result = await this.query<{ id: number }>(query, [
      content,
      JSON.stringify(embedding),
      metadata || {},
    ]);

    return result.rows[0].id;
  }

  /**
   * Search similar embeddings
   */
  async searchSimilar(
    tableName: string,
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<
    Array<{
      id: number;
      content: string;
      metadata: any;
      similarity: number;
    }>
  > {
    const query = `
      SELECT 
        id,
        content,
        metadata,
        cosine_similarity(embedding, $1::vector) as similarity
      FROM ${tableName}
      WHERE cosine_similarity(embedding, $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;

    const result = await this.query(query, [JSON.stringify(queryEmbedding), threshold, limit]);

    return result.rows;
  }

  /**
   * Run migrations
   */
  async runMigrations(
    migrations: Array<{
      version: number;
      name: string;
      up: string;
      down?: string;
    }>
  ): Promise<void> {
    // Create migrations table if not exists
    await this.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const appliedResult = await this.query<{ version: number }>(
      'SELECT version FROM migrations ORDER BY version'
    );
    const applied = new Set(appliedResult.rows.map((r) => r.version));

    // Run pending migrations
    for (const migration of migrations.sort((a, b) => a.version - b.version)) {
      if (!applied.has(migration.version)) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);

        await this.transaction(async (client) => {
          await client.query(migration.up);
          await client.query('INSERT INTO migrations (version, name) VALUES ($1, $2)', [
            migration.version,
            migration.name,
          ]);
        });

        console.log(`Migration ${migration.version} applied successfully`);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): {
    total: number;
    idle: number;
    waiting: number;
  } | null {
    if (!this.pool) return null;

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Disconnect from PostgreSQL
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        console.log('Disconnected from PostgreSQL');
        this.emit('disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting from PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected && this.pool !== null;
  }
}

// Export singleton instance
let pgConnection: PostgreSQLConnection | null = null;

export function getPostgreSQLConnection(config?: PostgreSQLConfig): PostgreSQLConnection {
  if (!pgConnection && config) {
    pgConnection = new PostgreSQLConnection(config);
  }

  if (!pgConnection) {
    throw new Error('PostgreSQL connection not initialized. Provide config on first call.');
  }

  return pgConnection;
}

export default PostgreSQLConnection;

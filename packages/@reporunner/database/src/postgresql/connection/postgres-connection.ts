import { EventEmitter } from 'node:events';
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
        return;
      }
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
      this.emit('connected');
    } catch (error) {
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
      this.emit('clientConnected', client);
    });

    this.pool.on('acquire', (client) => {
      this.emit('clientAcquired', client);
    });

    this.pool.on('error', (error, _client) => {
      this.emit('error', error);
      this.handleConnectionError();
    });

    this.pool.on('remove', (client) => {
      this.emit('clientRemoved', client);
    });
  }

  /**
   * Initialize pgvector extension
   */
  private async initializePgVector(): Promise<void> {
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

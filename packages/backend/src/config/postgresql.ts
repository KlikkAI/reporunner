/**
 * PostgreSQL configuration with pgvector support
 */

import { Pool, type PoolConfig } from 'pg';
import { ConfigService } from './ConfigService.js';

export class PostgreSQLConfig {
  private static instance: PostgreSQLConfig;
  private pool: Pool | null = null;
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  public static getInstance(): PostgreSQLConfig {
    if (!PostgreSQLConfig.instance) {
      PostgreSQLConfig.instance = new PostgreSQLConfig();
    }
    return PostgreSQLConfig.instance;
  }

  private getPoolConfig(): PoolConfig {
    const config = this.configService.getPostgreSQLConfig();
    return {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20, // maximum number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // how long to try connecting before timing out
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    };
  }

  public async connect(): Promise<void> {
    try {
      this.pool = new Pool(this.getPoolConfig());

      // Test the connection
      const client = await this.pool.connect();

      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('PostgreSQL connected successfully with pgvector extension');

      client.release();
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        console.log('PostgreSQL disconnected successfully');
      }
    } catch (error) {
      console.error('PostgreSQL disconnection error:', error);
      throw error;
    }
  }

  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized. Call connect() first.');
    }
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized. Call connect() first.');
    }
    return this.pool.query(text, params);
  }

  // Vector similarity search helper
  public async vectorSimilaritySearch(
    table: string,
    embeddingColumn: string,
    queryVector: number[],
    limit: number = 10,
    threshold: number = 0.8
  ): Promise<any[]> {
    const query = `
      SELECT *,
             1 - (${embeddingColumn} <=> $1::vector) as similarity
      FROM ${table}
      WHERE 1 - (${embeddingColumn} <=> $1::vector) > $2
      ORDER BY ${embeddingColumn} <=> $1::vector
      LIMIT $3
    `;

    const result = await this.query(query, [JSON.stringify(queryVector), threshold, limit]);
    return result.rows;
  }
}

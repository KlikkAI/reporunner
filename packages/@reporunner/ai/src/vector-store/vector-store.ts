/**
 * Vector Store implementation using PostgreSQL with pgvector
 * Provides semantic search capabilities for AI workflows
 */

import { Pool } from 'pg';
import type { Logger } from 'winston';
import type { EmbeddingService } from '../embeddings/EmbeddingService';
import {
  type VectorSearchParams,
  type VectorSearchResult,
  type VectorStoreConfig,
  type VectorStoreDocument,
  VectorStoreError,
} from '../types';

export class VectorStore {
  private pool: Pool;
  private embeddingService: EmbeddingService;
  private tableName: string;
  private dimensions: number;
  private logger: Logger;

  constructor(config: VectorStoreConfig, embeddingService: EmbeddingService, logger?: Logger) {
    this.pool = new Pool({ connectionString: config.connectionString });
    this.embeddingService = embeddingService;
    this.tableName = config.tableName;
    this.dimensions = config.dimensions;
    this.logger = logger || (console as any);

    this.initialize();
  }

  /**
   * Initialize the vector store table
   */
  private async initialize(): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Create extension if not exists
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');

      // Create table with vector column
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          embedding vector(${this.dimensions}),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_embedding_idx 
        ON ${this.tableName} USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_metadata_idx 
        ON ${this.tableName} USING GIN (metadata)
      `);

      this.logger.info('Vector store initialized successfully', { tableName: this.tableName });
    } catch (error) {
      throw new VectorStoreError(`Failed to initialize vector store: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(
    documents: Omit<VectorStoreDocument, 'embedding' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    if (documents.length === 0) return;

    try {
      // Generate embeddings for all documents
      const texts = documents.map((doc) => doc.content);
      const embeddings = await this.embeddingService.createEmbeddings(texts);

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          const embedding = embeddings[i];

          await client.query(
            `
            INSERT INTO ${this.tableName} (id, content, embedding, metadata)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) 
            DO UPDATE SET 
              content = EXCLUDED.content,
              embedding = EXCLUDED.embedding,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `,
            [doc.id, doc.content, `[${embedding.join(',')}]`, JSON.stringify(doc.metadata)]
          );
        }

        await client.query('COMMIT');

        this.logger.info('Documents added to vector store', {
          count: documents.length,
          tableName: this.tableName,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new VectorStoreError(`Failed to add documents: ${error}`);
    }
  }

  /**
   * Search for similar documents
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResult[]> {
    try {
      let queryEmbedding = params.queryEmbedding;

      // Generate embedding if not provided
      if (!queryEmbedding) {
        if (typeof params.query === 'string') {
          const embeddings = await this.embeddingService.createEmbeddings([params.query]);
          queryEmbedding = embeddings[0];
        } else {
          queryEmbedding = params.query;
        }
      }

      const client = await this.pool.connect();

      try {
        let sql = `
          SELECT 
            id, 
            content, 
            embedding, 
            metadata,
            created_at,
            updated_at,
            1 - (embedding <=> $1) as similarity
          FROM ${this.tableName}
        `;

        const queryParams: any[] = [`[${queryEmbedding.join(',')}]`];
        let paramIndex = 2;

        // Add metadata filter
        if (params.filter && Object.keys(params.filter).length > 0) {
          const conditions = [];
          for (const [key, value] of Object.entries(params.filter)) {
            conditions.push(`metadata->>'${key}' = $${paramIndex}`);
            queryParams.push(value);
            paramIndex++;
          }
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Add similarity threshold
        if (params.threshold !== undefined) {
          const whereClause = sql.includes('WHERE') ? ' AND' : ' WHERE';
          sql += `${whereClause} 1 - (embedding <=> $1) >= $${paramIndex}`;
          queryParams.push(params.threshold);
          paramIndex++;
        }

        sql += ` ORDER BY similarity DESC`;

        // Add limit
        if (params.limit) {
          sql += ` LIMIT $${paramIndex}`;
          queryParams.push(params.limit);
        }

        const result = await client.query(sql, queryParams);

        return result.rows.map((row) => ({
          id: row.id,
          score: row.similarity,
          values: params.includeMetadata ? this.parseVector(row.embedding) : undefined,
          metadata: params.includeMetadata ? {
            content: row.content,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            ...row.metadata,
          } : undefined,
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      throw new VectorStoreError(`Search failed: ${error}`);
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorStoreDocument | null> {
    try {
      const client = await this.pool.connect();

      try {
        const result = await client.query(
          `
          SELECT id, content, embedding, metadata, created_at, updated_at
          FROM ${this.tableName}
          WHERE id = $1
        `,
          [id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id,
          content: row.content,
          embedding: this.parseVector(row.embedding),
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      throw new VectorStoreError(`Failed to get document: ${error}`);
    }
  }

  /**
   * Delete documents
   */
  async deleteDocuments(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    try {
      const client = await this.pool.connect();

      try {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const result = await client.query(
          `
          DELETE FROM ${this.tableName}
          WHERE id IN (${placeholders})
        `,
          ids
        );

        this.logger.info('Documents deleted from vector store', {
          count: result.rowCount,
          tableName: this.tableName,
        });

        return result.rowCount || 0;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new VectorStoreError(`Failed to delete documents: ${error}`);
    }
  }

  /**
   * Get document count
   */
  async getDocumentCount(filter?: Record<string, any>): Promise<number> {
    try {
      const client = await this.pool.connect();

      try {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (filter && Object.keys(filter).length > 0) {
          const conditions = [];
          for (const [key, value] of Object.entries(filter)) {
            conditions.push(`metadata->>'${key}' = $${paramIndex}`);
            queryParams.push(value);
            paramIndex++;
          }
          sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await client.query(sql, queryParams);
        return parseInt(result.rows[0].count, 10);
      } finally {
        client.release();
      }
    } catch (error) {
      throw new VectorStoreError(`Failed to get document count: ${error}`);
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Parse vector string to number array
   */
  private parseVector(vectorString: string): number[] {
    // Remove brackets and parse as array
    const cleanString = vectorString.replace(/^\[|\]$/g, '');
    return cleanString.split(',').map((n) => parseFloat(n.trim()));
  }
}

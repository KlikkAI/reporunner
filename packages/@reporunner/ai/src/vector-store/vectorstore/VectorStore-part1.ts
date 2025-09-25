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
      const embeddings = await this.embeddingService.embed(texts);

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          const embedding = embeddings[i];

          await client.query(
            `
            INSERT INTO ${this.tableName} (id, content, embedding, metadata)

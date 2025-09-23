/**
 * Embeddings Service for vector operations with pgvector
 * Implements semantic search and AI-powered content discovery
 */

import type { PostgreSQLConfig } from '../config/postgresql.js';
import { HybridDatabaseService } from './DatabaseService.js';

export interface EmbeddingDocument {
  id?: number;
  contentId: string;
  contentType: string;
  textContent: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SearchResult extends EmbeddingDocument {
  similarity: number;
}

export class EmbeddingsService {
  private static instance: EmbeddingsService;
  private dbService: HybridDatabaseService;
  private postgres: PostgreSQLConfig;

  private constructor() {
    this.dbService = HybridDatabaseService.getInstance();
    this.postgres = this.dbService.getPostgres();
  }

  public static getInstance(): EmbeddingsService {
    if (!EmbeddingsService.instance) {
      EmbeddingsService.instance = new EmbeddingsService();
    }
    return EmbeddingsService.instance;
  }

  /**
   * Store embedding in PostgreSQL
   */
  public async storeEmbedding(document: EmbeddingDocument): Promise<number> {
    if (!document.embedding) {
      throw new Error('Embedding vector is required');
    }

    const query = `
      INSERT INTO embeddings (content_id, content_type, text_content, embedding, metadata)
      VALUES ($1, $2, $3, $4::vector, $5)
      RETURNING id
    `;

    const values = [
      document.contentId,
      document.contentType,
      document.textContent,
      JSON.stringify(document.embedding),
      JSON.stringify(document.metadata || {}),
    ];

    const result = await this.postgres.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Update existing embedding
   */
  public async updateEmbedding(id: number, document: Partial<EmbeddingDocument>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (document.textContent) {
      updateFields.push(`text_content = $${valueIndex++}`);
      values.push(document.textContent);
    }

    if (document.embedding) {
      updateFields.push(`embedding = $${valueIndex++}::vector`);
      values.push(JSON.stringify(document.embedding));
    }

    if (document.metadata) {
      updateFields.push(`metadata = $${valueIndex++}`);
      values.push(JSON.stringify(document.metadata));
    }

    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 1) {
      // Only updated_at, nothing to update
      return;
    }

    values.push(id);
    const query = `
      UPDATE embeddings
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
    `;

    await this.postgres.query(query, values);
  }

  /**
   * Semantic search using vector similarity
   */
  public async semanticSearch(
    queryEmbedding: number[],
    options: {
      contentType?: string;
      limit?: number;
      threshold?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    const { contentType, limit = 10, threshold = 0.7, metadata } = options;

    const whereConditions = ['1 - (embedding <=> $1::vector) > $2'];
    const values: any[] = [JSON.stringify(queryEmbedding), threshold];
    let valueIndex = 3;

    if (contentType) {
      whereConditions.push(`content_type = $${valueIndex++}`);
      values.push(contentType);
    }

    if (metadata) {
      whereConditions.push(`metadata @> $${valueIndex++}`);
      values.push(JSON.stringify(metadata));
    }

    values.push(limit);

    const query = `
      SELECT
        id,
        content_id,
        content_type,
        text_content,
        metadata,
        created_at,
        updated_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM embeddings
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY embedding <=> $1::vector
      LIMIT $${valueIndex}
    `;

    const result = await this.postgres.query(query, values);
    return result.rows.map((row: any) => ({
      id: row.id,
      contentId: row.content_id,
      contentType: row.content_type,
      textContent: row.text_content,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      similarity: parseFloat(row.similarity),
    }));
  }

  /**
   * Find similar documents to a given document
   */
  public async findSimilarDocuments(
    contentId: string,
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<SearchResult[]> {
    // First, get the embedding of the source document
    const sourceQuery = `
      SELECT embedding FROM embeddings WHERE content_id = $1
    `;
    const sourceResult = await this.postgres.query(sourceQuery, [contentId]);

    if (sourceResult.rows.length === 0) {
      throw new Error(`Document with content_id ${contentId} not found`);
    }

    const sourceEmbedding = sourceResult.rows[0].embedding;

    // Now find similar documents
    const query = `
      SELECT
        id,
        content_id,
        content_type,
        text_content,
        metadata,
        created_at,
        updated_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM embeddings
      WHERE content_id != $2
        AND 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4
    `;

    const result = await this.postgres.query(query, [sourceEmbedding, contentId, threshold, limit]);

    return result.rows.map((row: any) => ({
      id: row.id,
      contentId: row.content_id,
      contentType: row.content_type,
      textContent: row.text_content,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      similarity: parseFloat(row.similarity),
    }));
  }

  /**
   * Delete embedding by content ID
   */
  public async deleteEmbedding(contentId: string): Promise<void> {
    const query = 'DELETE FROM embeddings WHERE content_id = $1';
    await this.postgres.query(query, [contentId]);
  }

  /**
   * Get embedding by content ID
   */
  public async getEmbedding(contentId: string): Promise<EmbeddingDocument | null> {
    const query = `
      SELECT
        id,
        content_id,
        content_type,
        text_content,
        metadata,
        created_at,
        updated_at
      FROM embeddings
      WHERE content_id = $1
    `;

    const result = await this.postgres.query(query, [contentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      contentId: row.content_id,
      contentType: row.content_type,
      textContent: row.text_content,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Batch store embeddings for performance
   */
  public async batchStoreEmbeddings(documents: EmbeddingDocument[]): Promise<number[]> {
    if (documents.length === 0) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    documents.forEach((doc, index) => {
      if (!doc.embedding) {
        throw new Error(`Embedding vector is required for document at index ${index}`);
      }

      const baseIndex = index * 5;
      placeholders.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}::vector, $${baseIndex + 5})`
      );

      values.push(
        doc.contentId,
        doc.contentType,
        doc.textContent,
        JSON.stringify(doc.embedding),
        JSON.stringify(doc.metadata || {})
      );
    });

    const query = `
      INSERT INTO embeddings (content_id, content_type, text_content, embedding, metadata)
      VALUES ${placeholders.join(', ')}
      RETURNING id
    `;

    const result = await this.postgres.query(query, values);
    return result.rows.map((row: any) => row.id);
  }

  /**
   * Get statistics about embeddings
   */
  public async getStatistics(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    avgSimilarityThreshold: number;
  }> {
    // Total documents
    const totalResult = await this.postgres.query('SELECT COUNT(*) as count FROM embeddings');
    const totalDocuments = parseInt(totalResult.rows[0].count, 10);

    // Documents by type
    const typeResult = await this.postgres.query(`
      SELECT content_type, COUNT(*) as count
      FROM embeddings
      GROUP BY content_type
    `);

    const documentsByType: Record<string, number> = {};
    typeResult.rows.forEach((row: any) => {
      documentsByType[row.content_type] = parseInt(row.count, 10);
    });

    return {
      totalDocuments,
      documentsByType,
      avgSimilarityThreshold: 0.8, // This could be calculated from actual usage
    };
  }
}

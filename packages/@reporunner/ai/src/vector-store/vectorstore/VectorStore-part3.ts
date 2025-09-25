} finally
{
  client.release();
}
} catch (error)
{
  throw new VectorStoreError(`Search failed: ${error}`);
}
}

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<VectorStoreDocument | null>
{
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
async;
deleteDocuments(ids: string[])
: Promise<number>
{
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
async;
getDocumentCount(filter?: Record<string, any>)
: Promise<number>
{
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

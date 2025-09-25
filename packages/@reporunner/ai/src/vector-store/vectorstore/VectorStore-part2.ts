VALUES($1, $2, $3, $4);
ON;
CONFLICT(id);
DO;
UPDATE;
SET;
content = EXCLUDED.content,
              embedding = EXCLUDED.embedding,
              metadata = EXCLUDED.metadata,
              updated_at = NOW()
          `,
            [doc.id, doc.content, `[$
{
  embedding.join(',');
}
]`, JSON.stringify(doc.metadata)]
          )
}

        await client.query('COMMIT')

this.logger.info('Documents added to vector store',
{
  count: documents.length, tableName;
  : this.tableName,
}
)
} catch (error)
{
  await client.query('ROLLBACK');
  throw error;
}
finally
{
  client.release();
}
} catch (error)
{
  throw new VectorStoreError(`Failed to add documents: ${error}`);
}
}

  /**
   * Search for similar documents
   */
  async search(params: VectorSearchParams): Promise<VectorSearchResult[]>
{
    try {
      let queryEmbedding = params.queryEmbedding;

      // Generate embedding if not provided
      if (!queryEmbedding) {
        const embeddings = await this.embeddingService.embed([params.query]);
        queryEmbedding = embeddings[0];
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
          document: {
            id: row.id,
            content: row.content,
            embedding: this.parseVector(row.embedding),
            metadata: row.metadata,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
          similarity: row.similarity,
        }));

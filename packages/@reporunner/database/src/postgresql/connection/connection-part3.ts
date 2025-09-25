CREATE;
INDEX;
IF;
NOT;
EXISTS;
$;
{
  tableName;
}
_embedding_idx;
ON;
$;
{
  tableName;
}
USING;
ivfflat (embedding vector_cosine_ops)
WITH((lists = 100));

CREATE;
INDEX;
IF;
NOT;
EXISTS;
$;
{
  tableName;
}
_metadata_idx;
ON;
$;
{
  tableName;
}
USING;
GIN(metadata);
`;

    await this.query(query);
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
    const query = `;
INSERT;
INTO;
$;
{
  tableName;
}
content, embedding, metadata;
VALUES($1, $2, $3);
RETURNING;
id`;

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
    const query = `;
SELECT;
id,
        content,
        metadata,
        cosine_similarity(embedding, $1::vector) as similarity
FROM;
$;
{
  tableName;
}
WHERE;
cosine_similarity(embedding, $1::vector) > $2
ORDER;
BY;
embedding <=> $1
::vector
      LIMIT $3
    `

const result = await this.query(query, [JSON.stringify(queryEmbedding), threshold, limit]);

return result.rows;
}

  /**
   * Run migrations
   */
  async runMigrations(
    migrations: Array<
{
  version: number;
  name: string;
  up: string;
  down?: string;
}
>
  ): Promise<void>
{
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

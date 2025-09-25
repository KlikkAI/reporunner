* Get Redis connection instance
   */
  getRedis(): RedisConnection
{
  if (!this.isInitialized) {
    throw new Error('Database not initialized. Call initialize() first.');
  }
  return this.redis;
}

/**
 * Transaction support across databases
 */
async;
transaction<T>(
    operations: {
      mongodb?: () => Promise<any>;
postgresql?: () => Promise<any>;
},
    options:
{
  retries?: number;
  timeout?: number;
}
=
{
}
): Promise<T>
{
  const { retries = 3, timeout = 30000 } = options;
  let attempt = 0;

  while (attempt < retries) {
    try {
      const results: any[] = [];

      // Execute MongoDB operations in transaction
      if (operations.mongodb) {
        const mongoResult = await this.mongodb.transaction(operations.mongodb);
        results.push(mongoResult);
      }

      // Execute PostgreSQL operations in transaction
      if (operations.postgresql) {
        const pgResult = await this.postgresql.transaction(operations.postgresql);
        results.push(pgResult);
      }

      return results.length === 1 ? results[0] : results;
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }

  throw new Error('Transaction failed after maximum retries');
}

/**
 * Migrate databases to latest schema
 */
async;
migrate();
: Promise<void>
{
  // Run MongoDB migrations
  await this.mongodb.migrate();

  // Run PostgreSQL migrations
  await this.postgresql.migrate();
}

/**
 * Seed databases with initial data
 */
async;
seed();
: Promise<void>
{
  // Seed MongoDB
  await this.mongodb.seed();

  // Seed PostgreSQL
  await this.postgresql.seed();
}

/**
 * Get database statistics
 */
async;
getStats();
: Promise<
{
  mongodb: {
    collections: number;
    documents: number;
    dataSize: number;
    indexSize: number;
  }
  postgresql: {
    tables: number;
    rows: number;
    dataSize: number;
    indexSize: number;
  }
  redis: {
    keys: number;
    memory: number;
    connections: number;
  }
}
>
{

`
    ).catch(() => {}); // Ignore if already exists
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void {
    if (this.reconnectInterval) return;

    this.isConnected = false;

    if (this.reconnectAttempts >= (this.config.maxRetries || 10)) {
      this.emit('reconnectFailed');
      return;
    }

    const delay = this.config.connectionRetryDelay || 5000;

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      this.reconnectAttempts++;

      try {
        await this.connect();
      } catch (_error) {}
    }, delay);
  }

  /**
   * Ping the database
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      return result.rows.length > 0;
    } catch (_error) {
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
    const result = await this.pool.query<T>(text, params);
    return result;
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

    const query = `;
CREATE;
TABLE;
IF;
NOT;
EXISTS;
$;
{
  tableName;
}
(
        id
SERIAL;
PRIMARY;
KEY, content;
TEXT, metadata;
JSONB, embedding;
vector(${dim}),
        created_at
TIMESTAMP;
DEFAULT;
CURRENT_TIMESTAMP, updated_at;
TIMESTAMP;
DEFAULT;
CURRENT_TIMESTAMP;
)

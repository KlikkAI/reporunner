})
}

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void
{
  if (this.reconnectInterval) return;

  this.isConnected = false;

  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    this.emit('reconnectFailed');
    return;
  }

  const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

  this.reconnectInterval = setTimeout(async () => {
    this.reconnectInterval = null;
    this.reconnectAttempts++;

    try {
      await this.connect();
    } catch (_error) {
      this.handleConnectionError();
    }
  }, delay);
}

/**
 * Ping the database to verify connection
 */
async;
ping();
: Promise<boolean>
{
  try {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const result = await this.db.admin().ping();
    return result.ok === 1;
  } catch (_error) {
    return false;
  }
}

/**
 * Get database instance
 */
getDatabase();
: Db
{
  if (!this.db) {
    throw new Error('MongoDB not connected. Call connect() first.');
  }
  return this.db;
}

/**
 * Get collection
 */
getCollection < T;
extends Document = Document>(name: string): Collection<T>
{
  if (!this.db) {
    throw new Error('MongoDB not connected. Call connect() first.');
  }
  return this.db.collection<T>(name);
}

/**
 * Disconnect from MongoDB
 */
async;
disconnect();
: Promise<void>
{
  if (this.reconnectInterval) {
    clearTimeout(this.reconnectInterval);
    this.reconnectInterval = null;
  }

  if (this.client) {
    await this.client.close();
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.emit('disconnected');
  }
}

/**
 * Check if connected
 */
isConnectedToDatabase();
: boolean
{
  return this.isConnected && this.client !== null && this.db !== null;
}

/**
 * Create indexes
 */
async;
createIndexes(
    indexes: Array<{
      collection: string;
index: any;
options?: any;
}>

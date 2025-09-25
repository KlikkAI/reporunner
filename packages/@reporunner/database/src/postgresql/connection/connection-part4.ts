await this.transaction(async (client) => {
  await client.query(migration.up);
  await client.query('INSERT INTO migrations (version, name) VALUES ($1, $2)', [
    migration.version,
    migration.name,
  ]);
});
}
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats():
{
  total: number;
  idle: number;
  waiting: number;
}
| null
{
  if (!this.pool) return null;

  return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
}

/**
 * Disconnect from PostgreSQL
 */
async;
disconnect();
: Promise<void>
{
  if (this.reconnectInterval) {
    clearTimeout(this.reconnectInterval);
    this.reconnectInterval = null;
  }

  if (this.pool) {
    await this.pool.end();
    this.pool = null;
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
  return this.isConnected && this.pool !== null;
}
}

// Export singleton instance
let pgConnection: PostgreSQLConnection | null = null;

export function getPostgreSQLConnection(config?: PostgreSQLConfig): PostgreSQLConnection {
  if (!pgConnection && config) {
    pgConnection = new PostgreSQLConnection(config);
  }

  if (!pgConnection) {
    throw new Error('PostgreSQL connection not initialized. Provide config on first call.');
  }

  return pgConnection;
}

export default PostgreSQLConnection;

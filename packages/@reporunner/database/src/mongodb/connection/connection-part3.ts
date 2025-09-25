): Promise<void>
{
  if (!this.db) {
    throw new Error('Database not connected');
  }

  for (const indexConfig of indexes) {
    const collection = this.db.collection(indexConfig.collection);
    await collection.createIndex(indexConfig.index, indexConfig.options || {});
  }
}

/**
 * Run a transaction
 */
async;
runTransaction<T>(callback: (session: any) => Promise<T>, options?: any)
: Promise<T>
{
  if (!this.client) {
    throw new Error('MongoDB client not connected');
  }

  const session = this.client.startSession();

  try {
    const result = await session.withTransaction(async () => callback(session), options);
    return result as T;
  } finally {
    await session.endSession();
  }
}

/**
 * Get connection statistics
 */
async;
getStats();
: Promise<any>
{
  if (!this.db) {
    throw new Error('Database not connected');
  }

  const stats = await this.db.stats();
  const serverStatus = await this.db.admin().serverStatus();

  return {
      database: stats,
      server: {
        connections: serverStatus.connections,
        network: serverStatus.network,
        opcounters: serverStatus.opcounters,
        mem: serverStatus.mem,
      },
    };
}
}

// Export singleton instance
let mongoConnection: MongoDBConnection | null = null;

export function getMongoConnection(config?: MongoDBConfig): MongoDBConnection {
  if (!mongoConnection && config) {
    mongoConnection = new MongoDBConnection(config);
  }

  if (!mongoConnection) {
    throw new Error('MongoDB connection not initialized. Provide config on first call.');
  }

  return mongoConnection;
}

export default MongoDBConnection;

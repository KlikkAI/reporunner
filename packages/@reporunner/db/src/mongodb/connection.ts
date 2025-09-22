import {
  MongoClient,
  Db,
  Collection,
  MongoClientOptions,
  ServerApiVersion,
} from "mongodb";
import { EventEmitter } from "events";

export interface MongoDBConfig {
  uri: string;
  database: string;
  options?: MongoClientOptions;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxIdleTimeMS?: number;
  waitQueueTimeoutMS?: number;
  retryWrites?: boolean;
  retryReads?: boolean;
}

export class MongoDBConnection extends EventEmitter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoDBConfig;
  private isConnected: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(config: MongoDBConfig) {
    super();
    this.config = {
      ...config,
      options: {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: config.maxPoolSize || 100,
        minPoolSize: config.minPoolSize || 10,
        maxIdleTimeMS: config.maxIdleTimeMS || 60000,
        waitQueueTimeoutMS: config.waitQueueTimeoutMS || 5000,
        retryWrites: config.retryWrites !== false,
        retryReads: config.retryReads !== false,
        ...config.options,
      },
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        console.log("MongoDB already connected");
        return;
      }

      console.log("Connecting to MongoDB...");
      this.client = new MongoClient(this.config.uri, this.config.options);

      // Setup event listeners
      this.setupEventListeners();

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`Connected to MongoDB database: ${this.config.database}`);
      this.emit("connected");

      // Verify connection
      await this.ping();
    } catch (error) {
      console.error("MongoDB connection error:", error);
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Setup MongoDB event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on("serverOpening", () => {
      console.log("MongoDB server opening");
    });

    this.client.on("serverClosed", () => {
      console.log("MongoDB server closed");
    });

    this.client.on("serverDescriptionChanged", (event) => {
      console.log("MongoDB server description changed:", event);
    });

    this.client.on("error", (error) => {
      console.error("MongoDB client error:", error);
      this.emit("error", error);
      this.handleConnectionError();
    });

    this.client.on("close", () => {
      console.log("MongoDB connection closed");
      this.isConnected = false;
      this.emit("disconnected");
      this.handleConnectionError();
    });
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(): void {
    if (this.reconnectInterval) return;

    this.isConnected = false;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      this.emit("reconnectFailed");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms...`);

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      this.reconnectAttempts++;

      try {
        await this.connect();
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
        this.handleConnectionError();
      }
    }, delay);
  }

  /**
   * Ping the database to verify connection
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const result = await this.db.admin().ping();
      return result.ok === 1;
    } catch (error) {
      console.error("MongoDB ping failed:", error);
      return false;
    }
  }

  /**
   * Get database instance
   */
  getDatabase(): Db {
    if (!this.db) {
      throw new Error("MongoDB not connected. Call connect() first.");
    }
    return this.db;
  }

  /**
   * Get collection
   */
  getCollection<T = any>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error("MongoDB not connected. Call connect() first.");
    }
    return this.db.collection<T>(name);
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reconnectInterval) {
        clearTimeout(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.isConnected = false;
        console.log("Disconnected from MongoDB");
        this.emit("disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected && this.client !== null && this.db !== null;
  }

  /**
   * Create indexes
   */
  async createIndexes(
    indexes: Array<{
      collection: string;
      index: any;
      options?: any;
    }>,
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not connected");
    }

    for (const indexConfig of indexes) {
      const collection = this.db.collection(indexConfig.collection);
      await collection.createIndex(
        indexConfig.index,
        indexConfig.options || {},
      );
      console.log(
        `Created index on ${indexConfig.collection}:`,
        indexConfig.index,
      );
    }
  }

  /**
   * Run a transaction
   */
  async runTransaction<T>(
    callback: (session: any) => Promise<T>,
    options?: any,
  ): Promise<T> {
    if (!this.client) {
      throw new Error("MongoDB client not connected");
    }

    const session = this.client.startSession();

    try {
      const result = await session.withTransaction(
        async () => callback(session),
        options,
      );
      return result as T;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<any> {
    if (!this.db) {
      throw new Error("Database not connected");
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
    throw new Error(
      "MongoDB connection not initialized. Provide config on first call.",
    );
  }

  return mongoConnection;
}

export default MongoDBConnection;

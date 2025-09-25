import { EventEmitter } from 'node:events';
import {
  type Collection,
  type Db,
  type Document,
  MongoClient,
  type MongoClientOptions,
  ServerApiVersion,
} from 'mongodb';

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
        return;
      }
      this.client = new MongoClient(this.config.uri, this.config.options);

      // Setup event listeners
      this.setupEventListeners();

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Verify connection
      await this.ping();
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Setup MongoDB event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('serverOpening', () => {});

    this.client.on('serverClosed', () => {});

    this.client.on('serverDescriptionChanged', (_event: any) => {});

    this.client.on('error', (error: any) => {
      this.emit('error', error);
      this.handleConnectionError();
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.emit('disconnected');
      this.handleConnectionError();

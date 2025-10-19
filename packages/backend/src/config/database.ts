/**
 * Database configuration
 */

import mongoose from 'mongoose';
import { ConfigService } from './ConfigService.js';

export class DatabaseConfig {
  private static instance: DatabaseConfig;
  private configService: ConfigService;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public getConnectionOptions(): mongoose.ConnectOptions {
    return {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };
  }

  public getConnectionString(): string {
    return this.configService.getDatabaseConfig().uri;
  }

  public async connect(): Promise<void> {
    await mongoose.connect(this.getConnectionString(), this.getConnectionOptions());
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

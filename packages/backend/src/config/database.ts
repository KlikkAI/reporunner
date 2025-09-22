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
    try {
      await mongoose.connect(this.getConnectionString(), this.getConnectionOptions());
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected successfully');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }
}

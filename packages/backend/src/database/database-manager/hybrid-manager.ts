// Hybrid database manager reusing patterns from core repository patterns
import type { DatabaseConfig } from '../types/config-schemas';
import { DatabaseConnectionOrchestrator } from './connection-orchestration';
import { DatabaseHealthMonitor } from './health-monitoring';

export interface HybridDatabaseManager {
  initialize(config: DatabaseConfig): Promise<void>;
  getMongoConnection(): any;
  getPostgreSQLConnection(): any;
  shutdown(): Promise<void>;
  getHealthStatus(): Promise<any>;
}

export class HybridDatabaseManagerImpl implements HybridDatabaseManager {
  private orchestrator: DatabaseConnectionOrchestrator;
  private healthMonitor: DatabaseHealthMonitor;

  constructor() {
    this.orchestrator = new DatabaseConnectionOrchestrator();
    this.healthMonitor = new DatabaseHealthMonitor();
  }

  async initialize(_config: DatabaseConfig): Promise<void> {
    await this.orchestrator.initializeConnections();
    this.healthMonitor.startMonitoring();
  }

  getMongoConnection(): any {
    return this.orchestrator.getMongoConnection();
  }

  getPostgreSQLConnection(): any {
    return this.orchestrator.getPostgreSQLConnection();
  }

  async shutdown(): Promise<void> {
    this.healthMonitor.stopMonitoring();
    await this.orchestrator.closeConnections();
  }

  async getHealthStatus(): Promise<any> {
    return this.healthMonitor.checkHealth();
  }
}

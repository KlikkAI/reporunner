/**
 * Migration system types and interfaces
 */

export interface IMigration {
  id: string;
  name: string;
  description?: string;
  version: string;
  database: 'mongodb' | 'postgresql' | 'both';
  dependencies?: string[]; // Migration IDs that must run before this one
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface IMigrationRecord {
  id: string;
  name: string;
  version: string;
  database: 'mongodb' | 'postgresql' | 'both';
  executedAt: Date;
  executionTime: number; // in milliseconds
  checksum?: string; // For integrity verification
}

export interface IMigrationResult {
  success: boolean;
  migration: IMigration;
  executionTime: number;
  error?: Error;
}

export interface IMigrationStatus {
  migration: IMigration;
  status: 'pending' | 'executed' | 'error' | 'rollback';
  executedAt?: Date;
  error?: string;
}

export abstract class BaseMigration implements IMigration {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract database: 'mongodb' | 'postgresql' | 'both';

  description?: string;
  dependencies?: string[];

  abstract up(): Promise<void>;
  abstract down(): Promise<void>;

  protected log(message: string): void {
    console.log(`[Migration ${this.id}] ${message}`);
  }

  protected error(message: string, error?: Error): void {
    console.error(`[Migration ${this.id}] ERROR: ${message}`, error);
  }

  // Generate checksum for migration integrity
  getChecksum(): string {
    const content = `${this.id}-${this.name}-${this.version}-${this.up.toString()}-${this.down.toString()}`;
    return require('node:crypto')
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }
}

export interface IMigrationManager {
  initialize(): Promise<void>;
  getMigrations(): IMigration[];
  getExecutedMigrations(): Promise<IMigrationRecord[]>;
  getPendingMigrations(): Promise<IMigration[]>;
  runMigrations(targetVersion?: string): Promise<IMigrationResult[]>;
  rollbackMigrations(targetVersion: string): Promise<IMigrationResult[]>;
  getStatus(): Promise<IMigrationStatus[]>;
  createMigration(name: string, database: 'mongodb' | 'postgresql' | 'both'): Promise<string>;
}

// Migration configuration
export interface IMigrationConfig {
  mongodb: {
    enabled: boolean;
    migrationsCollection: string;
  };
  postgresql: {
    enabled: boolean;
    migrationsTable: string;
    schema?: string;
  };
  migrationsDir: string;
  lockTimeout: number; // milliseconds
  autoBackup: boolean;
}

export const DEFAULT_MIGRATION_CONFIG: IMigrationConfig = {
  mongodb: {
    enabled: true,
    migrationsCollection: 'migrations',
  },
  postgresql: {
    enabled: true,
    migrationsTable: 'migrations',
    schema: 'public',
  },
  migrationsDir: './src/migrations/versions',
  lockTimeout: 300000, // 5 minutes
  autoBackup: false,
};

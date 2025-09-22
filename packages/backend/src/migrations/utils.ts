/**
 * Migration utilities and helpers
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { IMigration, IMigrationRecord } from "./types.js";

export class MigrationUtils {
  /**
   * Generate a migration filename with timestamp
   */
  static generateMigrationFilename(name: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.]/g, "")
      .substring(0, 15);
    const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `${timestamp}_${kebabName}.ts`;
  }

  /**
   * Generate migration version from timestamp
   */
  static generateVersion(): string {
    return new Date().toISOString().replace(/[-:.]/g, "").substring(0, 15);
  }

  /**
   * Load migration files from directory
   */
  static async loadMigrations(migrationsDir: string): Promise<IMigration[]> {
    try {
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"))
        .sort(); // Ensure chronological order

      const migrations: IMigration[] = [];

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const migrationModule = await import(filePath);

        // Support both default export and named export
        const migration = migrationModule.default || migrationModule.migration;

        if (
          migration &&
          typeof migration.up === "function" &&
          typeof migration.down === "function"
        ) {
          migrations.push(migration);
        } else {
          console.warn(`Invalid migration file: ${file}`);
        }
      }

      return migrations;
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        // Migrations directory doesn't exist yet
        await fs.mkdir(migrationsDir, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  /**
   * Validate migration dependencies
   */
  static validateDependencies(migrations: IMigration[]): void {
    const migrationIds = new Set(migrations.map((m) => m.id));

    for (const migration of migrations) {
      if (migration.dependencies) {
        for (const depId of migration.dependencies) {
          if (!migrationIds.has(depId)) {
            throw new Error(
              `Migration ${migration.id} has unresolved dependency: ${depId}`,
            );
          }
        }
      }
    }
  }

  /**
   * Sort migrations by dependencies and version
   */
  static sortMigrations(migrations: IMigration[]): IMigration[] {
    const sorted: IMigration[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (migration: IMigration) => {
      if (visiting.has(migration.id)) {
        throw new Error(
          `Circular dependency detected involving migration: ${migration.id}`,
        );
      }

      if (visited.has(migration.id)) {
        return;
      }

      visiting.add(migration.id);

      // Visit dependencies first
      if (migration.dependencies) {
        for (const depId of migration.dependencies) {
          const depMigration = migrations.find((m) => m.id === depId);
          if (depMigration) {
            visit(depMigration);
          }
        }
      }

      visiting.delete(migration.id);
      visited.add(migration.id);
      sorted.push(migration);
    };

    // Sort by version first, then resolve dependencies
    const versionSorted = [...migrations].sort((a, b) =>
      a.version.localeCompare(b.version),
    );

    for (const migration of versionSorted) {
      visit(migration);
    }

    return sorted;
  }

  /**
   * Calculate migration checksum for integrity verification
   */
  static calculateChecksum(migration: IMigration): string {
    const content = JSON.stringify({
      id: migration.id,
      name: migration.name,
      version: migration.version,
      database: migration.database,
      upContent: migration.up.toString(),
      downContent: migration.down.toString(),
    });

    return crypto
      .createHash("sha256")
      .update(content)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Format execution time in human-readable format
   */
  static formatExecutionTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    }
  }

  /**
   * Create migration template
   */
  static createMigrationTemplate(
    name: string,
    database: "mongodb" | "postgresql" | "both",
    version: string,
  ): string {
    const className = name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    return `import { BaseMigration } from '../types.js';
${database === "mongodb" || database === "both" ? "import mongoose from 'mongoose';" : ""}
${database === "postgresql" || database === "both" ? "import { PostgreSQLConfig } from '../../config/postgresql.js';" : ""}

/**
 * Migration: ${name}
 * Database: ${database}
 * Version: ${version}
 * 
 * Description: 
 * Add your migration description here
 */
export class ${className}Migration extends BaseMigration {
  id = '${version}_${name.replace(/[^a-z0-9]+/g, "_")}';
  name = '${name}';
  version = '${version}';
  database = '${database}' as const;
  description = 'Add migration description here';

  async up(): Promise<void> {
    this.log('Starting migration...');
    
    try {
      ${
        database === "mongodb" || database === "both"
          ? `
      // MongoDB operations
      if (this.database === 'mongodb' || this.database === 'both') {
        // Add your MongoDB migration code here
        // Example:
        // await mongoose.connection.db.collection('users').createIndex({ email: 1 });
      }`
          : ""
      }
      
      ${
        database === "postgresql" || database === "both"
          ? `
      // PostgreSQL operations
      if (this.database === 'postgresql' || this.database === 'both') {
        const pg = PostgreSQLConfig.getInstance();
        
        // Add your PostgreSQL migration code here
        // Example:
        // await pg.query(\`
        //   CREATE TABLE IF NOT EXISTS example_table (
        //     id SERIAL PRIMARY KEY,
        //     name VARCHAR(255) NOT NULL,
        //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        //   )
        // \`);
      }`
          : ""
      }
      
      this.log('Migration completed successfully');
    } catch (error) {
      this.error('Migration failed', error as Error);
      throw error;
    }
  }

  async down(): Promise<void> {
    this.log('Starting rollback...');
    
    try {
      ${
        database === "mongodb" || database === "both"
          ? `
      // MongoDB rollback operations
      if (this.database === 'mongodb' || this.database === 'both') {
        // Add your MongoDB rollback code here
        // Example:
        // await mongoose.connection.db.collection('users').dropIndex({ email: 1 });
      }`
          : ""
      }
      
      ${
        database === "postgresql" || database === "both"
          ? `
      // PostgreSQL rollback operations
      if (this.database === 'postgresql' || this.database === 'both') {
        const pg = PostgreSQLConfig.getInstance();
        
        // Add your PostgreSQL rollback code here
        // Example:
        // await pg.query('DROP TABLE IF EXISTS example_table');
      }`
          : ""
      }
      
      this.log('Rollback completed successfully');
    } catch (error) {
      this.error('Rollback failed', error as Error);
      throw error;
    }
  }
}

// Export default instance
export default new ${className}Migration();
`;
  }

  /**
   * Ensure migrations directory exists
   */
  static async ensureMigrationsDirectory(migrationsDir: string): Promise<void> {
    try {
      await fs.access(migrationsDir);
    } catch {
      await fs.mkdir(migrationsDir, { recursive: true });
    }
  }

  /**
   * Get migration file path
   */
  static getMigrationFilePath(migrationsDir: string, filename: string): string {
    return path.resolve(migrationsDir, filename);
  }

  /**
   * Validate migration record integrity
   */
  static validateMigrationIntegrity(
    migration: IMigration,
    record: IMigrationRecord,
  ): boolean {
    const currentChecksum = this.calculateChecksum(migration);
    return !record.checksum || record.checksum === currentChecksum;
  }
}

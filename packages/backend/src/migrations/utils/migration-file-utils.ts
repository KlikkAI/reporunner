/**
 * Migration utilities and helpers
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { IMigration, IMigrationRecord } from './types.js';

export class MigrationUtils {
  /**
   * Generate a migration filename with timestamp
   */
  static generateMigrationFilename(name: string): string {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15);
    const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${timestamp}_${kebabName}.ts`;
  }

  /**
   * Generate migration version from timestamp
   */
  static generateVersion(): string {
    return new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15);
  }

  /**
   * Load migration files from directory
   */
  static async loadMigrations(migrationsDir: string): Promise<IMigration[]> {
    try {
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
        .sort(); // Ensure chronological order

      const migrations: IMigration[] = [];

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const migrationModule = await import(filePath);

        // Support both default export and named export
        const migration = migrationModule.default || migrationModule.migration;

        if (
          migration &&
          typeof migration.up === 'function' &&
          typeof migration.down === 'function'
        ) {
          migrations.push(migration);
        } else {
          console.warn(`Invalid migration file: ${file}`);
        }
      }

      return migrations;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
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
            throw new Error(`Migration ${migration.id} has unresolved dependency: ${depId}`);
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
        throw new Error(`Circular dependency detected involving migration: ${migration.id}`);
      }

      if (visited.has(migration.id)) {
        return;
      }

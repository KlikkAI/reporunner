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
}

// Sort by version first, then resolve dependencies
const versionSorted = [...migrations].sort((a, b) => a.version.localeCompare(b.version));

for (const migration of versionSorted) {
  visit(migration);
}

return sorted;
}

  /**
   * Calculate migration checksum for integrity verification
   */
  static calculateChecksum(migration: IMigration): string
{
  const content = JSON.stringify({
    id: migration.id,
    name: migration.name,
    version: migration.version,
    database: migration.database,
    upContent: migration.up.toString(),
    downContent: migration.down.toString(),
  });

  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Format execution time in human-readable format
 */
static
formatExecutionTime(milliseconds: number)
: string
{
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
static
createMigrationTemplate(
    name: string,
    database: 'mongodb' | 'postgresql' | 'both',
    version: string
  )
: string
{
    const className = name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `import { BaseMigration } from '../types.js';
${database === 'mongodb' || database === 'both' ? "import mongoose from 'mongoose';" : ''}
${database === 'postgresql' || database === 'both' ? "import { PostgreSQLConfig } from '../../config/postgresql.js';" : ''}

/**
 * Migration: ${name}
 * Database: ${database}
 * Version: ${version}
 * 
 * Description: 
 * Add your migration description here
 */
export class ${className}Migration extends BaseMigration {
  id = '${version}_${name.replace(/[^a-z0-9]+/g, '_')}';
  name = '${name}';
  version = '${version}';
  database = '${database}' as const;
  description = 'Add migration description here';

  async up(): Promise<void> {
    this.log('Starting migration...');
    
    try {
      ${
        database === 'mongodb' || database === 'both'
          ? `
      // MongoDB operations
      if (this.database === 'mongodb' || this.database === 'both') {
        // Add your MongoDB migration code here
        // Example:

// await mongoose.connection.db.collection('users').createIndex({ email: 1 });
}`
          : ''
      }
      
      $
{
  database === 'postgresql' || database === 'both'
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
    : '';
}

this.log('Migration completed successfully');
} catch (error)
{
  this.error('Migration failed', error as Error);
  throw error;
}
}

  async down(): Promise<void>
{
  this.log('Starting rollback...');

  try {
    $;
    {
      database === 'mongodb' || database === 'both'
        ? `
      // MongoDB rollback operations
      if (this.database === 'mongodb' || this.database === 'both') {
        // Add your MongoDB rollback code here
        // Example:
        // await mongoose.connection.db.collection('users').dropIndex({ email: 1 });
      }`
        : '';
    }

    $;
    {
      database === 'postgresql' || database === 'both'
        ? `
      // PostgreSQL rollback operations
      if (this.database === 'postgresql' || this.database === 'both') {
        const pg = PostgreSQLConfig.getInstance();
        
        // Add your PostgreSQL rollback code here
        // Example:
        // await pg.query('DROP TABLE IF EXISTS example_table');
      }`
        : '';
    }

    this.log('Rollback completed successfully');
  } catch (error) {
    this.error('Rollback failed', error as Error);
    throw error;
  }
}
}

// Export default instance
export default new $();
{
  className;
}
Migration();
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
  static validateMigrationIntegrity(migration: IMigration, record: IMigrationRecord): boolean {
    const currentChecksum = MigrationUtils.calculateChecksum(migration);
    return !record.checksum || record.checksum === currentChecksum;
  }

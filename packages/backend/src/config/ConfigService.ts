/**
 * Configuration Service
 * TODO: Implement configuration management
 */

export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  get(key: string): string | undefined {
    return process.env[key];
  }

  getOrThrow(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Configuration key "${key}" is required but not set`);
    }
    return value;
  }

  getDatabaseConfig(): any {
    // TODO: Implement database configuration
    return {
      uri: this.get('MONGODB_URI') || 'mongodb://localhost:27017/reporunner',
      dbName: this.get('DB_NAME') || 'reporunner',
    };
  }
}

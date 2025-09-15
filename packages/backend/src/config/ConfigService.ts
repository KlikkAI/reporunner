/**
 * Configuration service for managing environment variables and settings
 */
export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get environment variable with default value
   */
  get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue!;
  }

  /**
   * Get required environment variable (throws if not set)
   */
  getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
  }

  /**
   * Get environment variable as number
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`);
      }
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return parsed;
  }

  /**
   * Get environment variable as boolean
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`);
      }
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return this.get('NODE_ENV', 'development') === 'development';
  }

  /**
   * Check if we're in production mode
   */
  isProduction(): boolean {
    return this.get('NODE_ENV', 'development') === 'production';
  }

  /**
   * Check if we're in test mode
   */
  isTest(): boolean {
    return this.get('NODE_ENV', 'development') === 'test';
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      uri: this.getRequired('MONGODB_URI'),
    };
  }

  /**
   * Get JWT configuration
   */
  getJWTConfig() {
    return {
      secret: this.getRequired('JWT_SECRET'),
      expiresIn: this.get('JWT_EXPIRES_IN', '7d'),
      refreshExpiresIn: this.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    };
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return {
      port: this.getNumber('PORT', 5000),
      nodeEnv: this.get('NODE_ENV', 'development'),
      corsOrigin: this.get('CORS_ORIGIN', 'http://localhost:3000'),
    };
  }

  /**
   * Get OAuth configuration
   */
  getOAuthConfig() {
    return {
      googleClientId: this.getRequired('GOOGLE_OAUTH_CLIENT_ID'),
      googleClientSecret: this.getRequired('GOOGLE_OAUTH_CLIENT_SECRET'),
      protocol: this.get('OAUTH_PROTOCOL'),
    };
  }

  /**
   * Get encryption configuration
   */
  getEncryptionConfig() {
    return {
      credentialKey: this.getRequired('CREDENTIAL_ENCRYPTION_KEY'),
      bcryptRounds: this.getNumber('BCRYPT_SALT_ROUNDS', 12),
    };
  }
}
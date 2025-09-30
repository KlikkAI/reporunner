// Configuration Service
// Provides configuration management for the application

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Config {
  logLevel: LogLevel;
  apiUrl: string;
  isDevelopment: boolean;
  version: string;
}

class ConfigService {
  private config: Config;

  constructor() {
    this.config = {
      logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      isDevelopment: import.meta.env.DEV,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value;
  }

  getAll(): Config {
    return { ...this.config };
  }

  isProduction(): boolean {
    return !this.config.isDevelopment;
  }

  isDevelopmentMode(): boolean {
    return this.config.isDevelopment;
  }
}

export const configService = new ConfigService();
export type { Config };

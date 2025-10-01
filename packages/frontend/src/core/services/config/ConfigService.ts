// Configuration Service
// Provides configuration management for the application

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  bufferSize: number;
}

interface FeatureFlags {
  enablePerformanceMonitoring: boolean;
  enableErrorReporting: boolean;
  enableRemoteLogging: boolean;
  enableAnalytics: boolean;
  enableDevTools: boolean;
}

interface Config {
  logLevel: LogLevel;
  apiUrl: string;
  isDevelopment: boolean;
  version: string;
  logging: LoggingConfig;
  features: FeatureFlags;
  environment: 'development' | 'staging' | 'production';
}

class ConfigService {
  private config: Config;

  constructor() {
    const logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
    const isDev = import.meta.env.DEV;
    const environment = (import.meta.env.VITE_ENVIRONMENT as Config['environment']) ||
                       (isDev ? 'development' : 'production');

    this.config = {
      logLevel,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
      isDevelopment: isDev,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment,
      logging: {
        level: logLevel,
        enableConsole: true,
        enableRemote: false,
        remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
        bufferSize: 100,
      },
      features: {
        enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' || isDev,
        enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true' || !isDev,
        enableRemoteLogging: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true' || false,
        enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,
        enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || isDev,
      },
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

  getConfig(): Config {
    return this.getAll();
  }

  getEnvironment(): Config['environment'] {
    return this.config.environment;
  }

  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  isProduction(): boolean {
    return !this.config.isDevelopment;
  }

  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  isDevelopmentMode(): boolean {
    return this.config.isDevelopment;
  }
}

export const configService = new ConfigService();
export type { Config, FeatureFlags, LoggingConfig };

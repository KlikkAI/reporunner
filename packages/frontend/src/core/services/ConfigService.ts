// Configuration service for managing app settings
import { config as environmentConfig } from '../config/environment';

export interface ApiEndpoints {
  auth: string;
  workflows: string;
  executions: string;
  credentials: string;
  integrations: string;
  users: string;
  organizations: string;
}

export interface AppConfig {
  apiBaseUrl: string;
  api: {
    baseUrl: string;
    timeout: number;
  };
  endpoints: ApiEndpoints;
  timeout: number;
  retryAttempts: number;
  enableCaching: boolean;
  features: {
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
    enablePerformanceMonitoring?: boolean;
    enableAnalytics?: boolean;
    enableErrorReporting?: boolean;
    enableMockData?: boolean;
    enableDebug?: boolean;
  };
  logging?: {
    level: string;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    bufferSize: number;
  };
  performance?: {
    renderTimeThreshold: number;
    bundleSizeWarningThreshold: number;
  };
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
  };
}

export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.buildConfig();
  }

  private buildConfig(): AppConfig {
    const baseUrl = environmentConfig.apiBaseUrl;

    return {
      apiBaseUrl: baseUrl,
      api: {
        baseUrl: baseUrl,
        timeout: 30000, // 30 seconds
      },
      endpoints: {
        auth: `${baseUrl}/auth`,
        workflows: `${baseUrl}/workflows`,
        executions: `${baseUrl}/executions`,
        credentials: `${baseUrl}/credentials`,
        integrations: `${baseUrl}/integrations`,
        users: `${baseUrl}/users`,
        organizations: `${baseUrl}/organizations`,
      },
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      enableCaching: true,
      features: {
        ...environmentConfig.features,
        enablePerformanceMonitoring: true,
        enableAnalytics: true,
        enableErrorReporting: true,
        enableMockData: false,
        enableDebug: import.meta.env.DEV,
      },
      logging: {
        level: 'info',
        enableConsole: true,
        enableRemote: false,
        bufferSize: 100,
      },
      performance: {
        renderTimeThreshold: 16, // 16ms = 60fps
        bundleSizeWarningThreshold: 500000, // 500KB
      },
      auth: {
        tokenKey: 'auth_token',
        refreshTokenKey: 'refresh_token',
      },
    };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  getApiEndpoint(endpoint: keyof ApiEndpoints): string {
    return this.config.endpoints[endpoint];
  }

  getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature] ?? false;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  getEnvironment(): string {
    return import.meta.env.MODE || 'development';
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
}

export const configService = new ConfigService();

// LogLevel type for logging service
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

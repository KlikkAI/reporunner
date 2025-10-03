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
  endpoints: ApiEndpoints;
  timeout: number;
  retryAttempts: number;
  enableCaching: boolean;
  features: {
    aiAssistant: boolean;
    collaboration: boolean;
    analytics: boolean;
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
      features: environmentConfig.features,
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
    return this.config.features[feature];
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export const configService = new ConfigService();

// LogLevel type for logging service
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

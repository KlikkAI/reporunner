import { EventEmitter } from 'node:events';

export interface IntegrationConfig {
  name: string;
  displayName: string;
  description: string;
  version: string;
  icon?: string;
  color?: string;
  categories: string[];
  documentationUrl?: string;
  authType: 'none' | 'apiKey' | 'oauth2' | 'basic' | 'custom';
  baseUrl?: string;
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
}

export interface IntegrationCredentials {
  type: string;
  data: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface IntegrationContext {
  userId: string;
  organizationId: string;
  workflowId: string;
  executionId: string;
  credentials?: IntegrationCredentials;
  metadata?: Record<string, any>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, any>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface IntegrationError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
  retryable?: boolean;
}

export abstract class BaseIntegration extends EventEmitter {
  protected config: IntegrationConfig;
  protected context?: IntegrationContext;
  protected credentials?: IntegrationCredentials;
  private requestCount: number = 0;
  private requestResetTime: number = Date.now();

  constructor(config: IntegrationConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the integration with context
   */
  async initialize(context: IntegrationContext): Promise<void> {
    this.context = context;
    this.credentials = context.credentials;

    // Validate credentials if required
    if (this.config.authType !== 'none' && !this.credentials) {
      throw this.createError(
        'MISSING_CREDENTIALS',
        'Credentials are required for this integration'
      );
    }

    // Perform any integration-specific initialization
    await this.onInitialize();

    this.emit('initialized', { integration: this.config.name, context });
  }

  /**
   * Abstract method for integration-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Test the connection to the integration
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get available actions for this integration
   */
  abstract getActions(): Promise<IntegrationAction[]>;

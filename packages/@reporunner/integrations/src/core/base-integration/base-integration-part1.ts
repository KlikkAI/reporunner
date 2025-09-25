import { EventEmitter } from 'node:events';
import type { AxiosInstance } from 'axios';
import type { OAuth2Handler } from '../auth/oauth2-handler';
import type { CredentialManager } from '../security/credential-manager';
import { WebhookManager } from '../webhook/webhook-manager';

export interface IntegrationConfig {
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  author?: string;
  documentation?: string;
  requiredCredentials?: string[];
  optionalCredentials?: string[];
  supportedFeatures?: string[];
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
  webhooks?: {
    enabled: boolean;
    basePath?: string;
  };
  oauth?: {
    enabled: boolean;
    provider?: string;
  };
}

export interface IntegrationState {
  status: 'initializing' | 'connected' | 'disconnected' | 'error' | 'suspended';
  lastActivity?: Date;
  errorMessage?: string;
  errorCount: number;
  metadata?: Record<string, any>;
}

export interface IntegrationContext {
  userId: string;
  workspaceId?: string;
  environment?: 'development' | 'staging' | 'production';
  settings?: Record<string, any>;
}

export abstract class BaseIntegration extends EventEmitter {
  protected config: IntegrationConfig;
  protected state: IntegrationState;
  protected context?: IntegrationContext;
  protected httpClient?: AxiosInstance;
  protected webhookManager?: WebhookManager;
  protected oauth2Handler?: OAuth2Handler;
  protected credentialManager?: CredentialManager;
  private initializationPromise?: Promise<void>;
  private heartbeatInterval?: NodeJS.Timeout;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(config: IntegrationConfig) {
    super();
    this.config = config;
    this.state = {
      status: 'initializing',
      errorCount: 0,
    };
  }

  /**
   * Initialize the integration
   */
  async initialize(context: IntegrationContext): Promise<void> {
    // Prevent multiple initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(context);
    return this.initializationPromise;
  }

  /**
   * Perform initialization
   */
  private async performInitialization(context: IntegrationContext): Promise<void> {
    try {
      this.context = context;
      this.setState('initializing');

      // Validate configuration
      await this.validateConfiguration();

      // Setup components
      await this.setupComponents();

      // Call abstract initialization method
      await this.onInitialize();

// Start heartbeat

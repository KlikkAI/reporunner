WebhookRegistration,
  webhookManager,
} from './webhook/webhook-manager'

/**
 * Integration Framework Factory
 *
 * Main entry point for creating and managing integrations
 */
export class IntegrationFramework {
  private static instance: IntegrationFramework;

  public readonly registry = integrationRegistry;
  public readonly eventBus = integrationEventBus;
  public readonly webhookManager = webhookManager;
  public readonly healthMonitor = healthMonitor;
  public readonly rateLimiter = rateLimiter;
  public readonly configValidator = configValidator;
  public readonly tester = integrationTester;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationFramework {
    if (!IntegrationFramework.instance) {
      IntegrationFramework.instance = new IntegrationFramework();
    }
    return IntegrationFramework.instance;
  }

  /**
   * Initialize framework with configuration
   */
  async initialize(config?: {
    masterKey?: string;
    eventBusConfig?: any;
    healthCheckInterval?: number;
  }): Promise<void> {
    // Initialize credential manager with master key if provided
    if (config?.masterKey) {
      getCredentialManager(config.masterKey);
    }

    // Configure event bus
    if (config?.eventBusConfig) {
      // Apply event bus configuration
      Object.assign(this.eventBus, config.eventBusConfig);
    }

    // Setup global health monitoring
    if (config?.healthCheckInterval) {
      // Configure health check interval
    }
  }

  /**
   * Register a new integration
   */
  registerIntegration(definition: any): void {
    this.registry.registerDefinition(definition);
  }

  /**
   * Create integration instance
   */
  async createIntegration(name: string, context: any): Promise<string> {
    return this.registry.createInstance(name, context);
  }

  /**
   * Execute integration action
   */
  async executeAction(instanceId: string, action: string, params: any): Promise<any> {
    return this.registry.executeAction(instanceId, action, params);
  }

  /**
   * Get integration health
   */
  getHealth(integrationName?: string): any {
    return this.healthMonitor.getHealthStatus(integrationName);
  }

  /**
   * Configure rate limiting
   */
  configureRateLimit(config: any): void {
    this.rateLimiter.configure(config);
  }

  /**
   * Register webhook
   */
  registerWebhook(integrationName: string, config: any, handler: any): string {
    return this.webhookManager.registerWebhook(integrationName, config, handler);
  }

/**

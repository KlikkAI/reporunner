/**
 * @reporunner/integrations - Integration Framework
 *
 * A comprehensive framework for building and managing integrations
 * with third-party services in the RepoRunner platform.
 */

// Core components
export {
  BaseIntegration,
  IntegrationConfig,
  IntegrationState,
  IntegrationContext,
} from "./core/base-integration";

export {
  IntegrationRegistry,
  IntegrationDefinition,
  IntegrationInstance,
  IntegrationFilter,
  integrationRegistry,
} from "./core/integration-registry";

export {
  IntegrationEventBus,
  EventPayload,
  EventSubscription,
  EventHandler,
  EventFilter,
  EventChannel,
  EventBusConfig,
  integrationEventBus,
} from "./core/event-bus";

// Authentication
export {
  OAuth2Handler,
  OAuth2Config,
  OAuth2Token,
  OAuth2Session,
  AuthorizationRequest,
} from "./auth/oauth2-handler";

// Security
export {
  CredentialManager,
  Credential,
  EncryptedData,
  CredentialFilter,
  CredentialRotationPolicy,
  getCredentialManager,
} from "./security/credential-manager";

// Webhooks
export {
  WebhookManager,
  WebhookConfig,
  WebhookRegistration,
  WebhookEvent,
  WebhookHandler,
  webhookManager,
} from "./webhook/webhook-manager";

// Configuration
export {
  ConfigurationValidator,
  BaseIntegrationConfig,
  GitHubIntegrationConfig,
  SlackIntegrationConfig,
  JiraIntegrationConfig,
  ApiKeySchema,
  OAuth2ConfigSchema,
  WebhookConfigSchema,
  RateLimitConfigSchema,
  ConnectionConfigSchema,
  BaseIntegrationConfigSchema,
  GitHubIntegrationConfigSchema,
  SlackIntegrationConfigSchema,
  JiraIntegrationConfigSchema,
  configValidator,
} from "./config/configuration-schema";

// Utilities
export {
  RateLimiter,
  RateLimitConfig,
  RateLimitEntry,
  RateLimitStatus,
  rateLimiter,
} from "./utils/rate-limiter";

// Monitoring
export {
  IntegrationHealthMonitor,
  HealthCheck,
  HealthStatus,
  IntegrationHealth,
  IntegrationMetrics,
  healthMonitor,
} from "./monitoring/health-monitor";

// Testing
export {
  IntegrationTester,
  MockServer,
  MockServerConfig,
  MockResponse,
  RequestLog,
  IntegrationTestHarness,
  TestAssertion,
  integrationTester,
} from "./testing/test-framework";

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

    console.log("Integration Framework initialized");
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
  async executeAction(
    instanceId: string,
    action: string,
    params: any,
  ): Promise<any> {
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
    return this.webhookManager.registerWebhook(
      integrationName,
      config,
      handler,
    );
  }

  /**
   * Publish event
   */
  async publishEvent(
    source: string,
    event: string,
    data: any,
    metadata?: any,
  ): Promise<void> {
    await this.eventBus.publish(source, event, data, metadata);
  }

  /**
   * Subscribe to events
   */
  subscribeToEvents(
    pattern: string | RegExp,
    handler: any,
    options?: any,
  ): string {
    return this.eventBus.subscribe(pattern, handler, options);
  }

  /**
   * Get framework statistics
   */
  getStatistics(): {
    registry: any;
    eventBus: any;
    webhooks: any;
    health: any;
    rateLimit: any;
  } {
    return {
      registry: this.registry.getStatistics(),
      eventBus: this.eventBus.getStatistics(),
      webhooks: this.webhookManager.getStatistics(),
      health: this.healthMonitor.getSummary(),
      rateLimit: this.rateLimiter.getStatistics(),
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    // Destroy all integration instances
    const instances = this.registry.getAllInstances();
    for (const instance of instances) {
      await this.registry.destroyInstance(instance.id);
    }

    // Clear all components
    this.registry.clearAll();
    this.eventBus.clearAll();
    this.webhookManager.clearAll();
    this.healthMonitor.clearAll();
    this.rateLimiter.clearAll();

    console.log("Integration Framework shut down");
  }
}

// Export singleton instance
export const integrationFramework = IntegrationFramework.getInstance();

// Default export
export default IntegrationFramework;

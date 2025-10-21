/**
 * @reporunner/integrations - Integration Framework
 *
 * A comprehensive framework for building and managing integrations
 * with third-party services in the RepoRunner platform.
 */

// Import singleton instances and types for internal use
import { type ConfigurationValidator, configValidator } from './config/configuration-schema';
import { type IntegrationEventBus, integrationEventBus } from './core/event-bus';
import { type IntegrationRegistry, integrationRegistry } from './core/integration-registry';
import { healthMonitor, type IntegrationHealthMonitor } from './monitoring/health-monitor';
import { getCredentialManager } from './security/credential-manager';
import { type IntegrationTester, integrationTester } from './testing/test-framework';
import { type RateLimiter, rateLimiter } from './utils/rate-limiter';
import {
  type WebhookConfig,
  type WebhookEvent,
  type WebhookHandler,
  type WebhookManager,
  webhookManager,
} from './webhook/webhook-manager';

// Authentication
export {
  AuthorizationRequest,
  OAuth2Config,
  OAuth2Handler,
  OAuth2Session,
  OAuth2Token,
} from './auth/oauth2-handler';
// Core components
export {
  BaseIntegration,
  IntegrationConfig,
  IntegrationContext,
} from './base/base-integration';
// Configuration
export {
  ApiKeySchema,
  BaseIntegrationConfig,
  BaseIntegrationConfigSchema,
  ConfigurationValidator,
  ConnectionConfigSchema,
  configValidator,
  GitHubIntegrationConfig,
  GitHubIntegrationConfigSchema,
  JiraIntegrationConfig,
  JiraIntegrationConfigSchema,
  OAuth2ConfigSchema,
  RateLimitConfigSchema,
  SlackIntegrationConfig,
  SlackIntegrationConfigSchema,
  WebhookConfigSchema,
} from './config/configuration-schema';
// IntegrationState type
export type IntegrationState =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'executing'
  | 'error'
  | 'disposed';
export {
  EventBusConfig,
  EventChannel,
  EventFilter,
  EventHandler,
  EventPayload,
  EventSubscription,
  IntegrationEventBus,
  integrationEventBus,
} from './core/event-bus';
export {
  IntegrationDefinition,
  IntegrationFilter,
  IntegrationInstance,
  IntegrationRegistry,
  integrationRegistry,
} from './core/integration-registry';
// Monitoring
export {
  HealthCheck,
  HealthStatus,
  healthMonitor,
  IntegrationHealth,
  IntegrationHealthMonitor,
  IntegrationMetrics,
} from './monitoring/health-monitor';
// Security
export {
  Credential,
  CredentialFilter,
  CredentialManager,
  CredentialRotationPolicy,
  EncryptedData,
  getCredentialManager,
} from './security/credential-manager';
// Testing
export {
  IntegrationTester,
  IntegrationTestHarness,
  integrationTester,
  MockResponse,
  MockServer,
  MockServerConfig,
  RequestLog,
  TestAssertion,
} from './testing/test-framework';
// Utilities
export {
  RateLimitConfig,
  RateLimitEntry,
  RateLimiter,
  RateLimitStatus,
  rateLimiter,
} from './utils/rate-limiter';
// Webhooks
export {
  WebhookConfig,
  WebhookEvent,
  WebhookHandler,
  WebhookManager,
  WebhookRegistration,
  webhookManager,
} from './webhook/webhook-manager';

/**
 * Integration Framework Factory
 *
 * Main entry point for creating and managing integrations
 */
export class IntegrationFramework {
  private static instance: IntegrationFramework;

  public readonly registry: IntegrationRegistry = integrationRegistry;
  public readonly eventBus: IntegrationEventBus = integrationEventBus;
  public readonly webhookManager: WebhookManager = webhookManager;
  public readonly healthMonitor: IntegrationHealthMonitor = healthMonitor;
  public readonly rateLimiter: RateLimiter = rateLimiter;
  public readonly configValidator: ConfigurationValidator = configValidator;
  public readonly tester: IntegrationTester = integrationTester;

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
    eventBusConfig?: Record<string, unknown>;
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
  registerIntegration(definition: Record<string, unknown>): void {
    this.registry.registerDefinition(definition);
  }

  /**
   * Create integration instance
   */
  async createIntegration(name: string, context: Record<string, unknown>): Promise<string> {
    return this.registry.createInstance(name, context);
  }

  /**
   * Execute integration action
   */
  async executeAction(
    instanceId: string,
    action: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    return this.registry.executeAction(instanceId, action, params);
  }

  /**
   * Get integration health
   */
  getHealth(integrationName?: string): unknown {
    return this.healthMonitor.getHealthStatus(integrationName);
  }

  /**
   * Configure rate limiting
   */
  configureRateLimit(config: Record<string, unknown>): void {
    this.rateLimiter.configure(config);
  }

  /**
   * Register webhook
   */
  registerWebhook(
    integrationName: string,
    config: Record<string, unknown>,
    handler: (data: unknown) => void
  ): string {
    const webhookHandler: WebhookHandler = async (event: WebhookEvent) => {
      handler(event);
    };
    return this.webhookManager.registerWebhook(
      integrationName,
      config as unknown as WebhookConfig,
      webhookHandler
    );
  }

  /**
   * Publish event
   */
  async publishEvent(
    source: string,
    event: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.eventBus.publish(source, event, data, metadata);
  }

  /**
   * Subscribe to events
   */
  subscribeToEvents(
    pattern: string | RegExp,
    handler: (data: unknown) => void,
    options?: Record<string, unknown>
  ): string {
    return this.eventBus.subscribe(pattern, handler, options);
  }

  /**
   * Get framework statistics
   */
  getStatistics(): {
    registry: Record<string, unknown>;
    eventBus: Record<string, unknown>;
    webhooks: Record<string, unknown>;
    health: Record<string, unknown>;
    rateLimit: Record<string, unknown>;
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
  }
}

// Export singleton instance
export const integrationFramework = IntegrationFramework.getInstance();

// Default export
export default IntegrationFramework;

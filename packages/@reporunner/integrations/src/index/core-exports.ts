/**
 * @reporunner/integrations - Integration Framework
 *
 * A comprehensive framework for building and managing integrations
 * with third-party services in the RepoRunner platform.
 */

// Authentication
export {
  AuthorizationRequest,
  OAuth2Config,
  OAuth2Handler,
  OAuth2Session,
  OAuth2Token,
} from './auth/oauth2-handler';
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
// Core components
export {
  BaseIntegration,
  IntegrationConfig,
  IntegrationContext,
  IntegrationState,
} from './core/base-integration';
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

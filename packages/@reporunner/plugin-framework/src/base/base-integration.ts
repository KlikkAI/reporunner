import { EventEmitter } from "events";
import { z } from "zod";

export enum IntegrationType {
  OAUTH2 = "oauth2",
  API_KEY = "api_key",
  BASIC_AUTH = "basic_auth",
  CUSTOM = "custom",
}

export enum IntegrationCategory {
  COMMUNICATION = "communication",
  PRODUCTIVITY = "productivity",
  DEVELOPMENT = "development",
  DATABASE = "database",
  AI = "ai",
  ANALYTICS = "analytics",
  PAYMENT = "payment",
  STORAGE = "storage",
  MARKETING = "marketing",
}

export interface IntegrationMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: IntegrationCategory;
  icon?: string;
  documentation?: string;
  supportedTriggers?: string[];
  supportedActions?: string[];
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
}

export interface IntegrationCredentials {
  type: IntegrationType;
  data: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
  metadata?: Record<string, any>;
}

export interface IntegrationContext {
  credentials: IntegrationCredentials;
  workflowId: string;
  executionId: string;
  userId: string;
  organizationId: string;
  logger?: any;
}

export interface TriggerConfig {
  name: string;
  displayName: string;
  description: string;
  properties: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
}

export interface ActionConfig {
  name: string;
  displayName: string;
  description: string;
  properties: z.ZodObject<any>;
  inputSchema: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
}

export abstract class BaseIntegration extends EventEmitter {
  protected metadata: IntegrationMetadata;
  protected context?: IntegrationContext;
  protected triggers: Map<string, TriggerConfig> = new Map();
  protected actions: Map<string, ActionConfig> = new Map();
  protected rateLimiter?: any;

  constructor(metadata: IntegrationMetadata) {
    super();
    this.metadata = metadata;
    this.initialize();
  }

  /**
   * Initialize integration - register triggers and actions
   */
  protected abstract initialize(): void;

  /**
   * Authenticate with the service
   */
  abstract authenticate(credentials: IntegrationCredentials): Promise<boolean>;

  /**
   * Refresh authentication if needed
   */
  abstract refreshAuth?(): Promise<IntegrationCredentials>;

  /**
   * Test connection to the service
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Clean up resources
   */
  abstract cleanup?(): Promise<void>;

  /**
   * Set execution context
   */
  setContext(context: IntegrationContext): void {
    this.context = context;
  }

  /**
   * Get integration metadata
   */
  getMetadata(): IntegrationMetadata {
    return this.metadata;
  }

  /**
   * Register a trigger
   */
  protected registerTrigger(config: TriggerConfig): void {
    this.triggers.set(config.name, config);
  }

  /**
   * Register an action
   */
  protected registerAction(config: ActionConfig): void {
    this.actions.set(config.name, config);
  }

  /**
   * Get available triggers
   */
  getTriggers(): TriggerConfig[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get available actions
   */
  getActions(): ActionConfig[] {
    return Array.from(this.actions.values());
  }

  /**
   * Execute a trigger
   */
  async executeTrigger(
    triggerName: string,
    properties: Record<string, any>,
  ): Promise<any> {
    const trigger = this.triggers.get(triggerName);
    if (!trigger) {
      throw new Error(`Trigger ${triggerName} not found`);
    }

    // Validate properties
    const validatedProps = trigger.properties.parse(properties);

    // Execute trigger implementation
    const methodName = `trigger_${triggerName}`;
    if (typeof (this as any)[methodName] !== "function") {
      throw new Error(`Trigger implementation ${methodName} not found`);
    }

    const result = await (this as any)[methodName](validatedProps);

    // Validate output
    return trigger.outputSchema.parse(result);
  }

  /**
   * Execute an action
   */
  async executeAction(
    actionName: string,
    input: Record<string, any>,
    properties: Record<string, any>,
  ): Promise<any> {
    const action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    // Validate input and properties
    const validatedInput = action.inputSchema.parse(input);
    const validatedProps = action.properties.parse(properties);

    // Check rate limiting
    if (this.rateLimiter) {
      await this.rateLimiter.checkLimit();
    }

    // Execute action implementation
    const methodName = `action_${actionName}`;
    if (typeof (this as any)[methodName] !== "function") {
      throw new Error(`Action implementation ${methodName} not found`);
    }

    const result = await (this as any)[methodName](
      validatedInput,
      validatedProps,
    );

    // Validate output
    return action.outputSchema.parse(result);
  }

  /**
   * Handle webhook
   */
  async handleWebhook?(
    headers: Record<string, string>,
    body: any,
    query?: Record<string, string>,
  ): Promise<any> {
    throw new Error("Webhook handling not implemented");
  }

  /**
   * Validate webhook signature
   */
  protected validateWebhookSignature?(
    headers: Record<string, string>,
    body: any,
    secret: string,
  ): boolean {
    return false;
  }

  /**
   * Get required OAuth scopes
   */
  getRequiredScopes?(): string[] {
    return [];
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl?(redirectUri: string, state: string): string {
    throw new Error("OAuth not implemented for this integration");
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCodeForTokens?(
    code: string,
    redirectUri: string,
  ): Promise<IntegrationCredentials> {
    throw new Error("OAuth not implemented for this integration");
  }

  /**
   * Log event
   */
  protected log(level: string, message: string, data?: any): void {
    if (this.context?.logger) {
      this.context.logger[level](message, data);
    }
    this.emit("log", { level, message, data });
  }

  /**
   * Handle errors
   */
  protected handleError(error: any): never {
    this.log("error", "Integration error", {
      integration: this.metadata.name,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export default BaseIntegration;

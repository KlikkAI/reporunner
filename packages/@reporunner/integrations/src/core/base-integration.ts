import { EventEmitter } from "events";
import { AxiosInstance } from "axios";
import { WebhookManager } from "../webhook/webhook-manager";
import { OAuth2Handler } from "../auth/oauth2-handler";
import { CredentialManager } from "../security/credential-manager";

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
  status: "initializing" | "connected" | "disconnected" | "error" | "suspended";
  lastActivity?: Date;
  errorMessage?: string;
  errorCount: number;
  metadata?: Record<string, any>;
}

export interface IntegrationContext {
  userId: string;
  workspaceId?: string;
  environment?: "development" | "staging" | "production";
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
      status: "initializing",
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
  private async performInitialization(
    context: IntegrationContext,
  ): Promise<void> {
    try {
      this.context = context;
      this.setState("initializing");

      // Validate configuration
      await this.validateConfiguration();

      // Setup components
      await this.setupComponents();

      // Call abstract initialization method
      await this.onInitialize();

      // Start heartbeat
      this.startHeartbeat();

      this.setState("connected");
      this.emit("initialized", { name: this.config.name });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Abstract method for integration-specific initialization
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * Connect to the service
   */
  async connect(): Promise<void> {
    try {
      this.setState("initializing");

      // Call abstract connect method
      await this.onConnect();

      this.setState("connected");
      this.retryCount = 0;
      this.emit("connected", { name: this.config.name });
    } catch (error: any) {
      this.handleError(error);

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;

        this.emit("retry", {
          name: this.config.name,
          attempt: this.retryCount,
          delay,
        });

        setTimeout(() => this.connect(), delay);
      } else {
        throw error;
      }
    }
  }

  /**
   * Abstract method for integration-specific connection
   */
  protected abstract onConnect(): Promise<void>;

  /**
   * Disconnect from the service
   */
  async disconnect(): Promise<void> {
    try {
      // Stop heartbeat
      this.stopHeartbeat();

      // Call abstract disconnect method
      await this.onDisconnect();

      this.setState("disconnected");
      this.emit("disconnected", { name: this.config.name });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Abstract method for integration-specific disconnection
   */
  protected abstract onDisconnect(): Promise<void>;

  /**
   * Validate configuration
   */
  protected async validateConfiguration(): Promise<void> {
    // Check required credentials
    if (
      this.config.requiredCredentials &&
      this.config.requiredCredentials.length > 0
    ) {
      for (const credentialName of this.config.requiredCredentials) {
        const hasCredential = await this.checkCredential(credentialName);
        if (!hasCredential) {
          throw new Error(`Missing required credential: ${credentialName}`);
        }
      }
    }

    // Call abstract validation method
    await this.onValidateConfiguration();
  }

  /**
   * Abstract method for integration-specific configuration validation
   */
  protected abstract onValidateConfiguration(): Promise<void>;

  /**
   * Setup components
   */
  protected async setupComponents(): Promise<void> {
    // Setup webhook manager if needed
    if (this.config.webhooks?.enabled) {
      this.webhookManager = new WebhookManager();
    }

    // Setup OAuth2 handler if needed
    if (this.config.oauth?.enabled) {
      // OAuth2 config should be provided through context or credentials
      // This is a placeholder
    }

    // Setup credential manager
    // This would typically be injected or shared across integrations
  }

  /**
   * Check if credential exists
   */
  protected async checkCredential(name: string): Promise<boolean> {
    if (!this.credentialManager || !this.context) {
      return false;
    }

    const credentials = this.credentialManager.findCredentials({
      integrationName: this.config.name,
      userId: this.context.userId,
      isActive: true,
    });

    return credentials.some((cred) => cred.name === name);
  }

  /**
   * Get credential value
   */
  protected async getCredential(name: string): Promise<string | null> {
    if (!this.credentialManager || !this.context) {
      return null;
    }

    const credentials = this.credentialManager.findCredentials({
      integrationName: this.config.name,
      userId: this.context.userId,
      isActive: true,
    });

    const credential = credentials.find((cred) => cred.name === name);
    if (credential && credential.id) {
      const fullCredential = await this.credentialManager.retrieveCredential(
        credential.id,
        this.context.userId,
      );
      return fullCredential?.value || null;
    }

    return null;
  }

  /**
   * Execute action
   */
  async execute(action: string, params: any): Promise<any> {
    if (this.state.status !== "connected") {
      throw new Error(`Integration ${this.config.name} is not connected`);
    }

    try {
      // Update last activity
      this.state.lastActivity = new Date();

      // Call abstract execute method
      const result = await this.onExecute(action, params);

      this.emit("action:executed", {
        name: this.config.name,
        action,
        params,
      });

      return result;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Abstract method for integration-specific action execution
   */
  protected abstract onExecute(action: string, params: any): Promise<any>;

  /**
   * Handle webhook
   */
  async handleWebhook(path: string, data: any): Promise<any> {
    if (!this.config.webhooks?.enabled) {
      throw new Error(`Webhooks not enabled for ${this.config.name}`);
    }

    try {
      // Call abstract webhook handler
      const result = await this.onWebhook(path, data);

      this.emit("webhook:handled", {
        name: this.config.name,
        path,
        data,
      });

      return result;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Abstract method for integration-specific webhook handling
   */
  protected abstract onWebhook(path: string, data: any): Promise<any>;

  /**
   * Set state
   */
  protected setState(
    status: IntegrationState["status"],
    errorMessage?: string,
  ): void {
    const previousStatus = this.state.status;
    this.state.status = status;

    if (errorMessage) {
      this.state.errorMessage = errorMessage;
    } else if (status === "connected") {
      this.state.errorMessage = undefined;
      this.state.errorCount = 0;
    }

    if (previousStatus !== status) {
      this.emit("state:changed", {
        name: this.config.name,
        previousStatus,
        newStatus: status,
        errorMessage,
      });
    }
  }

  /**
   * Handle error
   */
  protected handleError(error: Error): void {
    this.state.errorCount++;
    this.setState("error", error.message);

    this.emit("error", {
      name: this.config.name,
      error: error.message,
      errorCount: this.state.errorCount,
    });

    // Suspend if too many errors
    if (this.state.errorCount >= 10) {
      this.suspend();
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return;
    }

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.onHeartbeat();
        this.emit("heartbeat", {
          name: this.config.name,
          status: this.state.status,
        });
      } catch (error: any) {
        this.handleError(error);
      }
    }, 60000); // Every minute
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Abstract method for integration-specific heartbeat
   */
  protected abstract onHeartbeat(): Promise<void>;

  /**
   * Suspend integration
   */
  suspend(): void {
    this.stopHeartbeat();
    this.setState("suspended");

    this.emit("suspended", {
      name: this.config.name,
      errorCount: this.state.errorCount,
    });
  }

  /**
   * Resume integration
   */
  async resume(): Promise<void> {
    this.state.errorCount = 0;
    await this.connect();
  }

  /**
   * Get configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Get state
   */
  getState(): IntegrationState {
    return { ...this.state };
  }

  /**
   * Get context
   */
  getContext(): IntegrationContext | undefined {
    return this.context ? { ...this.context } : undefined;
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Record<string, any>): Promise<void> {
    if (!this.context) {
      throw new Error("Integration not initialized");
    }

    this.context.settings = {
      ...this.context.settings,
      ...settings,
    };

    await this.onSettingsUpdate(settings);

    this.emit("settings:updated", {
      name: this.config.name,
      settings,
    });
  }

  /**
   * Abstract method for integration-specific settings update
   */
  protected abstract onSettingsUpdate(
    settings: Record<string, any>,
  ): Promise<void>;

  /**
   * Get capabilities
   */
  getCapabilities(): string[] {
    return this.config.supportedFeatures || [];
  }

  /**
   * Check if capability is supported
   */
  hasCapability(capability: string): boolean {
    return this.getCapabilities().includes(capability);
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, any> {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      icon: this.config.icon,
      category: this.config.category,
      tags: this.config.tags,
      author: this.config.author,
      documentation: this.config.documentation,
      status: this.state.status,
      lastActivity: this.state.lastActivity,
      errorCount: this.state.errorCount,
      capabilities: this.getCapabilities(),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopHeartbeat();
    await this.disconnect();
    this.removeAllListeners();

    this.emit("cleanup", { name: this.config.name });
  }
}

export default BaseIntegration;

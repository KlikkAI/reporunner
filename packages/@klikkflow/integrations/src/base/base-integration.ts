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
  data: Record<string, unknown>;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface IntegrationContext {
  userId: string;
  organizationId: string;
  workflowId: string;
  executionId: string;
  credentials?: IntegrationCredentials;
  metadata?: Record<string, unknown>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface IntegrationError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
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

  /**
   * Get available triggers for this integration
   */
  abstract getTriggers(): Promise<IntegrationTrigger[]>;

  /**
   * Execute an action
   */
  abstract executeAction(actionName: string, parameters: Record<string, unknown>): Promise<unknown>;

  /**
   * Make an authenticated request to the integration
   */
  protected async makeRequest(endpoint: string, options: RequestOptions = {}): Promise<unknown> {
    // Check rate limits
    await this.checkRateLimit();

    // Build full URL
    const url = this.buildUrl(endpoint, options.queryParams);

    // Add authentication headers
    const headers = await this.getAuthHeaders(options.headers);

    // Make the request with retries
    const response = await this.executeWithRetry(
      async () => {
        return this.performRequest(url, {
          ...options,
          headers,
        });
      },
      options.retryCount || 3,
      options.retryDelay || 1000
    );

    // Update rate limit counters
    this.incrementRequestCount();

    return response;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): string {
    const baseUrl = this.config.baseUrl || '';
    let url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    return url;
  }

  /**
   * Get authentication headers based on auth type
   */
  protected async getAuthHeaders(
    additionalHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (!this.credentials) {
      return headers;
    }

    switch (this.config.authType) {
      case 'apiKey':
        headers.Authorization = `Bearer ${this.credentials.data.apiKey}`;
        break;

      case 'oauth2':
        // Check if token needs refresh
        if (this.credentials.expiresAt && new Date() >= this.credentials.expiresAt) {
          await this.refreshOAuth2Token();
        }
        headers.Authorization = `Bearer ${this.credentials.data.accessToken}`;
        break;

      case 'basic': {
        const auth = Buffer.from(
          `${this.credentials.data.username}:${this.credentials.data.password}`
        ).toString('base64');
        headers.Authorization = `Basic ${auth}`;
        break;
      }

      case 'custom':
        // Let the specific integration handle custom auth
        await this.applyCustomAuth(headers);
        break;
    }

    return headers;
  }

  /**
   * Apply custom authentication (to be overridden if needed)
   */
  protected async applyCustomAuth(_headers: Record<string, string>): Promise<void> {
    // Default implementation - does nothing
    // Override in specific integrations for custom auth
  }

  /**
   * Refresh OAuth2 token
   */
  protected async refreshOAuth2Token(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw this.createError('TOKEN_REFRESH_FAILED', 'No refresh token available');
    }

    // This should be implemented by OAuth2-based integrations
    throw this.createError('NOT_IMPLEMENTED', 'Token refresh not implemented');
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest(url: string, options: RequestOptions): Promise<unknown> {
    const controller = new AbortController();
    const timeout = options.timeout || 30000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleResponseError(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('TIMEOUT', `Request timed out after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Handle HTTP response errors
   */
  private async handleResponseError(response: Response): Promise<IntegrationError> {
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const error = this.createError(
      `HTTP_${response.status}`,
      (errorBody as { message?: string })?.message ||
        `Request failed with status ${response.status}`,
      response.status,
      errorBody
    );

    // Determine if error is retryable
    error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);

    return error;
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;

        const isRetryable = error instanceof Error && (error as IntegrationError).retryable;
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const waitTime = delay * 2 ** attempt;
        await this.sleep(waitTime);
      }
    }

    throw lastError;
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(): Promise<void> {
    if (!this.config.rateLimit) {
      return;
    }

    const now = Date.now();
    const periodMs = this.config.rateLimit.period * 1000;

    // Reset counter if period has passed
    if (now - this.requestResetTime > periodMs) {
      this.requestCount = 0;
      this.requestResetTime = now;
    }

    // Check if limit exceeded
    if (this.requestCount >= this.config.rateLimit.requests) {
      const waitTime = periodMs - (now - this.requestResetTime);
      throw this.createError(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }
  }

  /**
   * Increment request counter
   */
  private incrementRequestCount(): void {
    this.requestCount++;
  }

  /**
   * Create an integration error
   */
  protected createError(
    code: string,
    message: string,
    statusCode?: number,
    details?: unknown
  ): IntegrationError {
    const error = new Error(message) as IntegrationError;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.name = 'IntegrationError';
    return error;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get integration metadata
   */
  getMetadata(): IntegrationConfig {
    return this.config;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.context = undefined;
    this.credentials = undefined;
  }
}

export interface IntegrationAction {
  name: string;
  displayName: string;
  description: string;
  parameters: ActionParameter[];
  outputs: ActionOutput[];
}

export interface IntegrationTrigger {
  name: string;
  displayName: string;
  description: string;
  type: 'webhook' | 'polling' | 'manual';
  parameters: TriggerParameter[];
  outputs: TriggerOutput[];
}

export interface ActionParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'options' | 'file';
  required: boolean;
  default?: unknown;
  description?: string;
  options?: Array<{ name: string; value: unknown }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: unknown[];
  };
}

export interface ActionOutput {
  name: string;
  displayName: string;
  type: string;
  description?: string;
}

export interface TriggerParameter extends ActionParameter {}
export interface TriggerOutput extends ActionOutput {}

export default BaseIntegration;

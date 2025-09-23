/**
 * Enhanced Configuration Service for Large-Scale Applications
 *
 * Features:
 * - Runtime configuration validation
 * - Environment-specific overrides
 * - Feature flags system
 * - Type-safe configuration access
 * - Configuration hot-reloading capability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface AppConfig {
  // Application Info
  app: {
    name: string;
    version: string;
    environment: Environment;
    debug: boolean;
  };

  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // WebSocket Configuration
  websocket: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };

  // Authentication
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    timeout: number;
    autoRefreshThreshold: number;
  };

  // Feature Flags
  features: {
    enableDebug: boolean;
    enableMockData: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableAnalytics: boolean;
    enableHotReload: boolean;
    maxWorkflowNodes: number;
    enableAdvancedNodeTypes: boolean;
  };

  // Logging
  logging: {
    level: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    bufferSize: number;
  };

  // Performance
  performance: {
    enableMetrics: boolean;
    sampleRate: number;
    bundleSizeWarningThreshold: number;
    renderTimeThreshold: number;
  };

  // Security
  security: {
    enableCSP: boolean;
    allowedOrigins: string[];
    maxFileSize: number;
    sessionTimeout: number;
  };
}

// Configuration schema for validation (currently unused)
/*
const CONFIG_SCHEMA = {
  app: {
    name: { required: true, type: 'string' },
    version: { required: true, type: 'string' },
    environment: { required: true, type: 'string', enum: ['development', 'staging', 'production', 'test'] },
    debug: { required: false, type: 'boolean', default: false }
  },
  api: {
    baseUrl: { required: true, type: 'string', format: 'url' },
    timeout: { required: false, type: 'number', default: 30000, min: 1000, max: 300000 },
    retryAttempts: { required: false, type: 'number', default: 3, min: 0, max: 10 },
    retryDelay: { required: false, type: 'number', default: 1000, min: 100, max: 10000 }
  }
  // Add more schema validation as needed
}
*/

class ConfigurationService {
  private config: AppConfig;
  private listeners: Set<(config: AppConfig) => void> = new Set();
  private static instance: ConfigurationService;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();

    // Log successful configuration loading
    this.logConfigStatus();
  }

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  /**
   * Load configuration from environment variables with defaults
   */
  private loadConfiguration(): AppConfig {
    const env = import.meta.env;

    return {
      app: {
        name: env.VITE_APP_NAME || 'Reporunner',
        version: env.VITE_APP_VERSION || '1.0.0',
        environment: (env.VITE_ENVIRONMENT || 'development') as Environment,
        debug: env.VITE_DEBUG === 'true' || env.NODE_ENV === 'development',
      },

      api: {
        baseUrl: env.VITE_API_BASE_URL || 'http://localhost:5000',
        timeout: parseInt(env.VITE_API_TIMEOUT || '30000', 10),
        retryAttempts: parseInt(env.VITE_API_RETRY_ATTEMPTS || '3', 10),
        retryDelay: parseInt(env.VITE_API_RETRY_DELAY || '1000', 10),
      },

      websocket: {
        url: env.VITE_WS_URL || 'ws://localhost:5000',
        reconnectInterval: parseInt(env.VITE_WS_RECONNECT_INTERVAL || '5000', 10),
        maxReconnectAttempts: parseInt(env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '5', 10),
        heartbeatInterval: parseInt(env.VITE_WS_HEARTBEAT_INTERVAL || '30000', 10),
      },

      auth: {
        tokenKey: env.VITE_AUTH_TOKEN_KEY || 'auth_token',
        refreshTokenKey: env.VITE_AUTH_REFRESH_TOKEN_KEY || 'refresh_token',
        timeout: parseInt(env.VITE_AUTH_TIMEOUT || '3600000', 10),
        autoRefreshThreshold: parseInt(env.VITE_AUTH_REFRESH_THRESHOLD || '300000', 10),
      },

      features: {
        enableDebug: env.VITE_ENABLE_DEBUG === 'true',
        enableMockData: env.VITE_ENABLE_MOCK_DATA === 'true',
        enablePerformanceMonitoring: env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
        enableErrorReporting: env.VITE_ENABLE_ERROR_REPORTING === 'true',
        enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
        enableHotReload: env.VITE_ENABLE_HOT_RELOAD === 'true',
        maxWorkflowNodes: parseInt(env.VITE_MAX_WORKFLOW_NODES || '100', 10),
        enableAdvancedNodeTypes: env.VITE_ENABLE_ADVANCED_NODES === 'true',
      },

      logging: {
        level: (env.VITE_LOG_LEVEL || 'info') as LogLevel,
        enableConsole: env.VITE_LOG_CONSOLE !== 'false',
        enableRemote: env.VITE_LOG_REMOTE === 'true',
        remoteEndpoint: env.VITE_LOG_REMOTE_ENDPOINT,
        bufferSize: parseInt(env.VITE_LOG_BUFFER_SIZE || '100', 10),
      },

      performance: {
        enableMetrics: env.VITE_PERFORMANCE_METRICS === 'true',
        sampleRate: parseFloat(env.VITE_PERFORMANCE_SAMPLE_RATE || '0.1'),
        bundleSizeWarningThreshold: parseInt(env.VITE_BUNDLE_SIZE_WARNING || '500000', 10),
        renderTimeThreshold: parseInt(env.VITE_RENDER_TIME_THRESHOLD || '100', 10),
      },

      security: {
        enableCSP: env.VITE_ENABLE_CSP === 'true',
        allowedOrigins: env.VITE_ALLOWED_ORIGINS?.split(',') || ['*'],
        maxFileSize: parseInt(env.VITE_MAX_FILE_SIZE || '10485760', 10), // 10MB
        sessionTimeout: parseInt(env.VITE_SESSION_TIMEOUT || '1800000', 10), // 30 minutes
      },
    };
  }

  /**
   * Validate configuration against schema
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Basic validation
    if (!this.config.api.baseUrl) {
      errors.push('API base URL is required');
    }

    if (this.config.api.timeout < 1000 || this.config.api.timeout > 300000) {
      errors.push('API timeout must be between 1000ms and 300000ms');
    }

    if (!['development', 'staging', 'production', 'test'].includes(this.config.app.environment)) {
      errors.push('Invalid environment. Must be one of: development, staging, production, test');
    }

    if (this.config.performance.sampleRate < 0 || this.config.performance.sampleRate > 1) {
      errors.push('Performance sample rate must be between 0 and 1');
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;

      if (this.config.app.environment === 'production') {
        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Log configuration loading status
   */
  private logConfigStatus(): void {
    if (this.config.features.enableDebug) {
    }
  }

  /**
   * Get the complete configuration
   */
  getConfig(): AppConfig {
    return { ...this.config }; // Return a copy to prevent mutations
  }

  /**
   * Get a specific configuration section
   */
  get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return { ...this.config[section] };
  }

  /**
   * Check if a feature flag is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    const value = this.config.features[feature];
    return typeof value === 'boolean' ? value : false;
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironment(): Environment {
    return this.config.app.environment;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  /**
   * Get logging configuration
   */
  getLogLevel(): LogLevel {
    return this.config.logging.level;
  }

  /**
   * Update configuration at runtime (for testing or hot-reload)
   */
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfiguration();

    // Notify listeners
    this.listeners.forEach((listener) => listener(this.config));

    if (this.config.features.enableDebug) {
    }
  }

  /**
   * Subscribe to configuration changes
   */
  onConfigChange(listener: (config: AppConfig) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get configuration as environment variables (for debugging)
   */
  getAsEnvVars(): Record<string, string> {
    return {
      VITE_APP_NAME: this.config.app.name,
      VITE_APP_VERSION: this.config.app.version,
      VITE_ENVIRONMENT: this.config.app.environment,
      VITE_API_BASE_URL: this.config.api.baseUrl,
      VITE_ENABLE_DEBUG: String(this.config.features.enableDebug),
      // Add more as needed
    };
  }
}

// Export singleton instance
export const configService = ConfigurationService.getInstance();

// Export types and service class for testing
export { ConfigurationService };
export default configService;

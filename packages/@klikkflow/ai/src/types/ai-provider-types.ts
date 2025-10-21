// AI Provider types reusing patterns from auth-provider-types.ts

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama' | 'huggingface';

export interface ProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface AIProviderCredentials {
  id: string;
  name: string;
  type: AIProviderType;
  config: ProviderConfig;
  enabled: boolean;
  verified: boolean;
  lastVerified?: Date;
  organizationId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProviderSettings {
  defaultProvider: AIProviderType;
  fallbackProviders: AIProviderType[];
  enableCaching: boolean;
  cacheTimeout: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableRateLimiting: boolean;
  rateLimitPerMinute: number;
}

export interface ProviderCapabilities {
  llm: boolean;
  embeddings: boolean;
  multimodal: boolean;
  function_calling: boolean;
  streaming: boolean;
  fine_tuning: boolean;
  vision: boolean;
  audio: boolean;
}

export interface ProviderLimits {
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrentRequests: number;
  supportedModels: string[];
  contextWindow: number;
}

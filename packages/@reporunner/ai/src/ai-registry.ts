/**
 * AI Registry implementation
 * Reusing patterns from NodeRegistry.ts
 */

import { LLMManager } from './llm-manager';
import type {
  AIProviderType,
  EmbeddingModelInfo,
  LLMModelInfo,
  ProviderCapabilities,
  ProviderConfig,
  ProviderLimits,
} from './types';

export interface AIProviderDefinition {
  type: AIProviderType;
  name: string;
  description: string;
  capabilities: ProviderCapabilities;
  limits: ProviderLimits;
  configSchema: {
    required: string[];
    properties: Record<string, any>;
  };
  models: {
    llm: LLMModelInfo[];
    embedding: EmbeddingModelInfo[];
  };
}

export class AIRegistry {
  private static instance: AIRegistry;
  private providers = new Map<AIProviderType, AIProviderDefinition>();
  private llmManager: LLMManager;

  private constructor() {
    this.llmManager = new LLMManager();
    this.registerBuiltInProviders();
  }

  static getInstance(): AIRegistry {
    if (!AIRegistry.instance) {
      AIRegistry.instance = new AIRegistry();
    }
    return AIRegistry.instance;
  }

  registerProvider(definition: AIProviderDefinition): void {
    this.providers.set(definition.type, definition);
  }

  getProvider(type: AIProviderType): AIProviderDefinition | undefined {
    return this.providers.get(type);
  }

  getAllProviders(): AIProviderDefinition[] {
    return Array.from(this.providers.values());
  }

  getProvidersByCapability(capability: keyof ProviderCapabilities): AIProviderDefinition[] {
    return this.getAllProviders().filter((provider) => provider.capabilities[capability]);
  }

  getLLMProviders(): AIProviderDefinition[] {
    return this.getProvidersByCapability('llm');
  }

  getEmbeddingProviders(): AIProviderDefinition[] {
    return this.getProvidersByCapability('embeddings');
  }

  getMultimodalProviders(): AIProviderDefinition[] {
    return this.getProvidersByCapability('multimodal');
  }

  createProviderInstance(type: AIProviderType, config: ProviderConfig): void {
    const definition = this.getProvider(type);
    if (!definition) {
      throw new Error(`Unknown provider type: ${type}`);
    }

    this.llmManager.registerProvider(type, config);
  }

  getLLMManager(): LLMManager {
    return this.llmManager;
  }

  private registerBuiltInProviders(): void {
    // Register OpenAI provider
    this.registerProvider({
      type: 'openai',
      name: 'OpenAI',
      description: 'OpenAI GPT models and embeddings',
      capabilities: {
        llm: true,
        embeddings: true,
        multimodal: true,
        function_calling: true,
        streaming: true,
        fine_tuning: true,
        vision: true,
        audio: false,
      },
      limits: {
        maxTokensPerRequest: 128000,
        maxRequestsPerMinute: 3500,
        maxTokensPerMinute: 200000,
        maxConcurrentRequests: 10,
        supportedModels: [
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'text-embedding-3-large',
          'text-embedding-3-small',
          'text-embedding-ada-002',
        ],
        contextWindow: 128000,
      },
      configSchema: {
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string', description: 'OpenAI API Key' },
          baseURL: { type: 'string', description: 'Custom base URL (optional)' },
          organization: { type: 'string', description: 'Organization ID (optional)' },
        },
      },
      models: {
        llm: [
          {
            id: 'gpt-4o',
            name: 'GPT-4o',
            description: 'Most advanced multimodal model',
            contextWindow: 128000,
            maxTokens: 4096,
            capabilities: {
              completion: true,
              chat: true,
              functions: true,
              tools: true,
              vision: true,
              audio: false,
            },
          },
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            description: 'Faster, cheaper version of GPT-4o',
            contextWindow: 128000,
            maxTokens: 16384,
            capabilities: {
              completion: true,
              chat: true,
              functions: true,
              tools: true,
              vision: true,
              audio: false,
            },
          },
        ],
        embedding: [
          {
            id: 'text-embedding-3-large',
            name: 'Text Embedding 3 Large',
            description: 'Most capable embedding model',
            dimensions: 3072,
            maxTokens: 8191,
            supportedFormats: ['float'],
          },
          {
            id: 'text-embedding-3-small',
            name: 'Text Embedding 3 Small',
            description: 'Improved performance over Ada 002',
            dimensions: 1536,
            maxTokens: 8191,
            supportedFormats: ['float'],
          },
        ],
      },
    });

    // Register Anthropic provider
    this.registerProvider({
      type: 'anthropic',
      name: 'Anthropic',
      description: 'Claude models by Anthropic',
      capabilities: {
        llm: true,
        embeddings: false,
        multimodal: true,
        function_calling: true,
        streaming: true,
        fine_tuning: false,
        vision: true,
        audio: false,
      },
      limits: {
        maxTokensPerRequest: 200000,
        maxRequestsPerMinute: 1000,
        maxTokensPerMinute: 200000,
        maxConcurrentRequests: 5,
        supportedModels: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307',
        ],
        contextWindow: 200000,
      },
      configSchema: {
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string', description: 'Anthropic API Key' },
          baseUrl: { type: 'string', description: 'Custom base URL (optional)' },
          anthropicVersion: { type: 'string', description: 'API version (optional)' },
        },
      },
      models: {
        llm: [
          {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            description: 'Most intelligent model for complex tasks',
            contextWindow: 200000,
            maxTokens: 8192,
            capabilities: {
              completion: true,
              chat: true,
              functions: true,
              tools: true,
              vision: true,
              audio: false,
            },
          },
          {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            description: 'Fastest model for everyday tasks',
            contextWindow: 200000,
            maxTokens: 8192,
            capabilities: {
              completion: true,
              chat: true,
              functions: true,
              tools: true,
              vision: true,
              audio: false,
            },
          },
        ],
        embedding: [],
      },
    });
  }
}

// Export singleton instance
export const aiRegistry = AIRegistry.getInstance();

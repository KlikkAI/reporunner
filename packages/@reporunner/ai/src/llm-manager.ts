/**
 * LLM Manager implementation
 * Reusing patterns from workflow-engine and provider management
 */

import type {
  AIProviderType,
  ProviderConfig,
  LLMCompletion,
  LLMResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from './types';
import { BaseAIProvider, ILLMProvider, IEmbeddingProvider } from './base/ai-provider';
import { OpenAIProvider } from './providers/openai-provider';
import { AnthropicProvider } from './providers/anthropic-provider';

export class LLMManager {
  private providers: Map<AIProviderType, BaseAIProvider> = new Map();
  private defaultProvider?: AIProviderType;

  constructor() {
    // Initialize with basic configuration
  }

  registerProvider(type: AIProviderType, config: ProviderConfig): void {
    let provider: BaseAIProvider;

    switch (type) {
      case 'openai':
        provider = new OpenAIProvider(config as any);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config as any);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    this.providers.set(type, provider);

    // Set as default if first provider
    if (!this.defaultProvider) {
      this.defaultProvider = type;
    }
  }

  getProvider(type?: AIProviderType): BaseAIProvider {
    const providerType = type || this.defaultProvider;
    if (!providerType) {
      throw new Error('No provider specified and no default provider set');
    }

    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }

    return provider;
  }

  getLLMProvider(type?: AIProviderType): ILLMProvider {
    const provider = this.getProvider(type);
    if (!this.isLLMProvider(provider)) {
      throw new Error(`Provider ${type} does not support LLM operations`);
    }
    return provider as ILLMProvider;
  }

  getEmbeddingProvider(type?: AIProviderType): IEmbeddingProvider {
    const provider = this.getProvider(type);
    if (!this.isEmbeddingProvider(provider)) {
      throw new Error(`Provider ${type} does not support embedding operations`);
    }
    return provider as IEmbeddingProvider;
  }

  async complete(request: LLMCompletion, providerType?: AIProviderType): Promise<LLMResponse> {
    const provider = this.getLLMProvider(providerType);
    return provider.complete(request);
  }

  async *stream(request: LLMCompletion, providerType?: AIProviderType): AsyncIterable<LLMResponse> {
    const provider = this.getLLMProvider(providerType);
    yield* provider.stream(request);
  }

  async createEmbeddings(request: EmbeddingRequest, providerType?: AIProviderType): Promise<EmbeddingResponse> {
    const provider = this.getEmbeddingProvider(providerType);
    return provider.createEmbeddings(request);
  }

  async getAvailableModels(providerType?: AIProviderType): Promise<string[]> {
    const provider = this.getLLMProvider(providerType);
    return provider.getModels();
  }

  setDefaultProvider(type: AIProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider ${type} not registered`);
    }
    this.defaultProvider = type;
  }

  getRegisteredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  async validateProvider(type: AIProviderType): Promise<boolean> {
    const provider = this.getProvider(type);
    return provider.validateConfig();
  }

  async testProvider(type: AIProviderType): Promise<boolean> {
    const provider = this.getProvider(type);
    return provider.testConnection();
  }

  private isLLMProvider(provider: BaseAIProvider): provider is BaseAIProvider & ILLMProvider {
    return 'complete' in provider && 'stream' in provider && 'getModels' in provider;
  }

  private isEmbeddingProvider(provider: BaseAIProvider): provider is BaseAIProvider & IEmbeddingProvider {
    return 'createEmbeddings' in provider && 'getDimensions' in provider && 'getMaxTokens' in provider;
  }
}
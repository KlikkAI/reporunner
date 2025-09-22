import type { AIProviderType, ProviderConfig } from '../types';
import type {
  BaseAIProvider,
  IEmbeddingProvider,
  ILLMProvider,
  IVectorStoreProvider,
  ProviderCapabilities,
} from './ai-provider';

/**
 * Registry for managing AI providers
 */
export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers = new Map<AIProviderType, typeof BaseAIProvider>();
  private instances = new Map<string, BaseAIProvider>();
  private capabilities = new Map<AIProviderType, ProviderCapabilities>();

  private constructor() {}

  static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  /**
   * Register a provider class
   */
  registerProvider(
    type: AIProviderType,
    providerClass: typeof BaseAIProvider,
    capabilities: ProviderCapabilities
  ): void {
    this.providers.set(type, providerClass);
    this.capabilities.set(type, capabilities);
  }

  /**
   * Create a provider instance
   */
  async createProvider(config: ProviderConfig): Promise<BaseAIProvider> {
    const instanceKey = `${config.type}-${config.model || 'default'}`;

    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    const ProviderClass = this.providers.get(config.type);
    if (!ProviderClass) {
      throw new Error(`Provider ${config.type} not registered`);
    }

    const instance = new ProviderClass(config);
    await instance.validateConfig();

    this.instances.set(instanceKey, instance);
    return instance;
  }

  /**
   * Get LLM provider
   */
  async getLLMProvider(config: ProviderConfig): Promise<ILLMProvider> {
    const provider = await this.createProvider(config);

    if (!this.hasCapability(config.type, 'llm')) {
      throw new Error(`Provider ${config.type} does not support LLM`);
    }

    return provider as ILLMProvider;
  }

  /**
   * Get embedding provider
   */
  async getEmbeddingProvider(config: ProviderConfig): Promise<IEmbeddingProvider> {
    const provider = await this.createProvider(config);

    if (!this.hasCapability(config.type, 'embeddings')) {
      throw new Error(`Provider ${config.type} does not support embeddings`);
    }

    return provider as IEmbeddingProvider;
  }

  /**
   * Get vector store provider
   */
  async getVectorStoreProvider(config: ProviderConfig): Promise<IVectorStoreProvider> {
    const provider = await this.createProvider(config);
    return provider as IVectorStoreProvider;
  }

  /**
   * Check if provider has capability
   */
  hasCapability(type: AIProviderType, capability: keyof ProviderCapabilities): boolean {
    const caps = this.capabilities.get(type);
    return caps ? caps[capability] : false;
  }

  /**
   * Get available providers by capability
   */
  getProvidersByCapability(capability: keyof ProviderCapabilities): AIProviderType[] {
    return Array.from(this.capabilities.entries())
      .filter(([_, caps]) => caps[capability])
      .map(([type]) => type);
  }

  /**
   * List all registered providers
   */
  listProviders(): Array<{
    type: AIProviderType;
    capabilities: ProviderCapabilities;
  }> {
    return Array.from(this.capabilities.entries()).map(([type, capabilities]) => ({
      type,
      capabilities,
    }));
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    this.instances.clear();
  }
}

// Export singleton instance
export const aiRegistry = AIProviderRegistry.getInstance();

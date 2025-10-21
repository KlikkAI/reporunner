import type {
  AIProviderType,
  EmbeddingRequest,
  EmbeddingResponse,
  LLMCompletion,
  LLMResponse,
  ProviderConfig,
} from '../types';

/**
 * Base abstract class for all AI providers
 */
export abstract class BaseAIProvider {
  public readonly type: AIProviderType;
  protected readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.type = config.type;
    this.config = config;
  }

  abstract validateConfig(): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;
}

/**
 * LLM Provider interface
 */
export interface ILLMProvider {
  complete(request: LLMCompletion): Promise<LLMResponse>;
  stream(request: LLMCompletion): AsyncIterable<LLMResponse>;
  getModels(): Promise<string[]>;
  estimateTokens(text: string): number;
}

/**
 * Embedding Provider interface
 */
export interface IEmbeddingProvider {
  createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  getDimensions(model: string): number;
  getMaxTokens(model: string): number;
}

/**
 * Vector Store Provider interface
 */
export interface IVectorStoreProvider {
  createIndex(name: string, dimensions: number): Promise<string>;
  deleteIndex(indexId: string): Promise<void>;
  upsertVectors(
    indexId: string,
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void>;
  queryVectors(
    indexId: string,
    query: {
      vector?: number[];
      topK?: number;
      filter?: Record<string, unknown>;
    }
  ): Promise<
    Array<{
      id: string;
      score: number;
      metadata?: Record<string, unknown>;
    }>
  >;
}

/**
 * Combined AI Provider that implements multiple capabilities
 */
export abstract class CombinedAIProvider
  extends BaseAIProvider
  implements ILLMProvider, IEmbeddingProvider
{
  // LLM methods
  abstract complete(request: LLMCompletion): Promise<LLMResponse>;
  abstract stream(request: LLMCompletion): AsyncIterable<LLMResponse>;
  abstract getModels(): Promise<string[]>;
  abstract estimateTokens(text: string): number;

  // Embedding methods
  abstract createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  abstract getDimensions(model: string): number;
  abstract getMaxTokens(model: string): number;
}

/**
 * Embedding Service implementation
 * Reusing patterns from ai-provider.ts and workflow services
 */

import { aiRegistry } from '../ai-registry';
import type {
  AIProviderType,
  EmbeddingComparison,
  EmbeddingRequest,
  EmbeddingSearchOptions,
  EmbeddingSearchResult,
} from '../types';

export interface EmbeddingServiceConfig {
  defaultProvider?: AIProviderType;
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableMetrics?: boolean;
}

export interface EmbeddingCandidate {
  id: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export class EmbeddingService {
  private config: Required<EmbeddingServiceConfig>;
  private cache = new Map<string, { embedding: number[]; timestamp: number }>();

  constructor(config: EmbeddingServiceConfig = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      enableCaching: config.enableCaching ?? true,
      cacheTimeout: config.cacheTimeout || 3600000, // 1 hour
      enableMetrics: config.enableMetrics ?? false,
    };
  }

  async createEmbedding(
    text: string,
    options: {
      model?: string;
      provider?: AIProviderType;
      dimensions?: number;
    } = {}
  ): Promise<number[]> {
    const provider = options.provider || this.config.defaultProvider;
    const model = options.model || this.getDefaultModel(provider);

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedEmbedding(text, model);
      if (cached) {
        return cached;
      }
    }

    const llmManager = aiRegistry.getLLMManager();
    const embeddingProvider = llmManager.getEmbeddingProvider(provider);

    const request: EmbeddingRequest = {
      input: text,
      model,
      dimensions: options.dimensions,
    };

    const response = await embeddingProvider.createEmbeddings(request);
    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error('No embedding returned from provider');
    }

    // Cache the result
    if (this.config.enableCaching) {
      this.cacheEmbedding(text, model, embedding);
    }

    return embedding;
  }

  async createEmbeddings(
    texts: string[],
    options: {
      model?: string;
      provider?: AIProviderType;
      dimensions?: number;
    } = {}
  ): Promise<number[][]> {
    const provider = options.provider || this.config.defaultProvider;
    const model = options.model || this.getDefaultModel(provider);

    // Check cache for each text
    const results: (number[] | null)[] = [];
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];

    if (this.config.enableCaching) {
      for (let i = 0; i < texts.length; i++) {
        const cached = this.getCachedEmbedding(texts[i], model);
        if (cached) {
          results[i] = cached;
        } else {
          results[i] = null;
          uncachedTexts.push(texts[i]);
          uncachedIndices.push(i);
        }
      }
    } else {
      uncachedTexts.push(...texts);
      uncachedIndices.push(...texts.map((_, i) => i));
    }

    // Get embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      const llmManager = aiRegistry.getLLMManager();
      const embeddingProvider = llmManager.getEmbeddingProvider(provider);

      const request: EmbeddingRequest = {
        input: uncachedTexts,
        model,
        dimensions: options.dimensions,
      };

      const response = await embeddingProvider.createEmbeddings(request);

      // Fill in uncached results
      response.data.forEach((data, i) => {
        const originalIndex = uncachedIndices[i];
        results[originalIndex] = data.embedding;

        // Cache the result
        if (this.config.enableCaching) {
          this.cacheEmbedding(uncachedTexts[i], model, data.embedding);
        }
      });
    }

    return results as number[][];
  }

  async searchSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<EmbeddingCandidate>,
    options: Partial<EmbeddingSearchOptions> = {}
  ): Promise<EmbeddingSearchResult[]> {
    const limit = options.limit || 10;
    const threshold = options.threshold || 0;

    // Calculate similarities
    const similarities = candidateEmbeddings.map((candidate) => ({
      ...candidate,
      similarity: this.calculateCosineSimilarity(queryEmbedding, candidate.embedding),
    }));

    // Filter by threshold and sort by similarity
    const filtered = similarities
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return filtered.map((item) => ({
      id: item.id,
      score: item.similarity,
      values: options.includeValues ? item.embedding : undefined,
      metadata: options.includeMetadata ? item.metadata : undefined,
    }));
  }

  calculateSimilarity(
    embedding1: number[],
    embedding2: number[],
    method: 'cosine' | 'euclidean' | 'dot_product' = 'cosine'
  ): EmbeddingComparison {
    let similarity: number;
    let distance: number;

    switch (method) {
      case 'cosine':
        similarity = this.calculateCosineSimilarity(embedding1, embedding2);
        distance = 1 - similarity;
        break;
      case 'euclidean':
        distance = this.calculateEuclideanDistance(embedding1, embedding2);
        similarity = 1 / (1 + distance);
        break;
      case 'dot_product':
        similarity = this.calculateDotProduct(embedding1, embedding2);
        distance = -similarity;
        break;
      default:
        throw new Error(`Unsupported similarity method: ${method}`);
    }

    return {
      similarity,
      distance,
      method,
      confidence: Math.abs(similarity),
    };
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
  }

  private calculateDotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private getDefaultModel(provider: AIProviderType): string {
    const providerDef = aiRegistry.getProvider(provider);
    if (!providerDef) {
      throw new Error(`Provider ${provider} not found`);
    }

    const embeddingModels = providerDef.models.embedding;
    if (embeddingModels.length === 0) {
      throw new Error(`Provider ${provider} does not support embeddings`);
    }

    return embeddingModels[0].id;
  }

  private getCachedEmbedding(text: string, model: string): number[] | null {
    const key = `${text}:${model}`;
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.embedding;
  }

  private cacheEmbedding(text: string, model: string, embedding: number[]): void {
    const key = `${text}:${model}`;
    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; memoryUsage: number } {
    const size = this.cache.size;
    const memoryUsage = Array.from(this.cache.values()).reduce(
      (total, item) => total + item.embedding.length * 8, // Approximate bytes per number
      0
    );

    return { size, memoryUsage };
  }
}

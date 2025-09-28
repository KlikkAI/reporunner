// AI package main index - reusing patterns from other packages
export * from './types';
export * from './providers';
export * from './llm-manager';
export * from './ai-registry';
export * from './prompt-template';
export * from './embeddings';
export * from './utils';
export * from './vector-store';
export * from './llm';
export * from './nodes';

// Re-export specific items from base to avoid conflicts
export { BaseAIProvider, ILLMProvider, IEmbeddingProvider, IVectorStoreProvider, CombinedAIProvider } from './base';
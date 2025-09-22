/**
 * @reporunner/ai - AI and ML capabilities for Reporunner
 *
 * This package provides comprehensive AI/ML integration including:
 * - LLM providers (OpenAI, Anthropic, Google, Ollama)
 * - Vector embeddings and search
 * - AI agents with memory and tools
 * - Prompt management and optimization
 */

export * from './agents';
// Core AI classes
export { AIAgent } from './agents/AIAgent';
export * from './embeddings';
export { EmbeddingService } from './embeddings/EmbeddingService';
export * from './prompt-manager';
export { PromptManager } from './prompt-manager/PromptManager';
export * from './providers';
export { AnthropicProvider } from './providers/AnthropicProvider';
// Provider factories
export { createLLMProvider } from './providers/factory';
export { OpenAIProvider } from './providers/OpenAIProvider';
export * from './types';
export * from './vector-store';
export { VectorStore } from './vector-store/VectorStore';

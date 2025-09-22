import { z } from 'zod';

// Base AI types
export interface AIProvider {
  id: string;
  name: string;
  type: 'llm' | 'embedding' | 'vector' | 'multimodal';
  config: Record<string, unknown>;
}

// LLM Types
export const LLMMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string(),
  name: z.string().optional(),
  function_call: z
    .object({
      name: z.string(),
      arguments: z.string(),
    })
    .optional(),
});

export type LLMMessage = z.infer<typeof LLMMessageSchema>;

export const LLMCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(LLMMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional(),
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.record(z.unknown()),
      })
    )
    .optional(),
});

export type LLMCompletion = z.infer<typeof LLMCompletionSchema>;

export interface LLMResponse {
  id: string;
  choices: Array<{
    index: number;
    message: LLMMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created: number;
}

// Embedding Types
export const EmbeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
  encoding_format: z.enum(['float', 'base64']).optional(),
  dimensions: z.number().positive().optional(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;

export interface EmbeddingResponse {
  data: Array<{
    object: 'embedding';
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Vector Store Types
export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface VectorSearchQuery {
  vector?: number[];
  query?: string;
  filter?: Record<string, unknown>;
  top_k?: number;
  threshold?: number;
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
  distance: number;
}

// AI Node Types
export interface AINodeCredentials {
  apiKey: string;
  endpoint?: string;
  model?: string;
}

export interface AIExecutionContext {
  nodeId: string;
  workflowId: string;
  credentials: AINodeCredentials;
  parameters: Record<string, unknown>;
  input: Record<string, unknown>;
}

// Provider specific types
export enum AIProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  OLLAMA = 'ollama',
  AZURE = 'azure',
}

export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  endpoint?: string;
  model: string;
  organization?: string;
  apiVersion?: string;
}

// Memory and context types
export interface ConversationMemory {
  id: string;
  sessionId: string;
  messages: LLMMessage[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: VectorDocument[];
  indexId: string;
  metadata: Record<string, unknown>;
}

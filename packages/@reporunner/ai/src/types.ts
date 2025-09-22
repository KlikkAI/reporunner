/**
 * Core AI types and interfaces
 */

// LLM Provider Interface
export interface LLMProvider {
  readonly name: string;
  readonly supportedModels: string[];

  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
  generateStream(params: GenerateTextParams): AsyncIterableIterator<GenerateTextStreamResult>;
  embed(params: EmbedParams): Promise<EmbedResult>;
}

// Text Generation
export interface GenerateTextParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  tools?: AITool[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface GenerateTextResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'tool_use' | 'error';
  toolCalls?: ToolCall[];
}

export interface GenerateTextStreamResult {
  delta: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_use' | 'error';
  toolCalls?: ToolCall[];
}

// Embeddings
export interface EmbedParams {
  model: string;
  texts: string[];
  dimensions?: number;
}

export interface EmbedResult {
  embeddings: number[][];
  usage: {
    totalTokens: number;
  };
}

// AI Tools
export interface AITool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: ToolHandler;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export type ToolHandler = (parameters: Record<string, any>) => Promise<any>;

// Vector Store
export interface VectorStoreDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorSearchParams {
  query: string;
  queryEmbedding?: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, any>;
}

export interface VectorSearchResult {
  document: VectorStoreDocument;
  similarity: number;
}

// AI Agent
export interface AIAgentConfig {
  name: string;
  description: string;
  instructions: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AITool[];
  memory?: AgentMemoryConfig;
}

export interface AgentMemoryConfig {
  type: 'conversation' | 'vector' | 'hybrid';
  maxMessages?: number;
  vectorStoreConfig?: VectorStoreConfig;
}

export interface VectorStoreConfig {
  connectionString: string;
  tableName: string;
  dimensions: number;
}

export interface AgentConversation {
  id: string;
  agentId: string;
  messages: ChatMessage[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Prompt Management
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
}

// Provider-specific configurations
export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
}

export interface GoogleConfig {
  apiKey: string;
  projectId?: string;
}

export interface OllamaConfig {
  baseURL: string;
  model?: string;
}

// Error types
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class LLMProviderError extends AIError {
  constructor(
    message: string,
    public provider: string
  ) {
    super(message);
    this.name = 'LLMProviderError';
  }
}

export class VectorStoreError extends AIError {
  constructor(message: string) {
    super(message);
    this.name = 'VectorStoreError';
  }
}

export class AgentExecutionError extends AIError {
  constructor(
    message: string,
    public agentId: string
  ) {
    super(message);
    this.name = 'AgentExecutionError';
  }
}

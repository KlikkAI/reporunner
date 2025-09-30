// LLM types reusing patterns from workflow-types.ts

export interface LLMCompletion {
  model: string;
  prompt?: string;
  messages?: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  functions?: LLMFunction[];
  functionCall?: 'auto' | 'none' | { name: string };
  tools?: LLMTool[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  toolCalls?: LLMToolCall[];
  toolCallId?: string;
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LLMChoice[];
  usage?: LLMUsage;
  systemFingerprint?: string;
}

export interface LLMChoice {
  index: number;
  message?: LLMMessage;
  delta?: Partial<LLMMessage>;
  finishReason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
  logprobs?: any;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptTokensDetails?: {
    cachedTokens?: number;
  };
  completionTokensDetails?: {
    reasoningTokens?: number;
  };
}

export interface LLMFunction {
  name: string;
  description?: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface LLMTool {
  type: 'function';
  function: LLMFunction;
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow: number;
  maxTokens: number;
  pricing?: {
    input: number;
    output: number;
    currency: string;
  };
  capabilities: {
    completion: boolean;
    chat: boolean;
    functions: boolean;
    tools: boolean;
    vision: boolean;
    audio: boolean;
  };
}

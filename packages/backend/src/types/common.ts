/**
 * Common TypeScript type definitions for the application
 */

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface IPaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    statusCode: number;
    status: string;
    isOperational: boolean;
  };
  stack?: string;
}

export interface ILogContext {
  userId?: string;
  workflowId?: string;
  executionId?: string;
  correlationId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
}

export interface IExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  nodeType: string;
  executionTime?: number;
}

export interface ICredentialData {
  [key: string]: any;
}

export type NodeType = 
  | 'trigger' 
  | 'action' 
  | 'condition' 
  | 'transform' 
  | 'ai-agent' 
  | 'gmail-trigger' 
  | 'gmail-send' 
  | 'database' 
  | 'webhook' 
  | 'delay' 
  | 'loop' 
  | 'file';

export type ExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'success' 
  | 'error' 
  | 'cancelled';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
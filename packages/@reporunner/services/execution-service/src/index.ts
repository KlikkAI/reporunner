export interface ExecutionConfig {
  maxConcurrentExecutions: number;
  executionTimeout: number;
  retryAttempts: number;
  queueSize: number;
}

export interface ExecutionRequest {
  workflowId: string;
  triggeredBy: string;
  inputData?: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  outputData?: Record<string, any>;
  error?: string;
}

export class ExecutionService {
  async execute(_request: ExecutionRequest): Promise<ExecutionResult> {
    // TODO: Implement workflow execution
    throw new Error('Not implemented');
  }

  async getExecution(_id: string): Promise<ExecutionResult | null> {
    // TODO: Implement execution retrieval
    return null;
  }

  async cancelExecution(_id: string): Promise<boolean> {
    // TODO: Implement execution cancellation
    return false;
  }
}

export * from './queue';
export * from './worker';

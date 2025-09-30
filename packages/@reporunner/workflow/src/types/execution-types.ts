// Execution types reusing patterns from workflow-engine
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export enum TriggerType {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  API = 'api',
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metrics: {
    executionTime: number;
    memoryUsage: number;
    nodeCount: number;
  };
}

export interface ExecutionOptions {
  userId?: string;
  triggerData?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
  saveExecution?: boolean;
}

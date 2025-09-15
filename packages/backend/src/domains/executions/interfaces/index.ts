/**
 * Executions domain interfaces
 */

export interface IExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  executedNodes: string[];
  currentNode?: string;
  results: Map<string, any>;
  error?: string;
  duration?: number;
}

export interface INodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  duration?: number;
}

export interface INodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  userId: string;
  inputData?: any;
  nodeConfig: any;
}

export interface IExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  nodeType: string;
  executionTime?: number;
}

export interface IExecutionRequest {
  workflowId: string;
  inputData?: any;
  testMode?: boolean;
}

export interface IExecutionStats {
  totalExecutions: number;
  runningExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime?: number;
}
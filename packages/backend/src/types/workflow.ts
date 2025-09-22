/**
 * Workflow-specific type definitions
 */

export interface IWorkflowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    [key: string]: any;
  };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface IWorkflowExecution {
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
}

export interface INodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  userId: string;
  inputData?: any;
  nodeConfig: any;
}

export interface IWorkflowSettings {
  errorHandling: 'stop' | 'continue' | 'retry';
  timeout: number;
  retryAttempts: number;
  concurrent: boolean;
}

export interface IWorkflowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime?: number;
  lastExecuted?: Date;
}

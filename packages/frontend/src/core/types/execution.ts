// Types for workflow execution and monitoring

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'success'
    | 'error'
    | 'timeout';
  startedAt?: string;
  startTime?: string;
  endTime?: string;
  completedAt?: string;
  duration?: number;
  triggerType?: string;
  trigger?: {
    type: string;
    data: any;
  };
  progress?: {
    currentNodeId?: string;
    completedNodes?: string[];
    totalNodes?: number;
  };
  nodeExecutions?: {
    nodeId: string;
    nodeName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
  }[];
  results?: {
    nodeId: string;
    nodeName: string;
    status: 'success' | 'error' | 'skipped';
    output?: any;
    error?: string;
    executedAt: string;
    duration: number;
  }[];
  error?: {
    message: string;
    nodeId?: string;
    code?: string;
    stack?: string;
  };
  logs: string[];
  metadata?: {
    version: string;
    templateId?: string;
    userId?: string;
  };
}

export interface ExecutionRequest {
  workflowId: string;
  triggerData?: any;
  triggerType?: string;
}

export interface WorkflowExecutionFilter {
  status?:
    | (
        | 'running'
        | 'completed'
        | 'failed'
        | 'pending'
        | 'cancelled'
        | 'success'
        | 'error'
        | 'timeout'
      )[]
    | string;
  workflowId?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  page?: number;
}

export interface ExecutionStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  avgDuration: number;
  successRate: number;
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
}

export interface NodeExecutionDetails {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  logs: {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }[];
}

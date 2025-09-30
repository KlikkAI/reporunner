// Workflow types reusing patterns from API types and workflow-engine
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  triggers: WorkflowTrigger[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationId: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  parameters: Record<string, any>;
  credentials?: string[];
  disabled?: boolean;
  notes?: string;
  retryOnFail?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface WorkflowConnection {
  id: string;
  source: {
    nodeId: string;
    outputName: string;
    outputIndex?: number;
  };
  destination: {
    nodeId: string;
    inputName: string;
    inputIndex?: number;
  };
  type?: string;
  conditions?: Record<string, any>;
}

export interface WorkflowSettings {
  errorHandling: 'stop' | 'continue' | 'retry';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timezone?: string;
  saveExecutionData?: boolean;
  saveSuccessfulExecutions?: boolean;
  saveFailedExecutions?: boolean;
  executionTimeout?: number;
}

export interface WorkflowTrigger {
  id: string;
  type: 'webhook' | 'schedule' | 'manual' | 'event';
  enabled: boolean;
  config: Record<string, any>;
  workflowId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  startTime: Date;
  startedAt?: Date;
  endTime?: Date;
  finishedAt?: Date;
  duration?: number;
  triggerType: string;
  triggerData?: Record<string, any>;
  nodeExecutions: NodeExecution[];
  totalNodes: number;
  completedNodes: number;
  errorMessage?: string;
  error?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  inputData?: any;
  outputData?: Record<string, any>;
}

export interface NodeExecution {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startTime?: Date;
  startedAt?: Date;
  endTime?: Date;
  finishedAt?: Date;
  duration?: number;
  input?: Record<string, any>;
  inputData?: any;
  output?: Record<string, any>;
  outputData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  retryAttempt: number;
}

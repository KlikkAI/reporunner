// Workflow Node Types
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

// Workflow Definition
export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  settings: IWorkflowSettings;
  isActive: boolean;
  tags: string[];
  createdBy: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  metadata?: Record<string, any>;
}

export interface IWorkflowSettings {
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

// Workflow Context
export interface INodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  userId: string;
  inputData?: any;
  nodeConfig: any;
  previousNodeResults?: Record<string, any>;
  workflowData?: Record<string, any>;
}

// Workflow Request/Response Types
export interface IWorkflowCreateRequest {
  name: string;
  description?: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  settings?: Partial<IWorkflowSettings>;
  tags?: string[];
}

export interface IWorkflowUpdateRequest {
  name?: string;
  description?: string;
  nodes?: IWorkflowNode[];
  edges?: IWorkflowEdge[];
  settings?: Partial<IWorkflowSettings>;
  tags?: string[];
  isActive?: boolean;
}

// Workflow Statistics
export interface IWorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  inactiveWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  mostUsedNodes: Array<{
    type: string;
    count: number;
  }>;
}
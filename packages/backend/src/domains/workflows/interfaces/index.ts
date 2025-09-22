/**
 * Workflows domain interfaces
 */

export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  userId: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  isActive: boolean;
  settings?: IWorkflowSettings;
  statistics?: IWorkflowStatistics;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface IWorkflowCreateRequest {
  name: string;
  description?: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  settings?: IWorkflowSettings;
}

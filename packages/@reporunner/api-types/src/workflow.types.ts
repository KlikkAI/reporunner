import type { z } from 'zod';
import { ExecutionStatus } from './workflow.types/execution-types';
import { EdgeSchema, NodeSchema, WorkflowSchema } from './workflow.types/workflow-schemas';

// Base Node Interface
export interface INode extends z.infer<typeof NodeSchema> {}

// Edge Interface
export interface IEdge extends z.infer<typeof EdgeSchema> {}

// Workflow Interface
export interface IWorkflow extends z.infer<typeof WorkflowSchema> {}

// Workflow Settings
export interface IWorkflowSettings {
  errorWorkflow?: string;
  timezone?: string;
  timeout?: number;
  maxExecutionTime?: number;
  saveExecutionData?: boolean;
  saveManualExecutions?: boolean;
  retryFailedExecutions?: boolean;
  maxConsecutiveFailures?: number;
  executionOrder?: 'sequential' | 'parallel';
}

// Execution Interface
export interface IExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: Date;
  stoppedAt?: Date;
  executionTime?: number;
  mode: 'manual' | 'trigger' | 'schedule' | 'webhook' | 'retry';
  retryOf?: string;
  retryCount?: number;
  data?: IExecutionData;
  error?: IExecutionError;
  waitTill?: Date;
}

// Execution Data
export interface IExecutionData {
  nodes: Record<string, INodeExecutionData>;
  resultData: {
    runData: Record<string, INodeExecutionData[]>;
    error?: IExecutionError;
    lastNodeExecuted?: string;
  };
}

// Node Execution Data
export interface INodeExecutionData {
  startTime: number;
  executionTime: number;
  executionStatus: ExecutionStatus;
  data?: Record<string, any>;
  error?: IExecutionError;
  source?: string[];
}

// Execution Error
export interface IExecutionError {
  message: string;
  stack?: string;
  node?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export { NodeSchema, EdgeSchema, WorkflowSchema, ExecutionStatus };
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

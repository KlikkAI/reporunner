/**
 * Execution Types - Workflow execution tracking and results
 */

import type { BaseEntity, ExecutionMode, ID, Timestamp } from '../common';

/**
 * Execution status
 */
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'waiting'
  | 'crashed';

/**
 * Node execution status (can differ from overall execution status)
 */
export type NodeExecutionStatus = ExecutionStatus;

/**
 * Execution error interface
 */
export interface IExecutionError {
  message: string;
  code?: string;
  stack?: string;
  node?: ID;
  timestamp: Timestamp;
  context?: Record<string, any>;
  isRecoverable?: boolean;
}

/**
 * Node execution data
 */
export interface INodeExecutionData {
  startTime: number;
  executionTime: number;
  executionStatus: NodeExecutionStatus;
  data?: Record<string, any>;
  output?: any;
  error?: IExecutionError;
  source?: ID[];
  executionCount?: number;
  retryCount?: number;
}

/**
 * Execution data containing all node results
 */
export interface IExecutionData {
  nodes: Record<ID, INodeExecutionData>;
  resultData: {
    runData: Record<ID, INodeExecutionData[]>;
    error?: IExecutionError;
    lastNodeExecuted?: ID;
    executionOrder?: ID[];
  };
  environmentData?: Record<string, any>;
}

/**
 * Execution interface
 */
export interface IExecution extends BaseEntity {
  workflowId: ID;
  status: ExecutionStatus;
  mode: ExecutionMode;
  startedAt: Timestamp;
  stoppedAt?: Timestamp;
  executionTime?: number;
  retryOf?: ID;
  retryCount?: number;
  data?: IExecutionData;
  error?: IExecutionError;
  waitTill?: Timestamp;
  finished: boolean;
  workflowData?: {
    name: string;
    active: boolean;
  };
}

/**
 * Execution progress
 */
export interface IExecutionProgress {
  executionId: ID;
  totalNodes: number;
  completedNodes: number;
  currentNode?: ID;
  percentage: number;
  status: ExecutionStatus;
  startedAt: Timestamp;
  estimatedTimeRemaining?: number;
}

/**
 * Execution summary for lists
 */
export interface IExecutionSummary {
  id: ID;
  workflowId: ID;
  workflowName: string;
  status: ExecutionStatus;
  mode: ExecutionMode;
  startedAt: Timestamp;
  executionTime?: number;
  finished: boolean;
  hasError: boolean;
}

/**
 * Execution statistics
 */
export interface IExecutionStats {
  total: number;
  pending: number;
  running: number;
  success: number;
  error: number;
  cancelled: number;
  averageExecutionTime: number;
  successRate: number;
}

/**
 * Execution filter options
 */
export interface IExecutionFilter {
  workflowId?: ID;
  status?: ExecutionStatus | ExecutionStatus[];
  mode?: ExecutionMode | ExecutionMode[];
  startDateFrom?: Timestamp;
  startDateTo?: Timestamp;
  finished?: boolean;
}

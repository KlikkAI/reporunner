/**
 * Workflows domain interfaces
 */

import type {
  IWorkflow as ApiWorkflow,
  IWorkflowSettings as ApiWorkflowSettings,
  IEdge,
  INode,
} from '@reporunner/api-types';

export interface IWorkflow extends ApiWorkflow {
  userId: string;
  isActive: boolean;
  statistics?: IWorkflowStatistics;
}

export interface IWorkflowSettings extends ApiWorkflowSettings {}

export interface IWorkflowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime?: number;
  lastExecuted?: Date;
}

export interface IWorkflowCreateRequest
  extends Omit<
    ApiWorkflow,
    'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status' | 'version' | 'meta'
  > {
  nodes: INode[];
  edges: IEdge[];
  settings?: ApiWorkflowSettings;
}

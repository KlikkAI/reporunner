/**
 * Workflow Types - Workflow definition and configuration
 * Consolidated from @reporunner/types
 */

import { z } from 'zod';
import type { BaseEntity, EntityStatus, ID, Timestamp } from './common';

/**
 * Node position in the workflow canvas
 */
export interface INodePosition {
  x: number;
  y: number;
}

/**
 * Node schema using Zod
 */
export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.any()).optional(),
  integrationData: z.record(z.string(), z.any()).optional(),
});

/**
 * Edge schema using Zod
 */
export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

/**
 * Workflow schema using Zod
 */
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  active: z.boolean().default(false),
  settings: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Node interface
 */
export interface INode {
  id: ID;
  type: string;
  position: INodePosition;
  data?: Record<string, any>;
  integrationData?: {
    id: string;
    name: string;
    version?: string;
    action?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * Edge interface
 */
export interface IEdge {
  id: ID;
  source: ID;
  target: ID;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'ai' | 'conditional';
  data?: Record<string, any>;
}

/**
 * Workflow settings
 */
export interface IWorkflowSettings {
  errorWorkflow?: ID;
  timezone?: string;
  timeout?: number;
  maxExecutionTime?: number;
  saveExecutionData?: boolean;
  saveManualExecutions?: boolean;
  retryFailedExecutions?: boolean;
  maxConsecutiveFailures?: number;
  executionOrder?: 'sequential' | 'parallel';
  executionTimeout?: number;
}

/**
 * Workflow interface
 */
export interface IWorkflow extends BaseEntity {
  name: string;
  description?: string;
  nodes: INode[];
  edges: IEdge[];
  active: boolean;
  status: EntityStatus;
  settings?: IWorkflowSettings;
  tags?: string[];
  version?: number;
  organizationId?: ID;
  ownerId: ID;
}

/**
 * Workflow statistics
 */
export interface IWorkflowStats {
  workflowId: ID;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionAt?: Timestamp;
  successRate: number;
}

/**
 * Workflow version
 */
export interface IWorkflowVersion {
  id: ID;
  workflowId: ID;
  version: number;
  workflow: IWorkflow;
  createdAt: Timestamp;
  createdBy: ID;
  changeDescription?: string;
}

// Export Zod types
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

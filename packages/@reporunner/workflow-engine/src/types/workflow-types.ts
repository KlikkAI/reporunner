import { z } from 'zod';
import {
  WorkflowStatus,
  ExecutionStatus as ApiExecutionStatus,
  NodeType,
  NodeSchema,
  EdgeSchema,
  WorkflowSchema as ApiWorkflowSchema,
} from '@reporunner/api-types';
// Valid minimal placeholder to satisfy tsup build
export interface WorkflowTypesPlaceholder {}
// Workflow Definition
export const WorkflowNodeSchema = NodeSchema.extend({
  parameters: z.record(z.unknown()),
  credentials: z.string().optional(), // Overrides api-types's string[] to string for engine's internal representation
  disabled: z.boolean().default(false),
  notes: z.string().optional(),
  retryOnFail: z.boolean().default(false), // Specific to engine
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000),
  timeout: z.number().optional(),
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowConnectionSchema = EdgeSchema.extend({
  conditions: z.record(z.unknown()).optional(),
});

export type WorkflowConnection = z.infer<typeof WorkflowConnectionSchema>;

export const WorkflowSchema = ApiWorkflowSchema.extend({
  connections: z.array(WorkflowConnectionSchema),
  settings: z.object({
    timezone: z.string().default('UTC'),
    timeout: z.number().default(300000), // 5 minutes
    retryOnFail: z.boolean().default(false),
    maxRetries: z.number().default(3),
    callerPolicy: z.enum(['own', 'any']).default('own'),
    errorWorkflow: z.string().optional(),
  }),
  active: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.number().default(1),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Execution Types
// Using ApiExecutionStatus from @reporunner/api-types as the canonical source
export const ExecutionStatus = ApiExecutionStatus;

export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
  WAITING = 'waiting',
}

export interface NodeExecutionData {
  json: Record<string, unknown>;
  binary?: Record<string, Buffer>;
  pairedItem?: {
    item: number;
    input?: number;
  };
  error?: {
    message: string;
    stack?: string;
    lineNumber?: number;
    timestamp: Date;
  };
}

export interface NodeExecution {
  nodeId: string;
  status: NodeExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  executionTime?: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// Export all types for use across the workflow engine
export type { WorkflowDefinition, WorkflowExecution, WorkflowEngineNode, WorkflowEngineEdge };

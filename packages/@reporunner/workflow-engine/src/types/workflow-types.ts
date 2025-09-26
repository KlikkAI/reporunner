import { z } from 'zod';

// Workflow Definition
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  parameters: z.record(z.unknown()),
  credentials: z.string().optional(),
  disabled: z.boolean().default(false),
  notes: z.string().optional(),
  retryOnFail: z.boolean().default(false),
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000),
  timeout: z.number().optional(),
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

export const WorkflowConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  conditions: z.record(z.unknown()).optional(),
});

export type WorkflowConnection = z.infer<typeof WorkflowConnectionSchema>;

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
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
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  UNKNOWN = 'unknown',
}

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

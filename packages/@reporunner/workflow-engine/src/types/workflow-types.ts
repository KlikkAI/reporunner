import { z } from 'zod';
import { ExecutionStatus, NodeExecution, WorkflowExecution } from './execution-types';

// Valid minimal placeholder to satisfy tsup build
export type WorkflowTypesPlaceholder = {};

// Workflow Definition - Engine-specific node with additional properties
export const WorkflowNodeSchema = z.object({
  // Base properties from NodeSchema
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().optional(),
    inputs: z.record(z.string(), z.any()).optional(),
    outputs: z.record(z.string(), z.any()).optional(),
    config: z.record(z.string(), z.any()).optional(),
  }),
  meta: z.record(z.string(), z.any()).optional(),

  // Engine-specific properties
  parameters: z.record(z.unknown()),
  credentials: z.string().optional(), // Single credential for engine's internal representation
  disabled: z.boolean().default(false),
  notes: z.string().optional(),
  retryOnFail: z.boolean().default(false),
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(1000),
  timeout: z.number().optional(),
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

// Workflow Connection - Engine-specific edge with additional properties
export const WorkflowConnectionSchema = z.object({
  // Base properties from EdgeSchema
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  meta: z.record(z.string(), z.any()).optional(),

  // Engine-specific properties
  conditions: z.record(z.unknown()).optional(),
});

export type WorkflowConnection = z.infer<typeof WorkflowConnectionSchema>;

// Workflow - Engine-specific workflow with additional properties
export const WorkflowSchema = z.object({
  // Base properties from ApiWorkflowSchema
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowConnectionSchema),

  // Override connections to use our engine schema
  connections: z.array(WorkflowConnectionSchema),

  // Enhanced settings for engine
  settings: z.object({
    timezone: z.string().default('UTC'),
    timeout: z.number().default(300000), // 5 minutes
    retryOnFail: z.boolean().default(false),
    maxRetries: z.number().default(3),
    callerPolicy: z.enum(['own', 'any']).default('own'),
    errorWorkflow: z.string().optional(),
  }),

  // Engine-specific properties
  active: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.number().default(1),
  meta: z.record(z.string(), z.any()).optional(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Execution Types (imported from execution-types.ts to avoid duplication)
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

// Export type aliases for workflow engine
export type WorkflowDefinition = Workflow;
export type WorkflowEngineNode = WorkflowNode;
export type WorkflowEngineEdge = WorkflowConnection;

// Re-export imported types for convenience
export { WorkflowExecution, ExecutionStatus, NodeExecution };

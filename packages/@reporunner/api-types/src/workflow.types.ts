import { z } from 'zod';

// Workflow Status
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

// Execution Status
export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  WAITING = 'WAITING',
  PAUSED = 'PAUSED',
}

// Node Types
export enum NodeType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  CONDITIONAL = 'CONDITIONAL',
  LOOP = 'LOOP',
  WEBHOOK = 'WEBHOOK',
  SCHEDULE = 'SCHEDULE',
  HTTP_REQUEST = 'HTTP_REQUEST',
  FUNCTION = 'FUNCTION',
  AI_AGENT = 'AI_AGENT',
  DATA_TRANSFORM = 'DATA_TRANSFORM',
  INTEGRATION = 'INTEGRATION',
}

// Base Node Interface
export interface INode {
  id: string;
  type: NodeType;
  name: string;
  position: {
    x: number;
    y: number;
  };
  properties: Record<string, any>;
  credentials?: string[];
  disabled?: boolean;
  notes?: string;
  continueOnError?: boolean;
  executeOnce?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

// Edge Interface
export interface IEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  type?: 'default' | 'conditional' | 'error';
  label?: string;
  data?: Record<string, any>;
}

// Workflow Interface
export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: INode[];
  edges: IEdge[];
  status: WorkflowStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  tags?: string[];
  settings?: IWorkflowSettings;
  meta?: Record<string, any>;
}

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

// Zod Schemas for validation
export const NodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NodeType),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  properties: z.record(z.any()),
  credentials: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  notes: z.string().optional(),
  continueOnError: z.boolean().optional(),
  executeOnce: z.boolean().optional(),
  retryOnError: z.boolean().optional(),
  maxRetries: z.number().optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  target: z.string(),
  targetHandle: z.string().optional(),
  type: z.enum(['default', 'conditional', 'error']).optional(),
  label: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  status: z.nativeEnum(WorkflowStatus),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  settings: z
    .object({
      errorWorkflow: z.string().optional(),
      timezone: z.string().optional(),
      timeout: z.number().optional(),
      maxExecutionTime: z.number().optional(),
      saveExecutionData: z.boolean().optional(),
      saveManualExecutions: z.boolean().optional(),
      retryFailedExecutions: z.boolean().optional(),
      maxConsecutiveFailures: z.number().optional(),
      executionOrder: z.enum(['sequential', 'parallel']).optional(),
    })
    .optional(),
  meta: z.record(z.any()).optional(),
});

export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

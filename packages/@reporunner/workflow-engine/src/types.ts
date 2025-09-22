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
  inputData: NodeExecutionData[];
  outputData: NodeExecutionData[];
  error?: {
    message: string;
    stack?: string;
    lineNumber?: number;
    timestamp: Date;
  };
  retryCount: number;
  continueOnFail: boolean;
}

export const ExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.nativeEnum(ExecutionStatus),
  mode: z.enum(['manual', 'trigger', 'webhook', 'retry', 'cli']),
  startTime: z.date(),
  endTime: z.date().optional(),
  executionTime: z.number().optional(),
  nodeExecutions: z.record(z.any()), // NodeExecution mapped by nodeId
  data: z.object({
    startData: z.record(z.unknown()).optional(),
    resultData: z.record(z.unknown()).optional(),
    executionData: z.record(z.unknown()).optional(),
  }),
  finished: z.boolean().default(false),
  waitTill: z.date().optional(),
  retryOf: z.string().optional(),
  retrySuccessId: z.string().optional(),
  stoppedAt: z.date().optional(),
  workflowData: z.any(), // Workflow snapshot
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
});

export type Execution = z.infer<typeof ExecutionSchema>;

// Queue Types
export interface QueueJob {
  id: string;
  type: 'workflow-execution' | 'node-execution' | 'webhook' | 'trigger';
  data: Record<string, unknown>;
  priority: number;
  delay?: number;
  attempts: number;
  maxAttempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  timeout: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface QueueOptions {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
  settings: {
    stalledInterval: number;
    maxStalledCount: number;
  };
}

// Worker Types
export interface WorkerConfig {
  concurrency: number;
  maxMemory: number; // MB
  timeout: number; // ms
  retries: {
    attempts: number;
    delay: number;
  };
  heartbeat: {
    interval: number;
    timeout: number;
  };
}

export interface WorkerStats {
  id: string;
  status: 'idle' | 'busy' | 'error' | 'stopped';
  currentJob?: string;
  processedJobs: number;
  failedJobs: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  uptime: number;
  lastHeartbeat: Date;
}

// Event Types
export enum WorkflowEvent {
  EXECUTION_STARTED = 'execution.started',
  EXECUTION_FINISHED = 'execution.finished',
  EXECUTION_FAILED = 'execution.failed',
  NODE_STARTED = 'node.started',
  NODE_FINISHED = 'node.finished',
  NODE_FAILED = 'node.failed',
  WORKFLOW_ACTIVATED = 'workflow.activated',
  WORKFLOW_DEACTIVATED = 'workflow.deactivated',
}

export interface WorkflowEventData {
  event: WorkflowEvent;
  workflowId: string;
  executionId: string;
  nodeId?: string;
  userId?: string;
  organizationId?: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

// Trigger Types
export interface TriggerConfig {
  id: string;
  workflowId: string;
  nodeId: string;
  type: 'cron' | 'webhook' | 'manual' | 'email' | 'file';
  config: Record<string, unknown>;
  active: boolean;
  lastExecution?: Date;
  nextExecution?: Date;
}

export interface CronTriggerConfig extends TriggerConfig {
  type: 'cron';
  config: {
    expression: string;
    timezone: string;
  };
}

export interface WebhookTriggerConfig extends TriggerConfig {
  type: 'webhook';
  config: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    authentication: {
      type: 'none' | 'basic' | 'header' | 'query';
      config?: Record<string, unknown>;
    };
    responseMode: 'lastNode' | 'firstEntryNode' | 'responseNode';
    responseData?: string;
  };
}

// Workflow Engine Configuration
export interface WorkflowEngineConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  database: {
    type: 'mongodb' | 'postgresql';
    connectionString: string;
  };
  workers: {
    enabled: boolean;
    concurrency: number;
    maxMemory: number;
  };
  queue: QueueOptions;
  security: {
    allowedNodeTypes: string[];
    maxExecutionTime: number;
    maxMemoryUsage: number;
  };
  webhooks: {
    enabled: boolean;
    path: string;
    maxPayloadSize: number;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    database: boolean;
    console: boolean;
  };
}

// Context Types
export interface IExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  userId?: string;
  organizationId?: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry' | 'cli';
  startTime: Date;
  timezone: string;
  workflow: Workflow;
  inputData: NodeExecutionData[];
  getNodeParameter: (parameterName: string, index?: number) => unknown;
  getCredentials: (credentialType: string) => Promise<Record<string, unknown>>;
  helpers: {
    request: (options: any) => Promise<any>;
  };
}

export interface INodeType {
  description: {
    displayName: string;
    name: string;
    group: string[];
    version: number;
    description: string;
    defaults: {
      name: string;
      color?: string;
    };
    inputs: string[];
    outputs: string[];
    properties: NodeProperty[];
    credentials?: CredentialTest[];
    webhooks?: WebhookDescription[];
    polling?: boolean;
  };
  execute: (context: IExecutionContext) => Promise<NodeExecutionData[][]>;
  webhook?: (context: IExecutionContext) => Promise<any>;
  poll?: (context: IExecutionContext) => Promise<NodeExecutionData[][]>;
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: string;
  default: unknown;
  required?: boolean;
  description?: string;
  options?: Array<{
    name: string;
    value: string | number | boolean;
    description?: string;
  }>;
  displayOptions?: {
    show?: Record<string, unknown[]>;
    hide?: Record<string, unknown[]>;
  };
}

export interface CredentialTest {
  name: string;
  required?: boolean;
}

export interface WebhookDescription {
  name: string;
  httpMethod: string;
  path: string;
  responseMode?: string;
}

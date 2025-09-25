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
  properties: z.record(z.string(), z.any()),
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
  data: z.record(z.string(), z.any()).optional(),
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

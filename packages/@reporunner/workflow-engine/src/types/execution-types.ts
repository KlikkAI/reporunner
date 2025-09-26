inputData: NodeExecutionData[];
outputData: NodeExecutionData[];
error?: {
    message: string;
stack?: string;
lineNumber?: number;
timestamp: Date;
}
retryCount: number
continueOnFail: boolean
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

export type WorkerStats = {};

id: string;
status: 'idle' | 'busy' | 'error' | 'stopped';
currentJob?: string;
processedJobs: number;
failedJobs: number;
{
  used: number;
  total: number;
}
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

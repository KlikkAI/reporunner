// Event trigger types reusing patterns from execution types
export interface EventTriggerState {
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

export interface WorkflowEngineConfig {
  maxConcurrentExecutions: number;
  executionTimeout: number;
  retryAttempts: number;
  queueOptions: {
    redis: {
      host: string;
      port: number;
      password?: string;
    };
  };
}

// Event Types
export enum WorkflowEvent {
  EXECUTION_STARTED = 'execution.started',
  EXECUTION_FINISHED = 'execution.finished',
  EXECUTION_FAILED = 'execution.failed',
  EXECUTION_CANCELLED = 'execution.cancelled',
  NODE_STARTED = 'node.started',
  NODE_FINISHED = 'node.finished',
  NODE_FAILED = 'node.failed',
  ENGINE_STARTED = 'engine.started',
  ENGINE_STOPPED = 'engine.stopped',
  ENGINE_ERROR = 'engine.error',
}

export interface WorkflowEventData {
  event: WorkflowEvent;
  executionId: string;
  workflowId: string;
  nodeId?: string;
  timestamp: Date;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// Trigger Configuration
export interface TriggerConfig {
  id: string;
  type: 'webhook' | 'schedule' | 'manual' | 'event';
  enabled: boolean;
  config: Record<string, any>;
  workflowId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookTrigger extends TriggerConfig {
  type: 'webhook';
  config: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'apikey';
      config: Record<string, any>;
    };
  };
}

export interface ScheduleTrigger extends TriggerConfig {
  type: 'schedule';
  config: {
    cron: string;
    timezone: string;
    enabled: boolean;
  };
}

// Execution Status Enums
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export enum TriggerType {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  API = 'api',
}

// Node Execution Interface
export interface INodeExecution {
  nodeId: string;
  nodeName: string;
  status: NodeStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  retryAttempt: number;
}

// Execution Interface
export interface IExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggerType: TriggerType;
  triggerData?: Record<string, any>;
  nodeExecutions: INodeExecution[];
  totalNodes: number;
  completedNodes: number;
  errorMessage?: string;
  metadata: {
    version: number;
    environment: string;
    userAgent?: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Execution Request/Response Types
export interface IExecutionCreateRequest {
  workflowId: string;
  triggerType: TriggerType;
  triggerData?: Record<string, any>;
  runData?: Record<string, any>;
}

export interface IExecutionUpdateRequest {
  status?: ExecutionStatus;
  nodeExecutions?: INodeExecution[];
  errorMessage?: string;
}

// Execution Statistics
export interface IExecutionStats {
  total: number;
  pending: number;
  running: number;
  success: number;
  error: number;
  cancelled: number;
  timeout: number;
  successRate: number;
  avgDuration: number;
}

// Execution types reusing patterns from @klikkflow/types
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
export interface NodeExecution {
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

// Workflow Execution Interface
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggerType: TriggerType;
  triggerData?: Record<string, any>;
  nodeExecutions: NodeExecution[];
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
export interface ExecutionCreateRequest {
  workflowId: string;
  triggerType: TriggerType;
  triggerData?: Record<string, any>;
  runData?: Record<string, any>;
}

export interface ExecutionUpdateRequest {
  status?: ExecutionStatus;
  nodeExecutions?: NodeExecution[];
  errorMessage?: string;
}

// Execution Statistics
export interface ExecutionStats {
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

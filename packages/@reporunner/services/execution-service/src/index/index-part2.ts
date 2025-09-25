triggerType: string;
inputData?: Record<string, any>;
outputData?: Record<string, any>;
error?: ExecutionError;
nodeExecutions: NodeExecution[];
metadata: ExecutionMetadata;
progress: ExecutionProgress;
}

export interface NodeExecution {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'timeout';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  inputData?: any;
  outputData?: any;
  error?: NodeExecutionError;
  attempts: number;
  maxAttempts: number;
  retryCount: number;
  skipReason?: string;
}

export interface NodeExecutionError {
  message: string;
  stack?: string;
  code?: string;
  type: 'validation' | 'runtime' | 'timeout' | 'connection' | 'permission' | 'unknown';
  details?: Record<string, any>;
}

export interface ExecutionError {
  message: string;
  stack?: string;
  code?: string;
  type: 'workflow' | 'node' | 'system' | 'timeout' | 'cancelled';
  nodeId?: string;
  details?: Record<string, any>;
}

export interface ExecutionMetadata {
  correlationId: string;
  environment: string;
  organizationId: string;
  executionContext: Record<string, any>;
  tags?: string[];
  parentExecutionId?: string;
  childExecutions?: string[];
}

export interface ExecutionProgress {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  runningNodes: number;
  pendingNodes: number;
  percentage: number;
  currentPhase: string;
  estimatedTimeRemaining?: number;
}

export interface ExecutionJobData {
  executionId: string;
  workflowId: string;
  workflow: WorkflowDefinition;
  request: ExecutionRequest;
  attempt: number;
}

export class ExecutionService extends EventEmitter {
  private db: Db;
  private executions: Collection<ExecutionResult>;
  private cache: Redis;
  private executionQueue: Queue<ExecutionJobData>;
  private executionWorker: Worker<ExecutionJobData>;
  private eventBus: DistributedEventBus;
  private activeExecutions: Map<string, ExecutionResult> = new Map();
  private nodeExecutors: Map<string, NodeExecutor> = new Map();

  constructor(
    private config: ExecutionConfig,
    private mongoClient: MongoClient,
    eventBus: DistributedEventBus
  ) {
    super();
    this.eventBus = eventBus;
    this.cache = new Redis(config.redis);
    this.db = mongoClient.db(config.mongodb.database);
    this.executions = this.db.collection<ExecutionResult>('workflow_executions');

    // Initialize BullMQ
    this.executionQueue = new Queue<ExecutionJobData>('workflow-execution', {
      connection: config.redis,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,

status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
startedAt: Date;
completedAt?: Date;
duration?: number;
input: Record<string, any>;
output?: Record<string, any>;
error?: any;
nodeExecutions: NodeExecution[];
metadata: ExecutionMetadata;
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: any;
  attempts: number;
}

export interface ExecutionMetadata {
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'api';
  environment: string;
  correlationId?: string;
}

export class WorkflowService extends EventEmitter {
  private db: Db;
  private workflows: Collection<WorkflowDefinition>;
  private executions: Collection<WorkflowExecution>;
  private cache: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private mongoClient: MongoClient,
    private redisClient: Redis
  ) {
    super();
    this.cache = redisClient;
    this.db = mongoClient.db('reporunner');
    this.workflows = this.db.collection<WorkflowDefinition>('workflows');
    this.executions = this.db.collection<WorkflowExecution>('workflow_executions');
    this.initializeIndexes();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      // Create indexes for efficient queries
      await this.workflows.createIndex({ organizationId: 1, createdAt: -1 });
      await this.workflows.createIndex({ 'tags': 1 });
      await this.workflows.createIndex({ status: 1 });
      await this.workflows.createIndex({ createdBy: 1 });
      await this.workflows.createIndex({ name: 'text', description: 'text' });
      
      await this.executions.createIndex({ workflowId: 1, startedAt: -1 });
      await this.executions.createIndex({ status: 1 });
      await this.executions.createIndex({ 'metadata.correlationId': 1 });
      
      logger.info('Database indexes initialized');
    } catch (error) {
      logger.error('Failed to create indexes', error);
    }
  }

  async create(
    workflow: Omit<WorkflowDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<WorkflowDefinition> {
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id: uuidv4(),
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      status: workflow.status || 'draft'
    };

    try {
      // Validate workflow structure
      this.validateWorkflow(newWorkflow);
      
      // Save to database
      await this.workflows.insertOne(newWorkflow);
      
      // Cache the workflow
      await this.cacheWorkflow(newWorkflow);
      
      // Emit event for other services
      this.emit('workflow.created', {
        workflowId: newWorkflow.id,
        userId,
        organizationId: newWorkflow.organizationId
      });
      
      logger.info(`Workflow created: ${newWorkflow.id}`);
      return newWorkflow;

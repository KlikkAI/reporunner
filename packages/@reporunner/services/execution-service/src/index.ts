import type { DistributedEventBus } from '@reporunner/platform/event-bus';
import { logger } from '@reporunner/shared/logger';
import { type Job, Queue, Worker } from 'bullmq';
import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import type { Collection, Db, MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionConfig {
  maxConcurrentExecutions: number;
  executionTimeout: number;
  retryAttempts: number;
  queueSize: number;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  mongodb: {
    uri: string;
    database: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
  organizationId: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  config?: NodeConfiguration;
}

export interface NodeConfiguration {
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialInterval: number;
  };
  timeout?: number;
  skipOnError?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: EdgeCondition;
}

export interface EdgeCondition {
  type: 'expression' | 'value' | 'status';
  expression?: string;
  value?: any;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
}

export interface WorkflowSettings {
  timeout: number;
  retries: number;
  errorHandling: 'stop' | 'continue' | 'rollback';
  parallelism?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface ExecutionRequest {
  workflowId: string;
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'api';
  inputData?: Record<string, any>;
  environment?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    async?: boolean;
  };
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  triggeredBy: string;
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
        attempts: config.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.executionWorker = new Worker<ExecutionJobData>(
      'workflow-execution',
      this.processExecution.bind(this),
      {
        connection: config.redis,
        concurrency: config.maxConcurrentExecutions,
        limiter: {
          max: config.maxConcurrentExecutions,
          duration: 1000,
        },
      }
    );

    this.initializeIndexes();
    this.setupWorkerEvents();
    this.setupEventSubscriptions();
    this.registerNodeExecutors();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      await this.executions.createIndex({ workflowId: 1, startedAt: -1 });
      await this.executions.createIndex({ status: 1 });
      await this.executions.createIndex({ triggeredBy: 1 });
      await this.executions.createIndex({ 'metadata.correlationId': 1 });
      await this.executions.createIndex({ 'metadata.organizationId': 1 });
      await this.executions.createIndex({ startedAt: -1 });

      logger.info('Execution service indexes initialized');
    } catch (error) {
      logger.error('Failed to create execution indexes', error);
    }
  }

  private setupWorkerEvents(): void {
    this.executionWorker.on('completed', async (job: Job<ExecutionJobData>) => {
      logger.info(`Execution completed: ${job.data.executionId}`);
      await this.handleExecutionCompleted(job.data.executionId);
    });

    this.executionWorker.on('failed', async (job: Job<ExecutionJobData>, error: Error) => {
      logger.error(`Execution failed: ${job?.data?.executionId}`, error);
      if (job?.data?.executionId) {
        await this.handleExecutionFailed(job.data.executionId, error);
      }
    });

    this.executionWorker.on('stalled', (job: Job<ExecutionJobData>) => {
      logger.warn(`Execution stalled: ${job.data.executionId}`);
    });
  }

  private async setupEventSubscriptions(): Promise<void> {
    // Subscribe to workflow events
    await this.eventBus.subscribe('workflow.*', async (event) => {
      await this.handleWorkflowEvent(event);
    });

    // Subscribe to node execution events
    await this.eventBus.subscribe('node.execution.*', async (event) => {
      await this.handleNodeExecutionEvent(event);
    });
  }

  private registerNodeExecutors(): void {
    // Register built-in node executors
    this.nodeExecutors.set('trigger', new TriggerNodeExecutor());
    this.nodeExecutors.set('action', new ActionNodeExecutor());
    this.nodeExecutors.set('condition', new ConditionNodeExecutor());
    this.nodeExecutors.set('transform', new TransformNodeExecutor());
    this.nodeExecutors.set('delay', new DelayNodeExecutor());
    this.nodeExecutors.set('webhook', new WebhookNodeExecutor());
    this.nodeExecutors.set('email', new EmailNodeExecutor());
    this.nodeExecutors.set('database', new DatabaseNodeExecutor());
    this.nodeExecutors.set('ai-agent', new AIAgentNodeExecutor());
    this.nodeExecutors.set('loop', new LoopNodeExecutor());
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      // Validate request
      this.validateExecutionRequest(request);

      // Get workflow definition
      const workflow = await this.getWorkflowDefinition(request.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${request.workflowId}`);
      }

      // Create execution record
      const execution = await this.createExecution(request, workflow);

      // Add to queue for processing
      await this.executionQueue.add(
        'execute-workflow',
        {
          executionId: execution.id,
          workflowId: request.workflowId,
          workflow,
          request,
          attempt: 1,
        },
        {
          priority: this.getPriorityWeight(request.options?.priority || 'normal'),
          delay: 0,
          jobId: execution.id,
        }
      );

      // Emit execution started event
      await this.eventBus.publish('execution.started', {
        executionId: execution.id,
        workflowId: request.workflowId,
        triggeredBy: request.triggeredBy,
      });

      logger.info(`Execution queued: ${execution.id}`);
      return execution;
    } catch (error) {
      logger.error('Failed to start execution', error);
      throw error;
    }
  }

  private async processExecution(job: Job<ExecutionJobData>): Promise<void> {
    const { executionId, workflow, request } = job.data;

    try {
      // Update execution status to running
      await this.updateExecutionStatus(executionId, 'running');

      // Get current execution state
      const execution = await this.getExecution(executionId);
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      this.activeExecutions.set(executionId, execution);

      // Execute workflow with topological sorting
      const result = await this.executeWorkflowNodes(execution, workflow, request);

      // Update final execution result
      await this.completeExecution(executionId, result);

      this.activeExecutions.delete(executionId);
    } catch (error) {
      logger.error(`Execution processing failed: ${executionId}`, error);
      await this.failExecution(executionId, error as Error);
      this.activeExecutions.delete(executionId);
      throw error;
    }
  }

  private async executeWorkflowNodes(
    execution: ExecutionResult,
    workflow: WorkflowDefinition,
    request: ExecutionRequest
  ): Promise<Record<string, any>> {
    const nodeOutputs = new Map<string, any>();
    const executedNodes = new Set<string>();
    const nodeQueue = this.topologicalSort(workflow.nodes, workflow.edges);

    // Initialize node executions
    for (const node of workflow.nodes) {
      const nodeExecution: NodeExecution = {
        nodeId: node.id,
        nodeName: node.data.name || node.type,
        nodeType: node.type,
        status: 'pending',
        attempts: 0,
        maxAttempts: node.config?.retryPolicy?.maxAttempts || 3,
        retryCount: 0,
      };
      execution.nodeExecutions.push(nodeExecution);
    }

    // Process nodes in topological order
    for (const nodeId of nodeQueue) {
      if (execution.status === 'cancelled') {
        break;
      }

      const node = workflow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      try {
        // Check if node should be executed based on conditions
        if (!(await this.shouldExecuteNode(node, workflow.edges, nodeOutputs, execution))) {
          await this.skipNode(execution.id, nodeId, 'Condition not met');
          continue;
        }

        // Execute node
        const result = await this.executeNode(execution, node, nodeOutputs, request);
        nodeOutputs.set(nodeId, result);
        executedNodes.add(nodeId);

        await this.updateExecutionProgress(execution.id);
      } catch (error) {
        logger.error(`Node execution failed: ${nodeId}`, error);

        // Handle error based on workflow settings
        if (workflow.settings.errorHandling === 'stop') {
          throw error;
        } else if (workflow.settings.errorHandling === 'continue') {
          await this.failNode(execution.id, nodeId, error as Error);
        } else if (workflow.settings.errorHandling === 'rollback') {
          await this.rollbackExecution(execution.id, executedNodes);
          throw error;
        }
      }
    }

    // Return final output
    return this.buildWorkflowOutput(nodeOutputs, workflow);
  }

  private async executeNode(
    execution: ExecutionResult,
    node: WorkflowNode,
    nodeOutputs: Map<string, any>,
    request: ExecutionRequest
  ): Promise<any> {
    const nodeExecution = execution.nodeExecutions.find((ne) => ne.nodeId === node.id);
    if (!nodeExecution) {
      throw new Error(`Node execution not found: ${node.id}`);
    }

    // Update node status to running
    await this.updateNodeStatus(execution.id, node.id, 'running');

    try {
      const executor = this.nodeExecutors.get(node.type);
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      // Prepare node input data
      const inputData = await this.prepareNodeInput(node, nodeOutputs, request);

      // Execute node with timeout
      const timeout = node.config?.timeout || this.config.executionTimeout;
      const result = await Promise.race([
        executor.execute(node, inputData, {
          executionId: execution.id,
          correlationId: execution.metadata.correlationId,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Node execution timeout')), timeout)
        ),
      ]);

      // Update node status to completed
      await this.updateNodeStatus(execution.id, node.id, 'completed', result);

      // Emit node completed event
      await this.eventBus.publish('node.execution.completed', {
        executionId: execution.id,
        nodeId: node.id,
        nodeType: node.type,
        result,
      });

      return result;
    } catch (error) {
      // Update node status to failed
      await this.updateNodeStatus(execution.id, node.id, 'failed', null, error as Error);

      // Emit node failed event
      await this.eventBus.publish('node.execution.failed', {
        executionId: execution.id,
        nodeId: node.id,
        nodeType: node.type,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  async getExecution(id: string): Promise<ExecutionResult | null> {
    try {
      // Check cache first
      const cached = await this.cache.get(`execution:${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const execution = await this.executions.findOne({ id });

      if (execution) {
        // Cache for future requests
        await this.cache.setex(`execution:${id}`, 300, JSON.stringify(execution));
      }

      return execution;
    } catch (error) {
      logger.error(`Failed to get execution: ${id}`, error);
      throw error;
    }
  }

  async cancelExecution(id: string, reason?: string): Promise<boolean> {
    try {
      const execution = await this.getExecution(id);
      if (!execution) {
        return false;
      }

      if (execution.status === 'completed' || execution.status === 'failed') {
        return false; // Cannot cancel completed executions
      }

      // Update execution status
      await this.updateExecutionStatus(id, 'cancelled');

      // Cancel job in queue if pending
      const job = await this.executionQueue.getJob(id);
      if (job && (await job.isWaiting())) {
        await job.remove();
      }

      // Emit cancellation event
      await this.eventBus.publish('execution.cancelled', {
        executionId: id,
        reason: reason || 'User cancellation',
      });

      logger.info(`Execution cancelled: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel execution: ${id}`, error);
      return false;
    }
  }

  async listExecutions(
    filters: {
      workflowId?: string;
      status?: string;
      triggeredBy?: string;
      organizationId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: {
      page: number;
      limit: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<{ executions: ExecutionResult[]; total: number }> {
    try {
      const query: any = {};

      if (filters.workflowId) query.workflowId = filters.workflowId;
      if (filters.status) query.status = filters.status;
      if (filters.triggeredBy) query.triggeredBy = filters.triggeredBy;
      if (filters.organizationId) query['metadata.organizationId'] = filters.organizationId;

      if (filters.startDate || filters.endDate) {
        query.startedAt = {};
        if (filters.startDate) query.startedAt.$gte = filters.startDate;
        if (filters.endDate) query.startedAt.$lte = filters.endDate;
      }

      const skip = (pagination.page - 1) * pagination.limit;
      const sort = pagination.sort || { startedAt: -1 };

      const [executions, total] = await Promise.all([
        this.executions.find(query).sort(sort).skip(skip).limit(pagination.limit).toArray(),
        this.executions.countDocuments(query),
      ]);

      return { executions, total };
    } catch (error) {
      logger.error('Failed to list executions', error);
      throw error;
    }
  }

  async getExecutionStats(filters?: {
    workflowId?: string;
    organizationId?: string;
    timeRange?: { from: Date; to: Date };
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byTriggerType: Record<string, number>;
    avgDuration: number;
    successRate: number;
  }> {
    try {
      const query: any = {};
      if (filters?.workflowId) query.workflowId = filters.workflowId;
      if (filters?.organizationId) query['metadata.organizationId'] = filters.organizationId;
      if (filters?.timeRange) {
        query.startedAt = {
          $gte: filters.timeRange.from,
          $lte: filters.timeRange.to,
        };
      }

      const pipeline = [
        { $match: query },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byTriggerType: [{ $group: { _id: '$triggerType', count: { $sum: 1 } } }],
            duration: [
              { $match: { duration: { $exists: true } } },
              { $group: { _id: null, avg: { $avg: '$duration' } } },
            ],
            successRate: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  successful: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                  },
                },
              },
            ],
          },
        },
      ];

      const result = await this.executions.aggregate(pipeline).toArray();
      const data = result[0];

      return {
        total: data.total[0]?.count || 0,
        byStatus: Object.fromEntries(data.byStatus.map((item: any) => [item._id, item.count])),
        byTriggerType: Object.fromEntries(
          data.byTriggerType.map((item: any) => [item._id, item.count])
        ),
        avgDuration: data.duration[0]?.avg || 0,
        successRate: data.successRate[0]
          ? (data.successRate[0].successful / data.successRate[0].total) * 100
          : 0,
      };
    } catch (error) {
      logger.error('Failed to get execution stats', error);
      throw error;
    }
  }

  // Helper methods
  private validateExecutionRequest(request: ExecutionRequest): void {
    if (!request.workflowId) {
      throw new Error('Workflow ID is required');
    }
    if (!request.triggeredBy) {
      throw new Error('Triggered by is required');
    }
  }

  private getPriorityWeight(priority: string): number {
    const weights = { low: 1, normal: 5, high: 10, critical: 20 };
    return weights[priority as keyof typeof weights] || 5;
  }

  private async createExecution(
    request: ExecutionRequest,
    workflow: WorkflowDefinition
  ): Promise<ExecutionResult> {
    const execution: ExecutionResult = {
      id: uuidv4(),
      workflowId: request.workflowId,
      status: 'pending',
      startedAt: new Date(),
      triggeredBy: request.triggeredBy,
      triggerType: request.triggerType,
      inputData: request.inputData,
      nodeExecutions: [],
      metadata: {
        correlationId: request.correlationId || uuidv4(),
        environment: request.environment || 'production',
        organizationId: workflow.organizationId,
        executionContext: request.metadata || {},
      },
      progress: {
        totalNodes: workflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        runningNodes: 0,
        pendingNodes: workflow.nodes.length,
        percentage: 0,
        currentPhase: 'initializing',
      },
    };

    await this.executions.insertOne(execution);
    return execution;
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const node of nodes) {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // Build graph
    for (const edge of edges) {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  // Placeholder implementations for remaining methods
  private async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition | null> {
    // This would integrate with WorkflowService
    // For now, return a mock workflow for testing
    return {
      id: workflowId,
      name: 'Test Workflow',
      nodes: [],
      edges: [],
      settings: {
        timeout: 30000,
        retries: 3,
        errorHandling: 'stop',
      },
      organizationId: 'test-org',
    };
  }

  private async updateExecutionStatus(
    id: string,
    status: ExecutionResult['status']
  ): Promise<void> {
    await this.executions.updateOne({ id }, { $set: { status, updatedAt: new Date() } });
  }

  private async shouldExecuteNode(
    node: WorkflowNode,
    edges: WorkflowEdge[],
    nodeOutputs: Map<string, any>,
    execution: ExecutionResult
  ): Promise<boolean> {
    // Find incoming edges with conditions
    const incomingEdges = edges.filter((edge) => edge.target === node.id && edge.condition);

    if (incomingEdges.length === 0) {
      return true; // No conditions, execute
    }

    // Evaluate all conditions
    for (const edge of incomingEdges) {
      const sourceOutput = nodeOutputs.get(edge.source);
      if (!this.evaluateCondition(edge.condition!, sourceOutput)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: EdgeCondition, sourceOutput: any): boolean {
    switch (condition.type) {
      case 'value':
        return this.compareValues(sourceOutput, condition.value, condition.operator || 'eq');
      case 'expression':
        // Implement expression evaluation (could use a safe eval library)
        return true; // Placeholder
      case 'status':
        return sourceOutput?.status === condition.value;
      default:
        return true;
    }
  }

  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      default:
        return true;
    }
  }

  private async skipNode(executionId: string, nodeId: string, reason: string): Promise<void> {
    await this.updateNodeStatus(executionId, nodeId, 'skipped', null, null, reason);
  }

  private async failNode(executionId: string, nodeId: string, error: Error): Promise<void> {
    await this.updateNodeStatus(executionId, nodeId, 'failed', null, error);
  }

  private async updateNodeStatus(
    executionId: string,
    nodeId: string,
    status: NodeExecution['status'],
    result?: any,
    error?: Error,
    skipReason?: string
  ): Promise<void> {
    const update: any = {
      'nodeExecutions.$.status': status,
      'nodeExecutions.$.completedAt': new Date(),
    };

    if (result !== undefined) update['nodeExecutions.$.outputData'] = result;
    if (error) {
      update['nodeExecutions.$.error'] = {
        message: error.message,
        stack: error.stack,
        type: 'runtime',
      };
    }
    if (skipReason) update['nodeExecutions.$.skipReason'] = skipReason;

    await this.executions.updateOne(
      { id: executionId, 'nodeExecutions.nodeId': nodeId },
      { $set: update }
    );
  }

  private async updateExecutionProgress(executionId: string): Promise<void> {
    const execution = await this.getExecution(executionId);
    if (!execution) return;

    const completed = execution.nodeExecutions.filter((ne) => ne.status === 'completed').length;
    const failed = execution.nodeExecutions.filter((ne) => ne.status === 'failed').length;
    const skipped = execution.nodeExecutions.filter((ne) => ne.status === 'skipped').length;
    const running = execution.nodeExecutions.filter((ne) => ne.status === 'running').length;
    const pending = execution.nodeExecutions.filter((ne) => ne.status === 'pending').length;

    const progress: ExecutionProgress = {
      totalNodes: execution.nodeExecutions.length,
      completedNodes: completed,
      failedNodes: failed,
      skippedNodes: skipped,
      runningNodes: running,
      pendingNodes: pending,
      percentage: Math.round(
        ((completed + failed + skipped) / execution.nodeExecutions.length) * 100
      ),
      currentPhase: running > 0 ? 'executing' : pending > 0 ? 'pending' : 'completed',
    };

    await this.executions.updateOne({ id: executionId }, { $set: { progress } });
  }

  private async prepareNodeInput(
    node: WorkflowNode,
    nodeOutputs: Map<string, any>,
    request: ExecutionRequest
  ): Promise<any> {
    // Merge node configuration with outputs from previous nodes
    const input = {
      ...node.data,
      ...request.inputData,
    };

    // Add outputs from connected nodes
    const nodeOutput: Record<string, any> = {};
    for (const [nodeId, output] of nodeOutputs) {
      nodeOutput[nodeId] = output;
    }

    return {
      ...input,
      $nodes: nodeOutput,
      $execution: {
        id: request.correlationId,
        triggeredBy: request.triggeredBy,
      },
    };
  }

  private buildWorkflowOutput(
    nodeOutputs: Map<string, any>,
    workflow: WorkflowDefinition
  ): Record<string, any> {
    // Find output nodes (nodes with no outgoing edges)
    const nodeIds = new Set(workflow.nodes.map((n) => n.id));
    const hasOutgoing = new Set(workflow.edges.map((e) => e.source));
    const outputNodes = Array.from(nodeIds).filter((id) => !hasOutgoing.has(id));

    // Build output from final nodes
    const output: Record<string, any> = {};
    for (const nodeId of outputNodes) {
      const nodeOutput = nodeOutputs.get(nodeId);
      if (nodeOutput !== undefined) {
        output[nodeId] = nodeOutput;
      }
    }

    return Object.keys(output).length > 0 ? output : Object.fromEntries(nodeOutputs);
  }

  private async rollbackExecution(executionId: string, executedNodes: Set<string>): Promise<void> {
    logger.info(`Rolling back execution: ${executionId}`, {
      executedNodes: Array.from(executedNodes),
    });
    // Implement rollback logic based on node types
    // This would typically involve calling rollback methods on node executors
  }

  private async completeExecution(executionId: string, result: Record<string, any>): Promise<void> {
    const now = new Date();
    const execution = await this.getExecution(executionId);
    const duration = execution ? now.getTime() - execution.startedAt.getTime() : 0;

    await this.executions.updateOne(
      { id: executionId },
      {
        $set: {
          status: 'completed',
          completedAt: now,
          outputData: result,
          duration,
        },
      }
    );
  }

  private async failExecution(executionId: string, error: Error): Promise<void> {
    const now = new Date();
    const execution = await this.getExecution(executionId);
    const duration = execution ? now.getTime() - execution.startedAt.getTime() : 0;

    await this.executions.updateOne(
      { id: executionId },
      {
        $set: {
          status: 'failed',
          completedAt: now,
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            type: 'workflow',
          },
        },
      }
    );
  }

  private async handleExecutionCompleted(executionId: string): Promise<void> {
    await this.eventBus.publish('execution.completed', { executionId });
  }

  private async handleExecutionFailed(executionId: string, error: Error): Promise<void> {
    await this.eventBus.publish('execution.failed', { executionId, error: error.message });
  }

  private async handleWorkflowEvent(event: any): Promise<void> {
    logger.debug('Handling workflow event', event);
  }

  private async handleNodeExecutionEvent(event: any): Promise<void> {
    logger.debug('Handling node execution event', event);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    activeExecutions: number;
    queueSize: number;
    workerStatus: string;
  }> {
    try {
      const queueSize = await this.executionQueue.count();
      const workerStatus = (await this.executionWorker.isRunning()) ? 'running' : 'stopped';

      return {
        status: 'healthy',
        activeExecutions: this.activeExecutions.size,
        queueSize,
        workerStatus,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        activeExecutions: 0,
        queueSize: 0,
        workerStatus: 'error',
      };
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down execution service');

    await this.executionWorker.close();
    await this.executionQueue.close();
    await this.cache.quit();

    this.activeExecutions.clear();
    this.nodeExecutors.clear();
  }
}

// Base interface for node executors
export interface NodeExecutor {
  execute(
    node: WorkflowNode,
    input: any,
    context: { executionId: string; correlationId: string }
  ): Promise<any>;
}

// Node executor implementations
class TriggerNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    return {
      triggered: true,
      timestamp: new Date(),
      input,
      nodeId: node.id,
    };
  }
}

class ActionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    // Simulate action execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      action: node.data.action || 'default_action',
      result: 'action_executed',
      input,
      nodeId: node.id,
      timestamp: new Date(),
    };
  }
}

class ConditionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const condition = node.data.condition;
    const result = this.evaluateCondition(condition, input);

    return {
      condition: result,
      input,
      nodeId: node.id,
      evaluation: condition,
    };
  }

  private evaluateCondition(condition: any, input: any): boolean {
    if (!condition) return true;

    // Simple condition evaluation
    if (condition.type === 'value') {
      return input[condition.field] === condition.value;
    }

    return true;
  }
}

class TransformNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const transformation = node.data.transformation || {};

    // Apply simple transformations
    const transformed = { ...input };

    if (transformation.mapping) {
      for (const [from, to] of Object.entries(transformation.mapping)) {
        if (input[from] !== undefined) {
          transformed[to as string] = input[from];
          delete transformed[from];
        }
      }
    }

    return {
      transformed,
      originalInput: input,
      nodeId: node.id,
    };
  }
}

class DelayNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const delay = node.data.delay || 1000;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      delayed: true,
      duration: delay,
      input,
      nodeId: node.id,
      timestamp: new Date(),
    };
  }
}

class WebhookNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { url, method = 'POST', headers = {} } = node.data;

    if (!url) {
      throw new Error('Webhook URL is required');
    }

    // Simulate webhook call
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      webhook_called: true,
      url,
      method,
      headers,
      input,
      nodeId: node.id,
      response: { status: 200, data: 'success' },
    };
  }
}

class EmailNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { to, subject, body } = node.data;

    if (!to) {
      throw new Error('Email recipient is required');
    }

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      email_sent: true,
      to,
      subject,
      body,
      input,
      nodeId: node.id,
      messageId: `msg_${Date.now()}`,
    };
  }
}

class DatabaseNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { operation, collection, query } = node.data;

    // Simulate database operation
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      db_operation: operation || 'find',
      collection,
      query,
      result: { matched: 1, modified: 1 },
      input,
      nodeId: node.id,
    };
  }
}

class AIAgentNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { provider, model, prompt } = node.data;

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      ai_response: `AI response for: ${prompt}`,
      provider: provider || 'openai',
      model: model || 'gpt-3.5-turbo',
      input,
      nodeId: node.id,
      tokens_used: 150,
    };
  }
}

class LoopNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, input: any): Promise<any> {
    const { iterations = 1, condition } = node.data;
    const results: any[] = [];

    for (let i = 0; i < iterations; i++) {
      // Simulate loop iteration
      await new Promise((resolve) => setTimeout(resolve, 50));

      results.push({
        iteration: i + 1,
        input: { ...input, iteration: i + 1 },
        result: `iteration_${i + 1}_complete`,
      });

      // Check condition if provided
      if (condition && !this.evaluateLoopCondition(condition, results[i])) {
        break;
      }
    }

    return {
      loop_completed: true,
      iterations: results.length,
      results,
      nodeId: node.id,
    };
  }

  private evaluateLoopCondition(condition: any, iterationResult: any): boolean {
    // Simple condition evaluation for loop continuation
    return true; // Placeholder
  }
}

export * from './queue';
export * from './worker';

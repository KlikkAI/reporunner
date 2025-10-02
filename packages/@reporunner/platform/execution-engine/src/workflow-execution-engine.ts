import { EventEmitter } from 'node:events';
import {
  ExecutionStatus,
  type IEdge,
  type IExecution,
  type INode,
  type INodeExecutionData,
  type IWorkflow,
  NodeType,
} from '@reporunner/types';
import { ERROR_CODES, EVENTS, SYSTEM } from '@reporunner/constants';
import type { DatabaseService } from '@reporunner/database';
import { type Job, Queue, Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import type { Logger } from 'winston';

export interface ExecutionEngineConfig {
  database: DatabaseService;
  logger: Logger;
  redis: {
    host: string;
    port: number;
  };
  maxExecutionTime?: number;
  maxRetries?: number;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  organizationId: string;
  mode: 'manual' | 'trigger' | 'schedule' | 'webhook';
  startedAt: Date;
  variables: Map<string, any>;
  nodeResults: Map<string, INodeExecutionData>;
  credentials: Map<string, any>;
}

export interface NodeExecutor {
  execute(node: INode, context: ExecutionContext, inputData: any): Promise<any>;
}

export class WorkflowExecutionEngine extends EventEmitter {
  private db: DatabaseService;
  private logger: Logger;
  private executionQueue: Queue;
  private worker!: Worker;
  private nodeExecutors: Map<string, NodeExecutor> = new Map();
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private config: ExecutionEngineConfig;

  constructor(config: ExecutionEngineConfig) {
    super();
    this.config = config;
    this.db = config.database;
    this.logger = config.logger;

    // Initialize BullMQ for job processing
    this.executionQueue = new Queue('workflow-execution', {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

    // Initialize worker
    this.setupWorker();

    // Register default node executors
    this.registerDefaultExecutors();
  }

  /**
   * Register a node executor for a specific node type
   */
  registerNodeExecutor(nodeType: string, executor: NodeExecutor): void {
    this.nodeExecutors.set(nodeType, executor);
    this.logger.info(`Registered executor for node type: ${nodeType}`);
  }

  /**
   * Start workflow execution
   */
  async executeWorkflow(
    workflowId: string,
    userId: string,
    mode: ExecutionContext['mode'] = 'manual',
    triggerData?: any
  ): Promise<string> {
    try {
      // Load workflow
      const workflow = (await this.db.mongo.workflows.findOne({
        id: workflowId,
      })) as IWorkflow;
      if (!workflow) {
        throw new ExecutionError('Workflow not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Check permissions
      if (!(await this.checkExecutionPermission(userId, workflowId))) {
        throw new ExecutionError('Permission denied', ERROR_CODES.AUTH_UNAUTHORIZED);
      }

      // Create execution record
      const executionId = uuidv4();
      const execution: IExecution = {
        id: executionId,
        workflowId,
        status: ExecutionStatus.PENDING,
        startedAt: new Date(),
        mode,
        data: {
          nodes: {},
          resultData: {
            runData: {},
          },
        },
      };

      // Save execution to database
      await this.db.mongo.executions.insertOne(execution);

      // Queue the execution
      await this.executionQueue.add(
        'execute',
        {
          executionId,
          workflowId,
          userId,
          organizationId: (workflow as any).organizationId || '',
          mode,
          triggerData,
        },
        {
          attempts: this.config.maxRetries || 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      // Emit event
      this.emit(EVENTS.EXECUTION_STARTED, { executionId, workflowId, userId });

      return executionId;
    } catch (error) {
      this.logger.error('Failed to start workflow execution', {
        error,
        workflowId,
      });
      throw error;
    }
  }

  /**
   * Execute specific node chain (for testing/debugging)
   */
  async executeNodeChain(nodeId: string, workflowId: string, userId: string): Promise<any> {
    const workflow = (await this.db.mongo.workflows.findOne({
      id: workflowId,
    })) as IWorkflow;
    if (!workflow) {
      throw new ExecutionError('Workflow not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Find target node
    const targetNode = workflow.nodes.find((n) => n.id === nodeId);
    if (!targetNode) {
      throw new ExecutionError('Node not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Build execution plan
    const executionPlan = this.buildExecutionPlan(workflow.nodes, workflow.edges, nodeId);

    // Create execution context
    const context: ExecutionContext = {
      executionId: uuidv4(),
      workflowId,
      userId,
      organizationId: (workflow as any).organizationId || '',
      mode: 'manual',
      startedAt: new Date(),
      variables: new Map(),
      nodeResults: new Map(),
      credentials: new Map(),
    };

    // Execute nodes in order
    for (const node of executionPlan) {
      const inputData = this.getNodeInputData(node, workflow.edges, context.nodeResults);
      const result = await this.executeNode(node, context, inputData);
      context.nodeResults.set(node.id, result);
    }

    return context.nodeResults.get(nodeId);
  }

  /**
   * Setup BullMQ worker
   */
  private setupWorker(): void {
    this.worker = new Worker(
      'workflow-execution',
      async (job: Job) => {
        return await this.processExecution(job.data);
      },
      {
        connection: {
          host: this.config.redis.host,
          port: this.config.redis.port,
        },
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.info(`Execution completed: ${job.data.executionId}`);
      this.emit(EVENTS.EXECUTION_COMPLETED, job.data);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Execution failed: ${job?.data.executionId}`, err);
      this.emit(EVENTS.EXECUTION_FAILED, { ...job?.data, error: err });
    });
  }

  /**
   * Process workflow execution
   */
  private async processExecution(jobData: any): Promise<any> {
    const { executionId, workflowId, userId, organizationId, mode, triggerData } = jobData;

    try {
      // Update execution status to RUNNING
      await this.updateExecutionStatus(executionId, ExecutionStatus.RUNNING);

      // Load workflow
      const workflow = (await this.db.mongo.workflows.findOne({
        id: workflowId,
      })) as IWorkflow;

      // Create execution context
      const context: ExecutionContext = {
        executionId,
        workflowId,
        userId,
        organizationId,
        mode,
        startedAt: new Date(),
        variables: new Map(),
        nodeResults: new Map(),
        credentials: new Map(),
      };

      // Store active execution
      this.activeExecutions.set(executionId, context);

      // Find trigger nodes or start nodes
      const startNodes = this.findStartNodes(workflow.nodes, workflow.edges);

      // Execute workflow
      const results = await this.executeWorkflowNodes(workflow, context, startNodes, triggerData);

      // Update execution with results
      await this.updateExecutionResults(executionId, results, ExecutionStatus.SUCCESS);

      // Clean up
      this.activeExecutions.delete(executionId);

      return results;
    } catch (error) {
      // Update execution status to FAILED
      await this.updateExecutionStatus(executionId, ExecutionStatus.FAILED, error);

      // Clean up
      this.activeExecutions.delete(executionId);

      throw error;
    }
  }

  /**
   * Execute workflow nodes
   */
  private async executeWorkflowNodes(
    workflow: IWorkflow,
    context: ExecutionContext,
    startNodes: INode[],
    triggerData?: any
  ): Promise<any> {
    const executedNodes = new Set<string>();
    const nodesToExecute = [...startNodes];
    const results: any = {};

    while (nodesToExecute.length > 0) {
      const node = nodesToExecute.shift()!;

      if (executedNodes.has(node.id)) {
        continue;
      }

      // Check if all dependencies are executed
      const dependencies = this.getNodeDependencies(node.id, workflow.edges);
      const allDependenciesExecuted = dependencies.every((depId) => executedNodes.has(depId));

      if (!allDependenciesExecuted) {
        // Re-queue this node
        nodesToExecute.push(node);
        continue;
      }

      // Get input data
      const inputData =
        node.type === NodeType.TRIGGER
          ? triggerData
          : this.getNodeInputData(node, workflow.edges, context.nodeResults);

      // Execute node
      const result = await this.executeNode(node, context, inputData);

      // Store result
      context.nodeResults.set(node.id, result);
      results[node.id] = result;
      executedNodes.add(node.id);

      // Add downstream nodes to queue
      const downstreamNodes = this.getDownstreamNodes(node.id, workflow.nodes, workflow.edges);
      nodesToExecute.push(...downstreamNodes.filter((n) => !executedNodes.has(n.id)));

      // Check for conditional branches
      if (node.type === NodeType.CONDITIONAL) {
        this.handleConditionalBranching(node, result, workflow.edges, nodesToExecute);
      }
    }

    return results;
  }

  /**
   * Execute individual node
   */
  private async executeNode(
    node: INode,
    context: ExecutionContext,
    inputData: any
  ): Promise<INodeExecutionData> {
    const startTime = Date.now();

    try {
      // Get executor for node type
      const executor = this.nodeExecutors.get(node.type);
      if (!executor) {
        throw new ExecutionError(
          `No executor found for node type: ${node.type}`,
          ERROR_CODES.WORKFLOW_INVALID
        );
      }

      // Execute with timeout
      const timeout =
        node.properties?.timeout || this.config.maxExecutionTime || SYSTEM.MAX_EXECUTION_TIME;
      const result = await this.executeWithTimeout(
        executor.execute(node, context, inputData),
        timeout
      );

      return {
        startTime,
        executionTime: Date.now() - startTime,
        executionStatus: ExecutionStatus.SUCCESS,
        data: result,
      };
    } catch (error) {
      const shouldContinue = node.continueOnError;

      if (!shouldContinue) {
        throw error;
      }

      return {
        startTime,
        executionTime: Date.now() - startTime,
        executionStatus: ExecutionStatus.FAILED,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          node: node.id,
          timestamp: new Date(),
          context: { nodeType: node.type, nodeId: node.id },
        },
      };
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
    ]);
  }

  /**
   * Build execution plan using topological sort
   */
  private buildExecutionPlan(nodes: INode[], edges: IEdge[], targetNodeId: string): INode[] {
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const visited = new Set<string>();
    const plan: INode[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);

      // Visit dependencies first
      const dependencies = edges.filter((e) => e.target === nodeId);
      for (const edge of dependencies) {
        visit(edge.source);
      }

      // Add current node
      const node = nodeMap.get(nodeId);
      if (node) {
        plan.push(node);
      }
    };

    visit(targetNodeId);
    return plan;
  }

  /**
   * Find start nodes (triggers or nodes with no incoming edges)
   */
  private findStartNodes(nodes: INode[], edges: IEdge[]): INode[] {
    const nodesWithIncomingEdges = new Set(edges.map((e) => e.target));
    return nodes.filter(
      (node) => node.type === NodeType.TRIGGER || !nodesWithIncomingEdges.has(node.id)
    );
  }

  /**
   * Get node dependencies
   */
  private getNodeDependencies(nodeId: string, edges: IEdge[]): string[] {
    return edges.filter((e) => e.target === nodeId).map((e) => e.source);
  }

  /**
   * Get downstream nodes
   */
  private getDownstreamNodes(nodeId: string, nodes: INode[], edges: IEdge[]): INode[] {
    const downstreamEdges = edges.filter((e) => e.source === nodeId);
    const downstreamNodeIds = downstreamEdges.map((e) => e.target);
    return nodes.filter((n) => downstreamNodeIds.includes(n.id));
  }

  /**
   * Get input data for node
   */
  private getNodeInputData(
    node: INode,
    edges: IEdge[],
    nodeResults: Map<string, INodeExecutionData>
  ): any {
    const inputEdges = edges.filter((e) => e.target === node.id);

    if (inputEdges.length === 0) {
      return null;
    }

    if (inputEdges.length === 1) {
      const result = nodeResults.get(inputEdges[0].source);
      return result?.data;
    }

    // Multiple inputs
    const combinedInput: any = {};
    inputEdges.forEach((edge) => {
      const result = nodeResults.get(edge.source);
      const key = edge.sourceHandle || 'input';
      combinedInput[key] = result?.data;
    });

    return combinedInput;
  }

  /**
   * Handle conditional branching
   */
  private handleConditionalBranching(
    node: INode,
    result: INodeExecutionData,
    edges: IEdge[],
    nodesToExecute: INode[]
  ): void {
    const condition = result.data?.condition;
    const branchToTake = condition ? 'true' : 'false';

    // Note: conditional edges would be filtered here based on branch
    // Currently handled in the nodesToExecute filter below

    // Remove nodes from other branches
    nodesToExecute.filter((n, index) => {
      const edge = edges.find((e) => e.source === node.id && e.target === n.id);
      if (edge?.data?.branch && edge.data.branch !== branchToTake) {
        nodesToExecute.splice(index, 1);
      }
    });
  }

  /**
   * Register default node executors
   */
  private registerDefaultExecutors(): void {
    // Register basic executors
    // These would be expanded with actual integration executors
  }

  /**
   * Check execution permission
   */
  private async checkExecutionPermission(_userId: string, _workflowId: string): Promise<boolean> {
    // TODO: Implement permission check using PermissionEngine
    return true;
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    error?: any
  ): Promise<void> {
    const update: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === ExecutionStatus.SUCCESS || status === ExecutionStatus.FAILED) {
      update.stoppedAt = new Date();
    }

    if (error) {
      update['data.resultData.error'] = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date(),
      };
    }

    await this.db.mongo.executions.updateOne({ id: executionId }, { $set: update });
  }

  /**
   * Update execution results
   */
  private async updateExecutionResults(
    executionId: string,
    results: any,
    status: ExecutionStatus
  ): Promise<void> {
    await this.db.mongo.executions.updateOne(
      { id: executionId },
      {
        $set: {
          status,
          stoppedAt: new Date(),
          'data.resultData.runData': results,
          executionTime: Date.now() - this.activeExecutions.get(executionId)?.startedAt.getTime(),
        },
      }
    );
  }

  /**
   * Stop execution
   */
  async stopExecution(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (context) {
      // Cancel any pending operations
      this.activeExecutions.delete(executionId);
      await this.updateExecutionStatus(executionId, ExecutionStatus.CANCELLED);
      this.emit(EVENTS.EXECUTION_CANCELLED, { executionId });
    }
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    await this.worker?.close();
    await this.executionQueue?.close();
  }
}

// Custom error class
export class ExecutionError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

export default WorkflowExecutionEngine;

import { EventEmitter } from 'node:events';
import {
  ExecutionStatus,
  type IEdge,
  type IExecution,
  type INode,
  type INodeExecutionData,
  type IWorkflow,
  NodeType,
} from '@reporunner/api-types';
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

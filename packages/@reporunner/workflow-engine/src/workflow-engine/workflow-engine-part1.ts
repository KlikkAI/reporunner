import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { EventBus } from './events/event-bus';
import { ExecutionEngine } from './execution/execution-engine';
import { QueueManager } from './queue/queue-manager';
import {
  type Execution,
  ExecutionStatus,
  type TriggerConfig,
  type WorkflowEngineConfig,
  WorkflowEvent,
  type WorkflowEventData,
} from './types';
import { WorkerManager } from './workers/worker-manager';

export class WorkflowEngine extends EventEmitter {
  private config: WorkflowEngineConfig;
  private queueManager: QueueManager;
  private executionEngine: ExecutionEngine;
  private workerManager: WorkerManager;
  private eventBus: EventBus;
  private isInitialized = false;

  constructor(config: WorkflowEngineConfig) {
    super();
    this.config = config;
    this.queueManager = new QueueManager(config.queue);
    this.executionEngine = new ExecutionEngine(config);
    this.workerManager = new WorkerManager(config.workers);
    this.eventBus = new EventBus();

    this.setupEventHandlers();
  }

  /**
   * Initialize the workflow engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize queue manager
    await this.queueManager.initialize();

    // Initialize execution engine
    await this.executionEngine.initialize();

    // Initialize worker manager if enabled
    if (this.config.workers.enabled) {
      await this.workerManager.initialize();
    }

    // Initialize event bus
    await this.eventBus.initialize();

    this.isInitialized = true;

    this.emit('engine:initialized');
  }

  /**
   * Shutdown the workflow engine gracefully
   */
  async shutdown(): Promise<void> {
    // Stop workers first
    if (this.config.workers.enabled) {
      await this.workerManager.shutdown();
    }

    // Stop execution engine
    await this.executionEngine.shutdown();

    // Stop queue manager
    await this.queueManager.shutdown();

    // Stop event bus
    await this.eventBus.shutdown();

    this.isInitialized = false;

    this.emit('engine:shutdown');
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(
    workflowId: string,
    options: {
      mode?: 'manual' | 'trigger' | 'webhook' | 'retry' | 'cli';
      inputData?: Record<string, unknown>;
      userId?: string;
      organizationId?: string;
    } = {}
  ): Promise<Execution> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

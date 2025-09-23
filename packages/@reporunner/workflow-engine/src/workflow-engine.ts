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

    const executionId = uuidv4();
    const execution: Execution = {
      id: executionId,
      workflowId,
      status: ExecutionStatus.PENDING,
      mode: options.mode || 'manual',
      startTime: new Date(),
      nodeExecutions: {},
      data: {
        startData: options.inputData || {},
      },
      finished: false,
      workflowData: null, // Will be populated by execution engine
      createdBy: options.userId,
      organizationId: options.organizationId,
    };

    // Queue the execution
    await this.queueManager.addJob('workflow-execution', {
      executionId,
      workflowId,
      execution,
      options,
    });

    // Emit event
    await this.emitWorkflowEvent(WorkflowEvent.EXECUTION_STARTED, {
      workflowId,
      executionId,
      userId: options.userId,
      organizationId: options.organizationId,
    });

    return execution;
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

    return this.executionEngine.cancelExecution(executionId);
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<Execution | null> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

    return this.executionEngine.getExecution(executionId);
  }

  /**
   * Get executions for a workflow
   */
  async getWorkflowExecutions(
    workflowId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: ExecutionStatus;
    } = {}
  ): Promise<Execution[]> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

    return this.executionEngine.getWorkflowExecutions(workflowId, options);
  }

  /**
   * Activate a workflow (enable triggers)
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

    // Implementation would activate triggers for this workflow
    await this.emitWorkflowEvent(WorkflowEvent.WORKFLOW_ACTIVATED, {
      workflowId,
      executionId: '',
    });
  }

  /**
   * Deactivate a workflow (disable triggers)
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }

    // Implementation would deactivate triggers for this workflow
    await this.emitWorkflowEvent(WorkflowEvent.WORKFLOW_DEACTIVATED, {
      workflowId,
      executionId: '',
    });
  }

  /**
   * Register a trigger
   */
  async registerTrigger(_trigger: TriggerConfig): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }
  }

  /**
   * Unregister a trigger
   */
  async unregisterTrigger(_triggerId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Workflow Engine not initialized');
    }
  }

  /**
   * Get engine statistics
   */
  async getStats(): Promise<{
    executions: {
      total: number;
      running: number;
      queued: number;
      completed: number;
      failed: number;
    };
    workers: {
      total: number;
      active: number;
      idle: number;
    };
    memory: {
      used: number;
      total: number;
    };
  }> {
    const queueStats = await this.queueManager.getStats();
    const workerStats = await this.workerManager.getStats();

    return {
      executions: {
        total: queueStats.completed + queueStats.failed + queueStats.active + queueStats.waiting,
        running: queueStats.active,
        queued: queueStats.waiting,
        completed: queueStats.completed,
        failed: queueStats.failed,
      },
      workers: {
        total: workerStats.length,
        active: workerStats.filter((w) => w.status === 'busy').length,
        idle: workerStats.filter((w) => w.status === 'idle').length,
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Queue events
    this.queueManager.on('job:completed', (jobId: string, result: any) => {
      this.emit('execution:completed', { jobId, result });
    });

    this.queueManager.on('job:failed', (jobId: string, error: Error) => {
      this.emit('execution:failed', { jobId, error });
    });

    // Execution events
    this.executionEngine.on('execution:started', (executionId: string) => {
      this.emit('execution:started', { executionId });
    });

    this.executionEngine.on('execution:finished', (executionId: string, result: any) => {
      this.emit('execution:finished', { executionId, result });
    });

    this.executionEngine.on('node:started', (executionId: string, nodeId: string) => {
      this.emit('node:started', { executionId, nodeId });
    });

    this.executionEngine.on('node:finished', (executionId: string, nodeId: string, result: any) => {
      this.emit('node:finished', { executionId, nodeId, result });
    });

    // Worker events
    this.workerManager.on('worker:started', (workerId: string) => {
      this.emit('worker:started', { workerId });
    });

    this.workerManager.on('worker:stopped', (workerId: string) => {
      this.emit('worker:stopped', { workerId });
    });
  }

  /**
   * Emit workflow event
   */
  private async emitWorkflowEvent(
    event: WorkflowEvent,
    data: Partial<WorkflowEventData>
  ): Promise<void> {
    const eventData: WorkflowEventData = {
      event,
      timestamp: new Date(),
      ...data,
    } as WorkflowEventData;

    this.eventBus.emit('workflow:event', eventData);
    this.emit('workflow:event', eventData);
  }
}

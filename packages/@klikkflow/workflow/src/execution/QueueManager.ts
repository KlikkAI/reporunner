/**
 * Queue-based execution manager using BullMQ
 * Provides horizontal scaling and advanced job processing
 */

import { type Job, Queue, type QueueOptions, Worker, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import type { Logger } from 'winston';
import type { WorkflowDefinition, WorkflowExecution } from '../types';
import { WorkflowEngine } from './WorkflowEngine';

export interface QueueManagerOptions {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  logger?: Logger;
}

export interface WorkflowJob {
  workflow: WorkflowDefinition;
  inputData: Record<string, any>;
  executionId: string;
  priority?: number;
  delay?: number;
  attempts?: number;
}

export class QueueManager {
  private redis: Redis;
  private workflowQueue: Queue<WorkflowJob>;
  private workers: Worker<WorkflowJob>[] = [];
  private workflowEngine: WorkflowEngine;
  private logger: Logger;
  private options: Required<Omit<QueueManagerOptions, 'logger'>>;

  constructor(options: QueueManagerOptions) {
    this.options = {
      concurrency: 10,
      retryAttempts: 3,
      retryDelay: 5000,
      ...options,
      redis: options.redis,
    };

    this.logger = options.logger || (console as any);

    // Setup Redis connection
    this.redis = new Redis({
      host: this.options.redis.host,
      port: this.options.redis.port,
      password: this.options.redis.password,
      db: this.options.redis.db || 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Setup workflow queue
    this.workflowQueue = new Queue<WorkflowJob>('workflow-execution', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: this.options.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: this.options.retryDelay,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    } as QueueOptions);

    this.workflowEngine = new WorkflowEngine({
      logger: this.logger,
      retryAttempts: this.options.retryAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Start workers for processing jobs
   */
  async startWorkers(workerCount: number = 1): Promise<void> {
    try {
      await this.redis.connect();

      for (let i = 0; i < workerCount; i++) {
        const worker = new Worker<WorkflowJob>(
          'workflow-execution',
          async (job: Job<WorkflowJob>) => {
            return await this.processWorkflowJob(job);
          },
          {
            connection: this.redis,
            concurrency: this.options.concurrency,
            removeOnComplete: 100,
            removeOnFail: 50,
          } as WorkerOptions
        );

        worker.on('completed', (job) => {
          this.logger.info('Workflow job completed', {
            jobId: job.id,
            executionId: job.data.executionId,
            workflowId: job.data.workflow.id,
          });
        });

        worker.on('failed', (job, error) => {
          this.logger.error('Workflow job failed', {
            jobId: job?.id,
            executionId: job?.data.executionId,
            error: error.message,
          });
        });

        worker.on('stalled', (jobId) => {
          this.logger.warn('Workflow job stalled', { jobId });
        });

        this.workers.push(worker);
      }

      this.logger.info('Queue workers started', {
        workerCount,
        concurrency: this.options.concurrency,
      });
    } catch (error) {
      this.logger.error('Failed to start workers', { error });
      throw error;
    }
  }

  /**
   * Add workflow execution job to queue
   */
  async addWorkflowJob(
    workflow: WorkflowDefinition,
    inputData: Record<string, any> = {},
    options: {
      executionId?: string;
      priority?: number;
      delay?: number;
      attempts?: number;
    } = {}
  ): Promise<string> {
    const executionId =
      options.executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const jobData: WorkflowJob = {
      workflow,
      inputData,
      executionId,
      priority: options.priority,
      delay: options.delay,
      attempts: options.attempts,
    };

    const job = await this.workflowQueue.add(`workflow-${workflow.id}`, jobData, {
      priority: options.priority,
      delay: options.delay,
      attempts: options.attempts || this.options.retryAttempts,
      jobId: executionId,
    });

    this.logger.info('Workflow job added to queue', {
      jobId: job.id,
      executionId,
      workflowId: workflow.id,
    });

    return executionId;
  }

  /**
   * Get job status and details
   */
  async getJobStatus(executionId: string): Promise<{
    status: string;
    progress?: number;
    result?: any;
    error?: string;
  } | null> {
    try {
      const job = await this.workflowQueue.getJob(executionId);
      if (!job) {
        return null;
      }

      const state = await job.getState();

      return {
        status: state,
        progress: job.progress as number,
        result: job.returnvalue,
        error: job.failedReason,
      };
    } catch (error) {
      this.logger.error('Failed to get job status', { executionId, error });
      return null;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(executionId: string): Promise<boolean> {
    try {
      const job = await this.workflowQueue.getJob(executionId);
      if (!job) {
        return false;
      }

      await job.remove();

      this.logger.info('Job cancelled', { executionId });
      return true;
    } catch (error) {
      this.logger.error('Failed to cancel job', { executionId, error });
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [active, waiting, completed, failed, delayed] = await Promise.all([
        this.workflowQueue.getActive(),
        this.workflowQueue.getWaiting(),
        this.workflowQueue.getCompleted(),
        this.workflowQueue.getFailed(),
        this.workflowQueue.getDelayed(),
      ]);

      return {
        active: active.length,
        waiting: waiting.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats', { error });
      throw error;
    }
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanQueue(
    options: {
      maxAge?: number; // milliseconds
      maxCount?: number;
    } = {}
  ): Promise<void> {
    try {
      const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours
      const maxCount = options.maxCount || 1000;

      await this.workflowQueue.clean(maxAge, maxCount, 'completed');
      await this.workflowQueue.clean(maxAge, maxCount, 'failed');

      this.logger.info('Queue cleaned', { maxAge, maxCount });
    } catch (error) {
      this.logger.error('Failed to clean queue', { error });
      throw error;
    }
  }

  /**
   * Shutdown workers and close connections
   */
  async shutdown(): Promise<void> {
    try {
      // Close all workers
      await Promise.all(this.workers.map((worker) => worker.close()));

      // Close queue
      await this.workflowQueue.close();

      // Close Redis connection
      await this.redis.quit();

      this.logger.info('Queue manager shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      throw error;
    }
  }

  /**
   * Process individual workflow job
   */
  private async processWorkflowJob(job: Job<WorkflowJob>): Promise<WorkflowExecution> {
    const { workflow, inputData, executionId } = job.data;

    try {
      // Update job progress
      await job.updateProgress(0);

      // Execute workflow
      const execution = await this.workflowEngine.executeWorkflow(workflow, inputData, {
        executionId,
        waitForCompletion: true,
      });

      // Update progress based on execution
      const progress = Math.round(
        (execution.metadata.completedNodes / execution.metadata.totalNodes) * 100
      );
      await job.updateProgress(progress);

      return execution;
    } catch (error) {
      this.logger.error('Workflow execution failed in queue', {
        jobId: job.id,
        executionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    this.workflowQueue.on('error', (error) => {
      this.logger.error('Queue error', { error });
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis error', { error });
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected');
    });

    this.redis.on('disconnect', () => {
      this.logger.warn('Redis disconnected');
    });
  }
}

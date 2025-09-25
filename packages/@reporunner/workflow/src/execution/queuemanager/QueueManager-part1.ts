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
      retryDelayOnFailover: 100,
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

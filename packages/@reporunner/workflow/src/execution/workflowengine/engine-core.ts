/**
 * Core workflow execution engine - similar to n8n's workflow execution
 * but with enhanced AI capabilities and modern architecture
 */

import { EventEmitter } from 'node:events';
import { v4 as uuid } from 'uuid';
import type { Logger } from 'winston';
import { WorkflowValidator } from '../common/WorkflowValidator';
import {
  type NodeExecution,
  type WorkflowDefinition,
  WorkflowEngineError,
  type WorkflowExecution,
} from '../types';
import { NodeExecutor } from './NodeExecutor';

export interface WorkflowEngineOptions {
  maxConcurrentExecutions?: number;
  executionTimeout?: number;
  retryAttempts?: number;
  logger?: Logger;
}

export class WorkflowEngine extends EventEmitter {
  private nodeExecutor: NodeExecutor;
  private validator: WorkflowValidator;
  private activeExecutions = new Map<string, WorkflowExecution>();
  private options: Required<WorkflowEngineOptions>;
  private logger: Logger;

  constructor(options: WorkflowEngineOptions = {}) {
    super();

    this.options = {
      maxConcurrentExecutions: 50,
      executionTimeout: 300000, // 5 minutes
      retryAttempts: 3,
      logger: options.logger || (console as any),
      ...options,
    };

    this.logger = this.options.logger;
    this.nodeExecutor = new NodeExecutor({ logger: this.logger });
    this.validator = new WorkflowValidator();
  }

  /**
   * Execute a workflow with the given input data
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    inputData: Record<string, any> = {},
    options: {
      executionId?: string;
      timeout?: number;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<WorkflowExecution> {
    const executionId = options.executionId || uuid();

    // Validate workflow
    const validationResult = await this.validator.validate(workflow);
    if (!validationResult.valid) {
      throw new WorkflowEngineError(
        `Workflow validation failed: ${validationResult.errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.options.maxConcurrentExecutions) {
      throw new WorkflowEngineError(
        'Maximum concurrent executions reached',
        'EXECUTION_LIMIT_REACHED'
      );
    }

    // Create execution context
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      inputData,
      nodeExecutions: new Map(),
      outputData: {},
      metadata: {
        totalNodes: workflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        retriedNodes: 0,
      },
    };

    this.activeExecutions.set(executionId, execution);
    this.emit('executionStarted', execution);

    try {
      if (options.waitForCompletion) {

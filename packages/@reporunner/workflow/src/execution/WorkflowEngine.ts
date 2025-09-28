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
import { ExecutionContext, NodeExecutionContext } from './ExecutionContext';

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
    if (!validationResult.isValid) {
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
      userId: 'system', // Default user ID
      status: 'running',
      startTime: new Date(),
      startedAt: new Date(),
      triggerType: 'manual',
      inputData,
      nodeExecutions: [],
      totalNodes: workflow.nodes.length,
      completedNodes: 0,
      outputData: {},
      metadata: {
        totalNodes: workflow.nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        retriedNodes: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeExecutions.set(executionId, execution);
    this.emit('executionStarted', execution);

    try {
      if (options.waitForCompletion) {
        await this.runExecution(workflow, execution, options.timeout);
      } else {
        // Run in background
        this.runExecution(workflow, execution, options.timeout).catch((error) => {
          this.handleExecutionError(execution, error);
        });
      }
    } catch (error) {
      this.handleExecutionError(execution, error);
    }

    return execution;
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.finishedAt = new Date();
    execution.error = 'Execution cancelled by user';

    this.activeExecutions.delete(executionId);
    this.emit('executionCancelled', execution);

    return true;
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Main execution logic
   */
  private async runExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    timeout?: number
  ): Promise<void> {
    const executionTimeout = timeout || this.options.executionTimeout;

    // Set execution timeout
    const timeoutId = setTimeout(() => {
      this.handleExecutionError(
        execution,
        new WorkflowEngineError('Execution timeout', 'EXECUTION_TIMEOUT')
      );
    }, executionTimeout);

    try {
      // Find trigger nodes (nodes with no inputs)
      const triggerNodes = workflow.nodes.filter(
        (node) => !workflow.connections.some((conn) => conn.destination.nodeId === node.id)
      );

      if (triggerNodes.length === 0) {
        throw new WorkflowEngineError('No trigger nodes found', 'NO_TRIGGER_NODES');
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder(workflow);

      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Check if execution was cancelled
        if (execution.status === 'cancelled') {
          return;
        }

        await this.executeNode(workflow, execution, node);
      }

      // Mark execution as successful
      execution.status = 'success';
      execution.finishedAt = new Date();

      this.emit('executionCompleted', execution);
    } catch (error) {
      this.handleExecutionError(execution, error);
    } finally {
      clearTimeout(timeoutId);
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    node: any
  ): Promise<void> {
    const nodeExecution: NodeExecution = {
      nodeId: node.id,
      nodeName: node.name,
      status: 'running',
      startedAt: new Date(),
      inputData: {},
      outputData: {},
      retryAttempt: 0,
    };

    execution.nodeExecutions.push(nodeExecution);
    this.emit('nodeExecutionStarted', { execution, nodeExecution });

    try {
      // Get input data from previous nodes
      const inputData = await this.getNodeInputData(workflow, execution, node);
      nodeExecution.inputData = inputData;

      // Create proper execution context
      const executionCtx = new ExecutionContext({
        executionId: execution.id,
        workflowId: workflow.id,
        userId: execution.userId,
        environment: 'production'
      });
      const nodeCtx = new NodeExecutionContext(executionCtx, node.id);

      // Execute the node
      const result = await this.nodeExecutor.execute(node, inputData, nodeCtx);

      nodeExecution.status = 'success';
      nodeExecution.finishedAt = new Date();
      nodeExecution.outputData = result.data;

      execution.metadata.completedNodes++;

      this.emit('nodeExecutionCompleted', { execution, nodeExecution });
    } catch (error) {
      await this.handleNodeError(workflow, execution, nodeExecution, error);
    }
  }

  /**
   * Handle node execution errors with retry logic
   */
  private async handleNodeError(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    nodeExecution: NodeExecution,
    error: any
  ): Promise<void> {
    this.logger.error('Node execution failed', {
      executionId: execution.id,
      nodeId: nodeExecution.nodeId,
      error: error.message,
      attempt: nodeExecution.retryAttempt + 1,
    });

    // Check if we should retry
    if (nodeExecution.retryAttempt < this.options.retryAttempts) {
      nodeExecution.retryAttempt++;
      execution.metadata.retriedNodes++;

      this.emit('nodeExecutionRetry', { execution, nodeExecution });

      // Exponential backoff
      const delay = 2 ** nodeExecution.retryAttempt * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry execution
      const node = workflow.nodes.find((n) => n.id === nodeExecution.nodeId);
      if (node) {
        await this.executeNode(workflow, execution, node);
        return;
      }
    }

    // Mark node as failed
    nodeExecution.status = 'error';
    nodeExecution.finishedAt = new Date();
    nodeExecution.error = error.message;

    execution.metadata.failedNodes++;

    this.emit('nodeExecutionFailed', { execution, nodeExecution });

    // Fail the entire execution
    throw new WorkflowEngineError(
      `Node execution failed: ${nodeExecution.nodeName}`,
      'NODE_EXECUTION_FAILED'
    );
  }

  /**
   * Handle execution errors
   */
  private handleExecutionError(execution: WorkflowExecution, error: any): void {
    this.logger.error('Workflow execution failed', {
      executionId: execution.id,
      workflowId: execution.workflowId,
      error: error.message,
    });

    execution.status = 'error';
    execution.finishedAt = new Date();
    execution.error = error.message;

    this.emit('executionFailed', execution);
  }

  /**
   * Get topological execution order for nodes
   */
  private getExecutionOrder(workflow: WorkflowDefinition): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new WorkflowEngineError('Circular dependency detected', 'CIRCULAR_DEPENDENCY');
      }

      if (visited.has(nodeId)) {
        return;
      }

      visiting.add(nodeId);

      // Visit dependencies first
      const dependencies = workflow.connections
        .filter((conn) => conn.destination.nodeId === nodeId)
        .map((conn) => conn.source.nodeId);

      for (const depId of dependencies) {
        visit(depId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Visit all nodes
    for (const node of workflow.nodes) {
      visit(node.id);
    }

    return order;
  }

  /**
   * Get input data for a node from its connections
   */
  private async getNodeInputData(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    node: any
  ): Promise<Record<string, any>> {
    const inputData: Record<string, any> = {};

    // Get data from connected nodes
    const inputConnections = workflow.connections.filter(
      (conn) => conn.destination.nodeId === node.id
    );

    for (const connection of inputConnections) {
      const sourceExecution = execution.nodeExecutions.find(ne => ne.nodeId === connection.source.nodeId);
      if (sourceExecution?.outputData) {
        const sourceData =
          sourceExecution.outputData[connection.source.outputIndex || 0] ||
          sourceExecution.outputData;

        inputData[connection.destination.inputIndex || 0] = sourceData;
      }
    }

    // If no connections, use workflow input data
    if (inputConnections.length === 0) {
      return execution.inputData;
    }

    return inputData;
  }
}

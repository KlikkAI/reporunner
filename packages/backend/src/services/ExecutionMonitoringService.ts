import { EventEmitter } from 'node:events';
import { Logger } from '@reporunner/core';
import type { ExecutionStatus, NodeExecutionState, WorkflowExecution } from '@reporunner/types';
import type { Server as SocketIOServer } from 'socket.io';

export interface ExecutionEvent {
  type:
    | 'execution_started'
    | 'execution_completed'
    | 'execution_failed'
    | 'node_started'
    | 'node_completed'
    | 'node_failed'
    | 'execution_progress';
  executionId: string;
  workflowId: string;
  nodeId?: string;
  timestamp: Date;
  data?: any;
  error?: string;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  activeExecutions: number;
  nodeExecutionTimes: Record<string, number>;
}

export class ExecutionMonitoringService extends EventEmitter {
  private logger: Logger;
  private io: SocketIOServer;
  private activeExecutions = new Map<string, WorkflowExecution>();
  private executionMetrics: ExecutionMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    activeExecutions: 0,
    nodeExecutionTimes: {},
  };

  constructor(io: SocketIOServer) {
    super();
    this.logger = new Logger('ExecutionMonitoringService');
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Start monitoring a workflow execution
   */
  async startExecution(execution: WorkflowExecution): Promise<void> {
    try {
      this.activeExecutions.set(execution.id, execution);
      this.executionMetrics.totalExecutions++;
      this.executionMetrics.activeExecutions++;

      const event: ExecutionEvent = {
        type: 'execution_started',
        executionId: execution.id,
        workflowId: execution.workflowId,
        timestamp: new Date(),
        data: {
          status: execution.status,
          startedAt: execution.startedAt,
          nodes: execution.nodes?.map((n) => n.id) || [],
        },
      };

      this.emitEvent(event);
      this.logger.info('Execution monitoring started', {
        executionId: execution.id,
        workflowId: execution.workflowId,
      });
    } catch (error) {
      this.logger.error('Failed to start execution monitoring', {
        error,
        executionId: execution.id,
      });
      throw error;
    }
  }

  /**
   * Update execution progress
   */
  async updateExecutionProgress(
    executionId: string,
    progress: number,
    currentNodeId?: string,
    nodeStates?: Record<string, NodeExecutionState>
  ): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        this.logger.warn('Execution not found for progress update', { executionId });
        return;
      }

      execution.progress = progress;
      execution.currentNodeId = currentNodeId;
      execution.nodeStates = nodeStates || execution.nodeStates;
      execution.updatedAt = new Date();

      const event: ExecutionEvent = {
        type: 'execution_progress',
        executionId,
        workflowId: execution.workflowId,
        nodeId: currentNodeId,
        timestamp: new Date(),
        data: {
          progress,
          currentNodeId,
          nodeStates,
          activeNodes: Object.entries(nodeStates || {})
            .filter(([, state]) => state.status === 'running')
            .map(([nodeId]) => nodeId),
        },
      };

      this.emitEvent(event);
    } catch (error) {
      this.logger.error('Failed to update execution progress', { error, executionId });
    }
  }

  /**
   * Handle node execution start
   */
  async onNodeStart(executionId: string, nodeId: string, nodeData?: any): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return;
      }

      if (!execution.nodeStates) {
        execution.nodeStates = {};
      }

      execution.nodeStates[nodeId] = {
        status: 'running',
        startedAt: new Date(),
        data: nodeData,
      };

      const event: ExecutionEvent = {
        type: 'node_started',
        executionId,
        workflowId: execution.workflowId,
        nodeId,
        timestamp: new Date(),
        data: nodeData,
      };

      this.emitEvent(event);
      this.logger.debug('Node execution started', { executionId, nodeId });
    } catch (error) {
      this.logger.error('Failed to handle node start', { error, executionId, nodeId });
    }
  }

  /**
   * Handle node execution completion
   */
  async onNodeComplete(
    executionId: string,
    nodeId: string,
    result: any,
    executionTime: number
  ): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return;
      }

      if (execution.nodeStates?.[nodeId]) {
        execution.nodeStates[nodeId] = {
          ...execution.nodeStates[nodeId],
          status: 'success',
          completedAt: new Date(),
          result,
          executionTime,
        };
      }

      // Update metrics
      this.executionMetrics.nodeExecutionTimes[nodeId] =
        (this.executionMetrics.nodeExecutionTimes[nodeId] || 0) + executionTime;

      const event: ExecutionEvent = {
        type: 'node_completed',
        executionId,
        workflowId: execution.workflowId,
        nodeId,
        timestamp: new Date(),
        data: {
          result,
          executionTime,
        },
      };

      this.emitEvent(event);
      this.logger.debug('Node execution completed', { executionId, nodeId, executionTime });
    } catch (error) {
      this.logger.error('Failed to handle node completion', { error, executionId, nodeId });
    }
  }

  /**
   * Handle node execution failure
   */
  async onNodeFail(executionId: string, nodeId: string, error: Error): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return;
      }

      if (execution.nodeStates?.[nodeId]) {
        execution.nodeStates[nodeId] = {
          ...execution.nodeStates[nodeId],
          status: 'error',
          completedAt: new Date(),
          error: error.message,
        };
      }

      const event: ExecutionEvent = {
        type: 'node_failed',
        executionId,
        workflowId: execution.workflowId,
        nodeId,
        timestamp: new Date(),
        error: error.message,
      };

      this.emitEvent(event);
      this.logger.error('Node execution failed', { executionId, nodeId, error: error.message });
    } catch (err) {
      this.logger.error('Failed to handle node failure', { error: err, executionId, nodeId });
    }
  }

  /**
   * Complete execution monitoring
   */
  async completeExecution(
    executionId: string,
    status: ExecutionStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return;
      }

      execution.status = status;
      execution.completedAt = new Date();
      execution.result = result;
      execution.error = error;

      // Update metrics
      this.executionMetrics.activeExecutions--;
      if (status === 'success') {
        this.executionMetrics.successfulExecutions++;
      } else if (status === 'error') {
        this.executionMetrics.failedExecutions++;
      }

      // Calculate execution time
      const executionTime = execution.completedAt.getTime() - execution.startedAt.getTime();
      this.executionMetrics.averageExecutionTime =
        (this.executionMetrics.averageExecutionTime * (this.executionMetrics.totalExecutions - 1) +
          executionTime) /
        this.executionMetrics.totalExecutions;

      const event: ExecutionEvent = {
        type: status === 'success' ? 'execution_completed' : 'execution_failed',
        executionId,
        workflowId: execution.workflowId,
        timestamp: new Date(),
        data: {
          status,
          result,
          executionTime,
          nodeStates: execution.nodeStates,
        },
        error,
      };

      this.emitEvent(event);

      // Keep execution in memory for a short time for final queries
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 30000); // 30 seconds

      this.logger.info('Execution monitoring completed', {
        executionId,
        status,
        executionTime,
      });
    } catch (err) {
      this.logger.error('Failed to complete execution monitoring', { error: err, executionId });
    }
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution metrics
   */
  getMetrics(): ExecutionMetrics {
    return { ...this.executionMetrics };
  }

  /**
   * Stop monitoring an execution
   */
  async stopExecution(executionId: string): Promise<void> {
    try {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return;
      }

      await this.completeExecution(executionId, 'cancelled', null, 'Execution stopped by user');
    } catch (error) {
      this.logger.error('Failed to stop execution', { error, executionId });
    }
  }

  private emitEvent(event: ExecutionEvent): void {
    // Emit to EventEmitter listeners
    this.emit('execution_event', event);

    // Emit to Socket.IO clients
    this.io.to(`execution:${event.executionId}`).emit('execution_event', event);
    this.io.to(`workflow:${event.workflowId}`).emit('execution_event', event);

    // Emit to all connected clients for global monitoring
    this.io.emit('execution_event', event);
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      this.logger.debug('Client connected to execution monitoring', { socketId: socket.id });

      // Join execution-specific rooms
      socket.on('monitor_execution', (executionId: string) => {
        socket.join(`execution:${executionId}`);

        // Send current execution status if available
        const execution = this.getExecutionStatus(executionId);
        if (execution) {
          socket.emit('execution_status', execution);
        }
      });

      // Join workflow-specific rooms
      socket.on('monitor_workflow', (workflowId: string) => {
        socket.join(`workflow:${workflowId}`);
      });

      // Leave rooms on disconnect
      socket.on('disconnect', () => {
        this.logger.debug('Client disconnected from execution monitoring', { socketId: socket.id });
      });

      // Send current metrics on request
      socket.on('get_metrics', () => {
        socket.emit('execution_metrics', this.getMetrics());
      });

      // Send active executions on request
      socket.on('get_active_executions', () => {
        socket.emit('active_executions', this.getActiveExecutions());
      });
    });
  }
}

export default ExecutionMonitoringService;

import { EventEmitter } from 'node:events';
import { Logger } from '@reporunner/core';
import type { ExecutionStatus, IExecution, INodeExecutionData } from '@reporunner/shared';
import type { Server as SocketIOServer } from 'socket.io';

// Type aliases for backward compatibility
type WorkflowExecution = IExecution;
type NodeExecutionState = INodeExecutionData;

/**
 * Monitoring state wrapper for IExecution
 * Adds runtime monitoring fields without mutating the IExecution type
 */
interface MonitoringState {
  execution: IExecution;
  progress: number;
  currentNodeId?: string;
  nodeStates: Record<string, INodeExecutionData>;
  updatedAt: Date;
}

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
  private activeExecutions = new Map<string, MonitoringState>();
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
      // Create monitoring state wrapper
      const monitoringState: MonitoringState = {
        execution,
        progress: 0,
        currentNodeId: undefined,
        nodeStates: execution.data?.nodes || {},
        updatedAt: new Date(),
      };

      this.activeExecutions.set(execution.id, monitoringState);
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
          nodes: Object.keys(execution.data?.nodes || {}),
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
      const monitoringState = this.activeExecutions.get(executionId);
      if (!monitoringState) {
        this.logger.warn('Execution not found for progress update', { executionId });
        return;
      }

      monitoringState.progress = progress;
      monitoringState.currentNodeId = currentNodeId;
      monitoringState.nodeStates = nodeStates || monitoringState.nodeStates;
      monitoringState.updatedAt = new Date();

      const event: ExecutionEvent = {
        type: 'execution_progress',
        executionId,
        workflowId: monitoringState.execution.workflowId,
        nodeId: currentNodeId,
        timestamp: new Date(),
        data: {
          progress,
          currentNodeId,
          nodeStates,
          activeNodes: Object.entries(nodeStates || {})
            .filter(([, state]) => state.executionStatus === 'running')
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
      const monitoringState = this.activeExecutions.get(executionId);
      if (!monitoringState) {
        return;
      }

      if (!monitoringState.nodeStates) {
        monitoringState.nodeStates = {};
      }

      monitoringState.nodeStates[nodeId] = {
        startTime: Date.now(),
        executionTime: 0,
        executionStatus: 'running',
        data: nodeData,
      };

      const event: ExecutionEvent = {
        type: 'node_started',
        executionId,
        workflowId: monitoringState.execution.workflowId,
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
      const monitoringState = this.activeExecutions.get(executionId);
      if (!monitoringState) {
        return;
      }

      if (monitoringState.nodeStates?.[nodeId]) {
        monitoringState.nodeStates[nodeId] = {
          ...monitoringState.nodeStates[nodeId],
          executionStatus: 'success',
          output: result,
          executionTime,
        };
      }

      // Update metrics
      this.executionMetrics.nodeExecutionTimes[nodeId] =
        (this.executionMetrics.nodeExecutionTimes[nodeId] || 0) + executionTime;

      const event: ExecutionEvent = {
        type: 'node_completed',
        executionId,
        workflowId: monitoringState.execution.workflowId,
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
      const monitoringState = this.activeExecutions.get(executionId);
      if (!monitoringState) {
        return;
      }

      if (monitoringState.nodeStates?.[nodeId]) {
        monitoringState.nodeStates[nodeId] = {
          ...monitoringState.nodeStates[nodeId],
          executionStatus: 'error',
          error: {
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      }

      const event: ExecutionEvent = {
        type: 'node_failed',
        executionId,
        workflowId: monitoringState.execution.workflowId,
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
      const monitoringState = this.activeExecutions.get(executionId);
      if (!monitoringState) {
        return;
      }

      // Update monitoring state only (keep execution immutable)
      monitoringState.updatedAt = new Date();

      // Update metrics
      this.executionMetrics.activeExecutions--;
      if (status === 'success') {
        this.executionMetrics.successfulExecutions++;
      } else if (status === 'error') {
        this.executionMetrics.failedExecutions++;
      }

      // Calculate execution time
      const startTime = new Date(monitoringState.execution.startedAt).getTime();
      const endTime = monitoringState.updatedAt.getTime();
      const executionTime = endTime - startTime;

      this.executionMetrics.averageExecutionTime =
        (this.executionMetrics.averageExecutionTime * (this.executionMetrics.totalExecutions - 1) +
          executionTime) /
        this.executionMetrics.totalExecutions;

      const event: ExecutionEvent = {
        type: status === 'success' ? 'execution_completed' : 'execution_failed',
        executionId,
        workflowId: monitoringState.execution.workflowId,
        timestamp: new Date(),
        data: {
          status,
          result,
          executionTime,
          nodeStates: monitoringState.nodeStates,
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
    const monitoringState = this.activeExecutions.get(executionId);
    return monitoringState?.execution || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).map((state) => state.execution);
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

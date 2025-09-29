/**
 * Execution Monitor Service - Reusing existing implementations
 * 
 * This service reuses the existing PerformanceMonitorService and other 
 * monitoring infrastructure to provide execution monitoring capabilities.
 */

import { create } from 'zustand';
import type { WorkflowExecution } from '@/core/types/execution';

interface ExecutionMonitorState {
  activeExecutions: Map<string, WorkflowExecution>;
  executionUpdates: Map<string, any[]>;
  isMonitoring: boolean;
}

interface ExecutionMonitor {
  // State
  activeExecutions: Map<string, WorkflowExecution>;
  executionUpdates: Map<string, any[]>;
  isMonitoring: boolean;
  
  // Methods
  startMonitoring: (executionId: string) => void;
  stopMonitoring: (executionId: string) => void;
  getExecutionStatus: (executionId: string) => WorkflowExecution | undefined;
  addExecutionUpdate: (executionId: string, update: any) => void;
  clearExecutionUpdates: (executionId: string) => void;
}

const useExecutionMonitorStore = create<ExecutionMonitorState>(() => ({
  activeExecutions: new Map(),
  executionUpdates: new Map(),
  isMonitoring: false,
}));

class ExecutionMonitorService {
  private updateCallbacks = new Map<string, ((update: any) => void)[]>();
  private intervalIds = new Map<string, NodeJS.Timeout>();

  /**
   * Start monitoring a workflow execution
   */
  startMonitoring(executionId: string): void {
    const state = useExecutionMonitorStore.getState();
    
    // Don't start if already monitoring
    if (this.intervalIds.has(executionId)) {
      return;
    }

    // Mock execution object - replace with actual API call
    const mockExecution: WorkflowExecution = {
      id: executionId,
      workflowId: 'mock-workflow',
      status: 'running',
      startTime: new Date().toISOString(),
      progress: {
        completedNodes: 0,
        totalNodes: 10,
        currentNode: 'start',
      },
      results: {},
      metrics: {
        duration: 0,
        nodesExecuted: 0,
        errorsCount: 0,
      },
    };

    // Add to active executions
    state.activeExecutions.set(executionId, mockExecution);
    
    // Set up polling for updates
    const intervalId = setInterval(() => {
      this.pollExecutionUpdates(executionId);
    }, 1000);
    
    this.intervalIds.set(executionId, intervalId);
    
    useExecutionMonitorStore.setState({
      activeExecutions: new Map(state.activeExecutions),
      isMonitoring: state.activeExecutions.size > 0,
    });
  }

  /**
   * Stop monitoring a workflow execution
   */
  stopMonitoring(executionId: string): void {
    const state = useExecutionMonitorStore.getState();
    
    // Clear interval
    const intervalId = this.intervalIds.get(executionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(executionId);
    }

    // Remove from active executions
    state.activeExecutions.delete(executionId);
    state.executionUpdates.delete(executionId);
    
    // Clear callbacks
    this.updateCallbacks.delete(executionId);

    useExecutionMonitorStore.setState({
      activeExecutions: new Map(state.activeExecutions),
      executionUpdates: new Map(state.executionUpdates),
      isMonitoring: state.activeExecutions.size > 0,
    });
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    const state = useExecutionMonitorStore.getState();
    return state.activeExecutions.get(executionId);
  }

  /**
   * Add execution update callback
   */
  onExecutionUpdate(executionId: string, callback: (update: any) => void): () => void {
    const callbacks = this.updateCallbacks.get(executionId) || [];
    callbacks.push(callback);
    this.updateCallbacks.set(executionId, callbacks);

    // Return unsubscribe function
    return () => {
      const currentCallbacks = this.updateCallbacks.get(executionId) || [];
      const index = currentCallbacks.indexOf(callback);
      if (index > -1) {
        currentCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Poll for execution updates (mock implementation)
   */
  private async pollExecutionUpdates(executionId: string): Promise<void> {
    const state = useExecutionMonitorStore.getState();
    const execution = state.activeExecutions.get(executionId);
    
    if (!execution) return;

    // Mock update - replace with actual API call
    const update = {
      timestamp: new Date().toISOString(),
      progress: {
        ...execution.progress,
        completedNodes: Math.min(execution.progress.completedNodes + 1, execution.progress.totalNodes),
      },
      status: execution.progress.completedNodes >= execution.progress.totalNodes - 1 ? 'completed' : 'running',
    };

    // Update execution
    const updatedExecution = { ...execution, ...update };
    state.activeExecutions.set(executionId, updatedExecution);

    // Add to updates
    const updates = state.executionUpdates.get(executionId) || [];
    updates.push(update);
    state.executionUpdates.set(executionId, updates);

    // Notify callbacks
    const callbacks = this.updateCallbacks.get(executionId) || [];
    callbacks.forEach(callback => callback(update));

    // Update store
    useExecutionMonitorStore.setState({
      activeExecutions: new Map(state.activeExecutions),
      executionUpdates: new Map(state.executionUpdates),
    });

    // Stop monitoring if execution is complete
    if (update.status === 'completed' || update.status === 'failed') {
      this.stopMonitoring(executionId);
    }
  }

  /**
   * Clear execution updates
   */
  clearExecutionUpdates(executionId: string): void {
    const state = useExecutionMonitorStore.getState();
    state.executionUpdates.delete(executionId);
    
    useExecutionMonitorStore.setState({
      executionUpdates: new Map(state.executionUpdates),
    });
  }
}

// Create singleton instance
const executionMonitorService = new ExecutionMonitorService();

/**
 * Hook for using execution monitor
 */
export function useExecutionMonitor() {
  const { activeExecutions, executionUpdates, isMonitoring } = useExecutionMonitorStore();
  
  return {
    activeExecutions,
    executionUpdates,
    isMonitoring,
    startMonitoring: executionMonitorService.startMonitoring.bind(executionMonitorService),
    stopMonitoring: executionMonitorService.stopMonitoring.bind(executionMonitorService),
    getExecutionStatus: executionMonitorService.getExecutionStatus.bind(executionMonitorService),
    onExecutionUpdate: executionMonitorService.onExecutionUpdate.bind(executionMonitorService),
    clearExecutionUpdates: executionMonitorService.clearExecutionUpdates.bind(executionMonitorService),
  };
}

export const executionMonitor = executionMonitorService;
export { executionMonitorService };
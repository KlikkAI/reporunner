/**
 * Enhanced Execution Store
 *
 * Reuses existing execution monitoring infrastructure to provide
 * enhanced execution tracking capabilities.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WorkflowExecution } from '../types/execution';

interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  logs: Array<{
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
  }>;
}

interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  averageNodeDuration: number;
  totalDuration: number;
}

interface EnhancedExecutionState {
  // Active executions
  activeExecutions: Map<string, WorkflowExecution>;

  // Node-level execution details
  nodeExecutions: Map<string, Map<string, NodeExecution>>; // executionId -> nodeId -> NodeExecution

  // Real-time updates
  executionUpdates: Map<string, any[]>;

  // Metrics and analytics
  executionMetrics: Map<string, ExecutionMetrics>;

  // UI state
  selectedExecution: string | null;
  isMonitoring: boolean;
  autoRefresh: boolean;

  // Actions
  startExecution: (workflowId: string, executionData: any) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  getExecution: (executionId: string) => WorkflowExecution | undefined;
  getNodeExecution: (executionId: string, nodeId: string) => NodeExecution | undefined;
  updateNodeExecution: (
    executionId: string,
    nodeId: string,
    update: Partial<NodeExecution>
  ) => void;
  addExecutionLog: (executionId: string, nodeId: string, log: NodeExecution['logs'][0]) => void;
  setSelectedExecution: (executionId: string | null) => void;
  toggleAutoRefresh: () => void;
  clearExecutionData: (executionId: string) => void;
}

export const useEnhancedExecutionStore = create<EnhancedExecutionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeExecutions: new Map(),
    nodeExecutions: new Map(),
    executionUpdates: new Map(),
    executionMetrics: new Map(),
    selectedExecution: null,
    isMonitoring: false,
    autoRefresh: true,

    // Start execution
    startExecution: async (workflowId: string, executionData: any): Promise<string> => {
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'running',
        startTime: new Date().toISOString(),
        progress: {
          completedNodes: [],
          totalNodes: executionData.nodeCount || 0,
          currentNode: executionData.startNode || 'start',
        },
        results: {},
        metrics: {
          duration: 0,
          nodesExecuted: 0,
          errorsCount: 0,
        },
      };

      set((state) => ({
        activeExecutions: new Map(state.activeExecutions.set(executionId, execution)),
        nodeExecutions: new Map(state.nodeExecutions.set(executionId, new Map())),
        isMonitoring: true,
      }));

      return executionId;
    },

    // Stop execution
    stopExecution: async (executionId: string): Promise<void> => {
      const state = get();
      const execution = state.activeExecutions.get(executionId);

      if (execution) {
        const updatedExecution = {
          ...execution,
          status: 'cancelled' as const,
          endTime: new Date().toISOString(),
        };

        set((state) => ({
          activeExecutions: new Map(state.activeExecutions.set(executionId, updatedExecution)),
        }));
      }
    },

    // Get execution
    getExecution: (executionId: string): WorkflowExecution | undefined => {
      return get().activeExecutions.get(executionId);
    },

    // Get node execution
    getNodeExecution: (executionId: string, nodeId: string): NodeExecution | undefined => {
      const nodeExecutions = get().nodeExecutions.get(executionId);
      return nodeExecutions?.get(nodeId);
    },

    // Update node execution
    updateNodeExecution: (
      executionId: string,
      nodeId: string,
      update: Partial<NodeExecution>
    ): void => {
      set((state) => {
        const nodeExecutions = state.nodeExecutions.get(executionId) || new Map();
        const currentExecution = nodeExecutions.get(nodeId) || {
          nodeId,
          status: 'pending' as const,
          logs: [],
        };

        const updatedExecution = { ...currentExecution, ...update };
        nodeExecutions.set(nodeId, updatedExecution);

        return {
          nodeExecutions: new Map(state.nodeExecutions.set(executionId, nodeExecutions)),
        };
      });
    },

    // Add execution log
    addExecutionLog: (executionId: string, nodeId: string, log: NodeExecution['logs'][0]): void => {
      set((state) => {
        const nodeExecutions = state.nodeExecutions.get(executionId) || new Map();
        const nodeExecution = nodeExecutions.get(nodeId) || {
          nodeId,
          status: 'pending' as const,
          logs: [],
        };

        const updatedExecution = {
          ...nodeExecution,
          logs: [...nodeExecution.logs, log],
        };
        nodeExecutions.set(nodeId, updatedExecution);

        return {
          nodeExecutions: new Map(state.nodeExecutions.set(executionId, nodeExecutions)),
        };
      });
    },

    // Set selected execution
    setSelectedExecution: (executionId: string | null): void => {
      set({ selectedExecution: executionId });
    },

    // Toggle auto refresh
    toggleAutoRefresh: (): void => {
      set((state) => ({ autoRefresh: !state.autoRefresh }));
    },

    // Clear execution data
    clearExecutionData: (executionId: string): void => {
      set((state) => {
        const newActiveExecutions = new Map(state.activeExecutions);
        const newNodeExecutions = new Map(state.nodeExecutions);
        const newExecutionUpdates = new Map(state.executionUpdates);
        const newExecutionMetrics = new Map(state.executionMetrics);

        newActiveExecutions.delete(executionId);
        newNodeExecutions.delete(executionId);
        newExecutionUpdates.delete(executionId);
        newExecutionMetrics.delete(executionId);

        return {
          activeExecutions: newActiveExecutions,
          nodeExecutions: newNodeExecutions,
          executionUpdates: newExecutionUpdates,
          executionMetrics: newExecutionMetrics,
          selectedExecution:
            state.selectedExecution === executionId ? null : state.selectedExecution,
        };
      });
    },
  }))
);

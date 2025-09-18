/**
 * Enhanced Execution State Management
 *
 * Provides real-time execution state tracking with visual feedback,
 * inspired by SIM's AI-powered execution monitoring and n8n's
 * enterprise-grade execution tracking.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { WorkflowExecution } from "@/core/schemas";
import {
  executionMonitor,
  type ExecutionEvent,
  type ExecutionEventHandler,
} from "@/app/services/executionMonitor";

export interface NodeExecutionState {
  nodeId: string;
  status: "idle" | "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputData?: any;
  outputData?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metrics?: {
    memoryUsage?: number;
    cpuTime?: number;
    ioOperations?: number;
  };
  debugInfo?: {
    breakpoint?: boolean;
    watchedVariables?: Record<string, any>;
    logs?: Array<{
      level: "debug" | "info" | "warn" | "error";
      message: string;
      timestamp: string;
    }>;
  };
}

export interface ExecutionProgress {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  skippedNodes: number;
  currentNodeId?: string;
  estimatedTimeRemaining?: number;
  progressPercentage: number;
}

export interface EnhancedExecutionState {
  // Current execution tracking
  currentExecution: WorkflowExecution | null;
  executionHistory: WorkflowExecution[];

  // Real-time node states
  nodeStates: Map<string, NodeExecutionState>;
  activeNodes: Set<string>;
  pendingNodes: Set<string>;
  completedNodes: Set<string>;
  failedNodes: Set<string>;

  // Execution progress
  progress: ExecutionProgress | null;

  // Performance metrics
  performanceMetrics: {
    totalExecutionTime?: number;
    nodeExecutionTimes: Map<string, number>;
    resourceUsage: {
      peakMemory?: number;
      totalCpuTime?: number;
      networkRequests?: number;
    };
  };

  // Real-time updates
  isConnected: boolean;
  lastUpdateTimestamp: string | null;
  subscriptions: Set<string>;

  // Debug mode
  debugMode: boolean;
  breakpoints: Set<string>;
  stepMode: boolean;
  currentStepNodeId?: string;

  // Actions
  startExecution: (workflowId: string, testMode?: boolean) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  subscribeToExecution: (executionId: string) => Promise<void>;
  unsubscribeFromExecution: (executionId: string) => void;

  // Node state management
  updateNodeState: (nodeId: string, state: Partial<NodeExecutionState>) => void;
  getNodeState: (nodeId: string) => NodeExecutionState | null;
  clearNodeStates: () => void;

  // Debug controls
  setDebugMode: (enabled: boolean) => void;
  addBreakpoint: (nodeId: string) => void;
  removeBreakpoint: (nodeId: string) => void;
  stepToNextNode: () => void;
  continueExecution: () => void;

  // History management
  addExecutionToHistory: (execution: WorkflowExecution) => void;
  clearExecutionHistory: () => void;
  getExecutionById: (executionId: string) => WorkflowExecution | null;

  // Utility methods
  calculateProgress: () => ExecutionProgress;
  getExecutionStats: () => {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    mostFailedNode?: string;
  };
}

export const useEnhancedExecutionStore = create<EnhancedExecutionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentExecution: null,
    executionHistory: [],
    nodeStates: new Map(),
    activeNodes: new Set(),
    pendingNodes: new Set(),
    completedNodes: new Set(),
    failedNodes: new Set(),
    progress: null,
    performanceMetrics: {
      nodeExecutionTimes: new Map(),
      resourceUsage: {},
    },
    isConnected: false,
    lastUpdateTimestamp: null,
    subscriptions: new Set(),
    debugMode: false,
    breakpoints: new Set(),
    stepMode: false,

    // Execution management
    startExecution: async (workflowId: string, testMode = false) => {
      try {
        // Clear previous state
        get().clearNodeStates();

        // Start execution via API
        const response = await fetch("/api/executions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflowId,
            mode: testMode ? "test" : "production",
            debugMode: get().debugMode,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to start execution: ${response.statusText}`);
        }

        const execution = await response.json();

        set({
          currentExecution: execution,
          progress: {
            totalNodes: 0,
            completedNodes: 0,
            failedNodes: 0,
            skippedNodes: 0,
            progressPercentage: 0,
          },
        });

        // Subscribe to real-time updates
        await get().subscribeToExecution(execution.id);

        return execution.id;
      } catch (error) {
        console.error("Failed to start execution:", error);
        throw error;
      }
    },

    stopExecution: async (executionId: string) => {
      try {
        await fetch(`/api/executions/${executionId}/stop`, {
          method: "POST",
        });

        // Update local state
        set((state) => ({
          currentExecution:
            state.currentExecution?.id === executionId
              ? { ...state.currentExecution, status: "cancelled" as const }
              : state.currentExecution,
        }));
      } catch (error) {
        console.error("Failed to stop execution:", error);
        throw error;
      }
    },

    subscribeToExecution: async (executionId: string) => {
      const state = get();

      if (state.subscriptions.has(executionId)) {
        return; // Already subscribed
      }

      const handleExecutionEvent: ExecutionEventHandler = (
        event: ExecutionEvent,
      ) => {
        const currentState = get();

        switch (event.type) {
          case "execution_started":
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: "running",
                    startTime: event.timestamp,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });
            break;

          case "execution_completed":
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: "completed",
                    endTime: event.timestamp,
                    duration: event.data.duration,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });

            if (currentState.currentExecution) {
              get().addExecutionToHistory(currentState.currentExecution);
            }
            break;

          case "execution_failed":
            set({
              currentExecution: currentState.currentExecution
                ? {
                    ...currentState.currentExecution,
                    status: "failed",
                    endTime: event.timestamp,
                    error: event.data.error,
                    duration: event.data.duration,
                  }
                : null,
              lastUpdateTimestamp: event.timestamp,
            });

            if (currentState.currentExecution) {
              get().addExecutionToHistory(currentState.currentExecution);
            }
            break;

          case "node_started":
            get().updateNodeState(event.data.nodeId, {
              status: "running",
              startTime: event.timestamp,
              inputData: event.data.inputData,
            });

            set((state) => ({
              activeNodes: new Set([...state.activeNodes, event.data.nodeId]),
              pendingNodes: new Set(
                [...state.pendingNodes].filter(
                  (id) => id !== event.data.nodeId,
                ),
              ),
              progress: {
                ...state.progress!,
                currentNodeId: event.data.nodeId,
              },
            }));
            break;

          case "node_completed":
            const completionTime = Date.now();
            const nodeState = currentState.nodeStates.get(event.data.nodeId);
            const executionTime = nodeState?.startTime
              ? completionTime - new Date(nodeState.startTime).getTime()
              : 0;

            get().updateNodeState(event.data.nodeId, {
              status: "completed",
              endTime: event.timestamp,
              duration: executionTime,
              outputData: event.data.outputData,
            });

            set((state) => {
              const newActiveNodes = new Set(state.activeNodes);
              newActiveNodes.delete(event.data.nodeId);

              const newCompletedNodes = new Set([
                ...state.completedNodes,
                event.data.nodeId,
              ]);

              // Update performance metrics
              const newNodeExecutionTimes = new Map(
                state.performanceMetrics.nodeExecutionTimes,
              );
              newNodeExecutionTimes.set(event.data.nodeId, executionTime);

              return {
                activeNodes: newActiveNodes,
                completedNodes: newCompletedNodes,
                performanceMetrics: {
                  ...state.performanceMetrics,
                  nodeExecutionTimes: newNodeExecutionTimes,
                },
                progress: get().calculateProgress(),
              };
            });
            break;

          case "node_failed":
            get().updateNodeState(event.data.nodeId, {
              status: "failed",
              endTime: event.timestamp,
              error: event.data.error,
            });

            set((state) => {
              const newActiveNodes = new Set(state.activeNodes);
              newActiveNodes.delete(event.data.nodeId);

              const newFailedNodes = new Set([
                ...state.failedNodes,
                event.data.nodeId,
              ]);

              return {
                activeNodes: newActiveNodes,
                failedNodes: newFailedNodes,
                progress: get().calculateProgress(),
              };
            });
            break;

          case "log_entry":
            // Handle log entries for debugging
            if (event.data.nodeId) {
              const currentNodeState = currentState.nodeStates.get(
                event.data.nodeId,
              );
              if (currentNodeState) {
                get().updateNodeState(event.data.nodeId, {
                  debugInfo: {
                    ...currentNodeState.debugInfo,
                    logs: [
                      ...(currentNodeState.debugInfo?.logs || []),
                      {
                        level: event.data.level || "info",
                        message: event.data.message,
                        timestamp: event.timestamp,
                      },
                    ].slice(-100), // Keep last 100 logs
                  },
                });
              }
            }
            break;
        }

        set({ lastUpdateTimestamp: event.timestamp });
      };

      await executionMonitor.subscribeToExecution(
        executionId,
        handleExecutionEvent,
      );

      set((state) => ({
        subscriptions: new Set([...state.subscriptions, executionId]),
        isConnected: executionMonitor.getConnectionStatus() === "connected",
      }));
    },

    unsubscribeFromExecution: (executionId: string) => {
      executionMonitor.unsubscribeFromExecution(executionId);

      set((state) => {
        const newSubscriptions = new Set(state.subscriptions);
        newSubscriptions.delete(executionId);

        return {
          subscriptions: newSubscriptions,
          isConnected: executionMonitor.getConnectionStatus() === "connected",
        };
      });
    },

    // Node state management
    updateNodeState: (
      nodeId: string,
      stateUpdate: Partial<NodeExecutionState>,
    ) => {
      set((state) => {
        const newNodeStates = new Map(state.nodeStates);
        const currentState = newNodeStates.get(nodeId) || {
          nodeId,
          status: "idle" as const,
        };

        newNodeStates.set(nodeId, { ...currentState, ...stateUpdate });

        return { nodeStates: newNodeStates };
      });
    },

    getNodeState: (nodeId: string) => {
      return get().nodeStates.get(nodeId) || null;
    },

    clearNodeStates: () => {
      set({
        nodeStates: new Map(),
        activeNodes: new Set(),
        pendingNodes: new Set(),
        completedNodes: new Set(),
        failedNodes: new Set(),
        progress: null,
      });
    },

    // Debug controls
    setDebugMode: (enabled: boolean) => {
      set({ debugMode: enabled });
    },

    addBreakpoint: (nodeId: string) => {
      set((state) => ({
        breakpoints: new Set([...state.breakpoints, nodeId]),
      }));
    },

    removeBreakpoint: (nodeId: string) => {
      set((state) => {
        const newBreakpoints = new Set(state.breakpoints);
        newBreakpoints.delete(nodeId);
        return { breakpoints: newBreakpoints };
      });
    },

    stepToNextNode: () => {
      // Implementation for step debugging
      set({ stepMode: true });
    },

    continueExecution: () => {
      set({ stepMode: false, currentStepNodeId: undefined });
    },

    // History management
    addExecutionToHistory: (execution: WorkflowExecution) => {
      set((state) => ({
        executionHistory: [execution, ...state.executionHistory].slice(0, 100), // Keep last 100 executions
      }));
    },

    clearExecutionHistory: () => {
      set({ executionHistory: [] });
    },

    getExecutionById: (executionId: string) => {
      const state = get();
      return (
        state.executionHistory.find((exec) => exec.id === executionId) || null
      );
    },

    // Utility methods
    calculateProgress: (): ExecutionProgress => {
      const state = get();
      const totalNodes = state.nodeStates.size;
      const completedNodes = state.completedNodes.size;
      const failedNodes = state.failedNodes.size;
      const skippedNodes = 0; // TODO: Implement skipped node tracking

      return {
        totalNodes,
        completedNodes,
        failedNodes,
        skippedNodes,
        currentNodeId: state.progress?.currentNodeId,
        progressPercentage:
          totalNodes > 0
            ? ((completedNodes + failedNodes) / totalNodes) * 100
            : 0,
      };
    },

    getExecutionStats: () => {
      const state = get();
      const totalExecutions = state.executionHistory.length;
      const successfulExecutions = state.executionHistory.filter(
        (exec) => exec.status === "completed",
      ).length;
      const successRate =
        totalExecutions > 0
          ? (successfulExecutions / totalExecutions) * 100
          : 0;

      const executionTimes = state.executionHistory
        .filter((exec) => exec.duration)
        .map((exec) => exec.duration!);

      const averageExecutionTime =
        executionTimes.length > 0
          ? executionTimes.reduce((sum, time) => sum + time, 0) /
            executionTimes.length
          : 0;

      // Find most failed node
      const nodeFailureCounts = new Map<string, number>();
      state.executionHistory.forEach((exec) => {
        if (exec.status === "failed" && Array.isArray(exec.results)) {
          exec.results.forEach((result) => {
            if (result.status === "failed") {
              const count = nodeFailureCounts.get(result.nodeId) || 0;
              nodeFailureCounts.set(result.nodeId, count + 1);
            }
          });
        }
      });

      let mostFailedNode: string | undefined;
      let maxFailures = 0;
      nodeFailureCounts.forEach((count, nodeId) => {
        if (count > maxFailures) {
          maxFailures = count;
          mostFailedNode = nodeId;
        }
      });

      return {
        totalExecutions,
        successRate,
        averageExecutionTime,
        mostFailedNode,
      };
    },
  })),
);

// Monitor connection status
setInterval(() => {
  useEnhancedExecutionStore.setState({
    isConnected: executionMonitor.getConnectionStatus() === "connected",
  });
}, 1000);

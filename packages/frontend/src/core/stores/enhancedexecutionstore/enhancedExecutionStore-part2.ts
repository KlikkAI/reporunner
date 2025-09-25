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
      // Clear previous state
      get().clearNodeStates();

      // Start execution via API
      const response = await fetch('/api/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          mode: testMode ? 'test' : 'production',
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
    },

    stopExecution: async (executionId: string) => {
      await fetch(`/api/executions/${executionId}/stop`, {
        method: 'POST',
      });

      // Update local state
      set((state) => ({
        currentExecution:
          state.currentExecution?.id === executionId
            ? { ...state.currentExecution, status: 'cancelled' as const }
            : state.currentExecution,

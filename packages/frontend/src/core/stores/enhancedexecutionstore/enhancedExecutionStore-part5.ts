return { nodeStates: newNodeStates };
})
},

    getNodeState: (nodeId: string) =>
{
  return get().nodeStates.get(nodeId) || null;
}
,

    clearNodeStates: () =>
{
  set({
    nodeStates: new Map(),
    activeNodes: new Set(),
    pendingNodes: new Set(),
    completedNodes: new Set(),
    failedNodes: new Set(),
    progress: null,
  });
}
,

    // Debug controls
    setDebugMode: (enabled: boolean) =>
{
  set({ debugMode: enabled });
}
,

    addBreakpoint: (nodeId: string) =>
{
  set((state) => ({
    breakpoints: new Set([...state.breakpoints, nodeId]),
  }));
}
,

    removeBreakpoint: (nodeId: string) =>
{
  set((state) => {
    const newBreakpoints = new Set(state.breakpoints);
    newBreakpoints.delete(nodeId);
    return { breakpoints: newBreakpoints };
  });
}
,

    stepToNextNode: () =>
{
  // Implementation for step debugging
  set({ stepMode: true });
}
,

    continueExecution: () =>
{
  set({ stepMode: false, currentStepNodeId: undefined });
}
,

    // History management
    addExecutionToHistory: (execution: WorkflowExecution) =>
{
  set((state) => ({
    executionHistory: [execution, ...state.executionHistory].slice(0, 100), // Keep last 100 executions
  }));
}
,

    clearExecutionHistory: () =>
{
  set({ executionHistory: [] });
}
,

    getExecutionById: (executionId: string) =>
{
  const state = get();
  return state.executionHistory.find((exec) => exec.id === executionId) || null;
}
,

    // Utility methods
    calculateProgress: (): ExecutionProgress =>
{
  const state = get();
  const totalNodes = state.nodeStates.size;
  const completedNodes = state.completedNodes.size;
  const failedNodes = state.failedNodes.size;

  // Calculate skipped nodes by checking node states
  const skippedNodes = Array.from(state.nodeStates.values()).filter(
    (nodeState) => nodeState.status === 'skipped'
  ).length;

  return {
        totalNodes,
        completedNodes,
        failedNodes,
        skippedNodes,
        currentNodeId: state.progress?.currentNodeId,
        progressPercentage:
          totalNodes > 0 ? ((completedNodes + failedNodes + skippedNodes) / totalNodes) * 100 : 0,
      };
}
,

    getExecutionStats: () =>
{
      const state = get();
      const totalExecutions = state.executionHistory.length;
      const successfulExecutions = state.executionHistory.filter(
        (exec) => exec.status === 'completed'
      ).length;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      const executionTimes = state.executionHistory
        .filter((exec) => exec.duration)
        .map((exec) => exec.duration!);

      const averageExecutionTime =
        executionTimes.length > 0

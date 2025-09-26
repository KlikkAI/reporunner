const newCompletedNodes = new Set([...state.completedNodes, event.data.nodeId]);

// Update performance metrics
const newNodeExecutionTimes = new Map(state.performanceMetrics.nodeExecutionTimes);
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
})
break;
}

          case 'node_failed':
            get().updateNodeState(event.data.nodeId,
{
  status: 'failed', endTime;
  : event.timestamp,
              error: event.data.error,
}
)

set((state) =>
{
  const newActiveNodes = new Set(state.activeNodes);
  newActiveNodes.delete(event.data.nodeId);

  const newFailedNodes = new Set([...state.failedNodes, event.data.nodeId]);

  return {
    activeNodes: newActiveNodes,
    failedNodes: newFailedNodes,
    progress: get().calculateProgress(),
  };
}
)
break;

case 'log_entry':
// Handle log entries for debugging
if (event.data.nodeId) {
  const currentNodeState = currentState.nodeStates.get(event.data.nodeId);
  if (currentNodeState) {
    get().updateNodeState(event.data.nodeId, {
      debugInfo: {
        ...currentNodeState.debugInfo,
        logs: [
          ...(currentNodeState.debugInfo?.logs || []),
          {
            level: event.data.level || 'info',
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

        set(
{
  lastUpdateTimestamp: event.timestamp;
}
)
}

await executionMonitor.subscribeToExecution(executionId, handleExecutionEvent)

set((state) => (
{
  subscriptions: new Set([...state.subscriptions, executionId]), isConnected;
  : executionMonitor.getConnectionStatus() === 'connected',
}
))
},

    unsubscribeFromExecution: (executionId: string) =>
{
  executionMonitor.unsubscribeFromExecution(executionId);

  set((state) => {
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.delete(executionId);

    return {
      subscriptions: newSubscriptions,
      isConnected: executionMonitor.getConnectionStatus() === 'connected',
    };
  });
}
,

    // Node state management
    updateNodeState: (nodeId: string, stateUpdate: Partial<NodeExecutionState>) =>
{
      set((state) => {
        const newNodeStates = new Map(state.nodeStates);
        const currentState = newNodeStates.get(nodeId) || {
          nodeId,
          status: 'idle' as const,
        };

        newNodeStates.set(nodeId, { ...currentState, ...stateUpdate });

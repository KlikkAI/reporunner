? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
          : 0

// Find most failed node
const nodeFailureCounts = new Map<string, number>();
state.executionHistory.forEach((exec) => {
  if (exec.status === 'failed' && Array.isArray(exec.results)) {
    exec.results.forEach((result) => {
      if (result.status === 'failed') {
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
  }))
)

// Monitor connection status
setInterval(() =>
{
  useEnhancedExecutionStore.setState({
    isConnected: executionMonitor.getConnectionStatus() === 'connected',
  });
}
, 1000)

({ autoRefresh, refreshInterval: interval, selectedWorkflowId }) => {
  // Clear existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Set up new interval if auto-refresh is enabled
  if (autoRefresh && selectedWorkflowId) {
    refreshInterval = setInterval(() => {
      const state = useAnalyticsStore.getState();
      if (state.selectedWorkflowId && !state.isLoading) {
        state.refreshAnalytics();
      }
    }, interval);
  }
};
)

// Subscribe to analytics service updates
analyticsService.subscribeToAnalytics((analytics) =>
{
  const state = useAnalyticsStore.getState();
  if (state.selectedWorkflowId === analytics.workflowId) {
    useAnalyticsStore.setState({
      currentAnalytics: analytics,
      lastUpdated: new Date().toISOString(),
    });
  }
}
)
}

// Export helper functions for component use
export const getExecutionSummary = (analytics: WorkflowAnalytics | null) => {
  if (!analytics) return null;

  return {
    totalExecutions: analytics.executionStats.total,
    successRate:
      analytics.executionStats.total > 0
        ? (analytics.executionStats.successful / analytics.executionStats.total) * 100
        : 100,
    avgDuration: analytics.executionStats.averageDuration,
    throughput: analytics.performanceMetrics.throughput,
    efficiency: analytics.performanceMetrics.efficiency,
  };
};

export const getTopBottlenecks = (bottlenecks: BottleneckAnalysis[], limit = 5) => {
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return bottlenecks
    .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
    .slice(0, limit);
};

export const getCostTrend = (costHistory: TimeSeriesPoint[]) => {
  if (costHistory.length < 2) return 0;

  const recent = costHistory.slice(-7).reduce((sum, p) => sum + p.value, 0) / 7;
  const previous = costHistory.slice(-14, -7).reduce((sum, p) => sum + p.value, 0) / 7;

  return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
};

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
  if (milliseconds < 3600000) return `${(milliseconds / 60000).toFixed(1)}m`;
  return `${(milliseconds / 3600000).toFixed(1)}h`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(1)}GB`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

comparisonWorkflowIds: [],
  // Actions
  loadAnalytics;
: async (workflowId: string, period?: number) =>
{
  set({ isLoading: true, selectedWorkflowId: workflowId });

  try {
    const analyticsPeriod = period || get().analyticsPeriod;
    const analytics = analyticsService.generateWorkflowAnalytics(workflowId, analyticsPeriod);

    // Extract time series data
    const performanceHistory = analytics.resourceTrends.cpuTrend;
    const costHistory = analytics.resourceTrends.costTrend;

    // Calculate reliability history from execution stats
    const reliabilityHistory: TimeSeriesPoint[] = performanceHistory.map((point) => ({
      timestamp: point.timestamp,
      value:
        analytics.executionStats.total > 0
          ? (analytics.executionStats.successful / analytics.executionStats.total) * 100
          : 100,
    }));

    set({
      currentAnalytics: analytics,
      performanceHistory,
      costHistory,
      reliabilityHistory,
      lastUpdated: new Date().toISOString(),
      isLoading: false,
    });

    // Load additional insights
    await Promise.all([
      get().generateBottleneckAnalysis(workflowId),
      get().showPredictions ? get().generatePredictiveInsights(workflowId) : Promise.resolve(),
      get().showCostAnalysis ? get().generateCostOptimization(workflowId) : Promise.resolve(),
    ]);
  } catch (_error) {
    set({ isLoading: false });
  }
}
,

    refreshAnalytics: async () =>
{
  const { selectedWorkflowId, analyticsPeriod } = get();
  if (selectedWorkflowId) {
    await get().loadAnalytics(selectedWorkflowId, analyticsPeriod);
  }
}
,

    recordExecution: (metrics: ExecutionMetrics) =>
{
  analyticsService.recordExecutionMetrics(metrics);

  set((state) => ({
    activeExecutions: new Map(state.activeExecutions).set(metrics.executionId, metrics),
    recentExecutions: [metrics, ...state.recentExecutions].slice(0, 50), // Keep last 50
  }));

  // Auto-refresh analytics if enabled
  const { autoRefresh, selectedWorkflowId } = get();
  if (autoRefresh && selectedWorkflowId === metrics.workflowId) {
    setTimeout(() => get().refreshAnalytics(), 1000); // Debounced refresh
  }
}
,

    updateNodeMetrics: (executionId: string, nodeMetrics: NodeMetrics) =>
{
  analyticsService.updateNodeMetrics(executionId, nodeMetrics);

  set((state) => {
    const updatedExecutions = new Map(state.activeExecutions);
    const execution = updatedExecutions.get(executionId);

    if (execution) {
      const existingIndex = execution.nodeMetrics.findIndex(
        (nm) => nm.nodeId === nodeMetrics.nodeId
      );

      if (existingIndex >= 0) {
        execution.nodeMetrics[existingIndex] = nodeMetrics;
      } else {
        execution.nodeMetrics.push(nodeMetrics);
      }

      updatedExecutions.set(executionId, execution);
    }

    return { activeExecutions: updatedExecutions };
  });
}
,

    generateBottleneckAnalysis: async (workflowId: string) =>
{
  try {
    const bottlenecks = analyticsService.detectBottlenecks(workflowId);
    set({ bottlenecks });
  } catch (_error) {}
}
,

    generatePredictiveInsights: async (workflowId: string) =>
{
      try {
        const insights = analyticsService.generatePredictiveInsights(workflowId);

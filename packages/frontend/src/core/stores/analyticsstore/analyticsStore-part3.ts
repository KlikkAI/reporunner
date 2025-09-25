set({ predictiveInsights: insights });
} catch (_error)
{
}
},

    generateCostOptimization: async (workflowId: string) =>
{
  try {
    const optimization = analyticsService.generateCostOptimization(workflowId);
    set({ costOptimization: optimization });
  } catch (_error) {}
}
,

    setSelectedWorkflow: (workflowId: string | null) =>
{
  set({ selectedWorkflowId: workflowId });
  if (workflowId) {
    get().loadAnalytics(workflowId);
  } else {
    get().clearAnalytics();
  }
}
,

    setAnalyticsPeriod: (period: 1 | 7 | 30 | 90) =>
{
  set({ analyticsPeriod: period });
  const { selectedWorkflowId } = get();
  if (selectedWorkflowId) {
    get().loadAnalytics(selectedWorkflowId, period);
  }
}
,

    toggleAnalyticsModal: () =>
{
  set((state) => ({ analyticsModalOpen: !state.analyticsModalOpen }));
}
,

    setSelectedTab: (tab) =>
{
  set({ selectedTab: tab });
}
,

    setSelectedNode: (nodeId: string | null) =>
{
  set({ selectedNodeId: nodeId });
}
,

    toggleAutoRefresh: () =>
{
  set((state) => ({ autoRefresh: !state.autoRefresh }));
}
,

    togglePredictions: () =>
{
  set((state) => ({ showPredictions: !state.showPredictions }));
  const { selectedWorkflowId, showPredictions } = get();
  if (selectedWorkflowId && !showPredictions) {
    get().generatePredictiveInsights(selectedWorkflowId);
  }
}
,

    toggleCostAnalysis: () =>
{
  set((state) => ({ showCostAnalysis: !state.showCostAnalysis }));
  const { selectedWorkflowId, showCostAnalysis } = get();
  if (selectedWorkflowId && !showCostAnalysis) {
    get().generateCostOptimization(selectedWorkflowId);
  }
}
,

    enableComparisonMode: (workflowIds: string[]) =>
{
  set({
    comparisonMode: true,
    comparisonWorkflowIds: workflowIds,
  });
}
,

    disableComparisonMode: () =>
{
  set({
    comparisonMode: false,
    comparisonWorkflowIds: [],
  });
}
,

    clearAnalytics: () =>
{
  set({
    currentAnalytics: null,
    bottlenecks: [],
    predictiveInsights: [],
    costOptimization: null,
    performanceHistory: [],
    costHistory: [],
    reliabilityHistory: [],
    lastUpdated: null,
    selectedNodeId: null,
  });
}
,
  }))
)

// Set up auto-refresh subscription
if (typeof window !== 'undefined') {
  let refreshInterval: NodeJS.Timeout;

  useAnalyticsStore.subscribe(
    (state) => ({
      autoRefresh: state.autoRefresh,
      refreshInterval: state.refreshInterval,
      selectedWorkflowId: state.selectedWorkflowId,
    }),

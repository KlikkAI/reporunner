/**
 * Analytics Store
 *
 * Zustand store for managing workflow analytics, performance monitoring,
 * and optimization insights state across the application.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  BottleneckAnalysis,
  CostOptimization,
  ExecutionMetrics,
  NodeMetrics,
  PredictiveInsight,
  TimeSeriesPoint,
  WorkflowAnalytics,
} from '../services/analyticsService';
import { analyticsService } from '../services/analyticsService';

export interface AnalyticsState {
  // Current analytics data
  currentAnalytics: WorkflowAnalytics | null;
  isLoading: boolean;
  lastUpdated: string | null;

  // Real-time execution monitoring
  activeExecutions: Map<string, ExecutionMetrics>;
  recentExecutions: ExecutionMetrics[];

  // Performance insights
  bottlenecks: BottleneckAnalysis[];
  predictiveInsights: PredictiveInsight[];
  costOptimization: CostOptimization | null;

  // Time series data for charts
  performanceHistory: TimeSeriesPoint[];
  costHistory: TimeSeriesPoint[];
  reliabilityHistory: TimeSeriesPoint[];

  // Filters and settings
  selectedWorkflowId: string | null;
  analyticsPeriod: 1 | 7 | 30 | 90; // days
  showPredictions: boolean;
  showCostAnalysis: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds

  // UI state
  analyticsModalOpen: boolean;
  selectedTab: 'overview' | 'performance' | 'costs' | 'insights' | 'nodes';
  selectedNodeId: string | null;
  comparisonMode: boolean;
  comparisonWorkflowIds: string[];

  // Actions
  loadAnalytics: (workflowId: string, period?: number) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  recordExecution: (metrics: ExecutionMetrics) => void;
  updateNodeMetrics: (executionId: string, nodeMetrics: NodeMetrics) => void;
  generateBottleneckAnalysis: (workflowId: string) => Promise<void>;
  generatePredictiveInsights: (workflowId: string) => Promise<void>;
  generateCostOptimization: (workflowId: string) => Promise<void>;
  setSelectedWorkflow: (workflowId: string | null) => void;
  setAnalyticsPeriod: (period: 1 | 7 | 30 | 90) => void;
  toggleAnalyticsModal: () => void;
  setSelectedTab: (tab: 'overview' | 'performance' | 'costs' | 'insights' | 'nodes') => void;
  setSelectedNode: (nodeId: string | null) => void;
  toggleAutoRefresh: () => void;
  togglePredictions: () => void;
  toggleCostAnalysis: () => void;
  enableComparisonMode: (workflowIds: string[]) => void;
  disableComparisonMode: () => void;
  clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentAnalytics: null,
    isLoading: false,
    lastUpdated: null,
    activeExecutions: new Map(),
    recentExecutions: [],
    bottlenecks: [],
    predictiveInsights: [],
    costOptimization: null,
    performanceHistory: [],
    costHistory: [],
    reliabilityHistory: [],
    selectedWorkflowId: null,
    analyticsPeriod: 7,
    showPredictions: true,
    showCostAnalysis: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    analyticsModalOpen: false,
    selectedTab: 'overview',
    selectedNodeId: null,
    comparisonMode: false,
    comparisonWorkflowIds: [],

    // Actions
    loadAnalytics: async (workflowId: string, period?: number) => {
      set({ isLoading: true, selectedWorkflowId: workflowId });

      try {
        const _analyticsPeriod = period || get().analyticsPeriod;
        const analytics = await analyticsService.generateWorkflowAnalytics(workflowId);

        // Extract time series data (stub implementation - will be enhanced when backend is ready)
        const performanceHistory: TimeSeriesPoint[] = [];
        const costHistory: TimeSeriesPoint[] = [];

        // Calculate reliability history from execution stats (stub)
        const reliabilityHistory: TimeSeriesPoint[] = [];

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
    },

    refreshAnalytics: async () => {
      const { selectedWorkflowId, analyticsPeriod } = get();
      if (selectedWorkflowId) {
        await get().loadAnalytics(selectedWorkflowId, analyticsPeriod);
      }
    },

    recordExecution: (metrics: ExecutionMetrics) => {
      analyticsService.recordExecutionMetrics(metrics.executionId, metrics);

      set((state) => ({
        activeExecutions: new Map(state.activeExecutions).set(metrics.executionId, metrics),
        recentExecutions: [metrics, ...state.recentExecutions].slice(0, 50), // Keep last 50
      }));

      // Auto-refresh analytics if enabled (stub - metrics don't have workflowId yet)
      const { autoRefresh } = get();
      if (autoRefresh) {
        setTimeout(() => get().refreshAnalytics(), 1000); // Debounced refresh
      }
    },

    updateNodeMetrics: (executionId: string, nodeMetrics: NodeMetrics) => {
      analyticsService.updateNodeMetrics(executionId, nodeMetrics);

      set((state) => {
        const updatedExecutions = new Map(state.activeExecutions);
        const execution = updatedExecutions.get(executionId);

        if (execution) {
          // Convert NodeMetrics to NodePerformanceStats format
          const perfStats: import('../services/analyticsService').NodePerformanceStats = {
            nodeId: nodeMetrics.nodeId,
            nodeType: '', // Will be populated when backend is ready
            avgExecutionTime: nodeMetrics.averageTime,
            executionCount: nodeMetrics.totalExecutions,
            errorCount: Math.round(nodeMetrics.errorRate * nodeMetrics.totalExecutions),
          };

          const existingIndex = execution.nodeMetrics.findIndex(
            (nm) => nm.nodeId === nodeMetrics.nodeId
          );

          if (existingIndex >= 0) {
            execution.nodeMetrics[existingIndex] = perfStats;
          } else {
            execution.nodeMetrics.push(perfStats);
          }

          updatedExecutions.set(executionId, execution);
        }

        return { activeExecutions: updatedExecutions };
      });
    },

    generateBottleneckAnalysis: async (workflowId: string) => {
      try {
        const bottlenecks = await analyticsService.detectBottlenecks(workflowId);
        set({ bottlenecks: bottlenecks as BottleneckAnalysis[] });
      } catch (_error) {}
    },

    generatePredictiveInsights: async (workflowId: string) => {
      try {
        const insights = await analyticsService.generatePredictiveInsights(workflowId);
        set({ predictiveInsights: insights ? [insights as PredictiveInsight] : [] });
      } catch (_error) {}
    },

    generateCostOptimization: async (workflowId: string) => {
      try {
        const optimization = await analyticsService.generateCostOptimization(workflowId);
        set({ costOptimization: optimization as CostOptimization });
      } catch (_error) {}
    },

    setSelectedWorkflow: (workflowId: string | null) => {
      set({ selectedWorkflowId: workflowId });
      if (workflowId) {
        get().loadAnalytics(workflowId);
      } else {
        get().clearAnalytics();
      }
    },

    setAnalyticsPeriod: (period: 1 | 7 | 30 | 90) => {
      set({ analyticsPeriod: period });
      const { selectedWorkflowId } = get();
      if (selectedWorkflowId) {
        get().loadAnalytics(selectedWorkflowId, period);
      }
    },

    toggleAnalyticsModal: () => {
      set((state) => ({ analyticsModalOpen: !state.analyticsModalOpen }));
    },

    setSelectedTab: (tab) => {
      set({ selectedTab: tab });
    },

    setSelectedNode: (nodeId: string | null) => {
      set({ selectedNodeId: nodeId });
    },

    toggleAutoRefresh: () => {
      set((state) => ({ autoRefresh: !state.autoRefresh }));
    },

    togglePredictions: () => {
      set((state) => ({ showPredictions: !state.showPredictions }));
      const { selectedWorkflowId, showPredictions } = get();
      if (selectedWorkflowId && !showPredictions) {
        get().generatePredictiveInsights(selectedWorkflowId);
      }
    },

    toggleCostAnalysis: () => {
      set((state) => ({ showCostAnalysis: !state.showCostAnalysis }));
      const { selectedWorkflowId, showCostAnalysis } = get();
      if (selectedWorkflowId && !showCostAnalysis) {
        get().generateCostOptimization(selectedWorkflowId);
      }
    },

    enableComparisonMode: (workflowIds: string[]) => {
      set({
        comparisonMode: true,
        comparisonWorkflowIds: workflowIds,
      });
    },

    disableComparisonMode: () => {
      set({
        comparisonMode: false,
        comparisonWorkflowIds: [],
      });
    },

    clearAnalytics: () => {
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
    },
  }))
);

// Set up auto-refresh subscription
if (typeof window !== 'undefined') {
  let refreshInterval: NodeJS.Timeout;

  useAnalyticsStore.subscribe(
    (state) => ({
      autoRefresh: state.autoRefresh,
      refreshInterval: state.refreshInterval,
      selectedWorkflowId: state.selectedWorkflowId,
    }),
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
    }
  );

  // Subscribe to analytics service updates
  analyticsService.subscribeToAnalytics((analytics) => {
    const state = useAnalyticsStore.getState();
    if (state.selectedWorkflowId === analytics.workflowId) {
      useAnalyticsStore.setState({
        currentAnalytics: analytics,
        lastUpdated: new Date().toISOString(),
      });
    }
  });
}

// Export helper functions for component use
export const getExecutionSummary = (analytics: WorkflowAnalytics | null) => {
  if (!analytics) {
    return null;
  }

  // Stub implementation - will be enhanced when backend provides full analytics
  return {
    totalExecutions: 0,
    successRate: 100,
    avgDuration: 0,
    throughput: 0,
    efficiency: 0,
  };
};

export const getTopBottlenecks = (bottlenecks: BottleneckAnalysis[], limit = 5) => {
  const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return bottlenecks
    .sort((a, b) => {
      const aSev = a.severity || a.impact || 'low';
      const bSev = b.severity || b.impact || 'low';
      return (severityOrder[bSev] || 0) - (severityOrder[aSev] || 0);
    })
    .slice(0, limit);
};

export const getCostTrend = (costHistory: TimeSeriesPoint[]) => {
  if (costHistory.length < 2) {
    return 0;
  }

  const recent = costHistory.slice(-7).reduce((sum, p) => sum + p.value, 0) / 7;
  const previous = costHistory.slice(-14, -7).reduce((sum, p) => sum + p.value, 0) / 7;

  return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
};

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }
  if (milliseconds < 3600000) {
    return `${(milliseconds / 60000).toFixed(1)}m`;
  }
  return `${(milliseconds / 3600000).toFixed(1)}h`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1048576) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  if (bytes < 1073741824) {
    return `${(bytes / 1048576).toFixed(1)}MB`;
  }
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

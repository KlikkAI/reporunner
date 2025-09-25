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

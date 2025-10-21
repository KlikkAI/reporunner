import { ApiClientError, apiClient } from './ApiClient';

/**
 * Workflow analysis request
 */
export interface WorkflowAnalysisRequest {
  workflowId: string;
  includeHistoricalData?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'deep';
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'reliability' | 'cost' | 'maintainability' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    performanceImprovement?: number; // Percentage
    reliabilityImprovement?: number;
    costSavings?: number;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    steps: string[];
  };
  reasoning: string;
}

/**
 * Workflow optimization report
 */
export interface OptimizationReport {
  workflowId: string;
  analysisDate: Date;
  overallScore: number; // 0-100
  suggestions: OptimizationSuggestion[];
  metrics: {
    currentPerformance: number;
    potentialImprovement: number;
    estimatedCostSavings: number;
  };
  summary: string;
}

/**
 * Workflow performance metrics
 */
export interface WorkflowMetrics {
  workflowId: string;
  timeRange: string;
  metrics: {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    errorCount: number;
    performanceTrend: 'improving' | 'stable' | 'degrading';
    reliabilityTrend: 'improving' | 'stable' | 'degrading';
  };
  chartData: {
    executionTimes: Array<{
      date: string;
      avgTime: number;
    }>;
    successRates: Array<{
      date: string;
      rate: number;
    }>;
  };
}

/**
 * Apply suggestion request
 */
export interface ApplySuggestionRequest {
  workflowId: string;
  suggestionId: string;
  autoApply?: boolean;
}

/**
 * Apply suggestion result
 */
export interface ApplySuggestionResult {
  workflowId: string;
  suggestionId: string;
  appliedAt: Date;
  backupId: string;
}

/**
 * Batch analysis request
 */
export interface BatchAnalysisRequest {
  workflowIds: string[]; // Max 10
}

/**
 * Batch analysis result
 */
export interface BatchAnalysisResult {
  batchId: string;
  workflowIds: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedCompletionTime: Date;
  jobs: Array<{
    workflowId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    jobId: string;
  }>;
}

/**
 * Batch analysis status
 */
export interface BatchAnalysisStatus {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  completedAt?: Date;
  results: Array<{
    workflowId: string;
    status: 'completed' | 'failed';
    overallScore: number;
    suggestionsCount: number;
  }>;
}

/**
 * Cached optimization suggestions
 */
export interface CachedSuggestions {
  workflowId: string;
  suggestions: OptimizationSuggestion[];
  lastAnalyzed: Date | null;
}

/**
 * Type-safe Workflow Optimization API Service
 *
 * Handles AI-powered workflow analysis, optimization suggestions, and performance metrics
 */
export class WorkflowOptimizationApiService {
  /**
   * Analyze a workflow and get optimization suggestions
   */
  async analyzeWorkflow(request: WorkflowAnalysisRequest): Promise<OptimizationReport> {
    try {
      const response = await apiClient.raw({
        method: 'POST',
        url: '/workflow-optimization/analyze',
        data: request,
      });

      const data = response.data as { success: boolean; data: OptimizationReport };

      if (!data.success) {
        throw new ApiClientError('Failed to analyze workflow', response.status, 'ANALYSIS_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to analyze workflow', 0, 'ANALYSIS_ERROR', error);
    }
  }

  /**
   * Get cached optimization suggestions for a workflow
   */
  async getSuggestions(workflowId: string): Promise<CachedSuggestions> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: `/workflow-optimization/suggestions/${workflowId}`,
      });

      const data = response.data as { success: boolean; data: CachedSuggestions };

      if (!data.success) {
        throw new ApiClientError(
          'Failed to fetch suggestions',
          response.status,
          'SUGGESTIONS_FAILED'
        );
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch suggestions', 0, 'SUGGESTIONS_ERROR', error);
    }
  }

  /**
   * Apply an optimization suggestion to a workflow
   */
  async applySuggestion(request: ApplySuggestionRequest): Promise<ApplySuggestionResult> {
    try {
      const response = await apiClient.raw({
        method: 'POST',
        url: '/workflow-optimization/apply-suggestion',
        data: request,
      });

      const data = response.data as { success: boolean; data: ApplySuggestionResult };

      if (!data.success) {
        throw new ApiClientError('Failed to apply suggestion', response.status, 'APPLY_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to apply suggestion', 0, 'APPLY_ERROR', error);
    }
  }

  /**
   * Get performance metrics for a workflow
   */
  async getMetrics(workflowId: string, timeRange = '7d'): Promise<WorkflowMetrics> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: `/workflow-optimization/metrics/${workflowId}`,
        params: { timeRange },
      });

      const data = response.data as { success: boolean; data: WorkflowMetrics };

      if (!data.success) {
        throw new ApiClientError('Failed to fetch metrics', response.status, 'METRICS_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch metrics', 0, 'METRICS_ERROR', error);
    }
  }

  /**
   * Analyze multiple workflows in batch
   */
  async batchAnalyze(request: BatchAnalysisRequest): Promise<BatchAnalysisResult> {
    try {
      // Validate max 10 workflows
      if (request.workflowIds.length > 10) {
        throw new ApiClientError(
          'Maximum 10 workflows allowed per batch',
          400,
          'BATCH_LIMIT_EXCEEDED'
        );
      }

      const response = await apiClient.raw({
        method: 'POST',
        url: '/workflow-optimization/batch-analyze',
        data: request,
      });

      const data = response.data as { success: boolean; data: BatchAnalysisResult };

      if (!data.success) {
        throw new ApiClientError('Failed to start batch analysis', response.status, 'BATCH_FAILED');
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to start batch analysis', 0, 'BATCH_ERROR', error);
    }
  }

  /**
   * Get status of batch analysis
   */
  async getBatchStatus(batchId: string): Promise<BatchAnalysisStatus> {
    try {
      const response = await apiClient.raw({
        method: 'GET',
        url: `/workflow-optimization/batch-status/${batchId}`,
      });

      const data = response.data as { success: boolean; data: BatchAnalysisStatus };

      if (!data.success) {
        throw new ApiClientError(
          'Failed to fetch batch status',
          response.status,
          'BATCH_STATUS_FAILED'
        );
      }

      return data.data;
    } catch (error) {
      throw new ApiClientError('Failed to fetch batch status', 0, 'BATCH_STATUS_ERROR', error);
    }
  }
}

// Export singleton instance
export const workflowOptimizationApiService = new WorkflowOptimizationApiService();

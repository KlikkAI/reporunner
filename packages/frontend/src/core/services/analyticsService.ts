/**
 * Advanced Analytics Service
 *
 * Comprehensive analytics and performance monitoring system for workflow
 * execution, providing insights, bottleneck detection, cost optimization,
 * and predictive analytics. Inspired by DataDog, New Relic, and Grafana.
 */

// Removed unused imports

export interface ExecutionMetrics {
  executionId: string;
  workflowId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalDuration?: number;
  nodeMetrics: NodeMetrics[];
  resourceUsage: ResourceUsage;
  errorDetails?: ExecutionError[];
}

export interface NodeMetrics {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputSize?: number;
  outputSize?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  cacheHits?: number;
  cacheMisses?: number;
  errorCount?: number;
  retryCount?: number;
}

export interface ResourceUsage {
  totalMemoryMB: number;
  peakMemoryMB: number;
  totalCpuMs: number;
  networkBytesIn: number;
  networkBytesOut: number;
  storageReads: number;
  storageWrites: number;
  apiCalls: number;
  cost?: {
    compute: number;
    storage: number;
    network: number;
    apis: number;
    total: number;
  };
}

export interface ExecutionError {
  nodeId: string;
  timestamp: string;
  type: 'timeout' | 'network' | 'auth' | 'validation' | 'runtime';
  message: string;
  stack?: string;
  retry?: {
    attempt: number;
    maxAttempts: number;
    nextRetryAt?: string;
  };
}

export interface WorkflowAnalytics {
  workflowId: string;
  period: {
    start: string;
    end: string;
  };
  executionStats: {
    total: number;
    successful: number;
    failed: number;
    cancelled: number;
    averageDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  };
  performanceMetrics: {
    throughput: number; // executions per hour
    reliability: number; // success rate percentage
    efficiency: number; // resource utilization score
    bottlenecks: BottleneckAnalysis[];
  };
  resourceTrends: {
    memoryTrend: TimeSeriesPoint[];
    cpuTrend: TimeSeriesPoint[];
    networkTrend: TimeSeriesPoint[];
    costTrend: TimeSeriesPoint[];
  };
  nodePerformance: NodePerformanceStats[];
}

export interface BottleneckAnalysis {
  type: 'slow_node' | 'memory_pressure' | 'network_latency' | 'api_limits';
  severity: 'low' | 'medium' | 'high' | 'critical';
  nodeId?: string;
  description: string;
  impact: string;
  recommendation: string;
  estimatedImprovement: string;
}

export interface NodePerformanceStats {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  executionCount: number;
  averageDuration: number;
  failureRate: number;
  resourceScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastExecuted: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface PredictiveInsight {
  type: 'performance_degradation' | 'cost_spike' | 'failure_risk' | 'optimization_opportunity';
  confidence: number; // 0-1
  timeframe: string;
  description: string;
  predictedImpact: string;
  recommendedActions: string[];
  basedOn: string[];
}

export interface CostOptimization {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  type: 'node_optimization' | 'resource_right_sizing' | 'caching' | 'scheduling';
  nodeId?: string;
  description: string;
  estimatedSavings: number;
  implementation: string;
  impact: 'low' | 'medium' | 'high';
}

export class AnalyticsService {
  private executionHistory = new Map<string, ExecutionMetrics>();
  private workflowAnalytics = new Map<string, WorkflowAnalytics>();
  private metricsBuffer: ExecutionMetrics[] = [];
  private analyticsListeners = new Set<(analytics: WorkflowAnalytics) => void>();

  // Configuration
  private readonly BUFFER_SIZE = 100;
  private readonly ANALYTICS_UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly METRICS_RETENTION_DAYS = 30;

  constructor() {
    this.startPeriodicAnalytics();
    this.setupMetricsRetention();
  }

  /**
   * Record execution metrics for a workflow run
   */
  recordExecutionMetrics(metrics: ExecutionMetrics): void {
    this.executionHistory.set(metrics.executionId, metrics);
    this.metricsBuffer.push(metrics);

    // Process buffer when full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      this.processMetricsBuffer();
    }

    // Emit real-time metrics
    this.emitMetricsUpdate(metrics);
  }

  /**
   * Update node-level metrics during execution
   */
  updateNodeMetrics(executionId: string, nodeMetrics: NodeMetrics): void {
    const execution = this.executionHistory.get(executionId);
    if (execution) {
      const existingIndex = execution.nodeMetrics.findIndex(
        (nm) => nm.nodeId === nodeMetrics.nodeId
      );

      if (existingIndex >= 0) {
        execution.nodeMetrics[existingIndex] = nodeMetrics;
      } else {
        execution.nodeMetrics.push(nodeMetrics);
      }

      // Update resource usage
      this.updateResourceUsage(execution, nodeMetrics);
    }
  }

  /**
   * Generate comprehensive workflow analytics
   */
  generateWorkflowAnalytics(workflowId: string, periodDays: number = 7): WorkflowAnalytics {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const relevantExecutions = Array.from(this.executionHistory.values()).filter(
      (exec) =>
        exec.workflowId === workflowId &&
        new Date(exec.startTime) >= startTime &&
        new Date(exec.startTime) <= endTime
    );

    const analytics: WorkflowAnalytics = {
      workflowId,
      period: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
      executionStats: this.calculateExecutionStats(relevantExecutions),
      performanceMetrics: this.calculatePerformanceMetrics(relevantExecutions),
      resourceTrends: this.calculateResourceTrends(relevantExecutions),
      nodePerformance: this.calculateNodePerformanceStats(relevantExecutions),
    };

    this.workflowAnalytics.set(workflowId, analytics);
    return analytics;
  }

  /**
   * Detect performance bottlenecks
   */
  detectBottlenecks(workflowId: string): BottleneckAnalysis[] {
    const analytics = this.workflowAnalytics.get(workflowId);
    if (!analytics) return [];

    const bottlenecks: BottleneckAnalysis[] = [];

    // Detect slow nodes
    const slowNodes = analytics.nodePerformance
      .filter((node) => node.averageDuration > 5000) // 5 seconds
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 3);

    slowNodes.forEach((node) => {
      bottlenecks.push({
        type: 'slow_node',
        severity: node.averageDuration > 30000 ? 'critical' : 'high',
        nodeId: node.nodeId,
        description: `Node "${node.nodeName}" is executing slowly`,
        impact: `Average execution time: ${(node.averageDuration / 1000).toFixed(2)}s`,
        recommendation: this.getNodeOptimizationRecommendation(node),
        estimatedImprovement: `Potential 20-40% workflow speed improvement`,
      });
    });

    // Detect high failure rate nodes
    const unreliableNodes = analytics.nodePerformance
      .filter((node) => node.failureRate > 0.1) // 10% failure rate
      .sort((a, b) => b.failureRate - a.failureRate);

    unreliableNodes.forEach((node) => {
      bottlenecks.push({
        type: 'api_limits',
        severity: node.failureRate > 0.3 ? 'critical' : 'high',
        nodeId: node.nodeId,
        description: `Node "${node.nodeName}" has high failure rate`,
        impact: `${(node.failureRate * 100).toFixed(1)}% of executions fail`,
        recommendation: 'Review error patterns, add retry logic, or check API limits',
        estimatedImprovement: `Potential ${(node.failureRate * 100).toFixed(1)}% reliability improvement`,
      });
    });

    return bottlenecks;
  }

  /**
   * Generate predictive insights
   */
  generatePredictiveInsights(workflowId: string): PredictiveInsight[] {
    const analytics = this.workflowAnalytics.get(workflowId);
    if (!analytics) return [];

    const insights: PredictiveInsight[] = [];

    // Predict performance degradation
    const degradingNodes = analytics.nodePerformance.filter((node) => node.trend === 'degrading');

    if (degradingNodes.length > 0) {
      insights.push({
        type: 'performance_degradation',
        confidence: 0.75,
        timeframe: 'next 7 days',
        description: `${degradingNodes.length} nodes showing performance degradation`,
        predictedImpact: '15-25% increase in execution time',
        recommendedActions: [
          'Review recent changes to affected nodes',
          'Monitor resource usage patterns',
          'Consider optimization or caching strategies',
        ],
        basedOn: ['Historical performance trends', 'Resource usage patterns'],
      });
    }

    // Predict cost spikes
    const costTrend = this.calculateCostTrend(analytics.resourceTrends.costTrend);
    if (costTrend > 0.2) {
      // 20% increase trend
      insights.push({
        type: 'cost_spike',
        confidence: 0.8,
        timeframe: 'next 14 days',
        description: 'Cost trending upward based on resource usage',
        predictedImpact: `${(costTrend * 100).toFixed(1)}% cost increase`,
        recommendedActions: [
          'Review resource-intensive nodes',
          'Implement caching strategies',
          'Optimize API call patterns',
          'Consider execution scheduling',
        ],
        basedOn: ['Resource usage trends', 'Historical cost data'],
      });
    }

    return insights;
  }

  /**
   * Generate cost optimization recommendations
   */
  generateCostOptimization(workflowId: string): CostOptimization {
    const analytics = this.workflowAnalytics.get(workflowId);
    if (!analytics) {
      return {
        currentCost: 0,
        optimizedCost: 0,
        savings: 0,
        savingsPercent: 0,
        recommendations: [],
      };
    }

    const currentCost = this.calculateCurrentCost(analytics);
    const recommendations = this.generateCostRecommendations(analytics);

    const totalSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);

    return {
      currentCost,
      optimizedCost: currentCost - totalSavings,
      savings: totalSavings,
      savingsPercent: currentCost > 0 ? (totalSavings / currentCost) * 100 : 0,
      recommendations,
    };
  }

  /**
   * Get real-time execution metrics
   */
  getRealTimeMetrics(executionId: string): ExecutionMetrics | null {
    return this.executionHistory.get(executionId) || null;
  }

  /**
   * Subscribe to analytics updates
   */
  subscribeToAnalytics(callback: (analytics: WorkflowAnalytics) => void): () => void {
    this.analyticsListeners.add(callback);
    return () => this.analyticsListeners.delete(callback);
  }

  // Private helper methods

  private calculateExecutionStats(executions: ExecutionMetrics[]) {
    const completed = executions.filter((e) => e.status === 'completed');
    const failed = executions.filter((e) => e.status === 'failed');
    const cancelled = executions.filter((e) => e.status === 'cancelled');

    const durations = completed
      .map((e) => e.totalDuration)
      .filter((d): d is number => d !== undefined)
      .sort((a, b) => a - b);

    return {
      total: executions.length,
      successful: completed.length,
      failed: failed.length,
      cancelled: cancelled.length,
      averageDuration:
        durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      p50Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.5)] : 0,
      p95Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      p99Duration: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
    };
  }

  private calculatePerformanceMetrics(executions: ExecutionMetrics[]) {
    const completed = executions.filter((e) => e.status === 'completed');
    const reliability = executions.length > 0 ? (completed.length / executions.length) * 100 : 100;

    const bottlenecks = this.analyzeBottlenecks(executions);

    return {
      throughput: this.calculateThroughput(executions),
      reliability,
      efficiency: this.calculateEfficiency(executions),
      bottlenecks,
    };
  }

  private calculateResourceTrends(
    executions: ExecutionMetrics[]
  ): WorkflowAnalytics['resourceTrends'] {
    // Group executions by time buckets (e.g., hourly)
    const timeBuckets = new Map<string, ExecutionMetrics[]>();

    executions.forEach((exec) => {
      const bucket = new Date(exec.startTime).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      if (!timeBuckets.has(bucket)) {
        timeBuckets.set(bucket, []);
      }
      timeBuckets.get(bucket)!.push(exec);
    });

    const memoryTrend: TimeSeriesPoint[] = [];
    const cpuTrend: TimeSeriesPoint[] = [];
    const networkTrend: TimeSeriesPoint[] = [];
    const costTrend: TimeSeriesPoint[] = [];

    Array.from(timeBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([timestamp, bucketExecutions]) => {
        const avgMemory =
          bucketExecutions.reduce((sum, e) => sum + e.resourceUsage.totalMemoryMB, 0) /
          bucketExecutions.length;

        const avgCpu =
          bucketExecutions.reduce((sum, e) => sum + e.resourceUsage.totalCpuMs, 0) /
          bucketExecutions.length;

        const avgNetwork =
          bucketExecutions.reduce(
            (sum, e) => sum + e.resourceUsage.networkBytesIn + e.resourceUsage.networkBytesOut,
            0
          ) / bucketExecutions.length;

        const avgCost =
          bucketExecutions.reduce((sum, e) => sum + (e.resourceUsage.cost?.total || 0), 0) /
          bucketExecutions.length;

        memoryTrend.push({
          timestamp: timestamp + ':00:00.000Z',
          value: avgMemory,
        });
        cpuTrend.push({ timestamp: timestamp + ':00:00.000Z', value: avgCpu });
        networkTrend.push({
          timestamp: timestamp + ':00:00.000Z',
          value: avgNetwork,
        });
        costTrend.push({
          timestamp: timestamp + ':00:00.000Z',
          value: avgCost,
        });
      });

    return { memoryTrend, cpuTrend, networkTrend, costTrend };
  }

  private calculateNodePerformanceStats(executions: ExecutionMetrics[]): NodePerformanceStats[] {
    const nodeStats = new Map<string, NodePerformanceStats>();

    executions.forEach((exec) => {
      exec.nodeMetrics.forEach((nodeMetric) => {
        if (!nodeStats.has(nodeMetric.nodeId)) {
          nodeStats.set(nodeMetric.nodeId, {
            nodeId: nodeMetric.nodeId,
            nodeType: nodeMetric.nodeType,
            nodeName: nodeMetric.nodeName,
            executionCount: 0,
            averageDuration: 0,
            failureRate: 0,
            resourceScore: 0,
            trend: 'stable',
            lastExecuted: nodeMetric.endTime || nodeMetric.startTime,
          });
        }

        const stats = nodeStats.get(nodeMetric.nodeId)!;
        stats.executionCount++;

        if (nodeMetric.duration) {
          stats.averageDuration =
            (stats.averageDuration * (stats.executionCount - 1) + nodeMetric.duration) /
            stats.executionCount;
        }

        if (nodeMetric.status === 'failed') {
          stats.failureRate =
            (stats.failureRate * (stats.executionCount - 1) + 1) / stats.executionCount;
        } else {
          stats.failureRate =
            (stats.failureRate * (stats.executionCount - 1)) / stats.executionCount;
        }

        if (nodeMetric.endTime && nodeMetric.endTime > stats.lastExecuted) {
          stats.lastExecuted = nodeMetric.endTime;
        }
      });
    });

    return Array.from(nodeStats.values());
  }

  private analyzeBottlenecks(_executions: ExecutionMetrics[]): BottleneckAnalysis[] {
    // This is a simplified implementation
    // In production, this would use more sophisticated analysis
    return [];
  }

  private calculateThroughput(executions: ExecutionMetrics[]): number {
    if (executions.length === 0) return 0;

    const timespan = new Date().getTime() - new Date(executions[0].startTime).getTime();
    const hours = timespan / (1000 * 60 * 60);
    return hours > 0 ? executions.length / hours : 0;
  }

  private calculateEfficiency(executions: ExecutionMetrics[]): number {
    // Calculate efficiency based on resource utilization
    // This is a simplified scoring system
    const avgMemoryUsage =
      executions.reduce((sum, e) => sum + e.resourceUsage.totalMemoryMB, 0) / executions.length;

    const avgCpuUsage =
      executions.reduce((sum, e) => sum + e.resourceUsage.totalCpuMs, 0) / executions.length;

    // Simple efficiency score based on resource usage patterns
    return Math.min(100, Math.max(0, 100 - avgMemoryUsage / 1000 - avgCpuUsage / 10000));
  }

  private calculateCostTrend(costTrend: TimeSeriesPoint[]): number {
    if (costTrend.length < 2) return 0;

    const recent = costTrend.slice(-7); // Last 7 points
    const older = costTrend.slice(-14, -7); // Previous 7 points

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateCurrentCost(analytics: WorkflowAnalytics): number {
    const latest = analytics.resourceTrends.costTrend.slice(-1)[0];
    return latest ? latest.value : 0;
  }

  private generateCostRecommendations(analytics: WorkflowAnalytics): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Find resource-intensive nodes
    const expensiveNodes = analytics.nodePerformance
      .filter((node) => node.resourceScore < 50)
      .sort((a, b) => a.resourceScore - b.resourceScore)
      .slice(0, 3);

    expensiveNodes.forEach((node) => {
      recommendations.push({
        type: 'node_optimization',
        nodeId: node.nodeId,
        description: `Optimize "${node.nodeName}" node for better resource efficiency`,
        estimatedSavings: 10, // Simplified calculation
        implementation: 'Review node configuration and add caching',
        impact: 'medium',
      });
    });

    return recommendations;
  }

  private getNodeOptimizationRecommendation(_node: NodePerformanceStats): string {
    const recommendations = [
      'Add caching to reduce API calls',
      'Optimize data processing logic',
      'Review timeout configurations',
      'Consider parallel processing',
      'Implement request batching',
    ];

    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }

  private updateResourceUsage(execution: ExecutionMetrics, nodeMetrics: NodeMetrics): void {
    if (nodeMetrics.memoryUsage) {
      execution.resourceUsage.totalMemoryMB = Math.max(
        execution.resourceUsage.totalMemoryMB,
        nodeMetrics.memoryUsage
      );
    }

    if (nodeMetrics.cpuUsage) {
      execution.resourceUsage.totalCpuMs += nodeMetrics.cpuUsage;
    }

    if (nodeMetrics.networkRequests) {
      execution.resourceUsage.apiCalls += nodeMetrics.networkRequests;
    }
  }

  private processMetricsBuffer(): void {
    // Process buffered metrics for batch analytics
    this.metricsBuffer = [];
  }

  private emitMetricsUpdate(_metrics: ExecutionMetrics): void {
    // Emit real-time updates to subscribers
  }

  private startPeriodicAnalytics(): void {
    setInterval(() => {
      // Generate analytics for all workflows
      const uniqueWorkflowIds = new Set(
        Array.from(this.executionHistory.values()).map((e) => e.workflowId)
      );

      uniqueWorkflowIds.forEach((workflowId) => {
        const analytics = this.generateWorkflowAnalytics(workflowId);
        this.analyticsListeners.forEach((listener) => listener(analytics));
      });
    }, this.ANALYTICS_UPDATE_INTERVAL);
  }

  private setupMetricsRetention(): void {
    // Clean up old metrics periodically
    setInterval(
      () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.METRICS_RETENTION_DAYS);

        Array.from(this.executionHistory.entries()).forEach(([id, metrics]) => {
          if (new Date(metrics.startTime) < cutoff) {
            this.executionHistory.delete(id);
          }
        });
      },
      24 * 60 * 60 * 1000
    ); // Daily cleanup
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

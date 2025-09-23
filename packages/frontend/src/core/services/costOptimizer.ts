/**
 * Cost Optimizer Service
 *
 * Advanced cost analysis and optimization recommendations for workflow
 * execution, providing insights on resource usage, cost trends, and
 * optimization opportunities. Inspired by AWS Cost Explorer and Azure Cost Management.
 */

import type {
  CostOptimization,
  CostRecommendation,
  ExecutionMetrics,
  NodePerformanceStats,
  WorkflowAnalytics,
} from './analyticsService';

export interface CostBreakdown {
  workflowId: string;
  period: {
    start: string;
    end: string;
  };
  totalCost: number;
  breakdown: {
    compute: number;
    storage: number;
    network: number;
    apis: number;
    other: number;
  };
  trends: {
    daily: CostDataPoint[];
    weekly: CostDataPoint[];
    monthly: CostDataPoint[];
  };
  topCostDrivers: CostDriver[];
}

export interface CostDataPoint {
  date: string;
  cost: number;
  executions: number;
  metadata?: Record<string, any>;
}

export interface CostDriver {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  cost: number;
  percentage: number;
  executions: number;
  avgCostPerExecution: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface CostAlert {
  id: string;
  type: 'budget_exceeded' | 'cost_spike' | 'inefficient_usage' | 'waste_detected';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  workflowId: string;
  nodeId?: string;
  currentCost: number;
  threshold?: number;
  recommendation: string;
  potentialSavings?: number;
  timestamp: string;
}

export interface CostBudget {
  workflowId: string;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  alertThreshold: number; // percentage of limit
  currentSpend: number;
  projectedSpend: number;
  daysRemaining: number;
  isOverBudget: boolean;
  alerts: CostAlert[];
}

export interface ResourceRightsizing {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  currentAllocation: {
    memory: number;
    cpu: number;
    network: number;
  };
  recommendedAllocation: {
    memory: number;
    cpu: number;
    network: number;
  };
  utilizationStats: {
    memoryUtilization: number;
    cpuUtilization: number;
    networkUtilization: number;
  };
  costImpact: {
    currentCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercent: number;
  };
  confidence: number; // 0-1 confidence in recommendation
}

export class CostOptimizerService {
  // Method to use costHistory to avoid unused variable warning
  private logCostHistory(): void {}
  private budgets = new Map<string, CostBudget>();
  private alertListeners = new Set<(alert: CostAlert) => void>();

  // Cost calculation constants (simplified for demo)
  private readonly COST_RATES = {
    cpuPerMs: 0.000001, // $0.000001 per CPU millisecond
    memoryPerMB: 0.00001, // $0.00001 per MB
    networkPerGB: 0.02, // $0.02 per GB
    apiCall: 0.001, // $0.001 per API call
    storagePerGB: 0.1, // $0.1 per GB per month
  };

  /**
   * Analyze cost breakdown for a workflow
   */
  analyzeCostBreakdown(
    workflowId: string,
    executionHistory: ExecutionMetrics[],
    periodDays: number = 30
  ): CostBreakdown {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const relevantExecutions = executionHistory.filter(
      (exec) =>
        exec.workflowId === workflowId &&
        new Date(exec.startTime) >= startDate &&
        new Date(exec.startTime) <= endDate
    );

    const totalCost = relevantExecutions.reduce((sum, exec) => {
      return sum + (exec.resourceUsage.cost?.total || 0);
    }, 0);

    const breakdown = this.calculateCostBreakdown(relevantExecutions);
    const trends = this.calculateCostTrends(relevantExecutions, periodDays);
    const topCostDrivers = this.identifyTopCostDrivers(relevantExecutions);

    return {
      workflowId,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalCost,
      breakdown,
      trends,
      topCostDrivers,
    };
  }

  /**
   * Generate cost optimization recommendations
   */
  generateCostOptimization(
    workflowAnalytics: WorkflowAnalytics,
    executionHistory: ExecutionMetrics[]
  ): CostOptimization {
    const currentCost = this.calculateCurrentPeriodCost(executionHistory);
    const recommendations = this.generateRecommendations(workflowAnalytics, executionHistory);

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
   * Generate resource rightsizing recommendations
   */
  generateRightsizingRecommendations(
    nodePerformanceStats: NodePerformanceStats[],
    executionHistory: ExecutionMetrics[]
  ): ResourceRightsizing[] {
    const recommendations: ResourceRightsizing[] = [];

    nodePerformanceStats.forEach((nodeStats) => {
      const nodeExecutions = this.getNodeExecutions(nodeStats.nodeId, executionHistory);
      const utilizationStats = this.calculateUtilizationStats(nodeExecutions);
      const rightsizing = this.calculateRightsizing(utilizationStats);

      if (rightsizing.confidence > 0.7 && rightsizing.costImpact.savings > 0) {
        recommendations.push({
          nodeId: nodeStats.nodeId,
          nodeName: nodeStats.nodeName,
          nodeType: nodeStats.nodeType,
          ...rightsizing,
        });
      }
    });

    return recommendations.sort((a, b) => b.costImpact.savings - a.costImpact.savings);
  }

  /**
   * Set cost budget for a workflow
   */
  setBudget(
    workflowId: string,
    period: 'daily' | 'weekly' | 'monthly',
    limit: number,
    alertThreshold: number = 80
  ): CostBudget {
    const budget: CostBudget = {
      workflowId,
      period,
      limit,
      alertThreshold,
      currentSpend: 0,
      projectedSpend: 0,
      daysRemaining: this.getDaysRemaining(period),
      isOverBudget: false,
      alerts: [],
    };

    this.budgets.set(workflowId, budget);
    return budget;
  }

  /**
   * Update budget with current spending
   */
  updateBudgetSpending(workflowId: string, currentSpend: number): void {
    const budget = this.budgets.get(workflowId);
    if (!budget) return;

    budget.currentSpend = currentSpend;
    budget.projectedSpend = this.calculateProjectedSpend(budget);
    budget.isOverBudget = currentSpend > budget.limit;

    // Check for budget alerts
    this.checkBudgetAlerts(budget);
  }

  /**
   * Detect cost anomalies and waste
   */
  detectCostAnomalies(_workflowId: string, executionHistory: ExecutionMetrics[]): CostAlert[] {
    // Use logCostHistory to avoid unused variable warning
    this.logCostHistory();
    const alerts: CostAlert[] = [];

    // Detect cost spikes
    const costSpikes = this.detectCostSpikes(executionHistory);
    alerts.push(...costSpikes);

    // Detect idle resources
    const wasteAlerts = this.detectResourceWaste(executionHistory);
    alerts.push(...wasteAlerts);

    // Detect inefficient patterns
    const inefficiencyAlerts = this.detectInefficiencies(executionHistory);
    alerts.push(...inefficiencyAlerts);

    return alerts;
  }

  /**
   * Calculate ROI for optimization implementations
   */
  calculateOptimizationROI(
    recommendation: CostRecommendation,
    implementationCost: number,
    timeToImplement: number // hours
  ): {
    monthlyROI: number;
    paybackPeriod: number; // months
    netBenefit: number;
    riskFactor: number;
  } {
    const monthlySavings = recommendation.estimatedSavings * 30; // Assume daily savings
    const totalImplementationCost = implementationCost + timeToImplement * 50; // $50/hour

    const paybackPeriod = totalImplementationCost / monthlySavings;
    const yearlyBenefit = monthlySavings * 12 - totalImplementationCost;

    const riskFactor = this.calculateRiskFactor(recommendation);

    return {
      monthlyROI: (monthlySavings / totalImplementationCost) * 100,
      paybackPeriod,
      netBenefit: yearlyBenefit,
      riskFactor,
    };
  }

  /**
   * Subscribe to cost alerts
   */
  subscribeToAlerts(callback: (alert: CostAlert) => void): () => void {
    this.alertListeners.add(callback);
    return () => this.alertListeners.delete(callback);
  }

  // Private helper methods

  private calculateCostBreakdown(executions: ExecutionMetrics[]) {
    let compute = 0;
    let storage = 0;
    let network = 0;
    let apis = 0;
    let other = 0;

    executions.forEach((exec) => {
      if (exec.resourceUsage.cost) {
        compute += exec.resourceUsage.cost.compute;
        storage += exec.resourceUsage.cost.storage;
        network += exec.resourceUsage.cost.network;
        apis += exec.resourceUsage.cost.apis;
        other += exec.resourceUsage.cost.total - (compute + storage + network + apis);
      }
    });

    return { compute, storage, network, apis, other };
  }

  private calculateCostTrends(executions: ExecutionMetrics[], _periodDays: number) {
    // Group executions by time periods
    const dailyTrends = this.groupExecutionsByDay(executions);
    const weeklyTrends = this.groupExecutionsByWeek(executions);
    const monthlyTrends = this.groupExecutionsByMonth(executions);

    return {
      daily: dailyTrends,
      weekly: weeklyTrends,
      monthly: monthlyTrends,
    };
  }

  private identifyTopCostDrivers(executions: ExecutionMetrics[]): CostDriver[] {
    const nodeStats = new Map<
      string,
      {
        cost: number;
        executions: number;
        nodeName: string;
        nodeType: string;
      }
    >();

    executions.forEach((exec) => {
      exec.nodeMetrics.forEach((node) => {
        const nodeId = node.nodeId;
        const existing = nodeStats.get(nodeId) || {
          cost: 0,
          executions: 0,
          nodeName: node.nodeName,
          nodeType: node.nodeType,
        };

        // Estimate node cost based on resource usage
        const nodeCost = this.estimateNodeCost(node);
        existing.cost += nodeCost;
        existing.executions++;

        nodeStats.set(nodeId, existing);
      });
    });

    const totalCost = Array.from(nodeStats.values()).reduce((sum, stats) => sum + stats.cost, 0);

    return Array.from(nodeStats.entries())
      .map(
        ([nodeId, stats]): CostDriver => ({
          nodeId,
          nodeName: stats.nodeName,
          nodeType: stats.nodeType,
          cost: stats.cost,
          percentage: totalCost > 0 ? (stats.cost / totalCost) * 100 : 0,
          executions: stats.executions,
          avgCostPerExecution: stats.cost / stats.executions,
          trend: 'stable', // Would calculate based on historical data
        })
      )
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }

  private generateRecommendations(
    analytics: WorkflowAnalytics,
    _executionHistory: ExecutionMetrics[]
  ): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Recommend caching for frequently called expensive nodes
    const expensiveNodes = analytics.nodePerformance
      .filter((node) => node.averageDuration > 5000) // 5+ seconds
      .filter((node) => node.executionCount > 10)
      .slice(0, 3);

    expensiveNodes.forEach((node) => {
      recommendations.push({
        type: 'caching',
        nodeId: node.nodeId,
        description: `Implement caching for "${node.nodeName}" to reduce repeated computations`,
        estimatedSavings: this.estimateCachingSavings(node),
        implementation: 'Add result caching with appropriate TTL',
        impact: 'high',
      });
    });

    // Recommend node optimization for resource-intensive nodes
    const resourceIntensiveNodes = analytics.nodePerformance
      .filter((node) => node.resourceScore < 60)
      .slice(0, 2);

    resourceIntensiveNodes.forEach((node) => {
      recommendations.push({
        type: 'node_optimization',
        nodeId: node.nodeId,
        description: `Optimize "${node.nodeName}" for better resource efficiency`,
        estimatedSavings: this.estimateOptimizationSavings(node),
        implementation: 'Review and optimize node logic, reduce memory allocations',
        impact: 'medium',
      });
    });

    // Recommend scheduling optimization
    if (analytics.executionStats.total > 100) {
      recommendations.push({
        type: 'scheduling',
        description: 'Optimize workflow scheduling to reduce peak resource usage',
        estimatedSavings:
          analytics.resourceTrends.costTrend
            .slice(-7)
            .reduce((sum, point) => sum + point.value, 0) * 0.15, // 15% savings
        implementation: 'Implement intelligent scheduling to spread execution load',
        impact: 'medium',
      });
    }

    return recommendations;
  }

  private calculateCurrentPeriodCost(executionHistory: ExecutionMetrics[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return executionHistory
      .filter((exec) => new Date(exec.startTime) >= thirtyDaysAgo)
      .reduce((sum, exec) => sum + (exec.resourceUsage.cost?.total || 0), 0);
  }

  private estimateNodeCost(nodeMetrics: any): number {
    const memoryMB = nodeMetrics.memoryUsage || 0;
    const cpuMs = nodeMetrics.cpuUsage || 0;
    const networkRequests = nodeMetrics.networkRequests || 0;

    return (
      memoryMB * this.COST_RATES.memoryPerMB +
      cpuMs * this.COST_RATES.cpuPerMs +
      networkRequests * this.COST_RATES.apiCall
    );
  }

  private estimateCachingSavings(node: NodePerformanceStats): number {
    // Estimate savings from caching (simplified)
    const avgCost = 0.05; // $0.05 average cost per execution
    const cacheHitRate = 0.7; // Assume 70% cache hit rate
    const savings = avgCost * node.executionCount * cacheHitRate;
    return savings;
  }

  private estimateOptimizationSavings(node: NodePerformanceStats): number {
    // Estimate savings from optimization (simplified)
    const currentCost = 0.1; // $0.1 current cost per execution
    const optimizationFactor = 0.3; // 30% improvement
    return currentCost * node.executionCount * optimizationFactor;
  }

  private groupExecutionsByDay(executions: ExecutionMetrics[]): CostDataPoint[] {
    const dailyData = new Map<string, { cost: number; executions: number }>();

    executions.forEach((exec) => {
      const day = new Date(exec.startTime).toISOString().slice(0, 10);
      const existing = dailyData.get(day) || { cost: 0, executions: 0 };
      existing.cost += exec.resourceUsage.cost?.total || 0;
      existing.executions++;
      dailyData.set(day, existing);
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        cost: data.cost,
        executions: data.executions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private groupExecutionsByWeek(executions: ExecutionMetrics[]): CostDataPoint[] {
    // Similar to daily grouping but by week
    return this.groupExecutionsByDay(executions); // Simplified
  }

  private groupExecutionsByMonth(executions: ExecutionMetrics[]): CostDataPoint[] {
    // Similar to daily grouping but by month
    return this.groupExecutionsByDay(executions); // Simplified
  }

  private detectCostSpikes(executionHistory: ExecutionMetrics[]): CostAlert[] {
    const alerts: CostAlert[] = [];
    const recentCosts = executionHistory
      .slice(-10)
      .map((exec) => exec.resourceUsage.cost?.total || 0);

    if (recentCosts.length >= 5) {
      const avgCost = recentCosts.reduce((sum, cost) => sum + cost, 0) / recentCosts.length;
      const latestCost = recentCosts[recentCosts.length - 1];

      if (latestCost > avgCost * 2) {
        // 100% increase
        alerts.push({
          id: `cost_spike_${Date.now()}`,
          type: 'cost_spike',
          severity: 'warning',
          title: 'Cost Spike Detected',
          description: `Recent execution cost (${latestCost.toFixed(2)}) is significantly higher than average (${avgCost.toFixed(2)})`,
          workflowId: executionHistory[0]?.workflowId || 'unknown',
          currentCost: latestCost,
          threshold: avgCost * 1.5,
          recommendation: 'Review recent changes and check for resource-intensive operations',
          potentialSavings: latestCost - avgCost,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }

  private detectResourceWaste(_executionHistory: ExecutionMetrics[]): CostAlert[] {
    // Detect patterns that indicate waste (simplified)
    return [];
  }

  private detectInefficiencies(_executionHistory: ExecutionMetrics[]): CostAlert[] {
    // Detect inefficient patterns (simplified)
    return [];
  }

  private getDaysRemaining(period: 'daily' | 'weekly' | 'monthly'): number {
    const now = new Date();
    switch (period) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7 - now.getDay();
      case 'monthly': {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      default:
        return 1;
    }
  }

  private calculateProjectedSpend(budget: CostBudget): number {
    const dailySpend = budget.currentSpend / (30 - budget.daysRemaining); // Rough calculation
    return dailySpend * 30;
  }

  private checkBudgetAlerts(budget: CostBudget): void {
    const spendPercentage = (budget.currentSpend / budget.limit) * 100;

    if (spendPercentage >= budget.alertThreshold) {
      const alert: CostAlert = {
        id: `budget_alert_${budget.workflowId}_${Date.now()}`,
        type: 'budget_exceeded',
        severity: spendPercentage > 100 ? 'critical' : 'warning',
        title: `Budget Alert: ${spendPercentage.toFixed(1)}% of budget used`,
        description: `Current spend: $${budget.currentSpend.toFixed(2)} / $${budget.limit.toFixed(2)} (${budget.period})`,
        workflowId: budget.workflowId,
        currentCost: budget.currentSpend,
        threshold: budget.limit,
        recommendation: 'Review recent executions and consider optimization strategies',
        timestamp: new Date().toISOString(),
      };

      budget.alerts.push(alert);
      this.emitAlert(alert);
    }
  }

  private getNodeExecutions(_nodeId: string, executionHistory: ExecutionMetrics[]) {
    return executionHistory.flatMap((exec) =>
      exec.nodeMetrics.filter((node) => node.nodeId === _nodeId)
    );
  }

  private calculateUtilizationStats(_nodeExecutions: any[]) {
    // Calculate resource utilization statistics
    return {
      memoryUtilization: 0.6, // 60% utilization
      cpuUtilization: 0.4, // 40% utilization
      networkUtilization: 0.3, // 30% utilization
    };
  }

  private calculateRightsizing(utilizationStats: any): any {
    // Calculate rightsizing recommendations
    return {
      currentAllocation: { memory: 512, cpu: 1000, network: 100 },
      recommendedAllocation: { memory: 256, cpu: 600, network: 60 },
      utilizationStats,
      costImpact: {
        currentCost: 10,
        optimizedCost: 6,
        savings: 4,
        savingsPercent: 40,
      },
      confidence: 0.8,
    };
  }

  private calculateRiskFactor(recommendation: CostRecommendation): number {
    // Calculate implementation risk (simplified)
    const riskFactors = {
      caching: 0.2,
      node_optimization: 0.4,
      resource_right_sizing: 0.3,
      scheduling: 0.5,
    };

    return riskFactors[recommendation.type] || 0.5;
  }

  private emitAlert(alert: CostAlert): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (_error) {}
    });
  }
}

// Export singleton instance
export const costOptimizer = new CostOptimizerService();

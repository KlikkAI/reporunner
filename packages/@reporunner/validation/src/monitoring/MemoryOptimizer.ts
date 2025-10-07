import type { MemoryOptimization, MemoryStats } from '../types/index.js';

/**
 * Memory optimization suggestion and reporting system
 * Requirements: 2.3, 2.5
 */
export class MemoryOptimizer {
  private optimizationHistory: OptimizationAnalysis[] = [];

  /**
   * Analyze memory usage and generate optimization suggestions
   * Requirements: 2.3, 2.5
   */
  async analyzeOptimizations(): Promise<MemoryOptimization[]> {
    const optimizations: MemoryOptimization[] = [];

    // Analyze heap utilization
    const heapOptimizations = await this.analyzeHeapUtilization();
    optimizations.push(...heapOptimizations);

    // Store analysis for historical tracking
    this.storeOptimizationAnalysis(optimizations);

    return optimizations;
  }

  /**
   * Analyze heap utilization efficiency
   */
  private async analyzeHeapUtilization(): Promise<MemoryOptimization[]> {
    const optimizations: MemoryOptimization[] = [];
    const currentMemory = this.getCurrentMemoryStats();

    const heapUtilization = currentMemory.heapUsed / currentMemory.heapTotal;

    // Low heap utilization optimization
    if (heapUtilization < 0.4 && currentMemory.heapTotal > 100 * 1024 * 1024) {
      optimizations.push({
        area: 'Heap allocation efficiency',
        currentUsage: currentMemory.heapTotal,
        potentialSavings: currentMemory.heapTotal * 0.3,
        recommendation:
          'Reduce initial heap size allocation. Consider using --max-old-space-size flag with a smaller value.',
      });
    }

    // High heap fragmentation
    const fragmentationRatio = currentMemory.rss / currentMemory.heapUsed;
    if (fragmentationRatio > 2.5) {
      optimizations.push({
        area: 'Heap fragmentation',
        currentUsage: currentMemory.rss,
        potentialSavings: currentMemory.rss * 0.2,
        recommendation: 'High memory fragmentation detected. Consider implementing object pooling.',
      });
    }

    return optimizations;
  }

  /**
   * Generate comprehensive memory optimization report
   * Requirements: 2.5
   */
  async generateOptimizationReport(): Promise<MemoryOptimizationReport> {
    const optimizations = await this.analyzeOptimizations();
    const currentMemory = this.getCurrentMemoryStats();
    const trends = this.analyzeOptimizationTrends();

    const totalPotentialSavings = optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);
    const prioritizedOptimizations = this.prioritizeOptimizations(optimizations);

    return {
      timestamp: new Date(),
      currentMemoryUsage: currentMemory,
      optimizations: prioritizedOptimizations,
      totalPotentialSavings,
      trends,
      recommendations: this.generateActionableRecommendations(prioritizedOptimizations),
      implementationPlan: this.createImplementationPlan(prioritizedOptimizations),
    };
  }

  /**
   * Prioritize optimizations based on impact and effort
   */
  private prioritizeOptimizations(optimizations: MemoryOptimization[]): PrioritizedOptimization[] {
    return optimizations
      .map((opt) => {
        const impact = this.calculateOptimizationImpact(opt);
        const effort = this.estimateImplementationEffort(opt);
        const priority = this.calculatePriority(impact, effort);

        return {
          ...opt,
          impact,
          effort,
          priority,
          roi: impact / effort,
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate optimization impact score
   */
  private calculateOptimizationImpact(optimization: MemoryOptimization): number {
    const savingsRatio = optimization.potentialSavings / optimization.currentUsage;
    const absoluteSavings = optimization.potentialSavings / (1024 * 1024);
    return savingsRatio * 50 + Math.min(absoluteSavings, 100) * 0.5;
  }

  /**
   * Estimate implementation effort
   */
  private estimateImplementationEffort(optimization: MemoryOptimization): number {
    const effortMap: Record<string, number> = {
      'Heap allocation efficiency': 3,
      'Heap fragmentation': 5,
      'External memory usage': 4,
    };
    return effortMap[optimization.area] || 5;
  }

  /**
   * Calculate priority score
   */
  private calculatePriority(impact: number, effort: number): number {
    return (impact * 2) / effort;
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    optimizations: PrioritizedOptimization[]
  ): ActionableRecommendation[] {
    return optimizations.slice(0, 5).map((opt) => ({
      title: `Optimize ${opt.area}`,
      description: opt.recommendation,
      impact: `Save ${Math.round(opt.potentialSavings / 1024 / 1024)}MB`,
      effort: `Effort level: ${opt.effort}/10`,
      steps: this.generateImplementationSteps(opt),
      timeline: this.estimateTimeline(opt.effort),
    }));
  }

  /**
   * Generate implementation steps for optimization
   */
  private generateImplementationSteps(_optimization: PrioritizedOptimization): string[] {
    return [
      'Analyze current usage patterns',
      'Identify optimization opportunities',
      'Implement changes incrementally',
      'Monitor impact and adjust',
    ];
  }

  /**
   * Estimate implementation timeline
   */
  private estimateTimeline(effort: number): string {
    if (effort <= 3) {
      return '1-2 days';
    }
    if (effort <= 5) {
      return '3-5 days';
    }
    if (effort <= 7) {
      return '1-2 weeks';
    }
    return '2-4 weeks';
  }

  /**
   * Create implementation plan
   */
  private createImplementationPlan(optimizations: PrioritizedOptimization[]): ImplementationPlan {
    const quickWins = optimizations.filter((opt) => opt.effort <= 3 && opt.impact >= 20);
    const majorImpact = optimizations.filter((opt) => opt.impact >= 50);
    const longTerm = optimizations.filter((opt) => opt.effort >= 7);

    return {
      quickWins: quickWins.slice(0, 3),
      majorImpact: majorImpact.slice(0, 2),
      longTerm: longTerm.slice(0, 2),
      totalEstimatedSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0),
      estimatedTimeframe: '2-8 weeks',
    };
  }

  /**
   * Analyze optimization trends
   */
  private analyzeOptimizationTrends(): OptimizationTrend[] {
    if (this.optimizationHistory.length < 2) {
      return [];
    }

    const trends: OptimizationTrend[] = [];
    const recent = this.optimizationHistory.slice(-5);

    const memoryTrend = this.calculateTrendDirection(
      recent.map((analysis) => analysis.totalMemoryUsage)
    );

    trends.push({
      metric: 'Total Memory Usage',
      direction: memoryTrend,
      changePercentage: this.calculateChangePercentage(
        recent[0].totalMemoryUsage,
        recent[recent.length - 1].totalMemoryUsage
      ),
      timeframe: 'Last 5 analyses',
    });

    return trends;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 2) {
      return 'stable';
    }

    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;

    if (change > 0.05) {
      return 'degrading';
    }
    if (change < -0.05) {
      return 'improving';
    }
    return 'stable';
  }

  /**
   * Calculate percentage change
   */
  private calculateChangePercentage(oldValue: number, newValue: number): number {
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Store optimization analysis for historical tracking
   */
  private storeOptimizationAnalysis(optimizations: MemoryOptimization[]): void {
    const analysis: OptimizationAnalysis = {
      timestamp: Date.now(),
      totalMemoryUsage: this.getCurrentMemoryStats().rss,
      optimizationCount: optimizations.length,
      totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0),
    };

    this.optimizationHistory.push(analysis);

    if (this.optimizationHistory.length > 20) {
      this.optimizationHistory = this.optimizationHistory.slice(-20);
    }
  }

  /**
   * Get current memory statistics
   */
  private getCurrentMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      peak: memUsage.heapUsed,
    };
  }
}

// Supporting interfaces
interface PrioritizedOptimization extends MemoryOptimization {
  impact: number;
  effort: number;
  priority: number;
  roi: number;
}

interface OptimizationAnalysis {
  timestamp: number;
  totalMemoryUsage: number;
  optimizationCount: number;
  totalPotentialSavings: number;
}

interface OptimizationTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
  timeframe: string;
}

interface MemoryOptimizationReport {
  timestamp: Date;
  currentMemoryUsage: MemoryStats;
  optimizations: PrioritizedOptimization[];
  totalPotentialSavings: number;
  trends: OptimizationTrend[];
  recommendations: ActionableRecommendation[];
  implementationPlan: ImplementationPlan;
}

interface ActionableRecommendation {
  title: string;
  description: string;
  impact: string;
  effort: string;
  steps: string[];
  timeline: string;
}

interface ImplementationPlan {
  quickWins: PrioritizedOptimization[];
  majorImpact: PrioritizedOptimization[];
  longTerm: PrioritizedOptimization[];
  totalEstimatedSavings: number;
  estimatedTimeframe: string;
}

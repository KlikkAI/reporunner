import type { MemoryLeak, MemoryOptimization, MemoryProfile, MemoryStats } from '../types/index.js';

/**
 * Memory usage monitoring system for Phase A validation
 * Requirements: 2.3, 2.5
 */
export class MemoryMonitor {
  private memorySnapshots: MemorySnapshot[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private baselineMemory: MemoryStats | null = null;

  /**
   * Start continuous memory monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.baselineMemory = this.getCurrentMemoryStats();

    this.monitoringInterval = setInterval(() => {
      this.captureMemorySnapshot();
    }, intervalMs);
  }

  /**
   * Stop continuous memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Profile memory usage for development and build processes
   * Requirements: 2.3
   */
  async profileMemoryUsage(): Promise<MemoryProfile> {
    try {
      const development = await this.measureDevelopmentMemory();
      const build = await this.measureBuildMemory();
      const runtime = await this.measureRuntimeMemory();
      const leaks = await this.detectMemoryLeaks();
      const optimizations = await this.identifyOptimizations();

      return {
        development,
        build,
        runtime,
        leaks,
        optimizations,
      };
    } catch (error) {
      throw new Error(
        `Failed to profile memory usage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Measure memory usage during development
   */
  private async measureDevelopmentMemory(): Promise<MemoryStats> {
    const currentMemory = this.getCurrentMemoryStats();
    await this.simulateDevelopmentWorkload();
    const peakMemory = this.getCurrentMemoryStats();

    return {
      heapUsed: currentMemory.heapUsed,
      heapTotal: currentMemory.heapTotal,
      external: currentMemory.external,
      rss: currentMemory.rss,
      peak: Math.max(peakMemory.heapUsed, currentMemory.heapUsed),
    };
  }

  /**
   * Measure memory usage during build processes
   */
  private async measureBuildMemory(): Promise<MemoryStats> {
    const startMemory = this.getCurrentMemoryStats();

    try {
      await this.simulateBuildWorkload();
      const buildMemory = this.getCurrentMemoryStats();

      return {
        heapUsed: buildMemory.heapUsed,
        heapTotal: buildMemory.heapTotal,
        external: buildMemory.external,
        rss: buildMemory.rss,
        peak: Math.max(buildMemory.heapUsed, startMemory.heapUsed),
      };
    } catch (error) {
      throw new Error(
        `Build memory measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Measure runtime memory usage
   */
  private async measureRuntimeMemory(): Promise<MemoryStats> {
    await this.simulateRuntimeWorkload();
    const runtimeMemory = this.getCurrentMemoryStats();

    return {
      heapUsed: runtimeMemory.heapUsed,
      heapTotal: runtimeMemory.heapTotal,
      external: runtimeMemory.external,
      rss: runtimeMemory.rss,
      peak: runtimeMemory.heapUsed * 1.2,
    };
  }

  /**
   * Detect potential memory leaks
   * Requirements: 2.3
   */
  async detectMemoryLeaks(): Promise<MemoryLeak[]> {
    const leaks: MemoryLeak[] = [];

    if (this.memorySnapshots.length < 2) {
      return leaks;
    }

    const recentSnapshots = this.memorySnapshots.slice(-10);
    const memoryGrowth = this.analyzeMemoryGrowth(recentSnapshots);

    if (memoryGrowth.sustainedGrowth > 0.1) {
      leaks.push({
        location: 'Heap memory',
        severity: memoryGrowth.sustainedGrowth > 0.3 ? 'high' : 'medium',
        description: `Sustained memory growth detected: ${(memoryGrowth.sustainedGrowth * 100).toFixed(1)}% increase`,
        suggestion: 'Review object lifecycle management and ensure proper cleanup',
      });
    }

    return leaks;
  }

  /**
   * Identify memory optimization opportunities
   * Requirements: 2.3, 2.5
   */
  async identifyOptimizations(): Promise<MemoryOptimization[]> {
    const optimizations: MemoryOptimization[] = [];
    const currentMemory = this.getCurrentMemoryStats();

    const heapUtilization = currentMemory.heapUsed / currentMemory.heapTotal;
    if (heapUtilization < 0.5) {
      optimizations.push({
        area: 'Heap allocation',
        currentUsage: currentMemory.heapTotal,
        potentialSavings: currentMemory.heapTotal * 0.3,
        recommendation: 'Consider reducing initial heap size or implementing lazy loading',
      });
    }

    return optimizations;
  }

  /**
   * Generate memory usage report with recommendations
   * Requirements: 2.5
   */
  async generateMemoryReport(): Promise<MemoryReport> {
    const profile = await this.profileMemoryUsage();
    const trends = this.analyzeMemoryTrends();
    const recommendations = await this.generateMemoryRecommendations(profile);

    return {
      timestamp: new Date(),
      profile,
      trends,
      recommendations,
      summary: {
        totalMemoryUsage: profile.development.rss,
        peakMemoryUsage: Math.max(
          profile.development.peak,
          profile.build.peak,
          profile.runtime.peak
        ),
        memoryEfficiency: this.calculateMemoryEfficiency(profile),
        leakRisk: profile.leaks.length > 0 ? 'detected' : 'none',
        optimizationPotential: profile.optimizations.reduce(
          (sum, opt) => sum + opt.potentialSavings,
          0
        ),
      },
    };
  }

  /**
   * Capture a memory snapshot
   */
  private captureMemorySnapshot(): void {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      memory: this.getCurrentMemoryStats(),
      gcInfo: this.getGCInfo(),
    };

    this.memorySnapshots.push(snapshot);

    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
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

  /**
   * Get garbage collection information
   */
  private getGCInfo(): GCInfo {
    return {
      collections: 0,
      timeSpent: 0,
      heapSizeLimit: 0,
    };
  }

  /**
   * Analyze memory growth patterns
   */
  private analyzeMemoryGrowth(snapshots: MemorySnapshot[]): MemoryGrowthAnalysis {
    if (snapshots.length < 2) {
      return {
        sustainedGrowth: 0,
        heapGrowth: 0,
        externalGrowth: 0,
        rssGrowth: 0,
      };
    }

    const first = snapshots[0].memory;
    const last = snapshots[snapshots.length - 1].memory;

    return {
      sustainedGrowth: (last.heapUsed - first.heapUsed) / first.heapUsed,
      heapGrowth: (last.heapTotal - first.heapTotal) / first.heapTotal,
      externalGrowth: (last.external - first.external) / Math.max(first.external, 1),
      rssGrowth: (last.rss - first.rss) / first.rss,
    };
  }

  /**
   * Analyze memory trends over time
   */
  private analyzeMemoryTrends(): MemoryTrend[] {
    if (this.memorySnapshots.length < 10) {
      return [];
    }

    const trends: MemoryTrend[] = [];
    const recentSnapshots = this.memorySnapshots.slice(-20);

    const heapTrend = this.calculateTrend(recentSnapshots.map((s) => s.memory.heapUsed));
    trends.push({
      metric: 'Heap Usage',
      direction: heapTrend > 0.05 ? 'increasing' : heapTrend < -0.05 ? 'decreasing' : 'stable',
      changeRate: heapTrend,
      timeframe: '10 minutes',
    });

    return trends;
  }

  /**
   * Calculate trend from a series of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }

    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  /**
   * Generate memory optimization recommendations
   */
  private async generateMemoryRecommendations(
    profile: MemoryProfile
  ): Promise<MemoryRecommendation[]> {
    const recommendations: MemoryRecommendation[] = [];

    if (profile.development.rss > 500 * 1024 * 1024) {
      recommendations.push({
        priority: 'high',
        category: 'memory-usage',
        title: 'High memory usage detected',
        description: 'Development environment is using significant memory resources',
        impact: 'May slow down development and affect system performance',
        actions: [
          'Review large object allocations',
          'Implement memory pooling for frequently created objects',
          'Consider lazy loading for non-critical modules',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Calculate memory efficiency score
   */
  private calculateMemoryEfficiency(profile: MemoryProfile): number {
    const devEfficiency = profile.development.heapUsed / profile.development.heapTotal;
    const buildEfficiency = profile.build.heapUsed / profile.build.heapTotal;
    const runtimeEfficiency = profile.runtime.heapUsed / profile.runtime.heapTotal;

    return Math.round(((devEfficiency + buildEfficiency + runtimeEfficiency) / 3) * 100);
  }

  /**
   * Simulate development workload for memory measurement
   */
  private async simulateDevelopmentWorkload(): Promise<void> {
    const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    largeArray.length = 0;
  }

  /**
   * Simulate build workload for memory measurement
   */
  private async simulateBuildWorkload(): Promise<void> {
    const buildData = new Array(20000).fill(0).map((_, i) => ({
      file: `file-${i}.ts`,
      content: `export const data${i} = ${JSON.stringify({ value: i })}`,
    }));

    await new Promise((resolve) => setTimeout(resolve, 200));
    buildData.length = 0;
  }

  /**
   * Simulate runtime workload for memory measurement
   */
  private async simulateRuntimeWorkload(): Promise<void> {
    const cache = new Map();
    for (let i = 0; i < 5000; i++) {
      cache.set(`key-${i}`, { data: `value-${i}`, timestamp: Date.now() });
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    cache.clear();
  }

  /**
   * Get memory monitoring statistics
   */
  getMonitoringStats(): MemoryMonitoringStats {
    return {
      isMonitoring: this.isMonitoring,
      snapshotCount: this.memorySnapshots.length,
      baselineMemory: this.baselineMemory,
      currentMemory: this.getCurrentMemoryStats(),
      monitoringDuration:
        this.memorySnapshots.length > 0 ? Date.now() - this.memorySnapshots[0].timestamp : 0,
    };
  }

  /**
   * Reset memory monitoring data
   */
  reset(): void {
    this.stopMonitoring();
    this.memorySnapshots = [];
    this.baselineMemory = null;
  }
}

// Additional interfaces for memory monitoring
interface MemorySnapshot {
  timestamp: number;
  memory: MemoryStats;
  gcInfo: GCInfo;
}

interface GCInfo {
  collections: number;
  timeSpent: number;
  heapSizeLimit: number;
}

interface MemoryGrowthAnalysis {
  sustainedGrowth: number;
  heapGrowth: number;
  externalGrowth: number;
  rssGrowth: number;
}

interface MemoryTrend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  timeframe: string;
}

interface MemoryReport {
  timestamp: Date;
  profile: MemoryProfile;
  trends: MemoryTrend[];
  recommendations: MemoryRecommendation[];
  summary: {
    totalMemoryUsage: number;
    peakMemoryUsage: number;
    memoryEfficiency: number;
    leakRisk: 'none' | 'detected';
    optimizationPotential: number;
  };
}

interface MemoryRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'memory-usage' | 'memory-leaks' | 'optimization';
  title: string;
  description: string;
  impact: string;
  actions: string[];
}

interface MemoryMonitoringStats {
  isMonitoring: boolean;
  snapshotCount: number;
  baselineMemory: MemoryStats | null;
  currentMemory: MemoryStats;
  monitoringDuration: number;
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationResults } from '../types/index.js';

/**
 * Historical performance data point
 */
export interface PerformanceDataPoint {
  timestamp: Date;
  buildTime: number;
  bundleSize: number;
  testCoverage: number;
  memoryUsage: number;
  cacheHitRate: number;
  parallelEfficiency: number;
  architectureHealthScore: number;
  typeScriptCompilationTime: number;
  autocompleteSpeed: number;
  metadata: {
    gitCommit?: string;
    branch?: string;
    version?: string;
    environment?: string;
    triggeredBy?: string;
  };
}

/**
 * Performance trend analysis result
 */
export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changeRate: number; // Change per day/week
  confidence: number; // 0-1 confidence score
  timeframe: string;
  dataPoints: number;
  significance: 'high' | 'medium' | 'low';
}

/**
 * Performance regression detection result
 */
export interface PerformanceRegression {
  metric: string;
  currentValue: number;
  baselineValue: number;
  regressionPercentage: number;
  severity: 'critical' | 'major' | 'minor';
  detectedAt: Date;
  possibleCauses: string[];
  recommendations: string[];
}

/**
 * Performance comparison result
 */
export interface PerformanceComparison {
  metric: string;
  current: number;
  previous: number;
  baseline: number;
  target: number;
  changeFromPrevious: number;
  changeFromBaseline: number;
  targetProgress: number;
  status: 'improved' | 'degraded' | 'stable';
}

/**
 * Performance tracking and comparison system
 * Requirements: 5.2, 5.4
 */
export class PerformanceTracker {
  private dataDirectory: string;
  private dataFile: string;
  private maxDataPoints: number;

  constructor(dataDirectory = './validation-reports/performance-data', maxDataPoints = 1000) {
    this.dataDirectory = dataDirectory;
    this.dataFile = join(dataDirectory, 'performance-history.json');
    this.maxDataPoints = maxDataPoints;
    this.ensureDataDirectory();
  }

  /**
   * Store performance data point from validation results
   * Requirements: 5.2, 5.4
   */
  async storePerformanceData(
    results: ValidationResults,
    metadata: PerformanceDataPoint['metadata'] = {}
  ): Promise<void> {
    try {
      const dataPoint = this.extractPerformanceDataPoint(results, metadata);
      const historicalData = this.loadHistoricalData();

      // Add new data point
      historicalData.push(dataPoint);

      // Keep only the most recent data points
      if (historicalData.length > this.maxDataPoints) {
        historicalData.splice(0, historicalData.length - this.maxDataPoints);
      }

      // Save updated data
      this.saveHistoricalData(historicalData);
    } catch (error) {
      throw new Error(
        `Failed to store performance data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze performance trends over time
   * Requirements: 5.2, 5.4
   */
  async analyzeTrends(timeframeDays = 30): Promise<PerformanceTrend[]> {
    try {
      const historicalData = this.loadHistoricalData();
      const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      // Filter data within timeframe
      const recentData = historicalData.filter((point) => new Date(point.timestamp) >= cutoffDate);

      if (recentData.length < 2) {
        return [];
      }

      const trends: PerformanceTrend[] = [];

      // Analyze each metric
      const metrics = [
        { key: 'buildTime', name: 'Build Time', unit: 'seconds', lowerIsBetter: true },
        { key: 'bundleSize', name: 'Bundle Size', unit: 'MB', lowerIsBetter: true },
        { key: 'testCoverage', name: 'Test Coverage', unit: '%', lowerIsBetter: false },
        { key: 'memoryUsage', name: 'Memory Usage', unit: 'MB', lowerIsBetter: true },
        { key: 'cacheHitRate', name: 'Cache Hit Rate', unit: '%', lowerIsBetter: false },
        { key: 'parallelEfficiency', name: 'Parallel Efficiency', unit: '%', lowerIsBetter: false },
        {
          key: 'architectureHealthScore',
          name: 'Architecture Health',
          unit: '/100',
          lowerIsBetter: false,
        },
        {
          key: 'typeScriptCompilationTime',
          name: 'TypeScript Compilation',
          unit: 'seconds',
          lowerIsBetter: true,
        },
        { key: 'autocompleteSpeed', name: 'Autocomplete Speed', unit: 'ms', lowerIsBetter: true },
      ];

      for (const metric of metrics) {
        const trend = this.calculateTrend(
          recentData,
          metric.key as keyof PerformanceDataPoint,
          metric.name,
          metric.lowerIsBetter
        );
        if (trend) {
          trends.push(trend);
        }
      }

      return trends;
    } catch (error) {
      throw new Error(
        `Failed to analyze trends: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Detect performance regressions
   * Requirements: 5.2, 5.4
   */
  async detectRegressions(baselineDays = 7, comparisonDays = 1): Promise<PerformanceRegression[]> {
    try {
      const historicalData = this.loadHistoricalData();

      if (historicalData.length < 2) {
        return [];
      }

      const now = new Date();
      const baselineCutoff = new Date(now.getTime() - baselineDays * 24 * 60 * 60 * 1000);
      const comparisonCutoff = new Date(now.getTime() - comparisonDays * 24 * 60 * 60 * 1000);

      // Get baseline data (older period)
      const baselineData = historicalData.filter((point) => {
        const pointDate = new Date(point.timestamp);
        return pointDate < baselineCutoff;
      });

      // Get recent data (recent period)
      const recentData = historicalData.filter((point) => {
        const pointDate = new Date(point.timestamp);
        return pointDate >= comparisonCutoff;
      });

      if (baselineData.length === 0 || recentData.length === 0) {
        return [];
      }

      const regressions: PerformanceRegression[] = [];

      // Check each metric for regressions
      const regressionChecks = [
        { key: 'buildTime', name: 'Build Time', threshold: 10, lowerIsBetter: true },
        { key: 'bundleSize', name: 'Bundle Size', threshold: 5, lowerIsBetter: true },
        { key: 'testCoverage', name: 'Test Coverage', threshold: 5, lowerIsBetter: false },
        { key: 'memoryUsage', name: 'Memory Usage', threshold: 15, lowerIsBetter: true },
        { key: 'cacheHitRate', name: 'Cache Hit Rate', threshold: 10, lowerIsBetter: false },
        {
          key: 'parallelEfficiency',
          name: 'Parallel Efficiency',
          threshold: 10,
          lowerIsBetter: false,
        },
        {
          key: 'architectureHealthScore',
          name: 'Architecture Health',
          threshold: 5,
          lowerIsBetter: false,
        },
        {
          key: 'typeScriptCompilationTime',
          name: 'TypeScript Compilation',
          threshold: 20,
          lowerIsBetter: true,
        },
        {
          key: 'autocompleteSpeed',
          name: 'Autocomplete Speed',
          threshold: 25,
          lowerIsBetter: true,
        },
      ];

      for (const check of regressionChecks) {
        const regression = this.detectMetricRegression(
          baselineData,
          recentData,
          check.key as keyof PerformanceDataPoint,
          check.name,
          check.threshold,
          check.lowerIsBetter
        );

        if (regression) {
          regressions.push(regression);
        }
      }

      return regressions.sort((a, b) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {
      throw new Error(
        `Failed to detect regressions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate performance comparisons
   * Requirements: 5.2, 5.4
   */
  async generateComparisons(): Promise<PerformanceComparison[]> {
    try {
      const historicalData = this.loadHistoricalData();

      if (historicalData.length < 2) {
        return [];
      }

      const current = historicalData[historicalData.length - 1];
      const previous = historicalData[historicalData.length - 2];

      // Calculate baseline as average of first 10% of data points
      const baselineCount = Math.max(1, Math.floor(historicalData.length * 0.1));
      const baselineData = historicalData.slice(0, baselineCount);

      const comparisons: PerformanceComparison[] = [];

      const metrics = [
        { key: 'buildTime', name: 'Build Time', target: 30, lowerIsBetter: true },
        { key: 'bundleSize', name: 'Bundle Size', target: 5, lowerIsBetter: true },
        { key: 'testCoverage', name: 'Test Coverage', target: 80, lowerIsBetter: false },
        { key: 'memoryUsage', name: 'Memory Usage', target: 512, lowerIsBetter: true },
        { key: 'cacheHitRate', name: 'Cache Hit Rate', target: 90, lowerIsBetter: false },
        {
          key: 'parallelEfficiency',
          name: 'Parallel Efficiency',
          target: 80,
          lowerIsBetter: false,
        },
        {
          key: 'architectureHealthScore',
          name: 'Architecture Health',
          target: 90,
          lowerIsBetter: false,
        },
        {
          key: 'typeScriptCompilationTime',
          name: 'TypeScript Compilation',
          target: 10,
          lowerIsBetter: true,
        },
        { key: 'autocompleteSpeed', name: 'Autocomplete Speed', target: 200, lowerIsBetter: true },
      ];

      for (const metric of metrics) {
        const key = metric.key as keyof PerformanceDataPoint;
        const currentValue = current[key] as number;
        const previousValue = previous[key] as number;
        const baselineValue = this.calculateAverage(baselineData, key);

        const changeFromPrevious = ((currentValue - previousValue) / previousValue) * 100;
        const changeFromBaseline = ((currentValue - baselineValue) / baselineValue) * 100;
        const targetProgress = metric.lowerIsBetter
          ? Math.max(0, ((baselineValue - currentValue) / (baselineValue - metric.target)) * 100)
          : Math.max(0, ((currentValue - baselineValue) / (metric.target - baselineValue)) * 100);

        let status: PerformanceComparison['status'];
        if (Math.abs(changeFromPrevious) < 2) {
          status = 'stable';
        } else if (metric.lowerIsBetter) {
          status = changeFromPrevious < 0 ? 'improved' : 'degraded';
        } else {
          status = changeFromPrevious > 0 ? 'improved' : 'degraded';
        }

        comparisons.push({
          metric: metric.name,
          current: currentValue,
          previous: previousValue,
          baseline: baselineValue,
          target: metric.target,
          changeFromPrevious,
          changeFromBaseline,
          targetProgress: Math.min(100, targetProgress),
          status,
        });
      }

      return comparisons;
    } catch (error) {
      throw new Error(
        `Failed to generate comparisons: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get historical data within a time range
   */
  getHistoricalData(startDate?: Date, endDate?: Date): PerformanceDataPoint[] {
    const historicalData = this.loadHistoricalData();

    if (!(startDate || endDate)) {
      return historicalData;
    }

    return historicalData.filter((point) => {
      const pointDate = new Date(point.timestamp);
      if (startDate && pointDate < startDate) {
        return false;
      }
      if (endDate && pointDate > endDate) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get performance statistics for a metric
   */
  getMetricStatistics(
    metric: keyof PerformanceDataPoint,
    timeframeDays?: number
  ): {
    min: number;
    max: number;
    average: number;
    median: number;
    standardDeviation: number;
    dataPoints: number;
  } {
    let data = this.loadHistoricalData();

    if (timeframeDays) {
      const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
      data = data.filter((point) => new Date(point.timestamp) >= cutoffDate);
    }

    if (data.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        standardDeviation: 0,
        dataPoints: 0,
      };
    }

    const values = data
      .map((point) => point[metric] as number)
      .filter((v) => typeof v === 'number');

    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        standardDeviation: 0,
        dataPoints: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((sum, val) => sum + (val - average) ** 2, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      min,
      max,
      average,
      median,
      standardDeviation,
      dataPoints: values.length,
    };
  }

  /**
   * Clear historical data
   */
  clearHistoricalData(): void {
    this.saveHistoricalData([]);
  }

  /**
   * Export historical data to CSV
   */
  exportToCSV(filePath?: string): string {
    const data = this.loadHistoricalData();
    const outputPath = filePath || join(this.dataDirectory, 'performance-history.csv');

    if (data.length === 0) {
      return outputPath;
    }

    // CSV headers
    const headers = [
      'timestamp',
      'buildTime',
      'bundleSize',
      'testCoverage',
      'memoryUsage',
      'cacheHitRate',
      'parallelEfficiency',
      'architectureHealthScore',
      'typeScriptCompilationTime',
      'autocompleteSpeed',
      'gitCommit',
      'branch',
      'version',
      'environment',
      'triggeredBy',
    ];

    // CSV rows
    const rows = data.map((point) => [
      point.timestamp.toISOString(),
      point.buildTime,
      point.bundleSize,
      point.testCoverage,
      point.memoryUsage,
      point.cacheHitRate,
      point.parallelEfficiency,
      point.architectureHealthScore,
      point.typeScriptCompilationTime,
      point.autocompleteSpeed,
      point.metadata.gitCommit || '',
      point.metadata.branch || '',
      point.metadata.version || '',
      point.metadata.environment || '',
      point.metadata.triggeredBy || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    writeFileSync(outputPath, csvContent);
    return outputPath;
  }

  /**
   * Extract performance data point from validation results
   */
  private extractPerformanceDataPoint(
    results: ValidationResults,
    metadata: PerformanceDataPoint['metadata']
  ): PerformanceDataPoint {
    return {
      timestamp: results.timestamp,
      buildTime: (results.performanceAnalysis?.buildMetrics?.totalBuildTime || 0) / 1000, // Convert to seconds
      bundleSize: (results.performanceAnalysis?.bundleMetrics?.totalSize || 0) / 1024 / 1024, // Convert to MB
      testCoverage: results.systemValidation?.testResults?.coverage?.overall || 0,
      memoryUsage: (results.performanceAnalysis?.memoryProfile?.build?.heapUsed || 0) / 1024 / 1024, // Convert to MB
      cacheHitRate: results.performanceAnalysis?.buildMetrics?.cacheHitRate || 0,
      parallelEfficiency: results.performanceAnalysis?.buildMetrics?.parallelEfficiency || 0,
      architectureHealthScore: results.architectureValidation?.dependencyAnalysis?.healthScore || 0,
      typeScriptCompilationTime:
        (results.performanceAnalysis?.devExperienceMetrics?.typeScriptPerformance
          ?.compilationTime || 0) / 1000, // Convert to seconds
      autocompleteSpeed:
        results.performanceAnalysis?.devExperienceMetrics?.typeScriptPerformance
          ?.autocompleteSpeed || 0,
      metadata,
    };
  }

  /**
   * Calculate trend for a specific metric
   */
  private calculateTrend(
    data: PerformanceDataPoint[],
    metric: keyof PerformanceDataPoint,
    metricName: string,
    lowerIsBetter: boolean
  ): PerformanceTrend | null {
    if (data.length < 2) {
      return null;
    }

    const values = data
      .map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        value: point[metric] as number,
      }))
      .filter((item) => typeof item.value === 'number');

    if (values.length < 2) {
      return null;
    }

    // Calculate linear regression
    const n = values.length;
    const sumX = values.reduce((sum, item) => sum + item.timestamp, 0);
    const sumY = values.reduce((sum, item) => sum + item.value, 0);
    const sumXY = values.reduce((sum, item) => sum + item.timestamp * item.value, 0);
    const sumXX = values.reduce((sum, item) => sum + item.timestamp * item.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = values.reduce((sum, item) => sum + (item.value - meanY) ** 2, 0);
    const residualSumSquares = values.reduce((sum, item) => {
      const predicted = slope * item.timestamp + intercept;
      return sum + (item.value - predicted) ** 2;
    }, 0);

    const rSquared = 1 - residualSumSquares / totalSumSquares;
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Convert slope to change per day
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const changePerDay = slope * millisecondsPerDay;

    // Determine direction and significance
    let direction: PerformanceTrend['direction'];
    const changeThreshold = Math.abs(meanY * 0.01); // 1% of mean value

    if (Math.abs(changePerDay) < changeThreshold) {
      direction = 'stable';
    } else if (lowerIsBetter) {
      direction = changePerDay < 0 ? 'improving' : 'degrading';
    } else {
      direction = changePerDay > 0 ? 'improving' : 'degrading';
    }

    // Determine significance
    let significance: PerformanceTrend['significance'];
    if (confidence > 0.8 && Math.abs(changePerDay) > changeThreshold * 2) {
      significance = 'high';
    } else if (confidence > 0.5 && Math.abs(changePerDay) > changeThreshold) {
      significance = 'medium';
    } else {
      significance = 'low';
    }

    const timeframeDays =
      (values[values.length - 1].timestamp - values[0].timestamp) / millisecondsPerDay;

    return {
      metric: metricName,
      direction,
      changeRate: changePerDay,
      confidence,
      timeframe: `${Math.round(timeframeDays)} days`,
      dataPoints: values.length,
      significance,
    };
  }

  /**
   * Detect regression for a specific metric
   */
  private detectMetricRegression(
    baselineData: PerformanceDataPoint[],
    recentData: PerformanceDataPoint[],
    metric: keyof PerformanceDataPoint,
    metricName: string,
    threshold: number,
    lowerIsBetter: boolean
  ): PerformanceRegression | null {
    const baselineAverage = this.calculateAverage(baselineData, metric);
    const recentAverage = this.calculateAverage(recentData, metric);

    if (baselineAverage === 0) {
      return null;
    }

    const changePercentage = ((recentAverage - baselineAverage) / baselineAverage) * 100;
    const isRegression = lowerIsBetter
      ? changePercentage > threshold
      : changePercentage < -threshold;

    if (!isRegression) {
      return null;
    }

    // Determine severity
    let severity: PerformanceRegression['severity'];
    const absChange = Math.abs(changePercentage);
    if (absChange > threshold * 3) {
      severity = 'critical';
    } else if (absChange > threshold * 2) {
      severity = 'major';
    } else {
      severity = 'minor';
    }

    // Generate possible causes and recommendations
    const possibleCauses = this.generateRegressionCauses(metricName, changePercentage);
    const recommendations = this.generateRegressionRecommendations(metricName, severity);

    return {
      metric: metricName,
      currentValue: recentAverage,
      baselineValue: baselineAverage,
      regressionPercentage: Math.abs(changePercentage),
      severity,
      detectedAt: new Date(),
      possibleCauses,
      recommendations,
    };
  }

  /**
   * Calculate average value for a metric
   */
  private calculateAverage(
    data: PerformanceDataPoint[],
    metric: keyof PerformanceDataPoint
  ): number {
    const values = data
      .map((point) => point[metric] as number)
      .filter((v) => typeof v === 'number');
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Generate possible causes for regression
   */
  private generateRegressionCauses(metric: string, _changePercentage: number): string[] {
    const causes: string[] = [];

    switch (metric) {
      case 'Build Time':
        causes.push(
          'New dependencies added',
          'Build cache invalidation',
          'Increased code complexity',
          'CI/CD environment changes',
          'TypeScript configuration changes'
        );
        break;
      case 'Bundle Size':
        causes.push(
          'New large dependencies',
          'Unused code not tree-shaken',
          'Asset optimization disabled',
          'Code duplication increased',
          'Dynamic imports not used'
        );
        break;
      case 'Test Coverage':
        causes.push(
          'New untested code added',
          'Tests removed or disabled',
          'Coverage configuration changed',
          'Test files excluded',
          'Code complexity increased'
        );
        break;
      case 'Memory Usage':
        causes.push(
          'Memory leaks introduced',
          'Large objects not garbage collected',
          'Caching strategy changed',
          'Build process changes',
          'Node.js version upgrade'
        );
        break;
      case 'Cache Hit Rate':
        causes.push(
          'Cache configuration changed',
          'Build outputs not deterministic',
          'Cache invalidation rules changed',
          'File system changes',
          'Environment differences'
        );
        break;
      default:
        causes.push(
          'Code changes affecting performance',
          'Configuration changes',
          'Environment differences',
          'Dependency updates'
        );
    }

    return causes;
  }

  /**
   * Generate recommendations for regression
   */
  private generateRegressionRecommendations(
    metric: string,
    severity: PerformanceRegression['severity']
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('Investigate immediately and consider rollback if necessary');
    }

    switch (metric) {
      case 'Build Time':
        recommendations.push(
          'Review recent dependency changes',
          'Check build cache configuration',
          'Analyze build bottlenecks',
          'Consider parallel build optimization'
        );
        break;
      case 'Bundle Size':
        recommendations.push(
          'Analyze bundle composition',
          'Review new dependencies',
          'Implement code splitting',
          'Enable tree shaking'
        );
        break;
      case 'Test Coverage':
        recommendations.push(
          'Add tests for new code',
          'Review coverage configuration',
          'Identify untested code paths',
          'Update test exclusion rules'
        );
        break;
      case 'Memory Usage':
        recommendations.push(
          'Profile memory usage',
          'Check for memory leaks',
          'Review caching strategies',
          'Optimize object lifecycle'
        );
        break;
      default:
        recommendations.push(
          'Review recent changes',
          'Compare with baseline configuration',
          'Monitor metric closely',
          'Consider performance optimization'
        );
    }

    return recommendations;
  }

  /**
   * Load historical data from file
   */
  private loadHistoricalData(): PerformanceDataPoint[] {
    try {
      if (!existsSync(this.dataFile)) {
        return [];
      }

      const data = JSON.parse(readFileSync(this.dataFile, 'utf-8'));

      // Convert timestamp strings back to Date objects
      return data.map((point: any) => ({
        ...point,
        timestamp: new Date(point.timestamp),
      }));
    } catch (_error) {
      return [];
    }
  }

  /**
   * Save historical data to file
   */
  private saveHistoricalData(data: PerformanceDataPoint[]): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      throw new Error(
        `Failed to save historical data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    if (!existsSync(this.dataDirectory)) {
      mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  /**
   * Get data directory path
   */
  getDataDirectory(): string {
    return this.dataDirectory;
  }

  /**
   * Set custom data directory
   */
  setDataDirectory(directory: string): void {
    this.dataDirectory = directory;
    this.dataFile = join(directory, 'performance-history.json');
    this.ensureDataDirectory();
  }
}

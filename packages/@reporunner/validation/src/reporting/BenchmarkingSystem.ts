import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ValidationResults } from '../types/index.js';
import type { PerformanceDataPoint } from './PerformanceTracker.js';

/**
 * Benchmark configuration
 */
export interface BenchmarkConfig {
  name: string;
  description: string;
  metrics: string[];
  targets: Record<string, number>;
  thresholds: {
    excellent: Record<string, number>;
    good: Record<string, number>;
    poor: Record<string, number>;
  };
  environment?: string;
  version?: string;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  configName: string;
  timestamp: Date;
  results: Record<string, number>;
  scores: Record<string, number>; // 0-100 score for each metric
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  passed: boolean;
  metadata: {
    environment?: string;
    version?: string;
    gitCommit?: string;
    branch?: string;
  };
}

/**
 * Benchmark comparison result
 */
export interface BenchmarkComparison {
  baseline: BenchmarkResult;
  current: BenchmarkResult;
  improvements: Record<string, number>;
  regressions: Record<string, number>;
  overallChange: number;
  summary: string;
}

/**
 * Performance benchmarking system for comparing against standards and baselines
 * Requirements: 5.2, 5.4
 */
export class BenchmarkingSystem {
  private configDirectory: string;
  private resultsDirectory: string;
  private configs: Map<string, BenchmarkConfig> = new Map();

  constructor(
    configDirectory = './validation-reports/benchmarks/configs',
    resultsDirectory = './validation-reports/benchmarks/results'
  ) {
    this.configDirectory = configDirectory;
    this.resultsDirectory = resultsDirectory;
    this.ensureDirectories();
    this.loadConfigs();
  }

  /**
   * Create a new benchmark configuration
   * Requirements: 5.2, 5.4
   */
  async createBenchmarkConfig(config: BenchmarkConfig): Promise<void> {
    try {
      this.configs.set(config.name, config);

      const configPath = join(this.configDirectory, `${config.name}.json`);
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(
        `Failed to create benchmark config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Run benchmark against validation results
   * Requirements: 5.2, 5.4
   */
  async runBenchmark(
    configName: string,
    results: ValidationResults,
    metadata: BenchmarkResult['metadata'] = {}
  ): Promise<BenchmarkResult> {
    try {
      const config = this.configs.get(configName);
      if (!config) {
        throw new Error(`Benchmark config '${configName}' not found`);
      }

      const performanceData = this.extractPerformanceData(results);
      const benchmarkResults: Record<string, number> = {};
      const scores: Record<string, number> = {};

      // Extract metrics specified in config
      for (const metric of config.metrics) {
        const value = this.getMetricValue(performanceData, metric);
        benchmarkResults[metric] = value;
        scores[metric] = this.calculateMetricScore(metric, value, config);
      }

      // Calculate overall score
      const overallScore =
        Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;

      // Determine grade
      const grade = this.calculateGrade(overallScore);

      // Check if benchmark passed
      const passed = this.checkBenchmarkPassed(benchmarkResults, config);

      const benchmarkResult: BenchmarkResult = {
        configName,
        timestamp: new Date(),
        results: benchmarkResults,
        scores,
        overallScore,
        grade,
        passed,
        metadata: {
          ...metadata,
          environment: config.environment,
          version: config.version,
        },
      };

      // Save result
      await this.saveBenchmarkResult(benchmarkResult);

      return benchmarkResult;
    } catch (error) {
      throw new Error(
        `Failed to run benchmark: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare benchmark results
   * Requirements: 5.2, 5.4
   */
  async compareBenchmarks(
    baselineResultId: string,
    currentResultId: string
  ): Promise<BenchmarkComparison> {
    try {
      const baseline = await this.loadBenchmarkResult(baselineResultId);
      const current = await this.loadBenchmarkResult(currentResultId);

      if (!(baseline && current)) {
        throw new Error('Benchmark results not found');
      }

      if (baseline.configName !== current.configName) {
        throw new Error('Cannot compare benchmarks with different configurations');
      }

      const improvements: Record<string, number> = {};
      const regressions: Record<string, number> = {};

      // Compare each metric
      for (const metric of Object.keys(baseline.results)) {
        const baselineValue = baseline.results[metric];
        const currentValue = current.results[metric];
        const change = ((currentValue - baselineValue) / baselineValue) * 100;

        if (Math.abs(change) > 1) {
          // Only consider changes > 1%
          if (this.isImprovement(metric, change)) {
            improvements[metric] = Math.abs(change);
          } else {
            regressions[metric] = Math.abs(change);
          }
        }
      }

      const overallChange = current.overallScore - baseline.overallScore;
      const summary = this.generateComparisonSummary(improvements, regressions, overallChange);

      return {
        baseline,
        current,
        improvements,
        regressions,
        overallChange,
        summary,
      };
    } catch (error) {
      throw new Error(
        `Failed to compare benchmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get benchmark history for a configuration
   */
  async getBenchmarkHistory(configName: string, limit = 50): Promise<BenchmarkResult[]> {
    try {
      const resultsDir = join(this.resultsDirectory, configName);
      if (!existsSync(resultsDir)) {
        return [];
      }

      const files = require('node:fs')
        .readdirSync(resultsDir)
        .filter((file: string) => file.endsWith('.json'))
        .sort()
        .slice(-limit);

      const results: BenchmarkResult[] = [];
      for (const file of files) {
        const result = await this.loadBenchmarkResult(join(configName, file.replace('.json', '')));
        if (result) {
          results.push(result);
        }
      }

      return results.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      throw new Error(
        `Failed to get benchmark history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate benchmark report
   */
  async generateBenchmarkReport(configName: string): Promise<string> {
    try {
      const config = this.configs.get(configName);
      if (!config) {
        throw new Error(`Benchmark config '${configName}' not found`);
      }

      const history = await this.getBenchmarkHistory(configName, 10);
      if (history.length === 0) {
        throw new Error(`No benchmark results found for '${configName}'`);
      }

      const latest = history[0];
      const reportContent = this.generateReportContent(config, latest, history);

      const reportPath = join(this.resultsDirectory, `${configName}-report.md`);
      writeFileSync(reportPath, reportContent);

      return reportPath;
    } catch (error) {
      throw new Error(
        `Failed to generate benchmark report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create default benchmark configurations
   */
  async createDefaultConfigs(): Promise<void> {
    // Phase A Validation Benchmark
    const phaseAConfig: BenchmarkConfig = {
      name: 'phase-a-validation',
      description: 'Phase A validation performance benchmark',
      metrics: [
        'buildTime',
        'bundleSize',
        'testCoverage',
        'memoryUsage',
        'cacheHitRate',
        'parallelEfficiency',
        'architectureHealthScore',
      ],
      targets: {
        buildTime: 30, // seconds
        bundleSize: 5, // MB
        testCoverage: 80, // %
        memoryUsage: 512, // MB
        cacheHitRate: 90, // %
        parallelEfficiency: 80, // %
        architectureHealthScore: 90, // /100
      },
      thresholds: {
        excellent: {
          buildTime: 20,
          bundleSize: 3,
          testCoverage: 90,
          memoryUsage: 256,
          cacheHitRate: 95,
          parallelEfficiency: 90,
          architectureHealthScore: 95,
        },
        good: {
          buildTime: 30,
          bundleSize: 5,
          testCoverage: 80,
          memoryUsage: 512,
          cacheHitRate: 85,
          parallelEfficiency: 75,
          architectureHealthScore: 85,
        },
        poor: {
          buildTime: 60,
          bundleSize: 10,
          testCoverage: 60,
          memoryUsage: 1024,
          cacheHitRate: 70,
          parallelEfficiency: 60,
          architectureHealthScore: 70,
        },
      },
      environment: 'ci',
      version: '1.0.0',
    };

    // Developer Experience Benchmark
    const devExperienceConfig: BenchmarkConfig = {
      name: 'developer-experience',
      description: 'Developer experience performance benchmark',
      metrics: ['typeScriptCompilationTime', 'autocompleteSpeed', 'buildTime', 'testCoverage'],
      targets: {
        typeScriptCompilationTime: 10, // seconds
        autocompleteSpeed: 200, // ms
        buildTime: 30, // seconds
        testCoverage: 80, // %
      },
      thresholds: {
        excellent: {
          typeScriptCompilationTime: 5,
          autocompleteSpeed: 100,
          buildTime: 20,
          testCoverage: 90,
        },
        good: {
          typeScriptCompilationTime: 10,
          autocompleteSpeed: 200,
          buildTime: 30,
          testCoverage: 80,
        },
        poor: {
          typeScriptCompilationTime: 20,
          autocompleteSpeed: 500,
          buildTime: 60,
          testCoverage: 60,
        },
      },
      environment: 'development',
      version: '1.0.0',
    };

    await this.createBenchmarkConfig(phaseAConfig);
    await this.createBenchmarkConfig(devExperienceConfig);
  }

  /**
   * Extract performance data from validation results
   */
  private extractPerformanceData(results: ValidationResults): PerformanceDataPoint {
    return {
      timestamp: results.timestamp,
      buildTime: (results.performanceAnalysis?.buildMetrics?.totalBuildTime || 0) / 1000,
      bundleSize: (results.performanceAnalysis?.bundleMetrics?.totalSize || 0) / 1024 / 1024,
      testCoverage: results.systemValidation?.testResults?.coverage?.overall || 0,
      memoryUsage: (results.performanceAnalysis?.memoryProfile?.build?.heapUsed || 0) / 1024 / 1024,
      cacheHitRate: results.performanceAnalysis?.buildMetrics?.cacheHitRate || 0,
      parallelEfficiency: results.performanceAnalysis?.buildMetrics?.parallelEfficiency || 0,
      architectureHealthScore: results.architectureValidation?.dependencyAnalysis?.healthScore || 0,
      typeScriptCompilationTime:
        (results.performanceAnalysis?.devExperienceMetrics?.typeScriptPerformance
          ?.compilationTime || 0) / 1000,
      autocompleteSpeed:
        results.performanceAnalysis?.devExperienceMetrics?.typeScriptPerformance
          ?.autocompleteSpeed || 0,
      metadata: {},
    };
  }

  /**
   * Get metric value from performance data
   */
  private getMetricValue(data: PerformanceDataPoint, metric: string): number {
    return (data as any)[metric] || 0;
  }

  /**
   * Calculate score for a metric (0-100)
   */
  private calculateMetricScore(metric: string, value: number, config: BenchmarkConfig): number {
    const excellent = config.thresholds.excellent[metric];
    const good = config.thresholds.good[metric];
    const poor = config.thresholds.poor[metric];

    if (!(excellent && good && poor)) {
      return 50; // Default score if thresholds not defined
    }

    // Determine if lower values are better
    const lowerIsBetter = this.isLowerBetter(metric);

    if (lowerIsBetter) {
      if (value <= excellent) {
        return 100;
      }
      if (value <= good) {
        return 80;
      }
      if (value <= poor) {
        return 60;
      }
      return Math.max(0, 60 - ((value - poor) / poor) * 30);
    } else {
      if (value >= excellent) {
        return 100;
      }
      if (value >= good) {
        return 80;
      }
      if (value >= poor) {
        return 60;
      }
      return Math.max(0, 60 - ((poor - value) / poor) * 30);
    }
  }

  /**
   * Calculate overall grade
   */
  private calculateGrade(score: number): BenchmarkResult['grade'] {
    if (score >= 90) {
      return 'A';
    }
    if (score >= 80) {
      return 'B';
    }
    if (score >= 70) {
      return 'C';
    }
    if (score >= 60) {
      return 'D';
    }
    return 'F';
  }

  /**
   * Check if benchmark passed
   */
  private checkBenchmarkPassed(results: Record<string, number>, config: BenchmarkConfig): boolean {
    for (const metric of config.metrics) {
      const value = results[metric];
      const target = config.targets[metric];

      if (target === undefined) {
        continue;
      }

      const lowerIsBetter = this.isLowerBetter(metric);

      if (lowerIsBetter && value > target) {
        return false;
      }
      if (!lowerIsBetter && value < target) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a change is an improvement
   */
  private isImprovement(metric: string, changePercentage: number): boolean {
    const lowerIsBetter = this.isLowerBetter(metric);
    return lowerIsBetter ? changePercentage < 0 : changePercentage > 0;
  }

  /**
   * Check if lower values are better for a metric
   */
  private isLowerBetter(metric: string): boolean {
    const lowerIsBetterMetrics = [
      'buildTime',
      'bundleSize',
      'memoryUsage',
      'typeScriptCompilationTime',
      'autocompleteSpeed',
    ];

    return lowerIsBetterMetrics.includes(metric);
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(
    improvements: Record<string, number>,
    regressions: Record<string, number>,
    overallChange: number
  ): string {
    const improvementCount = Object.keys(improvements).length;
    const regressionCount = Object.keys(regressions).length;

    if (improvementCount === 0 && regressionCount === 0) {
      return 'No significant changes detected';
    }

    let summary = '';

    if (overallChange > 5) {
      summary += 'Overall performance improved significantly. ';
    } else if (overallChange < -5) {
      summary += 'Overall performance degraded significantly. ';
    } else {
      summary += 'Overall performance remained stable. ';
    }

    if (improvementCount > 0) {
      const topImprovement = Object.entries(improvements).sort(([, a], [, b]) => b - a)[0];
      summary += `Best improvement: ${topImprovement[0]} (+${topImprovement[1].toFixed(1)}%). `;
    }

    if (regressionCount > 0) {
      const topRegression = Object.entries(regressions).sort(([, a], [, b]) => b - a)[0];
      summary += `Biggest regression: ${topRegression[0]} (-${topRegression[1].toFixed(1)}%). `;
    }

    return summary.trim();
  }

  /**
   * Generate report content
   */
  private generateReportContent(
    config: BenchmarkConfig,
    latest: BenchmarkResult,
    history: BenchmarkResult[]
  ): string {
    const trend =
      history.length > 1
        ? latest.overallScore - history[1].overallScore > 0
          ? '📈'
          : latest.overallScore - history[1].overallScore < 0
            ? '📉'
            : '➡️'
        : '➡️';

    return `# ${config.name} Benchmark Report

## Overview
- **Description**: ${config.description}
- **Latest Score**: ${latest.overallScore.toFixed(1)}/100 (Grade: ${latest.grade}) ${trend}
- **Status**: ${latest.passed ? '✅ PASSED' : '❌ FAILED'}
- **Timestamp**: ${latest.timestamp.toISOString()}

## Metrics Performance

${config.metrics
  .map((metric) => {
    const value = latest.results[metric];
    const score = latest.scores[metric];
    const target = config.targets[metric];
    const status = this.isLowerBetter(metric)
      ? value <= target
        ? '✅'
        : '❌'
      : value >= target
        ? '✅'
        : '❌';

    return `### ${metric}
- **Current**: ${value.toFixed(2)} ${status}
- **Target**: ${target}
- **Score**: ${score.toFixed(1)}/100`;
  })
  .join('\n\n')}

## Historical Trend

${history
  .slice(0, 5)
  .map(
    (result, index) =>
      `${index + 1}. ${result.timestamp.toISOString().split('T')[0]} - Score: ${result.overallScore.toFixed(1)} (${result.grade})`
  )
  .join('\n')}

## Thresholds

### Excellent (90-100 points)
${Object.entries(config.thresholds.excellent)
  .map(([metric, value]) => `- ${metric}: ${value}`)
  .join('\n')}

### Good (80-89 points)
${Object.entries(config.thresholds.good)
  .map(([metric, value]) => `- ${metric}: ${value}`)
  .join('\n')}

### Poor (60-69 points)
${Object.entries(config.thresholds.poor)
  .map(([metric, value]) => `- ${metric}: ${value}`)
  .join('\n')}

---
Generated: ${new Date().toISOString()}
`;
  }

  /**
   * Save benchmark result
   */
  private async saveBenchmarkResult(result: BenchmarkResult): Promise<void> {
    const configDir = join(this.resultsDirectory, result.configName);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const filename = `${result.timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = join(configDir, filename);

    writeFileSync(filepath, JSON.stringify(result, null, 2));
  }

  /**
   * Load benchmark result
   */
  private async loadBenchmarkResult(resultId: string): Promise<BenchmarkResult | null> {
    try {
      const filepath = join(this.resultsDirectory, `${resultId}.json`);
      if (!existsSync(filepath)) {
        return null;
      }

      const data = JSON.parse(readFileSync(filepath, 'utf-8'));
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      };
    } catch (_error) {
      return null;
    }
  }

  /**
   * Load benchmark configurations
   */
  private loadConfigs(): void {
    try {
      if (!existsSync(this.configDirectory)) {
        return;
      }

      const files = require('node:fs')
        .readdirSync(this.configDirectory)
        .filter((file: string) => file.endsWith('.json'));

      for (const file of files) {
        const configPath = join(this.configDirectory, file);
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        this.configs.set(config.name, config);
      }
    } catch (_error) {}
  }

  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.configDirectory)) {
      mkdirSync(this.configDirectory, { recursive: true });
    }
    if (!existsSync(this.resultsDirectory)) {
      mkdirSync(this.resultsDirectory, { recursive: true });
    }
  }

  /**
   * Get available benchmark configurations
   */
  getAvailableConfigs(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get benchmark configuration
   */
  getBenchmarkConfig(name: string): BenchmarkConfig | undefined {
    return this.configs.get(name);
  }
}

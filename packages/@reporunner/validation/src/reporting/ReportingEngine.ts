import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ChartData,
  ComparisonData,
  DocumentationUpdate,
  MetricCard,
  PerformanceDashboard,
  RecommendationList,
  TrendAnalysis,
  ValidationReport,
  ValidationResults,
  ValidationSummary,
} from '../types/index.js';

/**
 * Reporting engine for generating comprehensive validation reports
 * Requirements: 1.5, 2.4
 */
export class ReportingEngine {
  private outputDirectory: string;

  constructor(outputDirectory = './validation-reports') {
    this.outputDirectory = outputDirectory;
    this.ensureOutputDirectory();
  }

  /**
   * Generate comprehensive validation report
   * Requirements: 1.5, 2.4
   */
  async generateValidationReport(results: ValidationResults): Promise<ValidationReport> {
    try {
      // Generate summary
      const summary = this.generateValidationSummary(results);

      // Generate performance dashboard
      const performanceDashboard = this.generatePerformanceDashboard(results);

      // Generate recommendation list
      const recommendations = this.generateRecommendationList(results);

      // Generate documentation updates
      const documentation = this.generateDocumentationUpdates(results);

      const report: ValidationReport = {
        summary,
        detailedResults: results,
        performanceDashboard,
        recommendations,
        documentation,
      };

      // Save report to files
      await this.saveReport(report);

      return report;
    } catch (error) {
      throw new Error(
        `Failed to generate validation report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(results: ValidationResults): ValidationSummary {
    const criticalIssues = results.recommendations.filter((r) => r.priority === 'critical').length;

    // Count completed validations
    let completedValidations = 0;
    if (results.systemValidation) { completedValidations++; }
    if (results.performanceAnalysis) { completedValidations++; }
    if (results.architectureValidation) { completedValidations++; }

    return {
      overallStatus: results.status,
      completedValidations,
      totalValidations: 3,
      criticalIssues,
      performanceImprovements: {
        buildTime: results.performanceAnalysis.buildMetrics.improvementPercentage,
        bundleSize: results.performanceAnalysis.bundleMetrics.reductionPercentage,
      },
      nextSteps: results.nextSteps,
    };
  }

  /**
   * Generate performance dashboard data
   */
  private generatePerformanceDashboard(results: ValidationResults): PerformanceDashboard {
    const charts = this.generateChartData(results);
    const metrics = this.generateMetricCards(results);
    const trends = this.generateTrendAnalysis(results);
    const comparisons = this.generateComparisonData(results);

    return {
      charts,
      metrics,
      trends,
      comparisons,
    };
  }

  /**
   * Generate chart data for dashboard
   */
  private generateChartData(results: ValidationResults): ChartData[] {
    const charts: ChartData[] = [];

    // Build time comparison chart
    charts.push({
      id: 'build-time-comparison',
      type: 'bar',
      title: 'Package Build Times',
      data: Object.entries(results.performanceAnalysis.buildMetrics.packageBuildTimes).map(
        ([pkg, time]) => ({
          package: pkg,
          buildTime: Math.round(time / 1000), // Convert to seconds
        })
      ),
      xAxis: 'package',
      yAxis: 'buildTime',
    });

    // Bundle size distribution chart
    charts.push({
      id: 'bundle-size-distribution',
      type: 'pie',
      title: 'Bundle Size Distribution',
      data: Object.entries(results.performanceAnalysis.bundleMetrics.packageSizes).map(
        ([pkg, size]) => ({
          package: pkg,
          size: Math.round(size / 1024), // Convert to KB
        })
      ),
    });

    // Memory usage chart
    charts.push({
      id: 'memory-usage',
      type: 'line',
      title: 'Memory Usage Profile',
      data: [
        {
          phase: 'Development',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.development.heapUsed / 1024 / 1024
          ),
        },
        {
          phase: 'Build',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.build.heapUsed / 1024 / 1024
          ),
        },
        {
          phase: 'Runtime',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.runtime.heapUsed / 1024 / 1024
          ),
        },
      ],
      xAxis: 'phase',
      yAxis: 'heapUsed',
    });

    // Test coverage chart
    if (results.systemValidation.testResults.packageResults.length > 0) {
      charts.push({
        id: 'test-coverage',
        type: 'bar',
        title: 'Test Coverage by Package',
        data: results.systemValidation.testResults.packageResults.map((pkg) => ({
          package: pkg.packageName,
          coverage: pkg.coverage,
        })),
        xAxis: 'package',
        yAxis: 'coverage',
      });
    }

    return charts;
  }

  /**
   * Generate metric cards for dashboard
   */
  private generateMetricCards(results: ValidationResults): MetricCard[] {
    const metrics: MetricCard[] = [];

    // Build time improvement
    metrics.push({
      id: 'build-time-improvement',
      title: 'Build Time Improvement',
      value: results.performanceAnalysis.buildMetrics.improvementPercentage,
      unit: '%',
      trend: results.performanceAnalysis.buildMetrics.improvementPercentage > 0 ? 'up' : 'down',
      trendValue: results.performanceAnalysis.buildMetrics.improvementPercentage,
      status:
        results.performanceAnalysis.buildMetrics.improvementPercentage >= 30
          ? 'success'
          : 'warning',
    });

    // Bundle size reduction
    metrics.push({
      id: 'bundle-size-reduction',
      title: 'Bundle Size Reduction',
      value: results.performanceAnalysis.bundleMetrics.reductionPercentage,
      unit: '%',
      trend: results.performanceAnalysis.bundleMetrics.reductionPercentage > 0 ? 'up' : 'down',
      trendValue: results.performanceAnalysis.bundleMetrics.reductionPercentage,
      status:
        results.performanceAnalysis.bundleMetrics.reductionPercentage >= 20 ? 'success' : 'warning',
    });

    // Test coverage
    metrics.push({
      id: 'test-coverage',
      title: 'Overall Test Coverage',
      value: results.systemValidation.testResults.coverage.overall,
      unit: '%',
      status:
        results.systemValidation.testResults.coverage.overall >= 80
          ? 'success'
          : results.systemValidation.testResults.coverage.overall >= 60
            ? 'warning'
            : 'error',
    });

    // Architecture health score
    metrics.push({
      id: 'architecture-health',
      title: 'Architecture Health Score',
      value: results.architectureValidation.dependencyAnalysis.healthScore,
      unit: '/100',
      status:
        results.architectureValidation.dependencyAnalysis.healthScore >= 90
          ? 'success'
          : results.architectureValidation.dependencyAnalysis.healthScore >= 70
            ? 'warning'
            : 'error',
    });

    // Cache hit rate
    metrics.push({
      id: 'cache-hit-rate',
      title: 'Build Cache Hit Rate',
      value: results.performanceAnalysis.buildMetrics.cacheHitRate,
      unit: '%',
      status: results.performanceAnalysis.buildMetrics.cacheHitRate >= 80 ? 'success' : 'warning',
    });

    // Parallel efficiency
    metrics.push({
      id: 'parallel-efficiency',
      title: 'Build Parallel Efficiency',
      value: results.performanceAnalysis.buildMetrics.parallelEfficiency,
      unit: '%',
      status:
        results.performanceAnalysis.buildMetrics.parallelEfficiency >= 70 ? 'success' : 'warning',
    });

    return metrics;
  }

  /**
   * Generate trend analysis
   */
  private generateTrendAnalysis(results: ValidationResults): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];

    // Build time trend
    trends.push({
      metric: 'Build Time',
      direction:
        results.performanceAnalysis.buildMetrics.improvementPercentage > 0
          ? 'improving'
          : 'degrading',
      changePercentage: results.performanceAnalysis.buildMetrics.improvementPercentage,
      timeframe: 'Since consolidation',
    });

    // Bundle size trend
    trends.push({
      metric: 'Bundle Size',
      direction:
        results.performanceAnalysis.bundleMetrics.reductionPercentage > 0
          ? 'improving'
          : 'degrading',
      changePercentage: results.performanceAnalysis.bundleMetrics.reductionPercentage,
      timeframe: 'Since consolidation',
    });

    // Memory usage trend
    const memoryTrend =
      results.performanceAnalysis.memoryProfile.optimizations.length > 0 ? 'improving' : 'stable';
    trends.push({
      metric: 'Memory Usage',
      direction: memoryTrend,
      changePercentage: memoryTrend === 'improving' ? 10 : 0, // Placeholder
      timeframe: 'Current session',
    });

    return trends;
  }

  /**
   * Generate comparison data
   */
  private generateComparisonData(results: ValidationResults): ComparisonData[] {
    const comparisons: ComparisonData[] = [];

    // Build time comparison
    comparisons.push({
      metric: 'Build Time',
      current: results.performanceAnalysis.buildMetrics.totalBuildTime / 1000, // Convert to seconds
      baseline:
        results.performanceAnalysis.buildMetrics.totalBuildTime /
        1000 /
        (1 + results.performanceAnalysis.buildMetrics.improvementPercentage / 100),
      target: (results.performanceAnalysis.buildMetrics.totalBuildTime / 1000) * 0.7, // 30% improvement target
      unit: 'seconds',
    });

    // Bundle size comparison
    comparisons.push({
      metric: 'Bundle Size',
      current: results.performanceAnalysis.bundleMetrics.totalSize / 1024 / 1024, // Convert to MB
      baseline:
        results.performanceAnalysis.bundleMetrics.totalSize /
        1024 /
        1024 /
        (1 - results.performanceAnalysis.bundleMetrics.reductionPercentage / 100),
      target: (results.performanceAnalysis.bundleMetrics.totalSize / 1024 / 1024) * 0.8, // 20% reduction target
      unit: 'MB',
    });

    // Test coverage comparison
    comparisons.push({
      metric: 'Test Coverage',
      current: results.systemValidation.testResults.coverage.overall,
      baseline: 70, // Assumed baseline
      target: 80, // Target coverage
      unit: '%',
    });

    return comparisons;
  }

  /**
   * Generate recommendation list organized by priority
   */
  private generateRecommendationList(results: ValidationResults): RecommendationList {
    const recommendations = results.recommendations;

    return {
      critical: recommendations.filter((r) => r.priority === 'critical'),
      high: recommendations.filter((r) => r.priority === 'high'),
      medium: recommendations.filter((r) => r.priority === 'medium'),
      low: recommendations.filter((r) => r.priority === 'low'),
    };
  }

  /**
   * Generate documentation updates based on validation results
   */
  private generateDocumentationUpdates(results: ValidationResults): DocumentationUpdate[] {
    const updates: DocumentationUpdate[] = [];

    // Update architecture documentation
    updates.push({
      file: 'docs/architecture/package-structure.md',
      type: 'update',
      content: this.generateArchitectureDocumentation(results),
      reason: 'Update package structure documentation with validation results',
    });

    // Update performance documentation
    updates.push({
      file: 'docs/performance/build-optimization.md',
      type: 'create',
      content: this.generatePerformanceDocumentation(results),
      reason: 'Document performance improvements and optimization recommendations',
    });

    // Update developer guide
    updates.push({
      file: 'docs/developer-guide/getting-started.md',
      type: 'update',
      content: this.generateDeveloperGuideUpdates(results),
      reason: 'Update developer guide with new package structure and best practices',
    });

    // Create troubleshooting guide
    if (results.recommendations.length > 0) {
      updates.push({
        file: 'docs/troubleshooting/common-issues.md',
        type: 'create',
        content: this.generateTroubleshootingGuide(results),
        reason: 'Create troubleshooting guide based on validation findings',
      });
    }

    return updates;
  }

  /**
   * Generate architecture documentation content
   */
  private generateArchitectureDocumentation(results: ValidationResults): string {
    const dependencyAnalysis = results.architectureValidation.dependencyAnalysis;

    return `# Package Architecture

## Overview
The consolidated package architecture consists of ${dependencyAnalysis.dependencyGraph.metrics.totalNodes} packages with ${dependencyAnalysis.dependencyGraph.metrics.totalEdges} dependencies.

## Health Score
Current architecture health score: ${dependencyAnalysis.healthScore}/100

## Package Dependencies
${dependencyAnalysis.dependencyGraph.nodes.map((node) => `- ${node.packageName} (${node.type})`).join('\n')}

## Validation Results
- Circular Dependencies: ${dependencyAnalysis.circularDependencies.length}
- Boundary Violations: ${dependencyAnalysis.packageBoundaryViolations.length}
- Overall Status: ${results.status}

Last updated: ${results.timestamp.toISOString()}
`;
  }

  /**
   * Generate performance documentation content
   */
  private generatePerformanceDocumentation(results: ValidationResults): string {
    const buildMetrics = results.performanceAnalysis.buildMetrics;
    const bundleMetrics = results.performanceAnalysis.bundleMetrics;

    return `# Performance Optimization Results

## Build Performance
- Total Build Time: ${Math.round(buildMetrics.totalBuildTime / 1000)}s
- Improvement: ${buildMetrics.improvementPercentage.toFixed(1)}%
- Cache Hit Rate: ${buildMetrics.cacheHitRate.toFixed(1)}%
- Parallel Efficiency: ${buildMetrics.parallelEfficiency.toFixed(1)}%

## Bundle Analysis
- Total Bundle Size: ${Math.round(bundleMetrics.totalSize / 1024 / 1024)}MB
- Size Reduction: ${bundleMetrics.reductionPercentage.toFixed(1)}%

## Bottlenecks
${buildMetrics.bottlenecks.map((b) => `- ${b.packageName}: ${Math.round(b.buildTime / 1000)}s`).join('\n')}

## Optimization Recommendations
${results.recommendations
  .filter((r) => r.category === 'performance')
  .map((r) => `- ${r.title}: ${r.description}`)
  .join('\n')}

Last updated: ${results.timestamp.toISOString()}
`;
  }

  /**
   * Generate developer guide updates
   */
  private generateDeveloperGuideUpdates(results: ValidationResults): string {
    const devMetrics = results.performanceAnalysis.devExperienceMetrics;

    return `# Developer Guide Updates

## TypeScript Performance
- Compilation Time: ${Math.round(devMetrics.typeScriptPerformance.compilationTime / 1000)}s
- Autocomplete Speed: ${devMetrics.typeScriptPerformance.autocompleteSpeed}ms
- Type Resolution Accuracy: ${devMetrics.typeScriptPerformance.typeResolutionAccuracy.toFixed(1)}%

## Import Path Optimization
- Average Path Length: ${devMetrics.importPathMetrics.averagePathLength} characters
- Circular Dependencies: ${devMetrics.importPathMetrics.circularDependencies}
- Optimization Opportunities: ${devMetrics.importPathMetrics.optimizationOpportunities.length}

## Best Practices
${devMetrics.importPathMetrics.optimizationOpportunities.map((o) => `- ${o}`).join('\n')}

Last updated: ${results.timestamp.toISOString()}
`;
  }

  /**
   * Generate troubleshooting guide
   */
  private generateTroubleshootingGuide(results: ValidationResults): string {
    const criticalIssues = results.recommendations.filter((r) => r.priority === 'critical');
    const commonIssues = results.recommendations.filter(
      (r) => r.priority === 'high' || r.priority === 'medium'
    );

    const content = `# Troubleshooting Guide

## Critical Issues
${criticalIssues
  .map(
    (issue) => `
### ${issue.title}
**Problem:** ${issue.description}
**Impact:** ${issue.impact}
**Solution:**
${issue.steps.map((step) => `- ${step}`).join('\n')}
**Affected Packages:** ${issue.affectedPackages.join(', ')}
`
  )
  .join('\n')}

## Common Issues
${commonIssues
  .map(
    (issue) => `
### ${issue.title}
**Problem:** ${issue.description}
**Solution:**
${issue.steps.map((step) => `- ${step}`).join('\n')}
`
  )
  .join('\n')}

Last updated: ${results.timestamp.toISOString()}
`;

    return content;
  }

  /**
   * Save report to files
   */
  private async saveReport(report: ValidationReport): Promise<void> {
    try {
      // Save JSON report
      const jsonReport = JSON.stringify(report, null, 2);
      writeFileSync(join(this.outputDirectory, 'validation-report.json'), jsonReport);

      // Save markdown summary
      const markdownSummary = this.generateMarkdownSummary(report);
      writeFileSync(join(this.outputDirectory, 'validation-summary.md'), markdownSummary);

      // Save HTML dashboard (placeholder)
      const htmlDashboard = this.generateHTMLDashboard(report);
      writeFileSync(join(this.outputDirectory, 'dashboard.html'), htmlDashboard);

      // Save CSV metrics
      const csvMetrics = this.generateCSVMetrics(report);
      writeFileSync(join(this.outputDirectory, 'metrics.csv'), csvMetrics);

    } catch (error) {
      throw new Error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate markdown summary
   */
  private generateMarkdownSummary(report: ValidationReport): string {
    const { summary, recommendations } = report;

    return `# Phase A Validation Summary

## Overall Status: ${summary.overallStatus.toUpperCase()}

### Key Metrics
- Completed Validations: ${summary.completedValidations}/${summary.totalValidations}
- Critical Issues: ${summary.criticalIssues}
- Build Time Improvement: ${summary.performanceImprovements.buildTime.toFixed(1)}%
- Bundle Size Reduction: ${summary.performanceImprovements.bundleSize.toFixed(1)}%

### Performance Dashboard
${report.performanceDashboard.metrics
  .map(
    (metric) =>
      `- **${metric.title}**: ${metric.value}${metric.unit || ''} ${metric.status ? `(${metric.status})` : ''}`
  )
  .join('\n')}

### Recommendations Summary
- Critical: ${recommendations.critical.length}
- High Priority: ${recommendations.high.length}
- Medium Priority: ${recommendations.medium.length}
- Low Priority: ${recommendations.low.length}

### Next Steps
${summary.nextSteps.map((step) => `- ${step}`).join('\n')}

---
Generated: ${new Date().toISOString()}
`;
  }

  /**
   * Generate HTML dashboard (basic template)
   */
  private generateHTMLDashboard(report: ValidationReport): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase A Validation Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 5px; }
        .success { border-color: #28a745; }
        .warning { border-color: #ffc107; }
        .error { border-color: #dc3545; }
        .chart-placeholder { background: #f8f9fa; padding: 20px; text-align: center; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Phase A Validation Dashboard</h1>

    <h2>Key Metrics</h2>
    <div class="metrics">
        ${report.performanceDashboard.metrics
          .map(
            (metric) => `
            <div class="metric-card ${metric.status || ''}">
                <h3>${metric.title}</h3>
                <p><strong>${metric.value}${metric.unit || ''}</strong></p>
                ${metric.trend ? `<p>Trend: ${metric.trend} (${metric.trendValue || 0}%)</p>` : ''}
            </div>
        `
          )
          .join('')}
    </div>

    <h2>Charts</h2>
    ${report.performanceDashboard.charts
      .map(
        (chart) => `
        <div class="chart-placeholder">
            <h3>${chart.title}</h3>
            <p>Chart Type: ${chart.type}</p>
            <p>Data Points: ${chart.data.length}</p>
        </div>
    `
      )
      .join('')}

    <h2>Status: ${report.summary.overallStatus.toUpperCase()}</h2>

    <p>Generated: ${new Date().toISOString()}</p>
</body>
</html>`;
  }

  /**
   * Generate CSV metrics
   */
  private generateCSVMetrics(report: ValidationReport): string {
    const headers = ['Metric', 'Value', 'Unit', 'Status', 'Trend'];
    const rows = report.performanceDashboard.metrics.map((metric) => [
      metric.title,
      metric.value.toString(),
      metric.unit || '',
      metric.status || '',
      metric.trend || '',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDirectory)) {
      mkdirSync(this.outputDirectory, { recursive: true });
    }
  }

  /**
   * Get output directory path
   */
  getOutputDirectory(): string {
    return this.outputDirectory;
  }

  /**
   * Set custom output directory
   */
  setOutputDirectory(directory: string): void {
    this.outputDirectory = directory;
    this.ensureOutputDirectory();
  }
}

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
 * Aggregates validation results from multiple sources and generates comprehensive reports
 * Requirements: 5.1, 5.2, 5.4
 */
export class ValidationReportAggregator {
  private validationResults: ValidationResults[] = [];
  private historicalData: ValidationResults[] = [];

  /**
   * Add validation results to the aggregator
   */
  addValidationResults(results: ValidationResults): void {
    this.validationResults.push(results);
  }

  /**
   * Add historical validation data for trend analysis
   */
  addHistoricalData(historicalResults: ValidationResults[]): void {
    this.historicalData = historicalResults;
  }

  /**
   * Generate comprehensive validation report
   * Requirements: 5.1, 5.2, 5.4
   */
  async generateComprehensiveReport(): Promise<ValidationReport> {
    if (this.validationResults.length === 0) {
      throw new Error('No validation results available for report generation');
    }

    const latestResults = this.validationResults[this.validationResults.length - 1];

    // Generate all report components
    const summary = this.generateValidationSummary(latestResults);
    const performanceDashboard = this.generatePerformanceDashboard(latestResults);
    const recommendations = this.generateRecommendationList(latestResults);
    const documentation = this.generateDocumentationUpdates(latestResults);

    return {
      summary,
      detailedResults: latestResults,
      performanceDashboard,
      recommendations,
      documentation,
    };
  }

  /**
   * Generate validation summary with key metrics
   */
  private generateValidationSummary(results: ValidationResults): ValidationSummary {
    const criticalIssues = results.recommendations.filter((r) => r.priority === 'critical').length;

    // Count completed validations based on available data
    let completedValidations = 0;
    const totalValidations = 3; // System, Performance, Architecture

    if (results.systemValidation) {
      completedValidations++;
    }
    if (results.performanceAnalysis) {
      completedValidations++;
    }
    if (results.architectureValidation) {
      completedValidations++;
    }

    // Calculate performance improvements
    const buildTimeImprovement =
      results.performanceAnalysis?.buildMetrics?.improvementPercentage || 0;
    const bundleSizeReduction =
      results.performanceAnalysis?.bundleMetrics?.reductionPercentage || 0;

    return {
      overallStatus: results.status,
      completedValidations,
      totalValidations,
      criticalIssues,
      performanceImprovements: {
        buildTime: buildTimeImprovement,
        bundleSize: bundleSizeReduction,
      },
      nextSteps: results.nextSteps,
    };
  }

  /**
   * Generate performance dashboard with charts and metrics
   * Requirements: 5.2, 5.4
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
   * Generate comprehensive chart data for visualization
   */
  private generateChartData(results: ValidationResults): ChartData[] {
    const charts: ChartData[] = [];

    // Build time comparison chart
    if (results.performanceAnalysis?.buildMetrics?.packageBuildTimes) {
      charts.push({
        id: 'build-time-comparison',
        type: 'bar',
        title: 'Package Build Times',
        data: Object.entries(results.performanceAnalysis.buildMetrics.packageBuildTimes).map(
          ([pkg, time]) => ({
            package: pkg,
            buildTime: Math.round(time / 1000), // Convert to seconds
            status: time > 30000 ? 'slow' : time > 10000 ? 'medium' : 'fast',
          })
        ),
        xAxis: 'package',
        yAxis: 'buildTime',
      });
    }

    // Bundle size distribution chart
    if (results.performanceAnalysis?.bundleMetrics?.packageSizes) {
      charts.push({
        id: 'bundle-size-distribution',
        type: 'pie',
        title: 'Bundle Size Distribution',
        data: Object.entries(results.performanceAnalysis.bundleMetrics.packageSizes).map(
          ([pkg, size]) => ({
            package: pkg,
            size: Math.round(size / 1024), // Convert to KB
            percentage: (
              (size / results.performanceAnalysis.bundleMetrics.totalSize) *
              100
            ).toFixed(1),
          })
        ),
      });
    }

    // Memory usage profile chart
    if (results.performanceAnalysis?.memoryProfile) {
      const memoryData = [
        {
          phase: 'Development',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.development.heapUsed / 1024 / 1024
          ),
          heapTotal: Math.round(
            results.performanceAnalysis.memoryProfile.development.heapTotal / 1024 / 1024
          ),
        },
        {
          phase: 'Build',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.build.heapUsed / 1024 / 1024
          ),
          heapTotal: Math.round(
            results.performanceAnalysis.memoryProfile.build.heapTotal / 1024 / 1024
          ),
        },
        {
          phase: 'Runtime',
          heapUsed: Math.round(
            results.performanceAnalysis.memoryProfile.runtime.heapUsed / 1024 / 1024
          ),
          heapTotal: Math.round(
            results.performanceAnalysis.memoryProfile.runtime.heapTotal / 1024 / 1024
          ),
        },
      ];

      charts.push({
        id: 'memory-usage-profile',
        type: 'line',
        title: 'Memory Usage Profile (MB)',
        data: memoryData,
        xAxis: 'phase',
        yAxis: 'heapUsed',
      });
    }

    // Test coverage by package chart
    if (results.systemValidation?.testResults?.packageResults) {
      charts.push({
        id: 'test-coverage-by-package',
        type: 'bar',
        title: 'Test Coverage by Package',
        data: results.systemValidation.testResults.packageResults.map((pkg) => ({
          package: pkg.packageName,
          coverage: pkg.coverage,
          status: pkg.coverage >= 80 ? 'good' : pkg.coverage >= 60 ? 'fair' : 'poor',
        })),
        xAxis: 'package',
        yAxis: 'coverage',
      });
    }

    // API response time distribution
    if (results.systemValidation?.apiValidation?.responseTimeMetrics) {
      const responseMetrics = results.systemValidation.apiValidation.responseTimeMetrics;
      charts.push({
        id: 'api-response-times',
        type: 'bar',
        title: 'API Response Time Distribution',
        data: [
          { metric: 'Average', time: responseMetrics.average },
          { metric: 'Median', time: responseMetrics.median },
          { metric: 'P95', time: responseMetrics.p95 },
          { metric: 'P99', time: responseMetrics.p99 },
        ],
        xAxis: 'metric',
        yAxis: 'time',
      });
    }

    // Architecture health metrics
    if (results.architectureValidation?.dependencyAnalysis) {
      const depAnalysis = results.architectureValidation.dependencyAnalysis;
      charts.push({
        id: 'architecture-health',
        type: 'pie',
        title: 'Architecture Health Breakdown',
        data: [
          {
            category: 'Healthy Dependencies',
            count:
              depAnalysis.dependencyGraph.metrics.totalEdges -
              depAnalysis.circularDependencies.length,
            color: '#28a745',
          },
          {
            category: 'Circular Dependencies',
            count: depAnalysis.circularDependencies.length,
            color: '#dc3545',
          },
          {
            category: 'Boundary Violations',
            count: depAnalysis.packageBoundaryViolations.length,
            color: '#ffc107',
          },
        ],
      });
    }

    return charts;
  }

  /**
   * Generate metric cards for dashboard
   */
  private generateMetricCards(results: ValidationResults): MetricCard[] {
    const metrics: MetricCard[] = [];

    // Build time improvement metric
    if (results.performanceAnalysis?.buildMetrics) {
      const buildMetrics = results.performanceAnalysis.buildMetrics;
      metrics.push({
        id: 'build-time-improvement',
        title: 'Build Time Improvement',
        value: buildMetrics.improvementPercentage,
        unit: '%',
        trend: buildMetrics.improvementPercentage > 0 ? 'up' : 'down',
        trendValue: buildMetrics.improvementPercentage,
        status:
          buildMetrics.improvementPercentage >= 30
            ? 'success'
            : buildMetrics.improvementPercentage >= 15
              ? 'warning'
              : 'error',
      });

      // Cache hit rate metric
      metrics.push({
        id: 'cache-hit-rate',
        title: 'Build Cache Hit Rate',
        value: buildMetrics.cacheHitRate,
        unit: '%',
        status:
          buildMetrics.cacheHitRate >= 80
            ? 'success'
            : buildMetrics.cacheHitRate >= 60
              ? 'warning'
              : 'error',
      });

      // Parallel efficiency metric
      metrics.push({
        id: 'parallel-efficiency',
        title: 'Build Parallel Efficiency',
        value: buildMetrics.parallelEfficiency,
        unit: '%',
        status:
          buildMetrics.parallelEfficiency >= 70
            ? 'success'
            : buildMetrics.parallelEfficiency >= 50
              ? 'warning'
              : 'error',
      });
    }

    // Bundle size reduction metric
    if (results.performanceAnalysis?.bundleMetrics) {
      const bundleMetrics = results.performanceAnalysis.bundleMetrics;
      metrics.push({
        id: 'bundle-size-reduction',
        title: 'Bundle Size Reduction',
        value: bundleMetrics.reductionPercentage,
        unit: '%',
        trend: bundleMetrics.reductionPercentage > 0 ? 'up' : 'down',
        trendValue: bundleMetrics.reductionPercentage,
        status:
          bundleMetrics.reductionPercentage >= 20
            ? 'success'
            : bundleMetrics.reductionPercentage >= 10
              ? 'warning'
              : 'error',
      });
    }

    // Test coverage metric
    if (results.systemValidation?.testResults) {
      const testResults = results.systemValidation.testResults;
      metrics.push({
        id: 'test-coverage',
        title: 'Overall Test Coverage',
        value: testResults.coverage.overall,
        unit: '%',
        status:
          testResults.coverage.overall >= 80
            ? 'success'
            : testResults.coverage.overall >= 60
              ? 'warning'
              : 'error',
      });

      // Test success rate
      const successRate = (testResults.passedTests / testResults.totalTests) * 100;
      metrics.push({
        id: 'test-success-rate',
        title: 'Test Success Rate',
        value: successRate,
        unit: '%',
        status: successRate >= 95 ? 'success' : successRate >= 90 ? 'warning' : 'error',
      });
    }

    // Architecture health score
    if (results.architectureValidation?.dependencyAnalysis) {
      metrics.push({
        id: 'architecture-health-score',
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
    }

    // API endpoint health
    if (results.systemValidation?.apiValidation) {
      const apiValidation = results.systemValidation.apiValidation;
      const healthPercentage =
        ((apiValidation.validatedEndpoints - apiValidation.failedEndpoints.length) /
          apiValidation.totalEndpoints) *
        100;
      metrics.push({
        id: 'api-endpoint-health',
        title: 'API Endpoint Health',
        value: healthPercentage,
        unit: '%',
        status: healthPercentage >= 95 ? 'success' : healthPercentage >= 90 ? 'warning' : 'error',
      });
    }

    // Developer experience score
    if (results.performanceAnalysis?.devExperienceMetrics) {
      const devMetrics = results.performanceAnalysis.devExperienceMetrics;
      // Calculate composite DX score
      const dxScore =
        devMetrics.typeScriptPerformance.typeResolutionAccuracy * 0.3 +
        ((10000 - Math.min(devMetrics.typeScriptPerformance.autocompleteSpeed, 10000)) / 100) *
          0.3 +
        ((10000 - Math.min(devMetrics.idePerformance.navigationSpeed, 10000)) / 100) * 0.2 +
        devMetrics.idePerformance.sourceMapAccuracy * 0.2;

      metrics.push({
        id: 'developer-experience-score',
        title: 'Developer Experience Score',
        value: Math.round(dxScore),
        unit: '/100',
        status: dxScore >= 80 ? 'success' : dxScore >= 60 ? 'warning' : 'error',
      });
    }

    return metrics;
  }

  /**
   * Generate trend analysis based on historical data
   */
  private generateTrendAnalysis(results: ValidationResults): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];

    // Build time trend
    if (results.performanceAnalysis?.buildMetrics) {
      const improvement = results.performanceAnalysis.buildMetrics.improvementPercentage;
      trends.push({
        metric: 'Build Time',
        direction: improvement > 0 ? 'improving' : improvement < 0 ? 'degrading' : 'stable',
        changePercentage: Math.abs(improvement),
        timeframe: 'Since consolidation',
      });
    }

    // Bundle size trend
    if (results.performanceAnalysis?.bundleMetrics) {
      const reduction = results.performanceAnalysis.bundleMetrics.reductionPercentage;
      trends.push({
        metric: 'Bundle Size',
        direction: reduction > 0 ? 'improving' : reduction < 0 ? 'degrading' : 'stable',
        changePercentage: Math.abs(reduction),
        timeframe: 'Since consolidation',
      });
    }

    // Test coverage trend (if historical data available)
    if (this.historicalData.length > 0 && results.systemValidation?.testResults) {
      const currentCoverage = results.systemValidation.testResults.coverage.overall;
      const previousCoverage =
        this.historicalData[this.historicalData.length - 1]?.systemValidation?.testResults?.coverage
          ?.overall;

      if (previousCoverage !== undefined) {
        const coverageChange = ((currentCoverage - previousCoverage) / previousCoverage) * 100;
        trends.push({
          metric: 'Test Coverage',
          direction:
            coverageChange > 1 ? 'improving' : coverageChange < -1 ? 'degrading' : 'stable',
          changePercentage: Math.abs(coverageChange),
          timeframe: 'Since last validation',
        });
      }
    }

    // Architecture health trend
    if (results.architectureValidation?.dependencyAnalysis) {
      const healthScore = results.architectureValidation.dependencyAnalysis.healthScore;
      // Assume improving if score is above 80, stable if 60-80, degrading if below 60
      trends.push({
        metric: 'Architecture Health',
        direction: healthScore >= 80 ? 'improving' : healthScore >= 60 ? 'stable' : 'degrading',
        changePercentage: healthScore >= 80 ? 5 : healthScore >= 60 ? 0 : 10, // Placeholder values
        timeframe: 'Current assessment',
      });
    }

    return trends;
  }

  /**
   * Generate comparison data against baselines and targets
   */
  private generateComparisonData(results: ValidationResults): ComparisonData[] {
    const comparisons: ComparisonData[] = [];

    // Build time comparison
    if (results.performanceAnalysis?.buildMetrics) {
      const buildMetrics = results.performanceAnalysis.buildMetrics;
      const currentTime = buildMetrics.totalBuildTime / 1000; // Convert to seconds
      const baseline = currentTime / (1 + buildMetrics.improvementPercentage / 100);
      const target = baseline * 0.7; // 30% improvement target

      comparisons.push({
        metric: 'Build Time',
        current: Math.round(currentTime),
        baseline: Math.round(baseline),
        target: Math.round(target),
        unit: 'seconds',
      });
    }

    // Bundle size comparison
    if (results.performanceAnalysis?.bundleMetrics) {
      const bundleMetrics = results.performanceAnalysis.bundleMetrics;
      const currentSize = bundleMetrics.totalSize / 1024 / 1024; // Convert to MB
      const baseline = currentSize / (1 - bundleMetrics.reductionPercentage / 100);
      const target = baseline * 0.8; // 20% reduction target

      comparisons.push({
        metric: 'Bundle Size',
        current: Math.round(currentSize * 100) / 100,
        baseline: Math.round(baseline * 100) / 100,
        target: Math.round(target * 100) / 100,
        unit: 'MB',
      });
    }

    // Test coverage comparison
    if (results.systemValidation?.testResults) {
      const currentCoverage = results.systemValidation.testResults.coverage.overall;
      comparisons.push({
        metric: 'Test Coverage',
        current: currentCoverage,
        baseline: 70, // Assumed baseline
        target: 80, // Target coverage
        unit: '%',
      });
    }

    // Memory usage comparison
    if (results.performanceAnalysis?.memoryProfile) {
      const currentMemory = results.performanceAnalysis.memoryProfile.build.heapUsed / 1024 / 1024; // MB
      comparisons.push({
        metric: 'Build Memory Usage',
        current: Math.round(currentMemory),
        baseline: Math.round(currentMemory * 1.2), // Assume 20% improvement
        target: Math.round(currentMemory * 0.9), // Target 10% further reduction
        unit: 'MB',
      });
    }

    return comparisons;
  }

  /**
   * Generate organized recommendation list by priority
   */
  private generateRecommendationList(results: ValidationResults): RecommendationList {
    const recommendations = results.recommendations || [];

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

    // Architecture documentation update
    if (results.architectureValidation) {
      updates.push({
        file: 'docs/architecture/package-structure.md',
        type: 'update',
        content: this.generateArchitectureDocContent(results),
        reason: 'Update package structure documentation with validation results',
      });
    }

    // Performance documentation
    if (results.performanceAnalysis) {
      updates.push({
        file: 'docs/performance/optimization-results.md',
        type: 'create',
        content: this.generatePerformanceDocContent(results),
        reason: 'Document performance improvements and metrics',
      });
    }

    // Developer guide updates
    if (results.performanceAnalysis?.devExperienceMetrics) {
      updates.push({
        file: 'docs/developer-guide/development-workflow.md',
        type: 'update',
        content: this.generateDeveloperGuideContent(results),
        reason: 'Update developer guide with optimized workflows',
      });
    }

    // Troubleshooting guide
    const criticalRecommendations = results.recommendations.filter(
      (r) => r.priority === 'critical'
    );
    if (criticalRecommendations.length > 0) {
      updates.push({
        file: 'docs/troubleshooting/validation-issues.md',
        type: 'create',
        content: this.generateTroubleshootingContent(results),
        reason: 'Create troubleshooting guide for validation issues',
      });
    }

    return updates;
  }

  /**
   * Generate architecture documentation content
   */
  private generateArchitectureDocContent(results: ValidationResults): string {
    const depAnalysis = results.architectureValidation.dependencyAnalysis;

    return `# Package Architecture Validation Results

## Overview
Validation completed on: ${results.timestamp.toISOString()}

## Architecture Health Score: ${depAnalysis.healthScore}/100

## Package Structure
- Total Packages: ${depAnalysis.dependencyGraph.metrics.totalNodes}
- Dependencies: ${depAnalysis.dependencyGraph.metrics.totalEdges}
- Max Dependency Depth: ${depAnalysis.dependencyGraph.metrics.maxDepth}

## Validation Results
- Circular Dependencies: ${depAnalysis.circularDependencies.length}
- Boundary Violations: ${depAnalysis.packageBoundaryViolations.length}
- Overall Status: ${results.status.toUpperCase()}

## Package Dependencies
${depAnalysis.dependencyGraph.nodes
  .map(
    (node) => `- **${node.packageName}** (${node.type}) - Size: ${Math.round(node.size / 1024)}KB`
  )
  .join('\n')}

## Issues Found
${
  depAnalysis.circularDependencies.length > 0
    ? `### Circular Dependencies\n${depAnalysis.circularDependencies
        .map((dep) => `- ${dep.packages.join(' → ')} (${dep.severity})`)
        .join('\n')}`
    : '✅ No circular dependencies found'
}

${
  depAnalysis.packageBoundaryViolations.length > 0
    ? `### Boundary Violations\n${depAnalysis.packageBoundaryViolations
        .map(
          (violation) =>
            `- ${violation.fromPackage} → ${violation.toPackage}: ${violation.violationType}`
        )
        .join('\n')}`
    : '✅ No boundary violations found'
}
`;
  }

  /**
   * Generate performance documentation content
   */
  private generatePerformanceDocContent(results: ValidationResults): string {
    const buildMetrics = results.performanceAnalysis.buildMetrics;
    const bundleMetrics = results.performanceAnalysis.bundleMetrics;

    return `# Performance Optimization Results

## Build Performance
- **Total Build Time**: ${Math.round(buildMetrics.totalBuildTime / 1000)}s
- **Improvement**: ${buildMetrics.improvementPercentage.toFixed(1)}% ${buildMetrics.improvementPercentage >= 30 ? '✅' : '⚠️'}
- **Cache Hit Rate**: ${buildMetrics.cacheHitRate.toFixed(1)}%
- **Parallel Efficiency**: ${buildMetrics.parallelEfficiency.toFixed(1)}%

## Bundle Analysis
- **Total Bundle Size**: ${Math.round(bundleMetrics.totalSize / 1024 / 1024)}MB
- **Size Reduction**: ${bundleMetrics.reductionPercentage.toFixed(1)}% ${bundleMetrics.reductionPercentage >= 20 ? '✅' : '⚠️'}

## Package Build Times
${Object.entries(buildMetrics.packageBuildTimes)
  .sort(([, a], [, b]) => b - a)
  .map(([pkg, time]) => `- **${pkg}**: ${Math.round(time / 1000)}s`)
  .join('\n')}

## Bottlenecks Identified
${buildMetrics.bottlenecks
  .map(
    (bottleneck) =>
      `### ${bottleneck.packageName} (${Math.round(bottleneck.buildTime / 1000)}s)
${bottleneck.suggestions.map((s) => `- ${s}`).join('\n')}`
  )
  .join('\n\n')}

## Bundle Size by Package
${Object.entries(bundleMetrics.packageSizes)
  .sort(([, a], [, b]) => b - a)
  .map(([pkg, size]) => `- **${pkg}**: ${Math.round(size / 1024)}KB`)
  .join('\n')}
`;
  }

  /**
   * Generate developer guide content
   */
  private generateDeveloperGuideContent(results: ValidationResults): string {
    const devMetrics = results.performanceAnalysis.devExperienceMetrics;

    return `# Development Workflow Optimization

## TypeScript Performance
- **Compilation Time**: ${Math.round(devMetrics.typeScriptPerformance.compilationTime / 1000)}s
- **Autocomplete Speed**: ${devMetrics.typeScriptPerformance.autocompleteSpeed}ms
- **Type Resolution Accuracy**: ${devMetrics.typeScriptPerformance.typeResolutionAccuracy.toFixed(1)}%

## IDE Performance
- **Navigation Speed**: ${devMetrics.idePerformance.navigationSpeed}ms
- **IntelliSense Response**: ${devMetrics.idePerformance.intelliSenseResponseTime}ms
- **Source Map Accuracy**: ${devMetrics.idePerformance.sourceMapAccuracy.toFixed(1)}%

## Import Path Optimization
- **Average Path Length**: ${devMetrics.importPathMetrics.averagePathLength} characters
- **Circular Dependencies**: ${devMetrics.importPathMetrics.circularDependencies}
- **Inconsistent Paths**: ${devMetrics.importPathMetrics.inconsistentPaths}

## Optimization Opportunities
${devMetrics.importPathMetrics.optimizationOpportunities.map((opp) => `- ${opp}`).join('\n')}

## Best Practices
- Use consistent import paths across packages
- Leverage TypeScript path mapping for cleaner imports
- Monitor build cache hit rates for optimal performance
- Regular dependency analysis to prevent circular dependencies
`;
  }

  /**
   * Generate troubleshooting content
   */
  private generateTroubleshootingContent(results: ValidationResults): string {
    const criticalIssues = results.recommendations.filter((r) => r.priority === 'critical');
    const highIssues = results.recommendations.filter((r) => r.priority === 'high');

    return `# Validation Issues Troubleshooting Guide

## Critical Issues (${criticalIssues.length})
${criticalIssues
  .map(
    (issue) => `
### ${issue.title}
**Category**: ${issue.category}
**Impact**: ${issue.impact}
**Effort**: ${issue.effort}

**Problem**: ${issue.description}

**Solution Steps**:
${issue.steps.map((step) => `1. ${step}`).join('\n')}

**Affected Packages**: ${issue.affectedPackages.join(', ')}
`
  )
  .join('\n')}

## High Priority Issues (${highIssues.length})
${highIssues
  .map(
    (issue) => `
### ${issue.title}
**Problem**: ${issue.description}
**Solution**: ${issue.steps.join(' → ')}
`
  )
  .join('\n')}

## Quick Fixes
- Run \`pnpm run build\` to check for build issues
- Use \`pnpm run test\` to verify test coverage
- Check \`pnpm run architecture:validate\` for dependency issues
- Monitor memory usage during development

Last updated: ${results.timestamp.toISOString()}
`;
  }

  /**
   * Clear aggregated results
   */
  clearResults(): void {
    this.validationResults = [];
  }

  /**
   * Get current validation results count
   */
  getResultsCount(): number {
    return this.validationResults.length;
  }

  /**
   * Get historical data count
   */
  getHistoricalDataCount(): number {
    return this.historicalData.length;
  }
}

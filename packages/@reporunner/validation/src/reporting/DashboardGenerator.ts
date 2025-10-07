import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ChartData,
  ComparisonData,
  MetricCard,
  PerformanceDashboard,
  TrendAnalysis,
  ValidationReport,
} from '../types/index.js';

/**
 * Dashboard generator that creates interactive performance dashboards with charts and metrics
 * Requirements: 5.1, 5.2, 5.4
 */
export class DashboardGenerator {
  private outputDirectory: string;

  constructor(outputDirectory = './validation-reports/dashboard') {
    this.outputDirectory = outputDirectory;
    this.ensureOutputDirectory();
  }

  /**
   * Generate comprehensive performance dashboard
   * Requirements: 5.1, 5.2, 5.4
   */
  async generateDashboard(report: ValidationReport): Promise<string> {
    try {
      // Generate HTML dashboard
      const htmlContent = this.generateHTMLDashboard(report);
      const htmlPath = join(this.outputDirectory, 'index.html');
      writeFileSync(htmlPath, htmlContent);

      // Generate CSS styles
      const cssContent = this.generateDashboardCSS();
      const cssPath = join(this.outputDirectory, 'dashboard.css');
      writeFileSync(cssPath, cssContent);

      // Generate JavaScript for interactivity
      const jsContent = this.generateDashboardJS(report.performanceDashboard);
      const jsPath = join(this.outputDirectory, 'dashboard.js');
      writeFileSync(jsPath, jsContent);

      // Generate chart data JSON
      const chartDataPath = join(this.outputDirectory, 'chart-data.json');
      writeFileSync(chartDataPath, JSON.stringify(report.performanceDashboard.charts, null, 2));

      // Generate metrics data JSON
      const metricsDataPath = join(this.outputDirectory, 'metrics-data.json');
      writeFileSync(metricsDataPath, JSON.stringify(report.performanceDashboard.metrics, null, 2));

      return htmlPath;
    } catch (error) {
      throw new Error(
        `Failed to generate dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate HTML dashboard content
   */
  private generateHTMLDashboard(report: ValidationReport): string {
    const { summary, performanceDashboard, recommendations } = report;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase A Validation Dashboard</title>
    <link rel="stylesheet" href="dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
            <div class="header-content">
                <h1>Phase A Validation Dashboard</h1>
                <div class="header-status status-${summary.overallStatus}">
                    <span class="status-indicator"></span>
                    <span class="status-text">${summary.overallStatus.toUpperCase()}</span>
                </div>
                <div class="header-timestamp">
                    Last updated: ${new Date(report.detailedResults.timestamp).toLocaleString()}
                </div>
            </div>
        </header>

        <!-- Summary Cards -->
        <section class="summary-section">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Validation Progress</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(summary.completedValidations / summary.totalValidations) * 100}%"></div>
                    </div>
                    <p>${summary.completedValidations}/${summary.totalValidations} completed</p>
                </div>
                <div class="summary-card">
                    <h3>Critical Issues</h3>
                    <div class="metric-value ${summary.criticalIssues > 0 ? 'error' : 'success'}">
                        ${summary.criticalIssues}
                    </div>
                    <p>Issues requiring immediate attention</p>
                </div>
                <div class="summary-card">
                    <h3>Build Time Improvement</h3>
                    <div class="metric-value ${summary.performanceImprovements.buildTime >= 30 ? 'success' : 'warning'}">
                        ${summary.performanceImprovements.buildTime.toFixed(1)}%
                    </div>
                    <p>Target: 30% improvement</p>
                </div>
                <div class="summary-card">
                    <h3>Bundle Size Reduction</h3>
                    <div class="metric-value ${summary.performanceImprovements.bundleSize >= 20 ? 'success' : 'warning'}">
                        ${summary.performanceImprovements.bundleSize.toFixed(1)}%
                    </div>
                    <p>Target: 20% reduction</p>
                </div>
            </div>
        </section>

        <!-- Metrics Grid -->
        <section class="metrics-section">
            <h2>Performance Metrics</h2>
            <div class="metrics-grid">
                ${performanceDashboard.metrics.map((metric) => this.generateMetricCard(metric)).join('')}
            </div>
        </section>

        <!-- Charts Section -->
        <section class="charts-section">
            <h2>Performance Analytics</h2>
            <div class="charts-grid">
                ${performanceDashboard.charts.map((chart, index) => this.generateChartContainer(chart, index)).join('')}
            </div>
        </section>

        <!-- Trends Section -->
        <section class="trends-section">
            <h2>Performance Trends</h2>
            <div class="trends-grid">
                ${performanceDashboard.trends.map((trend) => this.generateTrendCard(trend)).join('')}
            </div>
        </section>

        <!-- Comparisons Section -->
        <section class="comparisons-section">
            <h2>Performance Comparisons</h2>
            <div class="comparisons-grid">
                ${performanceDashboard.comparisons.map((comparison) => this.generateComparisonCard(comparison)).join('')}
            </div>
        </section>

        <!-- Recommendations Section -->
        <section class="recommendations-section">
            <h2>Optimization Recommendations</h2>
            <div class="recommendations-tabs">
                <button class="tab-button active" data-tab="critical">Critical (${recommendations.critical.length})</button>
                <button class="tab-button" data-tab="high">High (${recommendations.high.length})</button>
                <button class="tab-button" data-tab="medium">Medium (${recommendations.medium.length})</button>
                <button class="tab-button" data-tab="low">Low (${recommendations.low.length})</button>
            </div>
            <div class="recommendations-content">
                ${this.generateRecommendationsContent(recommendations)}
            </div>
        </section>

        <!-- Footer -->
        <footer class="dashboard-footer">
            <p>Generated by Phase A Validation Framework</p>
            <p>Report ID: ${report.detailedResults.timestamp.getTime()}</p>
        </footer>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>`;
  }

  /**
   * Generate metric card HTML
   */
  private generateMetricCard(metric: MetricCard): string {
    const trendIcon = metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️';
    const statusClass = metric.status || 'neutral';

    return `
        <div class="metric-card ${statusClass}">
            <div class="metric-header">
                <h4>${metric.title}</h4>
                ${metric.trend ? `<span class="trend-indicator trend-${metric.trend}">${trendIcon}</span>` : ''}
            </div>
            <div class="metric-value">
                ${metric.value}${metric.unit || ''}
            </div>
            ${
              metric.trendValue
                ? `<div class="metric-trend">
                ${metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}${Math.abs(metric.trendValue || 0)}%
            </div>`
                : ''
            }
        </div>
    `;
  }

  /**
   * Generate chart container HTML
   */
  private generateChartContainer(chart: ChartData, index: number): string {
    return `
        <div class="chart-container">
            <div class="chart-header">
                <h3>${chart.title}</h3>
                <div class="chart-controls">
                    <button class="chart-download" data-chart="${chart.id}">📥 Download</button>
                    <button class="chart-fullscreen" data-chart="${chart.id}">🔍 Fullscreen</button>
                </div>
            </div>
            <div class="chart-wrapper">
                <canvas id="chart-${chart.id}" data-chart-index="${index}"></canvas>
            </div>
        </div>
    `;
  }

  /**
   * Generate trend card HTML
   */
  private generateTrendCard(trend: TrendAnalysis): string {
    const directionIcon =
      trend.direction === 'improving' ? '📈' : trend.direction === 'degrading' ? '📉' : '📊';
    const directionClass =
      trend.direction === 'improving'
        ? 'success'
        : trend.direction === 'degrading'
          ? 'error'
          : 'neutral';

    return `
        <div class="trend-card ${directionClass}">
            <div class="trend-header">
                <h4>${trend.metric}</h4>
                <span class="trend-icon">${directionIcon}</span>
            </div>
            <div class="trend-direction">${trend.direction.toUpperCase()}</div>
            <div class="trend-change">${trend.changePercentage.toFixed(1)}%</div>
            <div class="trend-timeframe">${trend.timeframe}</div>
        </div>
    `;
  }

  /**
   * Generate comparison card HTML
   */
  private generateComparisonCard(comparison: ComparisonData): string {
    const currentVsBaseline =
      ((comparison.current - comparison.baseline) / comparison.baseline) * 100;
    const currentVsTarget = ((comparison.current - comparison.target) / comparison.target) * 100;

    const baselineStatus = currentVsBaseline < 0 ? 'success' : 'warning';
    const targetStatus =
      Math.abs(currentVsTarget) < 5 ? 'success' : currentVsTarget < 0 ? 'success' : 'warning';

    return `
        <div class="comparison-card">
            <h4>${comparison.metric}</h4>
            <div class="comparison-bars">
                <div class="comparison-bar">
                    <label>Current</label>
                    <div class="bar current">
                        <div class="bar-fill" style="width: ${Math.min((comparison.current / Math.max(comparison.baseline, comparison.target, comparison.current)) * 100, 100)}%"></div>
                    </div>
                    <span>${comparison.current} ${comparison.unit}</span>
                </div>
                <div class="comparison-bar">
                    <label>Baseline</label>
                    <div class="bar baseline">
                        <div class="bar-fill" style="width: ${Math.min((comparison.baseline / Math.max(comparison.baseline, comparison.target, comparison.current)) * 100, 100)}%"></div>
                    </div>
                    <span>${comparison.baseline} ${comparison.unit}</span>
                </div>
                <div class="comparison-bar">
                    <label>Target</label>
                    <div class="bar target">
                        <div class="bar-fill" style="width: ${Math.min((comparison.target / Math.max(comparison.baseline, comparison.target, comparison.current)) * 100, 100)}%"></div>
                    </div>
                    <span>${comparison.target} ${comparison.unit}</span>
                </div>
            </div>
            <div class="comparison-status">
                <span class="status-badge ${baselineStatus}">vs Baseline: ${currentVsBaseline > 0 ? '+' : ''}${currentVsBaseline.toFixed(1)}%</span>
                <span class="status-badge ${targetStatus}">vs Target: ${currentVsTarget > 0 ? '+' : ''}${currentVsTarget.toFixed(1)}%</span>
            </div>
        </div>
    `;
  }

  /**
   * Generate recommendations content HTML
   */
  private generateRecommendationsContent(
    recommendations: ValidationReport['recommendations']
  ): string {
    const generateRecommendationList = (
      recs: ValidationReport['recommendations']['critical'],
      priority: string
    ) => `
        <div class="tab-content" id="tab-${priority}" ${priority === 'critical' ? 'style="display: block;"' : ''}>
            ${
              recs.length === 0
                ? `<p class="no-recommendations">No ${priority} priority recommendations</p>`
                : recs
                    .map(
                      (rec) => `
                <div class="recommendation-card priority-${priority}">
                    <div class="recommendation-header">
                        <h4>${rec.title}</h4>
                        <div class="recommendation-meta">
                            <span class="category-badge">${rec.category}</span>
                            <span class="effort-badge effort-${rec.effort}">${rec.effort} effort</span>
                        </div>
                    </div>
                    <p class="recommendation-description">${rec.description}</p>
                    <div class="recommendation-impact">
                        <strong>Impact:</strong> ${rec.impact}
                    </div>
                    <div class="recommendation-steps">
                        <strong>Steps:</strong>
                        <ol>
                            ${rec.steps.map((step) => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                    <div class="recommendation-packages">
                        <strong>Affected Packages:</strong>
                        ${rec.affectedPackages.map((pkg) => `<span class="package-tag">${pkg}</span>`).join('')}
                    </div>
                </div>
              `
                    )
                    .join('')
            }
        </div>
    `;

    return `
        ${generateRecommendationList(recommendations.critical, 'critical')}
        ${generateRecommendationList(recommendations.high, 'high')}
        ${generateRecommendationList(recommendations.medium, 'medium')}
        ${generateRecommendationList(recommendations.low, 'low')}
    `;
  }

  /**
   * Generate CSS styles for the dashboard
   */
  private generateDashboardCSS(): string {
    return `
/* Dashboard Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f8f9fa;
    color: #333;
    line-height: 1.6;
}

.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

/* Header */
.dashboard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

.header-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
}

.header-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.status-success .status-indicator { background-color: #28a745; }
.status-warning .status-indicator { background-color: #ffc107; }
.status-failure .status-indicator { background-color: #dc3545; }

.header-timestamp {
    font-size: 0.9rem;
    opacity: 0.9;
}

/* Summary Section */
.summary-section {
    margin-bottom: 40px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.summary-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #667eea;
}

.summary-card h3 {
    font-size: 1.1rem;
    margin-bottom: 12px;
    color: #666;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    transition: width 0.3s ease;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 4px;
}

.metric-value.success { color: #28a745; }
.metric-value.warning { color: #ffc107; }
.metric-value.error { color: #dc3545; }

/* Metrics Section */
.metrics-section, .charts-section, .trends-section, .comparisons-section, .recommendations-section {
    margin-bottom: 40px;
}

.metrics-section h2, .charts-section h2, .trends-section h2, .comparisons-section h2, .recommendations-section h2 {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #333;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.metric-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #6c757d;
}

.metric-card.success { border-left-color: #28a745; }
.metric-card.warning { border-left-color: #ffc107; }
.metric-card.error { border-left-color: #dc3545; }

.metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.metric-header h4 {
    font-size: 1rem;
    color: #666;
}

.trend-indicator {
    font-size: 1.2rem;
}

.metric-card .metric-value {
    font-size: 2.2rem;
    font-weight: 700;
    color: #333;
}

.metric-trend {
    font-size: 0.9rem;
    color: #666;
    margin-top: 4px;
}

/* Charts Section */
.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 30px;
}

.chart-container {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.chart-header h3 {
    font-size: 1.3rem;
    color: #333;
}

.chart-controls {
    display: flex;
    gap: 8px;
}

.chart-download, .chart-fullscreen {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
}

.chart-download:hover, .chart-fullscreen:hover {
    background: #f8f9fa;
}

.chart-wrapper {
    position: relative;
    height: 300px;
}

/* Trends Section */
.trends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.trend-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
    border-left: 4px solid #6c757d;
}

.trend-card.success { border-left-color: #28a745; }
.trend-card.error { border-left-color: #dc3545; }
.trend-card.neutral { border-left-color: #6c757d; }

.trend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.trend-header h4 {
    font-size: 1rem;
    color: #666;
}

.trend-icon {
    font-size: 1.5rem;
}

.trend-direction {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 8px;
}

.trend-change {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 4px;
}

.trend-timeframe {
    font-size: 0.9rem;
    color: #666;
}

/* Comparisons Section */
.comparisons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
}

.comparison-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comparison-card h4 {
    font-size: 1.2rem;
    margin-bottom: 16px;
    color: #333;
}

.comparison-bars {
    margin-bottom: 16px;
}

.comparison-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.comparison-bar label {
    width: 60px;
    font-size: 0.9rem;
    color: #666;
}

.bar {
    flex: 1;
    height: 20px;
    background-color: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.bar.current .bar-fill { background-color: #007bff; }
.bar.baseline .bar-fill { background-color: #6c757d; }
.bar.target .bar-fill { background-color: #28a745; }

.comparison-bar span {
    width: 80px;
    text-align: right;
    font-size: 0.9rem;
    font-weight: 600;
}

.comparison-status {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-badge.success {
    background-color: #d4edda;
    color: #155724;
}

.status-badge.warning {
    background-color: #fff3cd;
    color: #856404;
}

/* Recommendations Section */
.recommendations-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    border-bottom: 2px solid #e9ecef;
}

.tab-button {
    padding: 12px 20px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.tab-button:hover {
    color: #333;
    background-color: #f8f9fa;
}

.tab-button.active {
    color: #007bff;
    border-bottom-color: #007bff;
}

.recommendations-content {
    min-height: 300px;
}

.tab-content {
    display: none;
}

.no-recommendations {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 40px;
}

.recommendation-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    border-left: 4px solid #6c757d;
}

.recommendation-card.priority-critical { border-left-color: #dc3545; }
.recommendation-card.priority-high { border-left-color: #fd7e14; }
.recommendation-card.priority-medium { border-left-color: #ffc107; }
.recommendation-card.priority-low { border-left-color: #28a745; }

.recommendation-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 12px;
}

.recommendation-header h4 {
    font-size: 1.2rem;
    color: #333;
}

.recommendation-meta {
    display: flex;
    gap: 8px;
}

.category-badge, .effort-badge, .package-tag {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.category-badge {
    background-color: #e9ecef;
    color: #495057;
}

.effort-badge.effort-low {
    background-color: #d4edda;
    color: #155724;
}

.effort-badge.effort-medium {
    background-color: #fff3cd;
    color: #856404;
}

.effort-badge.effort-high {
    background-color: #f8d7da;
    color: #721c24;
}

.recommendation-description {
    margin-bottom: 16px;
    color: #666;
    line-height: 1.6;
}

.recommendation-impact, .recommendation-steps, .recommendation-packages {
    margin-bottom: 12px;
}

.recommendation-steps ol {
    margin-left: 20px;
    margin-top: 8px;
}

.recommendation-steps li {
    margin-bottom: 4px;
}

.package-tag {
    background-color: #e3f2fd;
    color: #1565c0;
    margin-right: 4px;
    margin-bottom: 4px;
    display: inline-block;
}

/* Footer */
.dashboard-footer {
    text-align: center;
    padding: 20px;
    color: #666;
    border-top: 1px solid #e9ecef;
    margin-top: 40px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 10px;
    }

    .header-content {
        flex-direction: column;
        text-align: center;
    }

    .header-content h1 {
        font-size: 2rem;
    }

    .charts-grid {
        grid-template-columns: 1fr;
    }

    .chart-wrapper {
        height: 250px;
    }

    .recommendations-tabs {
        flex-wrap: wrap;
    }

    .tab-button {
        flex: 1;
        min-width: 120px;
    }
}

/* Print Styles */
@media print {
    .chart-controls, .tab-button {
        display: none;
    }

    .tab-content {
        display: block !important;
    }

    .dashboard-container {
        max-width: none;
    }
}
`;
  }

  /**
   * Generate JavaScript for dashboard interactivity
   */
  private generateDashboardJS(dashboard: PerformanceDashboard): string {
    return `
// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Chart data
    const chartData = ${JSON.stringify(dashboard.charts, null, 2)};

    // Initialize charts
    initializeCharts();

    // Initialize tabs
    initializeTabs();

    // Initialize chart controls
    initializeChartControls();

    function initializeCharts() {
        chartData.forEach((chart, index) => {
            const canvas = document.getElementById('chart-' + chart.id);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            let chartConfig = {
                type: chart.type,
                data: generateChartData(chart),
                options: generateChartOptions(chart)
            };

            new Chart(ctx, chartConfig);
        });
    }

    function generateChartData(chart) {
        const colors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
            '#fd7e14', '#20c997', '#6c757d', '#e83e8c', '#17a2b8'
        ];

        switch (chart.type) {
            case 'bar':
                return {
                    labels: chart.data.map(d => d[chart.xAxis] || d.package || d.metric),
                    datasets: [{
                        label: chart.title,
                        data: chart.data.map(d => d[chart.yAxis] || d.buildTime || d.coverage || d.time),
                        backgroundColor: colors[0] + '80',
                        borderColor: colors[0],
                        borderWidth: 2
                    }]
                };

            case 'pie':
                return {
                    labels: chart.data.map(d => d.package || d.category),
                    datasets: [{
                        data: chart.data.map(d => d.size || d.count),
                        backgroundColor: colors.slice(0, chart.data.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                };

            case 'line':
                return {
                    labels: chart.data.map(d => d[chart.xAxis] || d.phase),
                    datasets: [{
                        label: chart.title,
                        data: chart.data.map(d => d[chart.yAxis] || d.heapUsed),
                        borderColor: colors[0],
                        backgroundColor: colors[0] + '20',
                        fill: true,
                        tension: 0.4
                    }]
                };

            default:
                return { labels: [], datasets: [] };
        }
    }

    function generateChartOptions(chart) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        };

        if (chart.type === 'bar' || chart.type === 'line') {
            baseOptions.scales = {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: chart.yAxis || 'Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: chart.xAxis || 'Category'
                    }
                }
            };
        }

        return baseOptions;
    }

    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.style.display = 'none');

                // Add active class to clicked button and show corresponding content
                this.classList.add('active');
                const targetContent = document.getElementById('tab-' + tabId);
                if (targetContent) {
                    targetContent.style.display = 'block';
                }
            });
        });
    }

    function initializeChartControls() {
        // Download chart functionality
        document.querySelectorAll('.chart-download').forEach(button => {
            button.addEventListener('click', function() {
                const chartId = this.getAttribute('data-chart');
                const canvas = document.getElementById('chart-' + chartId);
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = chartId + '-chart.png';
                    link.href = canvas.toDataURL();
                    link.click();
                }
            });
        });

        // Fullscreen chart functionality
        document.querySelectorAll('.chart-fullscreen').forEach(button => {
            button.addEventListener('click', function() {
                const chartId = this.getAttribute('data-chart');
                const chartContainer = document.querySelector('#chart-' + chartId).closest('.chart-container');

                if (chartContainer.requestFullscreen) {
                    chartContainer.requestFullscreen();
                } else if (chartContainer.webkitRequestFullscreen) {
                    chartContainer.webkitRequestFullscreen();
                } else if (chartContainer.msRequestFullscreen) {
                    chartContainer.msRequestFullscreen();
                }
            });
        });
    }

    // Auto-refresh functionality (optional)
    function setupAutoRefresh() {
        const refreshInterval = 5 * 60 * 1000; // 5 minutes

        setInterval(() => {
            // Check if there's new data available
            fetch('./chart-data.json')
                .then(response => response.json())
                .then(data => {
                    // Update charts if data has changed
                    console.log('Checking for data updates...');
                })
                .catch(error => {
                    console.log('Auto-refresh check failed:', error);
                });
        }, refreshInterval);
    }

    // Initialize auto-refresh (commented out by default)
    // setupAutoRefresh();
});

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    return (ms / 60000).toFixed(1) + 'm';
}

function formatPercentage(value) {
    return value.toFixed(1) + '%';
}
`;
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
   * Set custom output directory
   */
  setOutputDirectory(directory: string): void {
    this.outputDirectory = directory;
    this.ensureOutputDirectory();
  }

  /**
   * Get output directory path
   */
  getOutputDirectory(): string {
    return this.outputDirectory;
  }
}

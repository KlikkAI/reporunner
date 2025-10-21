import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationController } from '../controller/ValidationController.js';
import type { ValidationResults } from '../types/index.js';

/**
 * Continuous validation integration for CI/CD pipelines
 * Requirements: 1.5, 2.5, 4.5
 */
export class ContinuousValidationIntegration extends EventEmitter {
  private controller: ValidationController;
  private workspaceRoot: string;
  private historyDir: string;
  private configPath: string;
  private config: CIValidationConfig;

  constructor(workspaceRoot: string = process.cwd()) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.historyDir = join(workspaceRoot, '.validation-history');
    this.configPath = join(workspaceRoot, '.validation-ci.json');
    this.controller = new ValidationController(workspaceRoot);
    this.config = this.loadConfig();
    this.setupHistoryDirectory();
  }

  /**
   * Execute validation for CI/CD pipeline
   */
  async executeForCI(options: CIExecutionOptions = {}): Promise<CIValidationResult> {
    const startTime = new Date();

    try {
      // Load previous results for comparison
      const previousResults = this.loadPreviousResults();

      // Execute validation
      const results = await this.controller.executeValidation();

      // Store results in history
      await this.storeResults(results);

      // Analyze trends and regressions
      const analysis = this.analyzeResults(results, previousResults);

      // Generate CI-specific report
      const ciResult: CIValidationResult = {
        success: results.status === 'success',
        results,
        analysis,
        artifacts: await this.generateArtifacts(results, options),
        notifications: this.generateNotifications(results, analysis),
        exitCode: this.determineExitCode(results, analysis),
        duration: Date.now() - startTime.getTime(),
      };

      // Send notifications if configured
      if (this.config.notifications.enabled) {
        await this.sendNotifications(ciResult);
      }

      return ciResult;
    } catch (error) {
      const ciResult: CIValidationResult = {
        success: false,
        results: null,
        analysis: null,
        artifacts: [],
        notifications: [
          {
            type: 'failure',
            title: 'Validation Execution Failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            severity: 'critical',
          },
        ],
        exitCode: 1,
        duration: Date.now() - startTime.getTime(),
      };

      if (this.config.notifications.enabled) {
        await this.sendNotifications(ciResult);
      }

      return ciResult;
    }
  }

  /**
   * Setup validation for GitHub Actions
   */
  generateGitHubActionsWorkflow(): string {
    return `
name: Phase A Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  validation:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run Phase A Validation
      run: |
        npx @klikkflow/validation run \\
          --output ./validation-results \\
          --format json \\
          --verbose
      env:
        CI: true

    - name: Upload validation results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: validation-results
        path: validation-results/

    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = require('path');

          try {
            const resultsPath = path.join(process.cwd(), 'validation-results');
            const files = fs.readdirSync(resultsPath);
            const jsonFile = files.find(f => f.endsWith('.json'));

            if (jsonFile) {
              const results = JSON.parse(fs.readFileSync(path.join(resultsPath, jsonFile), 'utf8'));

              const comment = \`## 🔍 Phase A Validation Results

**Status:** \${results.status === 'success' ? '✅ Success' : results.status === 'warning' ? '⚠️ Warning' : '❌ Failure'}

### Summary
- **Tests:** \${results.systemValidation.testResults.passedTests}/\${results.systemValidation.testResults.totalTests} passed
- **Coverage:** \${results.systemValidation.testResults.coverage.overall.toFixed(1)}%
- **Build Time Improvement:** \${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%
- **Bundle Size Reduction:** \${results.performanceAnalysis.bundleMetrics.reductionPercentage.toFixed(1)}%

\${results.recommendations.length > 0 ? \`### 📋 Recommendations (\${results.recommendations.length})
\${results.recommendations.slice(0, 3).map(r => \`- **\${r.priority.toUpperCase()}:** \${r.title}\`).join('\\n')}
\${results.recommendations.length > 3 ? \`\\n... and \${results.recommendations.length - 3} more\` : ''}\` : ''}
              \`;

              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
          } catch (error) {
            console.error('Failed to post comment:', error);
          }
    `.trim();
  }

  /**
   * Setup validation for GitLab CI
   */
  generateGitLabCIConfig(): string {
    return `
stages:
  - validation

phase-a-validation:
  stage: validation
  image: node:18
  cache:
    paths:
      - node_modules/
      - .pnpm-store/
  before_script:
    - npm install -g pnpm
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile
  script:
    - npx @klikkflow/validation run --output ./validation-results --format json --verbose
  artifacts:
    when: always
    paths:
      - validation-results/
    reports:
      junit: validation-results/junit-report.xml
    expire_in: 30 days
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "develop"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_PIPELINE_SOURCE == "schedule"
    `.trim();
  }

  /**
   * Setup validation for Jenkins
   */
  generateJenkinsfile(): string {
    return `
pipeline {
    agent any

    tools {
        nodejs '18'
    }

    triggers {
        cron('H 2 * * *') // Daily at 2 AM
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install -g pnpm'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Phase A Validation') {
            steps {
                sh '''
                    npx @klikkflow/validation run \\
                        --output ./validation-results \\
                        --format json \\
                        --verbose
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'validation-results/**/*', fingerprint: true
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'validation-results',
                        reportFiles: '*.html',
                        reportName: 'Validation Report'
                    ])
                }
                failure {
                    emailext (
                        subject: "Phase A Validation Failed - \${env.JOB_NAME} #\${env.BUILD_NUMBER}",
                        body: "The Phase A validation has failed. Please check the build logs and validation report.",
                        to: "\${env.CHANGE_AUTHOR_EMAIL}"
                    )
                }
            }
        }
    }
}
    `.trim();
  }

  /**
   * Load configuration
   */
  private loadConfig(): CIValidationConfig {
    const defaultConfig: CIValidationConfig = {
      thresholds: {
        buildTimeRegression: 10, // 10% regression threshold
        bundleSizeIncrease: 5, // 5% increase threshold
        coverageDecrease: 2, // 2% coverage decrease threshold
        criticalIssues: 0, // No critical issues allowed
      },
      notifications: {
        enabled: false,
        channels: [],
        onSuccess: false,
        onFailure: true,
        onRegression: true,
      },
      artifacts: {
        keepHistory: 30, // Keep 30 days of history
        formats: ['json', 'html'],
        includeRawData: false,
      },
      failureConditions: {
        criticalIssues: true,
        buildTimeRegression: false,
        bundleSizeIncrease: false,
        coverageDecrease: false,
      },
    };

    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, 'utf8');
        return { ...defaultConfig, ...JSON.parse(configData) };
      } catch (_error) {}
    }

    return defaultConfig;
  }

  /**
   * Setup history directory
   */
  private setupHistoryDirectory(): void {
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * Store validation results in history
   */
  private async storeResults(results: ValidationResults): Promise<void> {
    const timestamp = results.timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = join(this.historyDir, `validation-${timestamp}.json`);

    writeFileSync(filename, JSON.stringify(results, null, 2));

    // Update latest results
    const latestPath = join(this.historyDir, 'latest.json');
    writeFileSync(latestPath, JSON.stringify(results, null, 2));

    // Cleanup old results based on retention policy
    await this.cleanupOldResults();
  }

  /**
   * Load previous validation results
   */
  private loadPreviousResults(): ValidationResults | null {
    const latestPath = join(this.historyDir, 'latest.json');

    if (existsSync(latestPath)) {
      try {
        const data = readFileSync(latestPath, 'utf8');
        return JSON.parse(data);
      } catch (_error) {}
    }

    return null;
  }

  /**
   * Analyze current results against previous results
   */
  private analyzeResults(
    current: ValidationResults,
    previous: ValidationResults | null
  ): ValidationAnalysis {
    if (!previous) {
      return {
        isRegression: false,
        improvements: [],
        regressions: [],
        newIssues: [],
        resolvedIssues: [],
        trends: {
          buildTime: 'stable',
          bundleSize: 'stable',
          coverage: 'stable',
          issues: 'stable',
        },
      };
    }

    const analysis: ValidationAnalysis = {
      isRegression: false,
      improvements: [],
      regressions: [],
      newIssues: [],
      resolvedIssues: [],
      trends: {
        buildTime: this.analyzeTrend(
          current.performanceAnalysis.buildMetrics.totalBuildTime,
          previous.performanceAnalysis.buildMetrics.totalBuildTime,
          this.config.thresholds.buildTimeRegression
        ),
        bundleSize: this.analyzeTrend(
          current.performanceAnalysis.bundleMetrics.totalSize,
          previous.performanceAnalysis.bundleMetrics.totalSize,
          this.config.thresholds.bundleSizeIncrease
        ),
        coverage: this.analyzeTrend(
          current.systemValidation.testResults.coverage.overall,
          previous.systemValidation.testResults.coverage.overall,
          -this.config.thresholds.coverageDecrease
        ),
        issues: this.analyzeTrend(
          current.recommendations.filter((r) => r.priority === 'critical').length,
          previous.recommendations.filter((r) => r.priority === 'critical').length,
          0
        ),
      },
    };

    // Check for regressions
    if (
      analysis.trends.buildTime === 'degrading' ||
      analysis.trends.bundleSize === 'degrading' ||
      analysis.trends.coverage === 'degrading' ||
      analysis.trends.issues === 'degrading'
    ) {
      analysis.isRegression = true;
    }

    return analysis;
  }

  /**
   * Analyze trend between two values
   */
  private analyzeTrend(
    current: number,
    previous: number,
    threshold: number
  ): 'improving' | 'degrading' | 'stable' {
    const change = ((current - previous) / previous) * 100;

    if (Math.abs(change) < Math.abs(threshold)) {
      return 'stable';
    }

    return change > 0 ? 'degrading' : 'improving';
  }

  /**
   * Generate CI artifacts
   */
  private async generateArtifacts(
    results: ValidationResults,
    _options: CIExecutionOptions
  ): Promise<CIArtifact[]> {
    const artifacts: CIArtifact[] = [];
    const timestamp = results.timestamp.toISOString().replace(/[:.]/g, '-');

    // JSON results
    if (this.config.artifacts.formats.includes('json')) {
      const filename = `validation-results-${timestamp}.json`;
      const path = join(this.workspaceRoot, 'validation-results', filename);
      artifacts.push({
        name: 'JSON Results',
        path,
        type: 'json',
        size: JSON.stringify(results).length,
      });
    }

    // HTML report
    if (this.config.artifacts.formats.includes('html')) {
      const filename = `validation-report-${timestamp}.html`;
      const path = join(this.workspaceRoot, 'validation-results', filename);
      artifacts.push({
        name: 'HTML Report',
        path,
        type: 'html',
        size: 0, // Will be calculated after generation
      });
    }

    return artifacts;
  }

  /**
   * Generate notifications based on results
   */
  private generateNotifications(
    results: ValidationResults,
    analysis: ValidationAnalysis | null
  ): CINotification[] {
    const notifications: CINotification[] = [];

    if (results.status === 'failure') {
      notifications.push({
        type: 'failure',
        title: 'Phase A Validation Failed',
        message: `Validation failed with ${results.recommendations.filter((r) => r.priority === 'critical').length} critical issues`,
        severity: 'critical',
      });
    } else if (results.status === 'warning') {
      notifications.push({
        type: 'warning',
        title: 'Phase A Validation Completed with Warnings',
        message: `Validation completed but found ${results.recommendations.length} recommendations`,
        severity: 'warning',
      });
    } else if (this.config.notifications.onSuccess) {
      notifications.push({
        type: 'success',
        title: 'Phase A Validation Successful',
        message: 'All validation checks passed successfully',
        severity: 'info',
      });
    }

    if (analysis?.isRegression && this.config.notifications.onRegression) {
      notifications.push({
        type: 'regression',
        title: 'Performance Regression Detected',
        message: 'Current validation shows performance regression compared to previous run',
        severity: 'warning',
      });
    }

    return notifications;
  }

  /**
   * Determine exit code for CI
   */
  private determineExitCode(
    results: ValidationResults,
    analysis: ValidationAnalysis | null
  ): number {
    // Critical issues always fail
    if (this.config.failureConditions.criticalIssues) {
      const criticalIssues = results.recommendations.filter(
        (r) => r.priority === 'critical'
      ).length;
      if (criticalIssues > this.config.thresholds.criticalIssues) {
        return 1;
      }
    }

    // Check other failure conditions
    if (analysis) {
      if (
        this.config.failureConditions.buildTimeRegression &&
        analysis.trends.buildTime === 'degrading'
      ) {
        return 1;
      }
      if (
        this.config.failureConditions.bundleSizeIncrease &&
        analysis.trends.bundleSize === 'degrading'
      ) {
        return 1;
      }
      if (
        this.config.failureConditions.coverageDecrease &&
        analysis.trends.coverage === 'degrading'
      ) {
        return 1;
      }
    }

    return results.status === 'failure' ? 1 : 0;
  }

  /**
   * Send notifications
   */
  private async sendNotifications(result: CIValidationResult): Promise<void> {
    for (const notification of result.notifications) {
      for (const channel of this.config.notifications.channels) {
        try {
          await this.sendNotification(notification, channel);
        } catch (_error) {}
      }
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    notification: CINotification,
    channel: NotificationChannel
  ): Promise<void> {
    switch (channel.type) {
      case 'slack':
        await this.sendSlackNotification(notification, channel);
        break;
      case 'email':
        await this.sendEmailNotification(notification, channel);
        break;
      case 'webhook':
        await this.sendWebhookNotification(notification, channel);
        break;
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    _notification: CINotification,
    _channel: NotificationChannel
  ): Promise<void> {}

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    _notification: CINotification,
    _channel: NotificationChannel
  ): Promise<void> {}

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    _notification: CINotification,
    _channel: NotificationChannel
  ): Promise<void> {}

  /**
   * Cleanup old validation results
   */
  private async cleanupOldResults(): Promise<void> {
    // Implementation for cleaning up old results based on retention policy
    // This would remove files older than the configured retention period
  }
}

// Types for CI integration
export interface CIValidationConfig {
  thresholds: {
    buildTimeRegression: number;
    bundleSizeIncrease: number;
    coverageDecrease: number;
    criticalIssues: number;
  };
  notifications: {
    enabled: boolean;
    channels: NotificationChannel[];
    onSuccess: boolean;
    onFailure: boolean;
    onRegression: boolean;
  };
  artifacts: {
    keepHistory: number;
    formats: ('json' | 'html' | 'markdown')[];
    includeRawData: boolean;
  };
  failureConditions: {
    criticalIssues: boolean;
    buildTimeRegression: boolean;
    bundleSizeIncrease: boolean;
    coverageDecrease: boolean;
  };
}

export interface CIExecutionOptions {
  branch?: string;
  commitSha?: string;
  pullRequestNumber?: number;
  buildNumber?: string;
  environment?: 'ci' | 'local';
}

export interface CIValidationResult {
  success: boolean;
  results: ValidationResults | null;
  analysis: ValidationAnalysis | null;
  artifacts: CIArtifact[];
  notifications: CINotification[];
  exitCode: number;
  duration: number;
}

export interface ValidationAnalysis {
  isRegression: boolean;
  improvements: string[];
  regressions: string[];
  newIssues: string[];
  resolvedIssues: string[];
  trends: {
    buildTime: 'improving' | 'degrading' | 'stable';
    bundleSize: 'improving' | 'degrading' | 'stable';
    coverage: 'improving' | 'degrading' | 'stable';
    issues: 'improving' | 'degrading' | 'stable';
  };
}

export interface CIArtifact {
  name: string;
  path: string;
  type: 'json' | 'html' | 'markdown' | 'xml';
  size: number;
}

export interface CINotification {
  type: 'success' | 'failure' | 'warning' | 'regression';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface NotificationChannel {
  type: 'slack' | 'email' | 'webhook';
  config: Record<string, any>;
}

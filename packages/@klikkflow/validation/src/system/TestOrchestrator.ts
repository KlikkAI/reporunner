import { spawn } from 'node:child_process';
import type { PackageTestResult, TestResults } from '../types/index.js';
import { TestResultAnalyzer } from './TestResultAnalyzer.js';
import { TestSuiteRunner } from './TestSuiteRunner.js';

/**
 * Test orchestration system for coordinating test execution across packages
 * Requirements: 1.1, 1.2
 */
export class TestOrchestrator {
  private testRunner: TestSuiteRunner;
  private analyzer: TestResultAnalyzer;
  private readonly workspaceRoot: string;

  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.testRunner = new TestSuiteRunner(workspaceRoot);
    this.analyzer = new TestResultAnalyzer();
  }

  /**
   * Execute comprehensive test suite with orchestration
   * Requirements: 1.1
   */
  async executeComprehensiveTests(
    options: TestExecutionOptions = {}
  ): Promise<TestOrchestrationResult> {
    const startTime = Date.now();

    try {
      // Run tests based on execution strategy
      const testResults = await this.executeTestsByStrategy(options);

      // Analyze results
      const analysis = this.analyzer.analyzeTestResults(testResults);

      // Generate execution report
      const report = this.analyzer.generateExecutionReport(testResults);

      // Check for critical failures
      const criticalIssues = this.identifyCriticalIssues(testResults);

      return {
        testResults,
        analysis,
        report,
        criticalIssues,
        executionTime: Date.now() - startTime,
        strategy: options.strategy || 'parallel',
        success: testResults.overallStatus === 'success' && criticalIssues.length === 0,
      };
    } catch (error) {
      throw new Error(
        `Test orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute tests with parallel strategy
   * Requirements: 1.1
   */
  async executeParallelTests(packageFilter?: string[]): Promise<TestResults> {
    const _packages = packageFilter || this.getAvailablePackages();

    // Use Turbo for parallel execution
    const _turboResult = await this.executeTurboCommand(['test', '--parallel']);

    // Get detailed results from test runner
    const detailedResults = await this.testRunner.runAllTests();

    // Filter results if package filter is specified
    if (packageFilter) {
      detailedResults.packageResults = detailedResults.packageResults.filter((pkg) =>
        packageFilter.includes(pkg.packageName)
      );
    }

    return detailedResults;
  }

  /**
   * Execute tests with sequential strategy
   * Requirements: 1.1
   */
  async executeSequentialTests(packageFilter?: string[]): Promise<TestResults> {
    const packages = packageFilter || this.getAvailablePackages();
    const packageResults: PackageTestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const startTime = Date.now();

    for (const packageName of packages) {
      try {
        const result = await this.testRunner.runPackageTests(packageName);
        packageResults.push(result.packageResults[0]);

        totalTests += result.totalTests;
        passedTests += result.passedTests;
        failedTests += result.failedTests;
        skippedTests += result.skippedTests;
      } catch (error) {
        packageResults.push({
          packageName,
          status: 'failure',
          testCount: 0,
          passedCount: 0,
          failedCount: 1,
          coverage: 0,
          duration: 0,
          errors: [
            `Failed to execute tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ],
        });
        failedTests += 1;
      }
    }

    // Generate overall coverage report
    const coverage = await this.testRunner.generateCoverageReport();

    return {
      overallStatus: failedTests === 0 ? 'success' : 'failure',
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      coverage,
      packageResults,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute tests for specific packages only
   * Requirements: 1.1
   */
  async executePackageSubset(packages: string[]): Promise<TestResults> {
    const validPackages = packages.filter((pkg) => this.getAvailablePackages().includes(pkg));

    if (validPackages.length === 0) {
      throw new Error('No valid packages specified for testing');
    }

    return this.executeParallelTests(validPackages);
  }

  /**
   * Execute tests with coverage focus
   * Requirements: 1.1
   */
  async executeCoverageFocusedTests(): Promise<TestResults> {
    // Run tests with enhanced coverage reporting
    const _result = await this.executeTurboCommand([
      'test',
      '--coverage',
      '--coverage.reporter=text',
      '--coverage.reporter=json-summary',
      '--coverage.reporter=html',
      '--coverage.reporter=lcov',
    ]);

    return this.testRunner.runAllTests();
  }

  /**
   * Execute smoke tests for quick validation
   * Requirements: 1.1
   */
  async executeSmokeTests(): Promise<TestResults> {
    // Run only essential tests for quick feedback
    const _result = await this.executeTurboCommand([
      'test',
      '--testNamePattern=smoke|essential|critical',
      '--maxWorkers=2',
    ]);

    return this.testRunner.runAllTests();
  }

  /**
   * Get test execution history and trends
   */
  getTestHistory(): TestResults[] {
    return this.testRunner.getTestHistory();
  }

  /**
   * Compare current results with historical data
   */
  compareWithHistory(currentResults: TestResults): TestTrendAnalysis | null {
    const history = this.getTestHistory();

    if (history.length === 0) {
      return null;
    }

    const previousResults = history[history.length - 1];
    const comparison = this.analyzer.compareWithPrevious(currentResults, previousResults);

    return {
      comparison,
      historicalTrend: this.calculateHistoricalTrend(history),
      regressions: this.identifyRegressions(currentResults, previousResults),
    };
  }

  /**
   * Execute tests based on strategy
   */
  private async executeTestsByStrategy(options: TestExecutionOptions): Promise<TestResults> {
    switch (options.strategy) {
      case 'sequential':
        return this.executeSequentialTests(options.packageFilter);
      case 'coverage-focused':
        return this.executeCoverageFocusedTests();
      case 'smoke':
        return this.executeSmokeTests();
      case 'subset':
        if (!options.packageFilter || options.packageFilter.length === 0) {
          throw new Error('Package filter required for subset strategy');
        }
        return this.executePackageSubset(options.packageFilter);
      default:
        return this.executeParallelTests(options.packageFilter);
    }
  }

  /**
   * Execute Turbo command for test orchestration
   */
  private async executeTurboCommand(args: string[]): Promise<TurboResult> {
    return new Promise((resolve, reject) => {
      const child = spawn('pnpm', ['turbo', ...args], {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
          success: code === 0,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get list of available packages for testing
   */
  private getAvailablePackages(): string[] {
    return [
      'frontend',
      'backend',
      'shared',
      '@reporunner/ai',
      '@reporunner/api',
      '@reporunner/auth',
      '@reporunner/database',
      '@reporunner/workflow-engine',
      '@reporunner/core',
      '@reporunner/design-system',
      '@reporunner/validation',
    ];
  }

  /**
   * Identify critical issues that require immediate attention
   */
  private identifyCriticalIssues(results: TestResults): CriticalIssue[] {
    const issues: CriticalIssue[] = [];

    // Critical: Core package failures
    const corePackageFailures = results.packageResults.filter(
      (pkg) => ['@reporunner/core', 'shared'].includes(pkg.packageName) && pkg.status === 'failure'
    );

    for (const failure of corePackageFailures) {
      issues.push({
        type: 'core-package-failure',
        severity: 'critical',
        packageName: failure.packageName,
        description: `Core package ${failure.packageName} has test failures`,
        impact: 'May affect multiple dependent packages',
        errors: failure.errors || [],
      });
    }

    // Critical: Very low overall coverage
    if (results.coverage.overall < 30) {
      issues.push({
        type: 'low-coverage',
        severity: 'critical',
        description: `Overall test coverage is critically low: ${results.coverage.overall}%`,
        impact: 'High risk of undetected bugs in production',
      });
    }

    // High: Multiple package failures
    const failedPackages = results.packageResults.filter((pkg) => pkg.status === 'failure');
    if (failedPackages.length >= 3) {
      issues.push({
        type: 'multiple-failures',
        severity: 'high',
        description: `${failedPackages.length} packages have test failures`,
        impact: 'Indicates systemic issues that need investigation',
        affectedPackages: failedPackages.map((pkg) => pkg.packageName),
      });
    }

    return issues;
  }

  /**
   * Calculate historical trend from test history
   */
  private calculateHistoricalTrend(history: TestResults[]): HistoricalTrend {
    if (history.length < 2) {
      return { trend: 'insufficient-data', dataPoints: history.length };
    }

    const recentResults = history.slice(-5); // Last 5 runs
    const successRates = recentResults.map((result) =>
      result.totalTests > 0 ? (result.passedTests / result.totalTests) * 100 : 0
    );

    const coverageRates = recentResults.map((result) => result.coverage.overall);

    const successTrend = this.calculateTrend(successRates);
    const coverageTrend = this.calculateTrend(coverageRates);

    return {
      trend:
        successTrend === 'improving' && coverageTrend === 'improving'
          ? 'improving'
          : successTrend === 'degrading' || coverageTrend === 'degrading'
            ? 'degrading'
            : 'stable',
      dataPoints: recentResults.length,
      successRateTrend: successTrend,
      coverageTrend: coverageTrend,
    };
  }

  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 2) {
      return 'stable';
    }
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;

    if (Math.abs(change) < 2) {
      return 'stable'; // Less than 2% change
    }
    return change > 0 ? 'improving' : 'degrading';
  }

  /**
   * Identify regressions between current and previous results
   */
  private identifyRegressions(current: TestResults, previous: TestResults): Regression[] {
    const regressions: Regression[] = [];

    // Overall success rate regression
    const currentSuccessRate =
      current.totalTests > 0 ? (current.passedTests / current.totalTests) * 100 : 0;
    const previousSuccessRate =
      previous.totalTests > 0 ? (previous.passedTests / previous.totalTests) * 100 : 0;

    if (currentSuccessRate < previousSuccessRate - 5) {
      // 5% threshold
      regressions.push({
        type: 'success-rate',
        description: `Success rate decreased from ${previousSuccessRate.toFixed(1)}% to ${currentSuccessRate.toFixed(1)}%`,
        severity: 'medium',
      });
    }

    // Coverage regression
    if (current.coverage.overall < previous.coverage.overall - 3) {
      // 3% threshold
      regressions.push({
        type: 'coverage',
        description: `Coverage decreased from ${previous.coverage.overall}% to ${current.coverage.overall}%`,
        severity: 'medium',
      });
    }

    // Package-specific regressions
    const previousPackageMap = new Map(
      previous.packageResults.map((pkg) => [pkg.packageName, pkg])
    );

    for (const currentPkg of current.packageResults) {
      const previousPkg = previousPackageMap.get(currentPkg.packageName);

      if (previousPkg && previousPkg.status === 'success' && currentPkg.status === 'failure') {
        regressions.push({
          type: 'package-failure',
          description: `Package ${currentPkg.packageName} tests started failing`,
          severity: 'high',
          packageName: currentPkg.packageName,
        });
      }
    }

    return regressions;
  }
}

// Type definitions
export interface TestExecutionOptions {
  strategy?: 'parallel' | 'sequential' | 'coverage-focused' | 'smoke' | 'subset';
  packageFilter?: string[];
  maxWorkers?: number;
  timeout?: number;
}

export interface TestOrchestrationResult {
  testResults: TestResults;
  analysis: import('./TestResultAnalyzer.js').TestAnalysis;
  report: import('./TestResultAnalyzer.js').TestExecutionReport;
  criticalIssues: CriticalIssue[];
  executionTime: number;
  strategy: string;
  success: boolean;
}

export interface TurboResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface CriticalIssue {
  type: 'core-package-failure' | 'low-coverage' | 'multiple-failures';
  severity: 'critical' | 'high' | 'medium';
  packageName?: string;
  description: string;
  impact: string;
  errors?: string[];
  affectedPackages?: string[];
}

export interface TestTrendAnalysis {
  comparison: import('./TestResultAnalyzer.js').TestComparison;
  historicalTrend: HistoricalTrend;
  regressions: Regression[];
}

export interface HistoricalTrend {
  trend: 'improving' | 'degrading' | 'stable' | 'insufficient-data';
  dataPoints: number;
  successRateTrend?: 'improving' | 'degrading' | 'stable';
  coverageTrend?: 'improving' | 'degrading' | 'stable';
}

export interface Regression {
  type: 'success-rate' | 'coverage' | 'package-failure';
  description: string;
  severity: 'critical' | 'high' | 'medium';
  packageName?: string;
}

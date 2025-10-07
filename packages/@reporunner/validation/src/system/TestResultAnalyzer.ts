import type { CoverageReport, PackageTestResult, TestResults } from '../types/index.js';

/**
 * Test result analysis and reporting utilities
 * Requirements: 1.1, 1.2
 */
export class TestResultAnalyzer {
  /**
   * Analyze test results and provide insights
   */
  analyzeTestResults(results: TestResults): TestAnalysis {
    const successRate =
      results.totalTests > 0 ? Math.round((results.passedTests / results.totalTests) * 100) : 0;

    const coverageScore = this.calculateCoverageScore(results.coverage);
    const packageAnalysis = this.analyzePackageResults(results.packageResults);

    return {
      successRate,
      coverageScore,
      totalDuration: results.duration,
      packageAnalysis,
      recommendations: this.generateRecommendations(results),
      riskAssessment: this.assessRisk(results),
    };
  }

  /**
   * Compare test results with previous runs
   */
  compareWithPrevious(current: TestResults, previous: TestResults): TestComparison {
    const testCountChange = current.totalTests - previous.totalTests;
    const successRateChange =
      this.calculateSuccessRate(current) - this.calculateSuccessRate(previous);
    const coverageChange = current.coverage.overall - previous.coverage.overall;
    const durationChange = current.duration - previous.duration;

    return {
      testCountChange,
      successRateChange,
      coverageChange,
      durationChange,
      trend: this.determineTrend(successRateChange, coverageChange, durationChange),
      packageComparisons: this.comparePackageResults(
        current.packageResults,
        previous.packageResults
      ),
    };
  }

  /**
   * Generate test execution report
   */
  generateExecutionReport(results: TestResults): TestExecutionReport {
    const analysis = this.analyzeTestResults(results);

    return {
      timestamp: new Date(),
      summary: {
        status: results.overallStatus,
        totalTests: results.totalTests,
        successRate: analysis.successRate,
        coverageScore: analysis.coverageScore,
        duration: results.duration,
      },
      packageBreakdown: results.packageResults.map((pkg) => ({
        name: pkg.packageName,
        status: pkg.status,
        tests: pkg.testCount,
        coverage: pkg.coverage,
        duration: pkg.duration,
        issues: pkg.errors?.length || 0,
      })),
      coverageDetails: results.coverage,
      recommendations: analysis.recommendations,
      riskLevel: analysis.riskAssessment.level,
    };
  }

  /**
   * Identify failing packages and their issues
   */
  identifyFailingPackages(packageResults: PackageTestResult[]): FailingPackageAnalysis[] {
    return packageResults
      .filter((pkg) => pkg.status === 'failure')
      .map((pkg) => ({
        packageName: pkg.packageName,
        failedTests: pkg.failedCount,
        errors: pkg.errors || [],
        coverage: pkg.coverage,
        duration: pkg.duration,
        severity: this.calculatePackageSeverity(pkg),
        suggestedActions: this.suggestPackageActions(pkg),
      }));
  }

  /**
   * Calculate overall coverage score
   */
  private calculateCoverageScore(coverage: CoverageReport): number {
    const weights = {
      lines: 0.4,
      statements: 0.3,
      branches: 0.2,
      functions: 0.1,
    };

    return Math.round(
      coverage.lines * weights.lines +
        coverage.statements * weights.statements +
        coverage.branches * weights.branches +
        coverage.functions * weights.functions
    );
  }

  /**
   * Analyze individual package results
   */
  private analyzePackageResults(packageResults: PackageTestResult[]): PackageAnalysis[] {
    return packageResults.map((pkg) => ({
      packageName: pkg.packageName,
      status: pkg.status,
      successRate: pkg.testCount > 0 ? Math.round((pkg.passedCount / pkg.testCount) * 100) : 0,
      coverage: pkg.coverage,
      performance: this.categorizePerformance(pkg.duration),
      issues: pkg.errors?.length || 0,
    }));
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: TestResults): string[] {
    const recommendations: string[] = [];

    if (results.failedTests > 0) {
      recommendations.push(`Fix ${results.failedTests} failing tests to improve reliability`);
    }

    if (results.coverage.overall < 70) {
      recommendations.push('Increase test coverage to meet the 70% threshold');
    }

    const slowPackages = results.packageResults.filter((pkg) => pkg.duration > 10000);
    if (slowPackages.length > 0) {
      recommendations.push(
        `Optimize test performance for: ${slowPackages.map((p) => p.packageName).join(', ')}`
      );
    }

    const lowCoveragePackages = results.packageResults.filter((pkg) => pkg.coverage < 60);
    if (lowCoveragePackages.length > 0) {
      recommendations.push(
        `Add more tests for: ${lowCoveragePackages.map((p) => p.packageName).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Assess risk level based on test results
   */
  private assessRisk(results: TestResults): RiskAssessment {
    let riskScore = 0;
    const factors: string[] = [];

    // Failed tests increase risk
    if (results.failedTests > 0) {
      riskScore += results.failedTests * 10;
      factors.push(`${results.failedTests} failing tests`);
    }

    // Low coverage increases risk
    if (results.coverage.overall < 50) {
      riskScore += 30;
      factors.push('Very low test coverage');
    } else if (results.coverage.overall < 70) {
      riskScore += 15;
      factors.push('Low test coverage');
    }

    // Package failures increase risk
    const failedPackages = results.packageResults.filter((pkg) => pkg.status === 'failure');
    if (failedPackages.length > 0) {
      riskScore += failedPackages.length * 20;
      factors.push(`${failedPackages.length} packages with test failures`);
    }

    const level = riskScore >= 50 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

    return {
      level,
      score: riskScore,
      factors,
    };
  }

  /**
   * Calculate success rate for test results
   */
  private calculateSuccessRate(results: TestResults): number {
    return results.totalTests > 0
      ? Math.round((results.passedTests / results.totalTests) * 100)
      : 0;
  }

  /**
   * Determine trend based on changes
   */
  private determineTrend(
    successRateChange: number,
    coverageChange: number,
    durationChange: number
  ): 'improving' | 'degrading' | 'stable' {
    const positiveChanges = [
      successRateChange > 0,
      coverageChange > 0,
      durationChange < 0, // Faster is better
    ].filter(Boolean).length;

    const negativeChanges = [
      successRateChange < 0,
      coverageChange < 0,
      durationChange > 1000, // Significantly slower
    ].filter(Boolean).length;

    if (positiveChanges > negativeChanges) {
      return 'improving';
    }
    if (negativeChanges > positiveChanges) {
      return 'degrading';
    }
    return 'stable';
  }

  /**
   * Compare package results between runs
   */
  private comparePackageResults(
    current: PackageTestResult[],
    previous: PackageTestResult[]
  ): PackageComparison[] {
    const previousMap = new Map(previous.map((pkg) => [pkg.packageName, pkg]));

    return current.map((currentPkg) => {
      const previousPkg = previousMap.get(currentPkg.packageName);

      if (!previousPkg) {
        return {
          packageName: currentPkg.packageName,
          testCountChange: currentPkg.testCount,
          coverageChange: currentPkg.coverage,
          durationChange: currentPkg.duration,
          statusChange: 'new',
        };
      }

      return {
        packageName: currentPkg.packageName,
        testCountChange: currentPkg.testCount - previousPkg.testCount,
        coverageChange: currentPkg.coverage - previousPkg.coverage,
        durationChange: currentPkg.duration - previousPkg.duration,
        statusChange:
          currentPkg.status === previousPkg.status
            ? 'unchanged'
            : currentPkg.status === 'success'
              ? 'improved'
              : 'degraded',
      };
    });
  }

  /**
   * Calculate severity for a failing package
   */
  private calculatePackageSeverity(pkg: PackageTestResult): 'low' | 'medium' | 'high' {
    if (pkg.failedCount > 10 || pkg.coverage < 30) {
      return 'high';
    }
    if (pkg.failedCount > 5 || pkg.coverage < 50) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Suggest actions for a failing package
   */
  private suggestPackageActions(pkg: PackageTestResult): string[] {
    const actions: string[] = [];

    if (pkg.failedCount > 0) {
      actions.push('Review and fix failing tests');
    }

    if (pkg.coverage < 50) {
      actions.push('Add comprehensive test coverage');
    }

    if (pkg.duration > 15000) {
      actions.push('Optimize test performance');
    }

    if (pkg.errors && pkg.errors.length > 0) {
      actions.push('Address test execution errors');
    }

    return actions;
  }

  /**
   * Categorize performance based on duration
   */
  private categorizePerformance(duration: number): 'fast' | 'moderate' | 'slow' {
    if (duration < 5000) {
      return 'fast';
    }
    if (duration < 15000) {
      return 'moderate';
    }
    return 'slow';
  }
}

// Type definitions for analysis results
export interface TestAnalysis {
  successRate: number;
  coverageScore: number;
  totalDuration: number;
  packageAnalysis: PackageAnalysis[];
  recommendations: string[];
  riskAssessment: RiskAssessment;
}

export interface PackageAnalysis {
  packageName: string;
  status: 'success' | 'failure';
  successRate: number;
  coverage: number;
  performance: 'fast' | 'moderate' | 'slow';
  issues: number;
}

export interface TestComparison {
  testCountChange: number;
  successRateChange: number;
  coverageChange: number;
  durationChange: number;
  trend: 'improving' | 'degrading' | 'stable';
  packageComparisons: PackageComparison[];
}

export interface PackageComparison {
  packageName: string;
  testCountChange: number;
  coverageChange: number;
  durationChange: number;
  statusChange: 'improved' | 'degraded' | 'unchanged' | 'new';
}

export interface TestExecutionReport {
  timestamp: Date;
  summary: {
    status: 'success' | 'failure';
    totalTests: number;
    successRate: number;
    coverageScore: number;
    duration: number;
  };
  packageBreakdown: Array<{
    name: string;
    status: 'success' | 'failure';
    tests: number;
    coverage: number;
    duration: number;
    issues: number;
  }>;
  coverageDetails: CoverageReport;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FailingPackageAnalysis {
  packageName: string;
  failedTests: number;
  errors: string[];
  coverage: number;
  duration: number;
  severity: 'low' | 'medium' | 'high';
  suggestedActions: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

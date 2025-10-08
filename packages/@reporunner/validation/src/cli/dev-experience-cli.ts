#!/usr/bin/env node

import { DevExperienceMetrics } from '../developer-experience/DevExperienceMetrics.js';
import { IDEPerformanceAnalyzer } from '../developer-experience/IDEPerformanceAnalyzer.js';
import { ProductivityTracker } from '../developer-experience/ProductivityTracker.js';

export class DevExperienceCLI {
  private workspaceRoot: string;
  private devMetrics: DevExperienceMetrics;
  private ideAnalyzer: IDEPerformanceAnalyzer;
  private productivityTracker: ProductivityTracker;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.devMetrics = new DevExperienceMetrics(workspaceRoot);
    this.ideAnalyzer = new IDEPerformanceAnalyzer(workspaceRoot);
    this.productivityTracker = new ProductivityTracker(workspaceRoot);
  }

  /**
   * Run comprehensive developer experience analysis
   */
  async runAnalysis(): Promise<void> {
    console.log('🔍 Running Developer Experience Analysis...\n');
    try {
      // Generate developer experience report
      console.log('📊 Analyzing developer metrics...');
      const devReport = await this.devMetrics.generateReport();
      console.log('🎯 Analyzing IDE performance...');
      const ideReport = await this.ideAnalyzer.analyzeIDEPerformance();
      console.log('📈 Analyzing productivity trends...');
      const trends = await this.productivityTracker.getProductivityTrends(30);

      // Display results
      this.displayDevExperienceReport(devReport);
      this.displayIDEPerformanceReport(ideReport);
      this.displayProductivityTrends(trends);

      console.log('\n✅ Developer Experience Analysis Complete!');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Start productivity tracking session
   */
  async startTracking(): Promise<void> {
    console.log('🚀 Starting productivity tracking session...\n');
    try {
      const sessionId = await this.productivityTracker.startSession();
      console.log(`📝 Session started: ${sessionId}`);
      console.log('Use Ctrl+C to end the session');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n⏹️  Ending productivity session...');
        const session = await this.productivityTracker.endSession();
        if (session) {
          console.log(
            `📊 Session completed: ${Math.round(session.metrics.totalDuration / 60000)} minutes`
          );
          console.log(`💻 Coding time: ${Math.round(session.metrics.codingTime / 60000)} minutes`);
          console.log(
            `🔧 Debugging time: ${Math.round(session.metrics.debuggingTime / 60000)} minutes`
          );
        }
        process.exit(0);
      });

      await new Promise(() => {}); // Run indefinitely until interrupted
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      process.exit(1);
    }
  }

  /**
   * Generate productivity report for specified days
   */
  async generateProductivityReport(days: number = 7): Promise<void> {
    console.log(`📊 Generating productivity report for last ${days} days...\n`);
    try {
      const report = await this.productivityTracker.generateProductivityReport(days);
      console.log(report);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      process.exit(1);
    }
  }

  /**
   * Run IDE performance benchmark
   */
  async benchmarkIDE(): Promise<void> {
    console.log('🎯 Running IDE Performance Benchmark...\n');

    try {
      const report = await this.ideAnalyzer.analyzeIDEPerformance();
      this.displayIDEPerformanceReport(report);
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  }

  private displayDevExperienceReport(report: any): void {
    console.log('\n📊 Developer Experience Report');
    console.log('===============================');
    console.log(`Overall Score: ${report.score}/100`);
    console.log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}\n`);

    console.log('🖥️  IDE Performance:');
    console.log(`  Type Checking: ${Math.round(report.idePerformance.typeCheckingTime)}ms`);
    console.log(`  Autocomplete: ${Math.round(report.idePerformance.autocompleteResponseTime)}ms`);
    console.log(`  Navigation: ${Math.round(report.idePerformance.navigationSpeed)}ms`);
    console.log(`  IntelliSense: ${Math.round(report.idePerformance.intelliSenseLatency)}ms\n`);

    console.log('⚡ Workflow Timing:');
    console.log(`  Hot Reload: ${Math.round(report.workflowTiming.hotReloadTime)}ms`);
    console.log(`  Build Startup: ${Math.round(report.workflowTiming.buildStartupTime)}ms`);
    console.log(`  Test Execution: ${Math.round(report.workflowTiming.testExecutionTime)}ms`);
    console.log(`  Linting: ${Math.round(report.workflowTiming.lintingTime)}ms\n`);

    console.log('🚀 Productivity Metrics:');
    console.log(`  Average Compile Time: ${Math.round(report.productivity.averageCompileTime)}ms`);
    console.log(
      `  Refactoring Efficiency: ${report.productivity.refactoringEfficiency.toFixed(1)}%`
    );
    console.log(
      `  Code Navigation Efficiency: ${report.productivity.codeNavigationEfficiency.toFixed(1)}%\n`
    );

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  private displayIDEPerformanceReport(report: any): void {
    console.log('\n🎯 IDE Performance Analysis');
    console.log('============================');
    console.log(`Overall Score: ${report.overallScore}/100`);
    console.log(
      `Workspace: ${report.workspaceSize.files} files, ${Math.round(report.workspaceSize.totalSize / 1024 / 1024)}MB\n`
    );

    console.log('📝 TypeScript Performance:');
    console.log(`  Compilation: ${Math.round(report.typescript.compilationTime)}ms`);
    console.log(`  Incremental Build: ${Math.round(report.typescript.incrementalBuildTime)}ms`);
    console.log(
      `  Errors: ${report.typescript.errorCount}, Warnings: ${report.typescript.warningCount}\n`
    );

    console.log('🔍 Autocomplete Performance:');
    console.log(`  Response Time: ${Math.round(report.autocomplete.responseTime)}ms`);
    console.log(`  Contextual Relevance: ${report.autocomplete.contextualRelevance.toFixed(1)}%\n`);

    console.log('🧭 Navigation Performance:');
    console.log(`  Go to Definition: ${Math.round(report.navigation.goToDefinitionTime)}ms`);
    console.log(`  Find References: ${Math.round(report.navigation.findReferencesTime)}ms`);
    console.log(`  Workspace Indexing: ${Math.round(report.navigation.workspaceIndexingTime)}ms\n`);

    console.log('💡 IntelliSense Performance:');
    console.log(`  Hover Info: ${Math.round(report.intelliSense.hoverInfoTime)}ms`);
    console.log(`  Signature Help: ${Math.round(report.intelliSense.signatureHelpTime)}ms`);
    console.log(
      `  Diagnostics Update: ${Math.round(report.intelliSense.diagnosticsUpdateTime)}ms\n`
    );

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  private displayProductivityTrends(trends: any): void {
    console.log('\n📈 Productivity Trends');
    console.log('======================');
    console.log(`Average Session: ${Math.round(trends.averageSessionDuration / 60000)} minutes`);
    console.log(`Coding Efficiency: ${(trends.codingEfficiency * 100).toFixed(1)}%`);
    console.log(`Debugging Ratio: ${(trends.debuggingRatio * 100).toFixed(1)}%`);
    console.log(`Build Success Rate: ${(trends.buildSuccessRate * 100).toFixed(1)}%`);
    console.log(`Test Success Rate: ${(trends.testSuccessRate * 100).toFixed(1)}%\n`);

    if (trends.dailyProductivity.length > 0) {
      console.log('📅 Recent Daily Activity:');
      trends.dailyProductivity.slice(-7).forEach((day: any) => {
        console.log(
          `  ${day.date}: ${Math.round(day.totalTime / 60000)} minutes, ${day.commits} commits`
        );
      });
    }
  }
}

// CLI entry point
const cli = new DevExperienceCLI();
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'analyze':
    await cli.runAnalysis();
    break;
  case 'track':
    await cli.startTracking();
    break;
  case 'report': {
    const days = arg ? Number.parseInt(arg, 10) : 7;
    await cli.generateProductivityReport(days);
    break;
  }
  case 'benchmark':
    await cli.benchmarkIDE();
    break;
  default:
    console.log('Usage: dev-experience-cli [command]');
    console.log('Commands:');
    console.log('  analyze    - Run comprehensive developer experience analysis');
    console.log('  track      - Start productivity tracking session');
    console.log('  report [days] - Generate productivity report (default: 7 days)');
    console.log('  benchmark  - Run IDE performance benchmark');
}

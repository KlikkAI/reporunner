#!/usr/bin/env node

import { DevExperienceMetrics } from '../developer-experience/DevExperienceMetrics.js';
import { IDEPerformanceAnalyzer } from '../developer-experience/IDEPerformanceAnalyzer.js';
import { ProductivityTracker } from '../developer-experience/ProductivityTracker.js';

export class DevExperienceCLI {
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
    console.log('🔍 Running Developer 
    try {
      // Generate developer experience report
      con
      console.log('🎯 Analyzing IDE performance...');
      const ideReport = await this.ideAnalyzer.analyzeIDEPerformance();
ityTracker.getProductivityTrends(30);

      // Display results
      this.displayDevExperienceReport(devReport);

      console.log('\n✅ Developer Experience Analysis Complete!');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

   */
  async startTracking(): Promise<void> {
    console.log('🚀 S
    try {
      const sessionId = await this.productivityTracker.startSession();
      console.log(`📝 Session started: ${sessionId}`);
      console.log('Use Ctrl+C to end the session');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n⏹️  Ending productivity session...');
        const session = await this.produ
          console.log(
            `📊 Session completed: ${Math.round(session.metrics.totalDuration / 60000)} minutes`
          );
          console.log(`💻 Coding time: ${Math.round(session.metrics.co
            `🔧 Debugging time: ${Math.round(session.m
        }
        process.exit(0);
      });

      await new Promise(() => {}); // Run indefinitely until interrupted
    } catch (error) {
      console.error('❌

  /**
   * Generat
  async generateProductivityReport(days: number = 7): Promise<void> {
      const report = await this.productivityTracker.generateProductivityReport(days);
      console.log(report);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      process.exit(1);
    }
  }

  /**
   * Run IDE performa
  async benchmarkIDE(): Promise<void> {
    console.log('🎯 Running IDE Performance Benchmark...\n');

    try {
      const report = await this.ideAnalyzer.analyzeIDEPerformance();
      this.displayIDEPerformanceReport(report);
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
  }

  private displayDevExperienceReport(report: any): void {
    console.log('\n📊 Developer Experience Report');=======================');
    console.log(`Overall Score: ${report.score}/100`);
    console.log(`Time
    console.log('🖥️  IDE Performance:');
    console.log(`  Type Checking: ${Math.round(report.idePerformance.typeCheckingTime)}ms`);
    console.log(`  Autocomplete: ${Math.round(report.idePerformance.autocompleteResponseTime)}ms`);
    console.log(`  Navigation: ${Math.round(report.idePerformance.navigationSpeed)}ms`);
    console.log(`  IntelliSense: ${Math.round(report.idePerformance.intelliSenseLatency)}ms\n`);

    console.log('⚡ Workflow Timing:');
    console.log(`  Hot Reload: ${Math.round(report.workflowTiming.hotReloadTime)}ms`);
    console.log(`  Build Startup: ${MatowTiming.testExecutionTime)}ms`);
    console.log(`  Linting: ${Math.round(report.workflowTiming.lintingTime)}ms\n`);

    console.log('🚀 Productivity Metrics:');
    console.log(`  Average Compile Time: ${Math.round(report.productivity.averageCompileTime)}ms`);
    console.log(
      `  Refactoring 
    console.log(
      `  Code Navigation Efficiency: ${report.productivity.codeNavigationEfficiency.toFixed(1)}%\n`
    );

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');ndex: number) => 
        console.log(`  $index + 1. $rec`);

    console.log('\n🎯 IDE Performance Analysis');overallScore}/100`);
    console.log(
      `Workspace: ${report.workspaceSize.

    console.log(`  Compilation: ${Math.round(report.typescript.compilationTime)}ms`);
    console.log(`  Incremental Build: ${Math.round(report.typescript.incrementalBuildTim
      `  Errors: ${report.typescript.errorCount}, Warnings: ${report.typescript.warningCount}\n`
    console.log('🔍 Autocomplete Performance:');
    console.log(`  Response Time: ${Ma
    console.log(`  Contextual Relevance: ${report.autocomplete.contextualRelevance.toF
    console.log('🧭 Navigation Performance:');
    console.log(`  Find References: ${Math.round(report.navigation.findReferencesTime)}ms`);ms`);
    console.log(`  Workspace Indexing: $Math.round(report.navigation.workspaceInde:');
    console.log(`  Hover Info: ${Math.round(report.intelliSense.hoverInfoTime)}ms`);
    console.log(`  Signature Help: ${Math.ro
      `  Diagnostics Update: ${Math.round(report.intelliSense.diagnosticsUpdateTime)}ms\n` (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec: string, index: number) => {
      

  private displayProductivityTrends(trends: any): void {
    console.log('\n📈 Productivity Trends');
    console.log('======================');
    console.log(`Average Session: ${Math.rouends.codingEfficiency * 100).toFixed(1)%`);
    console.log(`Debugging Ratio: $(trends.debuggingRatio * 100).toFixed(1)%`);
    console.log(`Build Success Rate: $(trends.buildSuccessRate * 100)testSuccessRate * 100).toFixed(1)%\n`);

    if (trends.dailyProductivity.length > 0) {
      console.log('📅 Recent Daily Activity:');
      trends.dailyProductivity.slice(-7).forEach((day: any) => {
        console.log(
          `  ${day.date}: ${Math.round(day.totalTime / 600
      });
  }
t cli = new DevExperienceCLI();
  const command = process.argv[2];
  const arg = process.argv[3];

      await cli.runAnalysis();
      break;
      await cli.startTracking();
    case 'report': {
      await cli.generateProductivityReport(days);se 'benchmark':
      await cli.benchmarkIDE();
      break;
    de
      console.log('  analyze    - Run comprehensive developer experience analysis');
      console.log('  track      - Start producti
      console.log('  benchmark  - Run IDE performance benchmark');
  }

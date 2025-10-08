#!/usr/bin/env node

import { BuildTimeAnalyzer } from '../build-time-analyzer.js';

export class BuildAnalyzerCLI {
  private analyzer: BuildTimeAnalyzer;

  constructor() {
    this.analyzer = new BuildTimeAnalyzer();
  }

  async run(args: string[]): Promise<void> {
    try {
      if (args.includes('--baseline')) {
        await this.runBaseline();
      } else if (args.includes('--compare')) {
        await this.runComparison();
      } else if (args.includes('--report')) {
        await this.generateReport();
      } else {
        await this.runFullAnalysis();
      }
    } catch (error) {
      console.error('❌ Build analysis failed:', error);
      process.exit(1);
    }
  }

  private async runBaseline(): Promise<void> {
    console.log('Running baseline measurement...');
    const metrics = await this.analyzer.measureBuildTimes();
    console.log(`Total Build Time: ${(metrics.totalBuildTime / 1000).toFixed(2)}s`);
    console.log('Baseline saved successfully');
  }

  private async runComparison(): Promise<void> {
    console.log('Comparing current build with baseline...');
    const metrics = await this.analyzer.measureBuildTimes();
    const comparison = await this.analyzer.compareWithBaseline(metrics);

    if (!comparison) {
      console.log('No baseline found. Run with --baseline first.');
      return;
    }

    console.log('Build Comparison Report');
    console.log(`Current Build Time: ${(metrics.totalBuildTime / 1000).toFixed(2)}s`);
    console.log(`Baseline Build Time: ${(comparison.baseline.totalBuildTime / 1000).toFixed(2)}s`);
    console.log(
      `Percentage Improvement: ${comparison.improvement.percentageImprovement > 0 ? '+' : ''}${comparison.improvement.percentageImprovement.toFixed(2)}%`
    );
  }

  private async generateReport(): Promise<void> {
    console.log('Generating build analysis report...');
    const report = await this.analyzer.generateAnalysisReport();

    console.log('\n📊 Build Analysis Report');
    console.log('========================');
    console.log(`Status: ${report.summary.status.toUpperCase()}`);
    console.log(`Message: ${report.summary.message}`);
    console.log(`Total Build Time: ${(report.metrics.totalBuildTime / 1000).toFixed(2)}s`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index: number) => {
        console.log(`${index + 1}. ${rec.description}`);
      });
    }
  }

  private async runFullAnalysis(): Promise<void> {
    console.log('Running full build analysis...');
    await this.runBaseline();
    await this.runComparison();
    await this.generateReport();
  }
}

const cli = new BuildAnalyzerCLI();
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.run(process.argv.slice(2)).catch(console.error);
}

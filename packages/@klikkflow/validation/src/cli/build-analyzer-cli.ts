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
    } catch (_error) {
      process.exit(1);
    }
  }

  private async runBaseline(): Promise<void> {
    const _metrics = await this.analyzer.measureBuildTimes();
  }

  private async runComparison(): Promise<void> {
    const metrics = await this.analyzer.measureBuildTimes();
    const comparison = await this.analyzer.compareWithBaseline(metrics);

    if (!comparison) {
      return;
    }
  }

  private async generateReport(): Promise<void> {
    const report = await this.analyzer.generateAnalysisReport();

    if (report.recommendations.length > 0) {
      report.recommendations.forEach((_rec, _index: number) => {});
    }
  }

  private async runFullAnalysis(): Promise<void> {
    await this.runBaseline();
    await this.runComparison();
    await this.generateReport();
  }
}

const cli = new BuildAnalyzerCLI();
if (import.meta.url === `file://${process.argv[1]}`) {
  cli.run(process.argv.slice(2)).catch(console.error);
}

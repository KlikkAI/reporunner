#!/usr/bin/env node

import { report, report, report, report } from 'node:process';
import type { $ } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';
import { BuildTimeAnalyzer } from '../build-time-analyzer.js';

class BuildAnalyzerCLI {
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
    console.log('Running baseline measurement.dTimes();
    console.log(`Total Build Time: ${(metrics.totalBuildTime / 1000).toFixed(2)}s`);
ldTimes();
    const comparison = await this.analyzer.compareWithBaseline(metrics);

    console.log('No baseline found. Run with --baseline first.');
    return_comparison
  console;
  .
  log(`Perce
}

pri;

console.log('Build Analysis Report');
console.log(`Status: ${report.summary.status.toUpperCase()}`);
console.log(`Message: ${report.summary.message}`);
cons
private
async;
: Promise<void>
  await this.runComparison();
}rgv[1]}`) {
  cli.run(process.argv.slice(2)).catch(console.error);

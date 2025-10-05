#!/usr/bin/env node

import { BundleSizeAnalyzer } from '../bundle-size-analyzer.js';

interface CLIOptions {
  baseline?: boolean;
  compare?: boolean;
  report?: boolean;
  updateBaseline?: boolean;
  distPath?: string;
  format?: 'json' | 'table' | 'summary';
  output?: string;
}

export class BundleAnalyzerCLI {
  private analyzer: BundleSizeAnalyzer;

  constructor(distPath?: string) {
    this.analyzer = new BundleSizeAnalyzer(distPath);
  }

  async run(options: CLIOptions = {}): Promise<void> {
    try {
      if (options.baseline) {
        await this.createBaseline();
      } else if (options.compare) {
        await this.compareWithBaseline(options);
      } else if (options.updateBaseline) {
        await this.updateBaseline();
      } else {
        await this.generateReport(options);
      }
    } catch (error) {
      console.error('Bundle analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async createBaseline(): Promise<void> {
    console.log('Creating bundle size baseline...');

    const metrics = await this.analyzer.analyzeBundleSizes();
    await this.analyzer.saveBaseline(metrics);

    console.log('Baseline created successfully');
  }

  private async compareWithBaseline(options: CLIOptions): Promise<void> {
    console.log('Comparing with baseline...');

    const metrics = await this.analyzer.analyzeBundleSizes();
    const comparison = await this.analyzer.compareWithBaseline(metrics);

    if (!comparison.baseline) {
      console.log('No baseline found. Creating baseline with current metrics...');
      await this.analyzer.saveBaseline(metrics);
      return;
    }

    console.log('Bundle Size Comparison');
    console.log('======================');

    if (comparison.meetsTarget) {
      console.log('Target reduction achieved!');
    } else {
      console.log('Target reduction not met');
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(comparison, null, 2));
    }
  }

  private async updateBaseline(): Promise<void> {
    console.log('Updating baseline...');

    const metrics = await this.analyzer.analyzeBundleSizes();
    await this.analyzer.updateBaseline(metrics);

    console.log('Baseline updated successfully');
  }

  private async generateReport(options: CLIOptions): Promise<void> {
    console.log('Generating bundle analysis report...');

    const report = await this.analyzer.generateReport();

    if (options.format === 'json') {
      const output = JSON.stringify(report, null, 2);
      if (options.output) {
        const fs = await import('node:fs/promises');
        await fs.writeFile(options.output, output);
        console.log(`Report saved to ${options.output}`);
      } else {
        console.log(output);
      }
      return;
    }

    console.log(`Status: ${report.summary.status}`);
    console.log(`Requirements Met: ${report.summary.meetsRequirements}`);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--baseline':
        options.baseline = true;
        break;
      case '--compare':
        options.compare = true;
        break;
      case '--report':
        options.report = true;
        break;
      case '--update-baseline':
        options.updateBaseline = true;
        break;
      case '--dist-path':
        options.distPath = args[++i];
        break;
      case '--format':
        options.format = args[++i] as 'json' | 'table' | 'summary';
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--help':
        console.log('Bundle Size Analyzer CLI');
        console.log('Usage: bundle-analyzer [options]');
        process.exit(0);
    }
  }

  const cli = new BundleAnalyzerCLI(options.distPath);
  cli.run(options);
}

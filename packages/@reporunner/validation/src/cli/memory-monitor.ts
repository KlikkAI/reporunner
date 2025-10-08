#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import { Command } from 'commander';
import { MemoryLeakDetector } from '../monitoring/MemoryLeakDetector.js';
import { MemoryMonitor } from '../monitoring/MemoryMonitor.js';
import { MemoryOptimizer } from '../monitoring/MemoryOptimizer.js';

/**
 * CLI command for memory monitoring and analysis
 * Requirements: 2.3, 2.5
 */

const program = new Command();

program
  .name('memory-monitor')
  .description('Memory usage monitoring and optimization tool for Phase A validation')
  .version('1.0.0');

// Memory profiling command
program
  .command('profile')
  .description('Profile memory usage across development, build, and runtime')
  .option('-o, --output <file>', 'Output file for memory profile report')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'json')
  .action(async (options) => {
    console.log('🔍 Profiling memory usage...');

    const monitor = new MemoryMonitor();

    try {
      const profile = await monitor.profileMemoryUsage();
      const report = await monitor.generateMemoryReport();

      console.log('\n📊 Memory Profile Summary:');
      console.log(
        `Total Memory Usage: ${Math.round(report.summary.totalMemoryUsage / 1024 / 1024)}MB`
      );
      console.log(`Memory Efficiency: ${report.summary.memoryEfficiency}%`);
      console.log(`Leak Risk: ${report.summary.leakRisk}`);
      console.log(`Peak Memory: ${Math.round(report.summary.peakMemoryUsage / 1024 / 1024)}MB\n`);

      if (profile.leaks.length > 0) {
        console.log('\n⚠️  Memory Leaks Detected:');
        profile.leaks.forEach((leak, index) => {
          console.log(`${index + 1}. [${leak.severity}] ${leak.location}: ${leak.description}`);
        });
      }

      if (profile.optimizations.length > 0) {
        console.log('\n💡 Top Optimization Opportunities:');
        profile.optimizations.slice(0, 3).forEach((opt, index) => {
          const savingsMB = Math.round(opt.potentialSavings / 1024 / 1024);
          console.log(`${index + 1}. ${opt.area}: Save ${savingsMB}MB - ${opt.recommendation}`);
        });
      }

      if (options.output) {
        await saveReport(options.output, report, options.format);
        console.log(`\n📄 Full report saved to: ${options.output}`);
      }
    } catch (error) {
      console.error(
        '❌ Memory profiling failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

// Leak detection command
program
  .command('detect-leaks')
  .description('Detect memory leaks in running processes')
  .option('-d, --duration <minutes>', 'Monitoring duration in minutes', '10')
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '30')
  .option('-t, --threshold <percentage>', 'Growth threshold percentage', '10')
  .action(async (options) => {
    const detector = new MemoryLeakDetector();

    console.log('🕵️  Starting memory leak detection...');
    console.log(`Duration: ${options.duration} minutes, Interval: ${options.interval} seconds`);

    // Set up event listeners
    detector.on('leaksDetected', (leaks) => {
      console.log(`\n⚠️  ${leaks.length} potential memory leak(s) detected:`);
      leaks.forEach((leak: any, index: number) => {
        console.log(`${index + 1}. [${leak.severity.toUpperCase()}] ${leak.location}`);
        console.log(`   ${leak.description}`);
        console.log(`   💡 ${leak.suggestion}\n`);
      });
    });

    detector.on('criticalLeaks', (leaks) => {
      console.log(`\n🚨 CRITICAL: ${leaks.length} high-severity leak(s) detected!`);
      leaks.forEach((leak: any, index: number) => {
        console.log(`${index + 1}. ${leak.location}: ${leak.description}`);
      });
    });

    detector.on('error', (error) => {
      console.error('❌ Leak detection error:', error);
    });

    try {
      detector.startTracking(Number.parseInt(options.interval, 10) * 1000);

      // Run for specified duration
      await new Promise((resolve) => {
        setTimeout(
          () => {
            detector.stopTracking();
            resolve(void 0);
          },
          Number.parseInt(options.duration, 10) * 60 * 1000
        );
      });

      const finalLeaks = await detector.detectLeaks();
      const stats = detector.getTrackingStats();

      console.log('\n📈 Final Analysis:');
      console.log(`Monitoring completed: ${stats.duration / 60000} minutes`);
      console.log(`Snapshots collected: ${stats.snapshotCount}`);
      console.log(`Total leaks detected: ${finalLeaks.length}`);

      if (finalLeaks.length === 0) {
        console.log('\n✅ No memory leaks detected!');
      }
    } catch (error) {
      console.error(
        '❌ Leak detection failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

// Memory optimization command
program
  .command('optimize')
  .description('Analyze memory usage and generate optimization recommendations')
  .option('-o, --output <file>', 'Output file for optimization report')
  .option('--detailed', 'Include detailed analysis and implementation steps')
  .action(async (options) => {
    console.log('🚀 Analyzing memory optimization opportunities...');

    const optimizer = new MemoryOptimizer();

    try {
      const report = await optimizer.generateOptimizationReport();

      console.log('\n📊 Optimization Analysis:');
      console.log(
        `Current Memory Usage: ${Math.round(report.currentMemoryUsage.rss / 1024 / 1024)}MB`
      );
      console.log(
        `Potential Savings: ${Math.round(report.totalPotentialSavings / 1024 / 1024)}MB`
      );
      console.log(`Recommendations: ${report.recommendations.length}`);

      console.log('\n🎯 Top Recommendations:');
      report.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}`);
        console.log(`   ${rec.impact} | ${rec.effort} | Timeline: ${rec.timeline}`);
        console.log(`   ${rec.description}\n`);
      });

      console.log('\n📋 Implementation Plan:');
      console.log(
        `Quick Wins (${report.implementationPlan.quickWins.length}): Easy optimizations with immediate impact`
      );
      console.log(
        `Major Impact (${report.implementationPlan.majorImpact.length}): High-impact optimizations worth prioritizing`
      );
      console.log(
        `Long Term (${report.implementationPlan.longTerm.length}): Strategic optimizations for sustained improvement`
      );
      console.log(
        `Estimated Total Savings: ${Math.round(report.implementationPlan.totalEstimatedSavings / 1024 / 1024)}MB`
      );
      console.log(`Estimated Timeframe: ${report.implementationPlan.estimatedTimeframe}`);

      if (options.detailed) {
        console.log('\n📝 Detailed Implementation Steps:');
        report.recommendations.forEach((rec, index) => {
          console.log(`\n${index + 1}. ${rec.title}:`);
          rec.steps.forEach((step, stepIndex) => {
            console.log(`   ${stepIndex + 1}. ${step}`);
          });
        });
      }

      if (options.output) {
        await saveReport(options.output, report, 'json');
        console.log(`\n📄 Detailed report saved to: ${options.output}`);
      }
    } catch (error) {
      console.error(
        '❌ Optimization analysis failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  });

// Monitor command for continuous monitoring
program
  .command('monitor')
  .description('Continuously monitor memory usage with real-time alerts')
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '60')
  .option('-a, --alert-threshold <mb>', 'Alert threshold in MB', '500')
  .option('--detect-leaks', 'Enable leak detection during monitoring')
  .action(async (options) => {
    console.log('📊 Starting continuous memory monitoring...');
    console.log(`Interval: ${options.interval}s | Alert threshold: ${options.alertThreshold}MB`);

    const monitor = new MemoryMonitor();
    let detector: MemoryLeakDetector | undefined;

    if (options.detectLeaks) {
      detector = new MemoryLeakDetector();
      console.log('🕵️  Leak detection enabled');
      detector.startTracking();
    }

    const alertThreshold = Number.parseInt(options.alertThreshold, 10) * 1024 * 1024;

    const monitoringInterval = setInterval(() => {
      const stats = monitor.getMonitoringStats();
      const current = stats.currentMemory;

      const timestamp = new Date().toLocaleTimeString();
      const heapMB = Math.round(current.heapUsed / 1024 / 1024);
      const rssMB = Math.round(current.rss / 1024 / 1024);

      console.log(
        `[${timestamp}] Heap: ${heapMB}MB | RSS: ${rssMB}MB | External: ${Math.round(current.external / 1024 / 1024)}MB`
      );

      if (current.rss > alertThreshold) {
        console.log(
          `🚨 ALERT: Memory usage (${rssMB}MB) exceeds threshold (${options.alertThreshold}MB)`
        );
      }
    }, Number.parseInt(options.interval, 10) * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping memory monitoring...');
      clearInterval(monitoringInterval);
      monitor.stopMonitoring();
      if (detector) {
        detector.stopTracking();
      }
      const stats = monitor.getMonitoringStats();
      console.log(`\n📈 Monitoring Summary:`);
      console.log(`Duration: ${Math.round(stats.monitoringDuration / 1000 / 60)} minutes`);
      console.log(`Snapshots collected: ${stats.snapshotCount}`);
      console.log(`Final memory usage: ${Math.round(stats.currentMemory.rss / 1024 / 1024)}MB`);

      process.exit(0);
    });
  });

// Utility function to save report
async function saveReport(filename: string, data: any, format: string): Promise<void> {
  let content: string;

  if (format === 'markdown') {
    content = generateMarkdownReport(data);
  } else {
    content = JSON.stringify(data, null, 2);
  }

  await fs.writeFile(filename, content, 'utf8');
}

// Generate markdown report
function generateMarkdownReport(data: any): string {
  const timestamp = new Date().toISOString();

  return `# Memory Analysis Report

**Generated**: ${timestamp}

## Summary

- **Total Memory Usage**: ${Math.round(data.summary?.totalMemoryUsage / 1024 / 1024 || 0)}MB
- **Peak Memory Usage**: ${Math.round(data.summary?.peakMemoryUsage / 1024 / 1024 || 0)}MB
- **Memory Efficiency**: ${data.summary?.memoryEfficiency || 0}%
- **Leak Risk**: ${data.summary?.leakRisk || 'Unknown'}

## Memory Profile

### Development
- Heap Used: ${Math.round(data.profile?.development?.heapUsed / 1024 / 1024 || 0)}MB
- RSS: ${Math.round(data.profile?.development?.rss / 1024 / 1024 || 0)}MB

### Build
- Heap Used: ${Math.round(data.profile?.build?.heapUsed / 1024 / 1024 || 0)}MB
- RSS: ${Math.round(data.profile?.build?.rss / 1024 / 1024 || 0)}MB

### Runtime
- Heap Used: ${Math.round(data.profile?.runtime?.heapUsed / 1024 / 1024 || 0)}MB
- RSS: ${Math.round(data.profile?.runtime?.rss / 1024 / 1024 || 0)}MB

## Recommendations

${
  data.recommendations
    ?.map(
      (rec: any, index: number) => `
### ${index + 1}. ${rec.title}

**Impact**: ${rec.impact}
**Effort**: ${rec.effort}
**Timeline**: ${rec.timeline}

${rec.description}

**Implementation Steps**:
${rec.steps?.map((step: string, stepIndex: number) => `${stepIndex + 1}. ${step}`).join('\n') || ''}
`
    )
    .join('\n') || 'No recommendations available'
}

---
*Generated by RepoRunner Memory Monitor*
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

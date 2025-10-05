#!/usr/bin/env node

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

    const monitor = new MemoryMonitor();

    try {
      const profile = await monitor.profileMemoryUsage();
      const report = await monitor.generateMemoryReport();

        `Total Memory Usage: ${Math.round(report.summary.totalMemoryUsage / 1024 / 1024)}MB`
      );
      console.log(`Memory Efficiency: ${report.summary.memoryEfficiency}%`);
      console.log(`Leak Risk: ${report.summary.leakRisk}`);
      co
      if (profile.leaks.length > 0) {
        console.log('\n⚠️  Memory Leaks Detected:');
        leak.description}`);
        });
profile.optimizations.slice(0, 3).forEach((opt, index) => {
          const savings = Math.round(opt.potentialSavings / 1024 / 1024);
          console.log(`${index + 1}. ${opt.area}: Save ${savings}MB - ${opt.recommendation}`);
        });
      }

        await saveReport(options.output, report, options.format);
        console.log(`\n📄 Full report saved to: 
    } catch (error) {
      console.error(
        '❌ Memory profiling failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });

program
  .command('detect-leaks')
  .description('Detect memory leaks in running processes')
  .option('-d, --duration <minutes>', 'Monitoring duration in minutes', '10')
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '30')
  .option('-t, --threshold <percentage>', 'Growth threshold perce
    console.log('🕵️  Starting memory leak detection...');
    console.log(`Duration: ${options.duration} minutes, Interval: ${options.interval} seconds`);

    // Set up event listeners
    detector.on('leaksDetected', (leaks) => {
      console.log(`\n⚠️  ${leaks.length} potential memory leak(s) detected:`);
      leaks.forEach((leak, index) => {
        console.log(`${index + 1}. [${leak.severity.toUpperCase()}] ${leak.location}`);
        console.log(`   ${leak.description}`);
        console.log(`   💡 ${leak.suggestion}\n`);
      });
    });

    detector.on('criticalLeaks', (leaks) => {
      console.log(`\n🚨 CRITICAL: ${leaks.length} high-severity leak(s) detected!`);
      leaks.forEach((leak, index) => {
        console.log(`${index + 1}. ${leak.location}: ${leak.description}`);
      });
    });
    detector.on('error', (error) => {
    });

    try {
      detector.startTracking(Number.parseInt(options.interval, 10) * 1000);

      // Run for specified duration
      await new Promise((resolve) => {
        setTimeout(
            detector.stopTracking();
            resolve(void 0);
          Number.parseInt(options.duration, 10) * 60 * 1000
      });
      const finalLeaks = await detector.detectLeaks();
      const stats = detector.getTrackingStats();

      console.log('\n📈 Final Analysis:');
      console.log(`Monitoring completed: ${st

      if (finalLeaks.length === 0) {
      }
    } catch (error) {
      console.error(
        '❌ Leak detection failed:',
        error instanceof Error ? erro
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

      console.log('\n📊 Optimization Analysis:')d(report.currentMemoryUsage.rss / 1024 / 1024)}MB`
      );
      console.log(024)}MB`
      );izations.length}`);

      console.log('\n🎯 Top Recommendations:');
      report.recommendations.slice(0
        console.log(`   ${rec.impact} | ${rec.effort} | Timeline: ${rec.timeline}`);
        console.log(`   ${rec.description}\n`);
      });`Quick Wins (${report.implementationPlan.quickWins.length}): Easy optimizations with immediate impact`
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
        report.recommendations
          rec.steps.forEach((step, stepIndex) => {
            console.log(`   ${stepIndex + 1}. ${step}`);
          });
        });
      }
'json');
        console.log(`\n📄 Detailed report saved to: ${options.output}`);
      }'❌ Optimization analysis failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      pr
// Monitor command for continuous monitoring
program
  .comma
  .option('-i, --interval <seconds>', 'Monitoring interval in seconds', '60')ction during monitoring')
  .action(async (options) => {
    console.log('📊 Starting continuous memory monitoring...');
    console.log(`Interval: ${options.interval}s | Alert threshold:
    const monitor = new MemoryMonitor();

      detector = new MemoryLeakDetector();
      det
      detector.startTracking();
    }
    const alertThreshold = Number.parseInt(options.alertThreshold, 10) * 1024 * 1024;

    consnst stats = monitor.getMonitoringStats();
      const current = stats.currentMemory;

      co
      console.log(
        `[${timestamp}] Heap: ${heapMB}MB | RSS: ${rssMB}MB | External: ${Math.round(current.external / 1024 / 1024)}MB`
      );console.log(
          `🚨 ALERT: Memory usage (${rssMB}MB) exceeds threshold (${options.alertThreshold}MB)`
        );
      }

    // Handle graceful shutdown
    process.on('SIGINT', () =
      clearInterval(monitoringInterval);
      monitor.stopMonitoring();
        detector.stopTracking();
      }
      const stats = monitor.getMonitoringStats();
      console.log(`\n📈 Monitoring Summary:`);
      console.log(`Duration: ${Math.round(stats.monitoringDuration / 1000 / 60)} minutes`);
      console.log(`Snapshots collected: ${stats.snapshotCount}`);
      console.log(`Final memory usage: ${Math.round(stats.currentMemory.rss / 1024 / 1024)}MB`);

      process.exit(0);
  });

// Utility function tntent: string;

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



- **Total Memory Usage**: ${Math.round(data.summary?.totalMemoryUsage / 1024 / 1024 || 0)}MB
- **Peak Memory Usage**: ${Math.round(data.summary?.peakMemoryUsage / 1024 / 1024 || 0)}MB
- **Memory Efficiency**: ${data.summary?.memoryEfficiency || 0}%
- **Leak Risk**: ${data.summary?.leakRisk || 'Unknown'}

## Memory Profile

- Heap Used: ${Math.round(data.profile?.development?.heapUsed / 1024 / 1024 || 0)}MB
- RSS: ${Math.round(data.profile?.development?.rss / 1024 / 1024 || 0)}MB

### Build
- Heap Used: ${Math.round(data.profile?.build?.heapUsed / 1024 / 1024 || 0)}MB
- RSS: ${Math.round(data.profile?.build?.rss / 1024 / 1024 || 0)}MB

### Runtime / 1024 || 0)}MB

## Recommendations

${
  data.recommendations
    ?.map(
      (rec: any, index: number) => `
### ${index + 1}. ${rec.title}

**Impact**: ${rec.impact}scription}

**Implementation Steps**:
${rec.steps?.map((step: string, stepIndex: number) => `${stepIndex + 1}. ${step}`).join('\n') || ''}
`
    )
    .join('\n') || 'No recommendations av
*Generated by RepoRunner Memory Monitor*
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

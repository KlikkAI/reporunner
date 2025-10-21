#!/usr/bin/env node

/**
 * Example usage of the Memory Monitoring System
 * Requirements: 2.3, 2.5
 */

import { MemoryLeakDetector } from '../src/monitoring/MemoryLeakDetector.js';
import { MemoryMonitor } from '../src/monitoring/MemoryMonitor.js';
import { MemoryOptimizer } from '../src/monitoring/MemoryOptimizer.js';

async function demonstrateMemoryMonitoring() {
  console.log('🧠 Memory Monitoring System Demonstration\n');
  console.log('='.repeat(50));

  // 1. Memory Profiling
  console.log('\n1. Memory Profiling');
  console.log('='.repeat(50));

  const monitor = new MemoryMonitor();

  try {
    const profile = await monitor.profileMemoryUsage();

    console.log('\nMemory Profile Results:');
    console.log(`Development Memory: ${Math.round(profile.development.rss / 1024 / 1024)}MB RSS`);
    console.log(`Build Memory: ${Math.round(profile.build.rss / 1024 / 1024)}MB RSS`);
    console.log(`Runtime Memory: ${Math.round(profile.runtime.rss / 1024 / 1024)}MB RSS`);

    if (profile.leaks.length > 0) {
      console.log(`\n⚠️  ${profile.leaks.length} potential memory leak(s) detected:`);
      profile.leaks.forEach((leak, index) => {
        console.log(`  ${index + 1}. [${leak.severity.toUpperCase()}] ${leak.location}`);
        console.log(`     ${leak.description}`);
      });
    }

    if (profile.optimizations.length > 0) {
      console.log(`\n💡 ${profile.optimizations.length} optimization opportunities:`);
      profile.optimizations.slice(0, 3).forEach((opt, index) => {
        const savings = Math.round(opt.potentialSavings / 1024 / 1024);
        console.log(`  ${index + 1}. ${opt.title} (${savings}MB potential savings)`);
      });
    }

    console.log('\n✅ Memory profiling completed');
  } catch (error) {
    console.error('❌ Memory profiling failed:', error);
  }

  console.log('\n');

  // 2. Memory Leak Detection
  console.log('2. Memory Leak Detection');
  console.log('='.repeat(50));

  const detector = new MemoryLeakDetector({
    sustainedGrowthThreshold: 0.05, // 5% growth threshold
    snapshotInterval: 1000,
  });

  // Set up event listeners
  detector.on('leaksDetected', (leaks) => {
    console.log(`\n⚠️  ${leaks.length} potential memory leak(s) detected:`);
    leaks.forEach((leak, index) => {
      console.log(`  ${index + 1}. [${leak.severity.toUpperCase()}] ${leak.location}`);
      console.log(`     ${leak.description}`);
    });
  });

  detector.on('criticalLeak', (leak) => {
    console.log(`\n🚨 CRITICAL LEAK DETECTED: ${leak.location}`);
    console.log(`   ${leak.description}`);
  });

  console.log('\nStarting leak detection (5 seconds)...');
  detector.startTracking(1000); // Check every second

  // Simulate some memory usage patterns
  await simulateMemoryUsage();

  // Wait for detection
  await new Promise((resolve) => setTimeout(resolve, 5000));

  detector.stopTracking();

  const finalLeaks = await detector.detectLeaks();
  const detectorStats = detector.getTrackingStats();

  console.log(`\nLeak Detection Summary:`);
  console.log(`Snapshots collected: ${detectorStats.snapshotCount}`);
  console.log(`Total leaks found: ${finalLeaks.length}`);

  console.log('\n');

  // 3. Memory Optimization Analysis
  console.log('3. Memory Optimization Analysis');
  console.log('='.repeat(50));

  const optimizer = new MemoryOptimizer();

  try {
    const report = await optimizer.generateOptimizationReport();

    console.log('\nOptimization Report:');
    console.log(
      `Current Memory Usage: ${Math.round(report.currentMemoryUsage.rss / 1024 / 1024)}MB`
    );
    console.log(
      `Total Potential Savings: ${Math.round(report.totalPotentialSavings / 1024 / 1024)}MB`
    );
    console.log(`Optimization Opportunities: ${report.optimizations.length}`);

    console.log('\nTop Recommendations:');
    report.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title}`);
      console.log(`     Impact: ${rec.impact}`);
      console.log(`     Effort: ${rec.effort}`);
      console.log(`     Timeline: ${rec.timeline}`);
    });

    console.log('\nImplementation Plan:');
    console.log(`  Quick Wins: ${report.implementationPlan.quickWins.length} optimizations`);
    console.log(`  Short Term: ${report.implementationPlan.shortTerm.length} optimizations`);
    console.log(`  Medium Term: ${report.implementationPlan.mediumTerm.length} optimizations`);
    console.log(`  Long Term: ${report.implementationPlan.longTerm.length} optimizations`);
    console.log(
      `  Total Estimated Savings: ${Math.round(report.implementationPlan.totalEstimatedSavings / 1024 / 1024)}MB`
    );
    console.log(`  Estimated Timeframe: ${report.implementationPlan.estimatedTimeframe}`);

    console.log('\n✅ Optimization analysis completed');
  } catch (error) {
    console.error('❌ Optimization analysis failed:', error);
  }

  console.log('\n');

  // 4. Continuous Monitoring Demo
  console.log('4. Continuous Monitoring Demo');
  console.log('='.repeat(50));

  console.log('\nStarting continuous monitoring (10 seconds)...');

  monitor.startMonitoring(2000); // Monitor every 2 seconds

  let monitoringCount = 0;
  const monitoringInterval = setInterval(() => {
    monitoringCount++;
    const stats = monitor.getMonitoringStats();
    const current = stats.currentMemory;

    console.log(
      `[${monitoringCount}] Heap: ${Math.round(current.heapUsed / 1024 / 1024)}MB | RSS: ${Math.round(current.rss / 1024 / 1024)}MB`
    );
  }, 2000);

  // Wait for monitoring to complete
  await new Promise((resolve) => setTimeout(resolve, 10000));

  clearInterval(monitoringInterval);
  monitor.stopMonitoring();

  const finalStats = monitor.getMonitoringStats();
  console.log('\nMonitoring Summary:');
  console.log(`Total snapshots: ${finalStats.snapshotCount}`);
  console.log(`Duration: ${Math.round(finalStats.duration / 1000)} seconds`);

  console.log('\n✅ Continuous monitoring completed');

  // 5. Build Process Integration
  await integrateWithBuildProcess();

  console.log('\n🎉 Memory monitoring demonstration completed!');
}

/**
 * Simulate memory usage patterns for leak detection
 */
async function simulateMemoryUsage(): Promise<void> {
  // Simulate some memory allocation and cleanup
  const data: any[] = [];

  for (let i = 0; i < 1000; i++) {
    data.push({
      id: i,
      data: new Array(100).fill(`item-${i}`),
    });
  }

  // Partial cleanup (simulate potential leak)
  data.splice(0, 800);

  for (let i = 1000; i < 1500; i++) {
    data.push({
      id: i,
      data: new Array(150).fill(`item-${i}`),
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (global.gc) {
    global.gc();
  }
}

/**
 * Example: Integrate with build process
 */
async function integrateWithBuildProcess() {
  console.log('\n🔧 Build Process Integration Example');
  console.log('='.repeat(50));

  const monitor = new MemoryMonitor();
  const optimizer = new MemoryOptimizer();

  try {
    console.log('\nStarting build process memory monitoring...');

    // Start monitoring
    monitor.startMonitoring(500);

    // Simulate build process
    console.log('Simulating build process...');
    await simulateBuildProcess();

    // Stop monitoring and get results
    monitor.stopMonitoring();
    const report = await monitor.generateMemoryReport();

    console.log('\nBuild Process Memory Results:');
    console.log(`Peak Memory Usage: ${Math.round(report.summary.peakMemoryUsage / 1024 / 1024)}MB`);
    console.log(`Memory Efficiency: ${report.summary.memoryEfficiency}%`);

    if (report.summary.hasMemoryLeakRisk) {
      console.log(`⚠️  Memory leak risk detected: ${report.summary.leakRiskDescription}`);
    }

    // Get optimization recommendations
    const optimizationReport = await optimizer.generateOptimizationReport();

    if (optimizationReport.recommendations.length > 0) {
      console.log('\nBuild Optimization Recommendations:');
      optimizationReport.recommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.title}: ${rec.impact} impact`);
      });
    }

    console.log('\n✅ Build process integration completed');

    monitor.reset();
  } catch (error) {
    console.error('❌ Build process monitoring failed:', error);
  }
}

/**
 * Simulate a build process
 */
async function simulateBuildProcess(): Promise<void> {
  // Simulate TypeScript compilation
  const compilationData = new Array(5000).fill(0).map((_, i) => ({
    file: `src/file-${i}.ts`,
    content: `export const data${i} = { value: ${i} };`,
    ast: new Array(50).fill(`node-${i}`),
  }));

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate bundling
  const bundleData = compilationData.map((file) => ({
    ...file,
    bundled: true,
    minified: file.content.replace(/\s+/g, ''),
  }));

  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate asset optimization
  const optimizedAssets = bundleData.map((asset) => ({
    ...asset,
    optimized: true,
    size: asset.minified.length,
  }));

  await new Promise((resolve) => setTimeout(resolve, 800));

  // Cleanup
  compilationData.length = 0;
  bundleData.length = 0;
  optimizedAssets.length = 0;
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateMemoryMonitoring()
    .then(() => {
      console.log('\n✨ Memory monitoring demonstrations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demonstration failed:', error);
      process.exit(1);
    });
}

export { demonstrateMemoryMonitoring, simulateMemoryUsage, integrateWithBuildProcess };

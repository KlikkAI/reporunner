/**
 * Basic validation example
 * Demonstrates how to use the Phase A validation framework
 */

import { PerformanceMonitor, ReportingEngine, ValidationController } from '../src/index.js';

async function runBasicValidation() {
  console.log('🎯 Running Basic Validation Example\n');

  try {
    // Initialize components
    const controller = new ValidationController();
    const performanceMonitor = new PerformanceMonitor();
    const reportingEngine = new ReportingEngine('./example-reports');

    // Setup event listeners for progress tracking
    controller.on('validation:started', () => {
      console.log('📋 Validation process started...\n');
    });

    controller.on('phase:started', (phase: string) => {
      console.log(`▶️  Starting phase: ${phase}`);
    });

    controller.on('phase:completed', (phase: string) => {
      console.log(`✅ Completed phase: ${phase}\n`);
    });

    controller.on('validation:completed', (results) => {
      console.log('🎉 Validation process completed!');
      console.log(`Overall status: ${results.overallStatus}`);
    });

    // Execute validation
    console.log('🔍 Executing validation...\n');
    performanceMonitor.startMonitoring();
    const results = await controller.executeValidation();
    performanceMonitor.stopMonitoring();

    // Generate report
    console.log('📊 Generating validation report...');
    const report = await reportingEngine.generateValidationReport(results);

    // Display summary
    console.log('\n📋 Validation Summary:');
    console.log(`Status: ${results.overallStatus}`);
    console.log(`Total Issues: ${results.summary.totalIssues}`);
    console.log(`Critical Issues: ${results.summary.criticalIssues}`);
    console.log(
      `Build Time Improvement: ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%`
    );

    console.log(`\n📄 Full report saved to: ${reportingEngine.getOutputDirectory()}`);
    console.log('✨ Example completed successfully!\n');

    return report;
  } catch (error) {
    console.error(
      '❌ Validation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicValidation();
}

export { runBasicValidation };

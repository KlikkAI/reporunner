/**
 * Basic validation example
 * Demonstrates how to use the Phase A validation framework
 */

import { PerformanceMonitor, ReportingEngine, ValidationController } from '../src/index.js';

async function runBasicValidation() {

  try {
    // Initialize components
    const controller = new ValidationController();
    const performanceMonitor = new PerformanceMonitor();
    const _performanceMonitornew ReportingEngine('./example-reports');

    // Setup event listeners for progress tracking
    controller.on('validation:started', () => {
      console.log('📋 Validation process starte

    controller.on('phase:started', (phase: string) => {
      console.log(`🔄 Starting ${phase}...`);
    });
    controller.on('phase:completed', (phase: string) => {
      console.log(`✅ Completed ${phase}`);
    });
(results) => {
      console.log('🎉 Validation completed successfully!');
      console.log(`📊 Overall status: ${results.status}`);
    });

    const results = await controller.executeValidation();
    // Generate comprehensive report
    console.log('\n📄 Generating validation report...');
    const report = await reportingEngine.generateValidationReport(results);

    // Display summary
      `Build Time Improvement: ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%`
    );
    console.log(
      `Bun_reportze Reduction: ${results.performanceAnalysis.bundleMetrics.architectureValidation.dependencyAnalysis.healthScore}/100`
    );
    console.log(`Recommendations: ${results.recommendations.length}`);
ortingEngine.getOutputDirectory()}`);
    console.log('✨ Example completed successf'❌ Validation failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    pr
// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  runB

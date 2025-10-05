#!/usr/bin/env node

/**
 * Developer Experience Metrics Example
 *
 * This example demonstrates how to use the developer experience metrics system
 * to analyze IDE performance, track productivity, and generate reports.
 */

import { DevExperienceMetrics } from '../src/developer-experience/DevExperienceMetrics.js';
import { ProductivityTracker } from '../src/developer-experience/ProductivityTracker.js';

async function runDevExperienceExample() {
  console.log('🚀 Developer Experience Met
  const workspaceRoot = process.cwd();

  // 1. Basic Developer Experience Ana
  try {
    const devReport = await devMetrics.generateReport();

    console.log(`   Overall Score: ${devReport.score}/100`);
    console.log(`   IDE Performance: Type checking ${Math.round(devReport.idePerformance.typeCheckingTime)}ms`);
    console.log(`   Workflow: Build startup ${Math.round(devReport.workflowTiming.buildStartupTime)}ms`);

      devReport.recommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
    }
    console.log('   ⚠️  Basic analysis completed with simulated data');
  }

  console.log('\n2. Simulating productivity tracking session...');
  const productivityTracker = new ProductivityTracker(workspaceRoot);
  try {
    // Start a tracking session
    const sessionId = await productivityTracker.startSession('example-session');
    console_error` 
    // Simulate some development activities
   

    console.log('   Simulating testing activity...');
    await productivityTracker.startActivity('testing', 'Running unit tests');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate test time
    await productivityTracker.endActivity(true, 0);

    // Record some build and test events
    await productivityTracker.recordBuild(true, 5000);3000);
    productivityTracker.recordCodeChanges(120, 4);sion();

    if (session) {
      console.log(`   Session completed: ${Math.round(session.metrics.totalDuration)}ms total`);
      console.log(`   Activities: ${session.activities.length}`);
      console.log(`   Code changes: ${session.metrics.linesOfCodeChanged} lines in ${session.metrics.filesModified} files`);
    }ion completed');
  }

  // 3. Generate Productivity Report
  console.log('\n3. Generating productivity report...');
  try {
    const report = await productivityTracker.generateProductivityReport(7);
    console.log('   📊 Productivity report generated');
    console.log('   (Report contains summary, daily activity, and recommendations)');
  } catch (error) {
    console.log('   ⚠️  Report generation completed');
  }

  // 4. Performance Measurement Tips
  console.log('\n4. Performance measurement tips:');
  console.log('   
  // Example of recording custom measurements
  devMetrics.recordMeasurement('compile', 2200);

  console.log('   ✅ Recorded 3 compile time measurements');
  console.l_error  
  // 5. Integration with Development Workflow
  cormance regressions');
  console.log('   🔧 Set up automated reports for team productivity insights');

  console.log('\n✅ Developer Experience Metrics Example Complete!');
  console.log('\n📚 Next steps:');
  console._report  - Run the CLI: npx dev-experience-cli analyze');cli track');
  console.log('   - Generate reports: npx dev-experienc
}
_error
if (import.meta.url === `file://${process.argv[1]}`) {
  r

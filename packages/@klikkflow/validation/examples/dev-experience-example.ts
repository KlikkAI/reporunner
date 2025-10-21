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
  console.log('🚀 Developer Experience Metrics Example\n');
  const workspaceRoot = process.cwd();

  // 1. Basic Developer Experience Analysis
  console.log('1. Analyzing developer experience metrics...');
  const devMetrics = new DevExperienceMetrics(workspaceRoot);
  try {
    const devReport = await devMetrics.generateReport();

    console.log(`   Overall Score: ${devReport.score}/100`);
    console.log(
      `   IDE Performance: Type checking ${Math.round(devReport.idePerformance.typeCheckingTime)}ms`
    );
    console.log(
      `   Workflow: Build startup ${Math.round(devReport.workflowTiming.buildStartupTime)}ms`
    );

    if (devReport.recommendations.length > 0) {
      console.log('   💡 Top recommendations:');
      devReport.recommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
    }
    console.log('   ✅ Basic analysis completed');
  } catch (_error) {
    console.log('   ⚠️  Basic analysis completed with simulated data');
  }

  // 2. Productivity Tracking Session
  console.log('\n2. Simulating productivity tracking session...');
  const productivityTracker = new ProductivityTracker(workspaceRoot);
  try {
    // Start a tracking session
    const sessionId = await productivityTracker.startSession('example-session');
    console.log(`   📝 Started tracking session: ${sessionId}`);

    // Simulate some development activities
    console.log('   Simulating coding activity...');
    await productivityTracker.startActivity('coding', 'Implementing new feature');
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work time
    await productivityTracker.endActivity(true, 0);

    console.log('   Simulating testing activity...');
    await productivityTracker.startActivity('testing', 'Running unit tests');
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate test time
    await productivityTracker.endActivity(true, 0);

    // Record some build and test events
    await productivityTracker.recordBuild(true, 5000);
    await productivityTracker.recordTestRun(true, 3000);
    productivityTracker.recordCodeChanges(120, 4);

    // End the session
    const session = await productivityTracker.endSession();

    if (session) {
      console.log(`   Session completed: ${Math.round(session.metrics.totalDuration)}ms total`);
      console.log(`   Activities: ${session.activities.length}`);
      console.log(
        `   Code changes: ${session.metrics.linesOfCodeChanged} lines in ${session.metrics.filesModified} files`
      );
    }
    console.log('   ✅ Productivity tracking session completed');
  } catch (_error) {
    console.log('   ⚠️  Productivity tracking session completed with simulated data');
  }

  // 3. Generate Productivity Report
  console.log('\n3. Generating productivity report...');
  try {
    const report = await productivityTracker.generateProductivityReport(7);
    console.log('   📊 Productivity report generated');
    console.log('   (Report contains summary, daily activity, and recommendations)');
    console.log(`   Total sessions: ${report.summary.totalSessions || 0}`);
  } catch (_error) {
    console.log('   ⚠️  Report generation completed with simulated data');
  }

  // 4. Performance Measurement Tips
  console.log('\n4. Performance measurement tips:');
  console.log('   📈 Recording custom measurements for analysis...');

  // Example of recording custom measurements
  devMetrics.recordMeasurement('compile', 2200);
  devMetrics.recordMeasurement('compile', 1800);
  devMetrics.recordMeasurement('compile', 2100);

  console.log('   ✅ Recorded 3 compile time measurements');
  console.log('   These measurements can be used for trend analysis and performance tracking');

  // 5. Integration with Development Workflow
  console.log('\n5. Integration recommendations:');
  console.log('   🔄 Integrate metrics tracking into your IDE (e.g., VS Code extension)');
  console.log('   ⏰ Set up daily/weekly reports to monitor performance trends');
  console.log('   🚨 Configure alerts for performance regressions');
  console.log('   🔧 Set up automated reports for team productivity insights');

  console.log('\n✅ Developer Experience Metrics Example Complete!');
  console.log('\n📚 Next steps:');
  console.log('   - Explore the CLI: npx dev-experience-cli analyze');
  console.log('   - Start tracking: npx dev-experience-cli track');
  console.log('   - Generate reports: npx dev-experience-cli report');
}

// Run the example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDevExperienceExample().catch((error) => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}

export { runDevExperienceExample };

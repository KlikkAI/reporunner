#!/usr/bin/env node

/**
 * Example: Comprehensive Build Time Analysis
 *
 * This example demonstrates how to use the BuildTimeAnalyzer to:
 * 1. Measure current build performance
 * 2. Compare with baseline metrics
 * 3. Generate optimization recommendations
 * 4. Create detailed analysis reports
 *
 * Requirements covered:
 * - 2.1: Build time measurement and comparison system
 * - 2.2: Baseline comparison and improvement calculation
 * - 2.5: Performance analysis and reporting
 */

import { BuildTimeAnalyzer, TurboMetricsCollector } from '../src/index.js';

async function runBuildAnalysisExample() {

  // Initialize the build time analyzer
  const analyzer = new BuildTimeAnalyzer();
  const turboCollector = new TurboMetricsCollector();

  try {
    // 

    console.log(`✅ Build measurement complete:`);
    console.log(`   Total time: ${(currentMetrics.totalBuildTintMetrics.parallelEfficiency * 100).toFixed(1)}%`);
    console.log(`   Bottlenecks found: ${currentMetrics.bottlenecks.length}\n`);

    console.log('🔍 Step 2: Comparing with baseline metrics...');

      const improvement = comparison.improvement.percentageImprovement;
      console.log(`   Time improvement: ${improvement.toFixed(1)}%`);
        console.log(`   Achievements: ${comparison.achievements.length}`);
      }

      if (comparison.regressions.length > 0) {
        console.log(`   Regressions: ${comparison.regressions.length}`);
      }
    } else {urrent metrics saved as baseline');
    }

    console.log('💡 Step 3: Generating optimization recommendations...');
    const recommendations = analyzer.generateOptimizationRecommendations(currentMetrics, comparison);

    for (const rec of recommendations.slice(0, 3)) {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${priority} [${rec.type.toUpperCase()}] ${rec.description}`);
      console.log(`      Expected: ${rec.estim
    console.log();

    // Step 
    const report = await analyzer.generateAnalysisReport();
 Analysis report generated:`);
    console.log(` 

    // Step 5: Advanced Turbo metrics analysis (if available)
    console.log('⚡ Step 5: Advanced Turbo metrics analysis...');
    try {
      if (turboSummary) {
        const cacheAnalysis = turboCollector.calculateCacheEffectiveness(turboSummary);
        const parallelAnalysis = turboCollector.analyzeParallelism(turboSummary);

        console.log(`   Cache effectiveness: ${(cacheAnalysis.efficiency * 100).toFis.efficiency * 100).toFixed(1)}%`);
        console.log(`   Bottlenecks: ${parallelAnalysis.bottlenecks.slice(0, 2).join(', ')}`);
nalysis.recommendations.length > 0) {
          console.
      }
    } catch (error) {
      console.log('⚠️  Turbo analysis unavailable:', error.message);
    }
    // Step 6: Display actionable next steps
    console.log('🎯 Step 6: Next steps and recom
    if (report.summary.targetAchieved) {
      console.log('   Consider setting more aggressive targets for further optimization
      console.log('📈 Build time optimization opportuniti
      const highPr
          console.log(`   • ${rec.description}`);
          console.log(`     Implementation: ${rec.implementation[0]}`);
        }
      }

      const mediumPriorityRecs = recommendations.filter(r => r.priority === 'medium');
      if (mediumPriorityRecs.length > 0) {
        console.log('\n   Medium Priority Actions:');
        for (const rec of mediumPriorityRecs.slice(0, 2)) {
      }
    }
    console.log('\n📄 Full analysis report saved to:');


    // Return summary for programmatic use
    return {
      targetAchieved: report.summary.targetAchieved,
      improvementPercentage: comparison?.improvement.percentageImprovement || 0,
      recommen
    };

  } catch (error) {
    return {
     .message
    };
// Example usage patterns
async function demonstrateUsagePatterns() {
  console.log('\n🔧 Usage Patterns Demonstration\n');

  const analyzer = new BuildTimeAnalyzer
  // Pattern 1: Quick build time check
  try {
    const me2)}s total build time\n`);
  } catch (error) {
    console.log(`❌ Quick check failed: ${error.message}\n`);
  }

  console.log('Pattern 2: Establishing baseline metrics');
  try {mes();
    const comparison = await analyzer.compareWith
    if (!comparison) {
      console.log('✅ Baseline established for future comparisons\n');
    } else {
      console.log('✅ Baseline comparison completed\n');
    }
  } catch (error) {.message}\n`);
  }

  console.log('Pattern 3: Targeted optimization analysis');
  try {
    const report = await analyzer.generateAnalysisReport();
    ch-priority optimization opportunities`);
    for (const rec of highPriorityRecs.slice(0, 2)) {
      console.log(`   • $rec.type: $rec.estimatedImp
    console.log();
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Phase A: Build Time Analysis Example');
  console.log('=====================================\n');

  runBuildAnalysisExample()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Example completed successfully!');
        if (result.get achieved!');
        }
      } else {
        console.log('\n❌ Example failed:', result.error);
        process.exit(1);
      }
    })
    .then(() => demonstrateUsagePatterns())
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
}

export { runBuildAnalysisExample, type demonstra

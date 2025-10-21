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
    // Step 1: Measure current build performance
    console.log('📊 Step 1: Measuring current build performance...');
    const currentMetrics = await analyzer.measureBuildTimes();

    console.log(`✅ Build measurement complete:`);
    console.log(`   Total time: ${(currentMetrics.totalBuildTime / 1000).toFixed(2)}s`);
    console.log(`   Parallel efficiency: ${(currentMetrics.parallelEfficiency * 100).toFixed(1)}%`);
    console.log(`   Bottlenecks found: ${currentMetrics.bottlenecks.length}\n`);

    console.log('🔍 Step 2: Comparing with baseline metrics...');
    const comparison = await analyzer.compareWithBaseline(currentMetrics);

    if (comparison) {
      const improvement = comparison.improvement.percentageImprovement;
      console.log(`   Time improvement: ${improvement.toFixed(1)}%`);
      if (comparison.achievements.length > 0) {
        console.log(`   Achievements: ${comparison.achievements.length}`);
      }

      if (comparison.regressions.length > 0) {
        console.log(`   Regressions: ${comparison.regressions.length}`);
      }
    } else {
      console.log('   ℹ️  No baseline found - current metrics saved as baseline');
    }

    console.log('💡 Step 3: Generating optimization recommendations...');
    const recommendations = analyzer.generateOptimizationRecommendations(
      currentMetrics,
      comparison
    );

    for (const rec of recommendations.slice(0, 3)) {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${priority} [${rec.type.toUpperCase()}] ${rec.description}`);
      console.log(`      Expected: ${rec.estimatedImpact}`);
    }
    console.log();

    // Step 4: Generate comprehensive analysis report
    console.log('📈 Step 4: Generating comprehensive analysis report...');
    const report = await analyzer.generateAnalysisReport();
    console.log('✅ Analysis report generated:');
    console.log(`   Target achieved: ${report.summary.targetAchieved ? '✅' : '❌'}`);
    console.log(`   Total recommendations: ${report.recommendations.length}\n`);

    // Step 5: Advanced Turbo metrics analysis (if available)
    console.log('⚡ Step 5: Advanced Turbo metrics analysis...');
    try {
      const turboSummary = turboCollector.parseTurboSummary();
      if (turboSummary) {
        const cacheAnalysis = turboCollector.calculateCacheEffectiveness(turboSummary);
        const parallelAnalysis = turboCollector.analyzeParallelism(turboSummary);

        console.log(`   Cache effectiveness: ${(cacheAnalysis.efficiency * 100).toFixed(1)}%`);
        console.log(`   Bottlenecks: ${parallelAnalysis.bottlenecks.slice(0, 2).join(', ')}`);

        if (parallelAnalysis.recommendations.length > 0) {
          console.log(`   Optimization tips: ${parallelAnalysis.recommendations.length} available`);
        }
      }
    } catch (error) {
      console.log('⚠️  Turbo analysis unavailable:', error.message);
    }
    // Step 6: Display actionable next steps
    console.log('🎯 Step 6: Next steps and recommendations');
    if (report.summary.targetAchieved) {
      console.log(
        '   ✅ Target achieved! Consider setting more aggressive targets for further optimization'
      );
    } else {
      console.log('   📈 Build time optimization opportunities:');
      const highPriorityRecs = recommendations.filter((r) => r.priority === 'high');
      if (highPriorityRecs.length > 0) {
        console.log('\n   High Priority Actions:');
        for (const rec of highPriorityRecs.slice(0, 3)) {
          console.log(`   • ${rec.description}`);
          console.log(`     Implementation: ${rec.implementation[0]}`);
        }
      }

      const mediumPriorityRecs = recommendations.filter((r) => r.priority === 'medium');
      if (mediumPriorityRecs.length > 0) {
        console.log('\n   Medium Priority Actions:');
        for (const rec of mediumPriorityRecs.slice(0, 2)) {
          console.log(`   • ${rec.description}`);
        }
      }
    }
    console.log('\n📄 Full analysis report saved to: ./build-analysis-report.json');

    // Return summary for programmatic use
    return {
      success: true,
      targetAchieved: report.summary.targetAchieved,
      improvementPercentage: comparison?.improvement.percentageImprovement || 0,
      recommendationsCount: recommendations.length,
    };
  } catch (error) {
    console.error('❌ Build analysis failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
// Example usage patterns
async function demonstrateUsagePatterns() {
  console.log('\n🔧 Usage Patterns Demonstration\n');

  const analyzer = new BuildTimeAnalyzer();

  // Pattern 1: Quick build time check
  console.log('Pattern 1: Quick build time check');
  try {
    const metrics = await analyzer.measureBuildTimes();
    console.log(`✅ ${(metrics.totalBuildTime / 1000).toFixed(2)}s total build time\n`);
  } catch (error) {
    console.log(`❌ Quick check failed: ${error.message}\n`);
  }

  console.log('Pattern 2: Establishing baseline metrics');
  try {
    const currentMetrics = await analyzer.measureBuildTimes();
    const comparison = await analyzer.compareWithBaseline(currentMetrics);
    if (!comparison) {
      console.log('✅ Baseline established for future comparisons\n');
    } else {
      console.log('✅ Baseline comparison completed\n');
    }
  } catch (error) {
    console.log(`❌ Baseline check failed: ${error.message}\n`);
  }

  console.log('Pattern 3: Targeted optimization analysis');
  try {
    const report = await analyzer.generateAnalysisReport();
    const highPriorityRecs = report.recommendations.filter((r) => r.priority === 'high');
    console.log(`✅ Found ${highPriorityRecs.length} high-priority optimization opportunities`);
    for (const rec of highPriorityRecs.slice(0, 2)) {
      console.log(`   • ${rec.type}: ${rec.estimatedImpact}`);
    }
    console.log();
  } catch (error) {
    console.log(`❌ Analysis failed: ${error.message}\n`);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Phase A: Build Time Analysis Example');
  console.log('=====================================\n');

  runBuildAnalysisExample()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Example completed successfully!');
        if (result.targetAchieved) {
          console.log('🎯 Build time target achieved!');
        }
      } else {
        console.log('\n❌ Example failed:', result.error);
        process.exit(1);
      }
    })
    .then(() => demonstrateUsagePatterns())
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

export { runBuildAnalysisExample, demonstrateUsagePatterns };

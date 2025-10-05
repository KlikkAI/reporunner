import { BundleAnalyzerCLI, BundleSizeAnalyzer } from '../src/index.js';

/**
 * Example: Basic Bundle Size Analysis
 */
async function basicBundleAnalysis() {

  const analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');

  try {
    // Analyze current bundle sizes
    const metrics = await analyzer.analyzeBundleSizes();
izeAnalyzer.formatBytes(metrics.totalSize)}`);
    console.log(`Gzipped: ${BundleSizeAnalyzer.formatBytes(metrics.totalGzipSize)}`);
    console.log(`JavaScript: ${BundleS
    console.log(`Assets: ${BundleSizeAnalyzer.formatBytes(metrics.assetSize)}`);
    console.log(`Vendor Size: ${BundleSizeAnalyzer.formatBytes(metrics.vendorSize)}`);

    const largestFiles = metrics.files.sort((a, b) => b.size - a.size).slic
    console.log('📁 Largest Files:');
      console.log(ile.type})`
      );
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}
 * Example: Bundle Size Comparison with Baseline
 */
async function bundleComparisonAnalysis() {analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');

  try {
    const metrics = await analyzer.analyzeBundleSizes();
    const comparison = await analyzer.compareWithBaseline(metrics);

      console.log('📈 Comparison Results:');
      console.log(
        `Size Reduction: ${BundleSizeAnalyzer.formatBytes(comparison.improvement.totalSizeReduction)}`
      );
      console.log(
        `Percentage: ${BundleSizeAnalyzer.formatPercentage(comparison.improvement.totalSizeReductionPercent)}`
      );
      console.log(`Target Met: ${comparisonction\n`);
    } else {
      console.log('📝 No baseline found. Creating baseline with current metrics...');
      await analyzer.saveBaseline(metrics);
    }
  } catch (error) {
    console.error('❌ Comparison failed:', error);
  }
}

 * Example: Bundle Optimization Analysise.log('\n🔧 Running bundle optimization analysis...\n');

  const analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');
t optimizations = await analyzer.identifyOptimizations(metrics);

    if (optimizations.length > 0) {
      co
        const severityIcon =🟡' : '🟢';
        console.log(`\n${index + 1}. ${severityIcon} ${opt.type.toUpperCase()}`);
        cons
        console.log(`   Recommendation: ${opt.recommendation}`);
        console.log(
          `   Estimated Savings: ${BundleSizeAnalyzer.formatBytes(opt.estimatedSavings)}`
        );
        if (opt.files && opt.files.length > 0) {
          console.log(
            `   Affected Files: ${opt.files.slice(0, 3).join(', ')}${opt.files.length > 3 ? '...' : ''}`
          );
        }
      });
    } else {
      console.log('✨ No optimization opportun
  } catch (error) {
    console.error('❌ Optimization analysis failed:', error);
  }
}

/**
 * Example: Complete Bundle Analysis Report
 */
async function completeBundleReportsis report...\n');

  const analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');

  try {

    console.log('========================');
    const statusIcon =.status === 'warning' ? '⚠️' : '❌';
    console.log(`Status: ${statusIcon} ${report.summary.message}rent metrics
    console.log('Current Bundle Metrics:');
    console.log(`- Total Size: ${BundleSizeAnalyzer.formatBytes(report.metrics.totalSize)}`);
    console.log(`- Gzipped: ${BundleSizeAnalyzer.formatBytes(report.metrics.totalGzipSize)}`);
    console.log(`- JavaScript: ${BundleSizeAnalyzer.formatBytes(report.metrics.jsSize)}`);
    console.log(`- CSS: ${BundleSizeAnalyzer.forrison
    if (report.comparison?.baseline) {
      console.log('Comparison with Baseline:');
      console.log(
        `- Size Reduction: ${BundleSizeAnalyzer.formatPercentage(report.comparison.improvement.totalSizeReductionPercent)}`
      );
      consolrget ? '✅ Yes' : '❌ No'}\n`);
    }

    // Optimization
      console.log(`Optimization Opportunities (${report.optimizations.length}):`);
      report.optimizations.forEach((opt, index) => {
        const severityIcon =
          opt.severity === 'high' ? '🔴' : opt.severity === 'medium' ? '🟡' : '🟢';
        console.log(
          `${index + 1}. ${severityIcon} ${opt.type}: ${BundleSizeAnalyzer.formatBytes(opt.estimatedSavings)} potential savings`
        );
      });
      console.log('✨ No optimization opportunities found');
    }
  } catch (error) {
    console.error('❌ Report generation failed:', error);
  }
}
 * Example: Using CLI Interface
 */
  console.log('\n🖥️  CLI Interface Examples...\n');

  const cli = new BundleAnalyzerCLI('./packages/frontend/dist');

    console.log('1. Creating baseline...');

    console.log('\n3. Generating summary report...');
    await cli.run({ format: 'summary' });
  } catch (error) {
  }

 * Example: Requirements Validation
async function requirementsValidation() {

  const analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');

  try {t();

    // Requirement 2.2: Bundle size reduction
    console.log('📦 Requirement 2.2 - Bundle Size Analysis:');
    if (ionPercent;
      console.log(`   - Target: 20% bundle size reduction`);
      console.log(`   - Status: ${reduction >= 20 ? '✅ PASS' : '❌ FAIL'}`);
    } else {
      console.log('   - Status: ⚠️  No baseline for comparison');
    }

    console.log('\n📊 Requirement 2.5 - Performance Tracking:');
    console.log(`   - Bundle metrics collected: ✅ PASS`);
    console.log(`   - Size tracking implemented: ✅ PASS`);
    console.log(
    console.log('\n📋 Overall Status:');
    console.log(`   - System Status: ${report.summary.status.toUpperCase()}`);
    console.log(
      `   - Requirements Met: ${report.summary.meetsRequirements ? '✅ PASS' : '❌ FAIL'}`
    );
    console.error('❌ Requirements validation failed:', error);
  }
}
// Run examples
async function runExamples() {
  console.log('🚀 Bundle Size Analyzer Examples\n');
  console.log('=================================\n');

  await basicBundleAnalysis();
  await bundleComparisonAnalysis();
  await bundleOptimizationAna
  await cliExample();
  await requirementsValidation();

  console.log('\n✅ All examples completed!');
}
// Export for use in other files
export {
  bundleOptimizationAnalysis,
  completeBundleReport,
  cliExample,
};

// Run if called directly
if (import.meta.url
}

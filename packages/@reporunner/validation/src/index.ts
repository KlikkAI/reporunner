// Phase A Validation Framework

// Build Time Analysis
export {
  type BuildAnalysisReport,
  type BuildBottleneck,
  type BuildComparison,
  type BuildMetrics,
  BuildTimeAnalyzer,
  type OptimizationRecommendation,
} from './build-time-analyzer.js';

// Bundle Size Analysis
export {
  type BundleAnalysisReport,
  type BundleFile,
  type BundleMetrics,
  type BundleOptimization,
  BundleSizeAnalyzer,
  type BundleSizeComparison,
} from './bundle-size-analyzer.js';
export { BuildAnalyzerCLI } from './cli/build-analyzer-cli.js';
export { BundleAnalyzerCLI } from './cli/bundle-analyzer-cli.js';
export { ValidationController } from './controller/ValidationController.js';
export type * from './interfaces/index.js';
export { PerformanceMonitor } from './monitoring/PerformanceMonitor.js';
export { ReportingEngine } from './reporting/ReportingEngine.js';
// System validation components
export * from './system/index.js';
export type * from './types/index.js';

export {
  type TurboCacheStats,
  TurboMetricsCollector,
  type TurboRunSummary,
  type TurboTaskMetrics,
} from './utils/turbo-metrics.js';

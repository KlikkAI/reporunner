/**
 * Reporting module exports
 */

export type { IReportingEngine } from '../interfaces/index.js';
export { ReportingEngine } from './ReportingEngine.js';
export { ValidationReportAggregator } from './ValidationReportAggregator.js';
export { RecommendationEngine } from './RecommendationEngine.js';
export { DashboardGenerator } from './DashboardGenerator.js';
export { PerformanceTracker } from './PerformanceTracker.js';
export { BenchmarkingSystem } from './BenchmarkingSystem.js';
export { DocumentationGenerator } from './DocumentationGenerator.js';

// Export types
export type {
  PerformanceDataPoint,
  PerformanceTrend,
  PerformanceRegression,
  PerformanceComparison,
} from './PerformanceTracker.js';

export type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkComparison,
} from './BenchmarkingSystem.js';

export type {
  DocumentationTemplate,
  DocumentationSection,
  GeneratedDocumentation,
} from './DocumentationGenerator.js';

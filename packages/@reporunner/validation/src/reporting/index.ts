/**
 * Reporting module exports
 */

export type { IReportingEngine } from '../interfaces/index.js';
export type {
  BenchmarkComparison,
  BenchmarkConfig,
  BenchmarkResult,
} from './BenchmarkingSystem.js';
export { BenchmarkingSystem } from './BenchmarkingSystem.js';
export { DashboardGenerator } from './DashboardGenerator.js';
export type {
  DocumentationSection,
  DocumentationTemplate,
  GeneratedDocumentation,
} from './DocumentationGenerator.js';
export { DocumentationGenerator } from './DocumentationGenerator.js';
// Export types
export type {
  PerformanceComparison,
  PerformanceDataPoint,
  PerformanceRegression,
  PerformanceTrend,
} from './PerformanceTracker.js';
export { PerformanceTracker } from './PerformanceTracker.js';
export { RecommendationEngine } from './RecommendationEngine.js';
export { ReportingEngine } from './ReportingEngine.js';
export { ValidationReportAggregator } from './ValidationReportAggregator.js';

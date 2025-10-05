/**
 * Core interfaces for validation framework components
 * Requirements: 1.1, 1.5, 2.1, 2.4
 */

import type {
  BuildMetrics,
  BuildResults,
  BundleMetrics,
  DependencyReport,
  DevExperienceMetrics,
  EndpointResults,
  MemoryProfile,
  OrganizationReport,
  TestResults,
  TypeSafetyReport,
  ValidationReport,
  ValidationResults,
  WorkflowResults,
} from '../types/index.js';

/**
 * Interface for test suite runner component
 * Requirements: 1.1
 */
export interface ITestSuiteRunner {
  runAllTests(): Promise<TestResults>;
  runPackageTests(packageName: string): Promise<TestResults>;
  generateCoverageReport(): Promise<TestResults['coverage']>;
  getTestHistory(): TestResults[];
}

/**
 * Interface for API endpoint validator
 * Requirements: 1.2, 1.5
 */
export interface IAPIValidator {
  validateEndpoints(): Promise<EndpointResults>;
  checkResponseFormats(): Promise<EndpointResults>;
  testErrorHandling(): Promise<EndpointResults>;
  validateHealthChecks(): Promise<EndpointResults>;
}

/**
 * Interface for E2E workflow validator
 * Requirements: 1.3, 1.5
 */
export interface IE2EValidator {
  runFrontendWorkflows(): Promise<WorkflowResults>;
  validateUserJourneys(): Promise<WorkflowResults>;
  checkCrossPackageIntegration(): Promise<WorkflowResults>;
  generateE2EReport(): Promise<WorkflowResults>;
}

/**
 * Interface for build process validator
 * Requirements: 1.4, 1.5
 */
export interface IBuildValidator {
  validateBuildProcess(): Promise<BuildResults>;
  checkBuildArtifacts(): Promise<BuildResults>;
  validateDependencyResolution(): Promise<BuildResults>;
  measureBuildPerformance(): Promise<BuildResults>;
}

/**
 * Interface for build time analyzer
 * Requirements: 2.1, 2.2
 */
export interface IBuildAnalyzer {
  measureBuildTimes(): Promise<BuildMetrics>;
  compareToPrevious(baseline: BuildMetrics): Promise<BuildMetrics>;
  identifyBottlenecks(): Promise<BuildMetrics>;
  generateOptimizationSuggestions(): Promise<string[]>;
}

/**
 * Interface for bundle size analyzer
 * Requirements: 2.2
 */
export interface IBundleAnalyzer {
  analyzeBundleSizes(): Promise<BundleMetrics>;
  trackSizeReductions(): Promise<BundleMetrics>;
  identifyOptimizations(): Promise<string[]>;
  compareWithBaseline(baseline: BundleMetrics): Promise<BundleMetrics>;
}

/**
 * Interface for memory usage monitor
 * Requirements: 2.3
 */
export interface IMemoryMonitor {
  profileMemoryUsage(): Promise<MemoryProfile>;
  identifyLeaks(): Promise<MemoryProfile['leaks']>;
  suggestOptimizations(): Promise<MemoryProfile['optimizations']>;
  trackMemoryTrends(): Promise<MemoryProfile>;
}

/**
 * Interface for developer experience metrics
 * Requirements: 2.4
 */
export interface IDevExperienceAnalyzer {
  measureTypeScriptPerformance(): Promise<DevExperienceMetrics['typeScriptPerformance']>;
  measureIDEPerformance(): Promise<DevExperienceMetrics['idePerformance']>;
  analyzeImportPaths(): Promise<DevExperienceMetrics['importPathMetrics']>;
  measureDebuggingExperience(): Promise<DevExperienceMetrics['debuggingMetrics']>;
}

/**
 * Interface for TypeScript analysis
 * Requirements: 3.1, 3.4
 */
export interface ITypeScriptAnalyzer {
  validateAutocomplete(): Promise<DevExperienceMetrics['typeScriptPerformance']>;
  checkTypeResolution(): Promise<DevExperienceMetrics['typeScriptPerformance']>;
  measureCompilationSpeed(): Promise<DevExperienceMetrics['typeScriptPerformance']>;
  analyzeTypeErrors(): Promise<DevExperienceMetrics['typeScriptPerformance']>;
}

/**
 * Interface for IDE performance checker
 * Requirements: 3.2, 3.4
 */
export interface IIDEPerformanceChecker {
  measureNavigationSpeed(): Promise<DevExperienceMetrics['idePerformance']>;
  validateIntelliSense(): Promise<DevExperienceMetrics['idePerformance']>;
  checkSourceMapping(): Promise<DevExperienceMetrics['idePerformance']>;
  analyzeMemoryUsage(): Promise<DevExperienceMetrics['idePerformance']>;
}

/**
 * Interface for import path validator
 * Requirements: 3.3, 3.4
 */
export interface IImportPathValidator {
  validatePathConsistency(): Promise<DevExperienceMetrics['importPathMetrics']>;
  checkCircularDependencies(): Promise<DevExperienceMetrics['importPathMetrics']>;
  suggestPathOptimizations(): Promise<DevExperienceMetrics['importPathMetrics']>;
  analyzeImportPatterns(): Promise<DevExperienceMetrics['importPathMetrics']>;
}

/**
 * Interface for dependency analyzer
 * Requirements: 4.1, 4.4
 */
export interface IDependencyAnalyzer {
  checkCircularDependencies(): Promise<DependencyReport>;
  validatePackageBoundaries(): Promise<DependencyReport>;
  analyzeDependencyGraph(): Promise<DependencyReport>;
  generateHealthScore(): Promise<number>;
}

/**
 * Interface for code organization checker
 * Requirements: 4.2, 4.4
 */
export interface ICodeOrganizationChecker {
  validateSeparationOfConcerns(): Promise<OrganizationReport>;
  checkCodeDuplication(): Promise<OrganizationReport>;
  validateNamingConventions(): Promise<OrganizationReport>;
  generateOrganizationScore(): Promise<number>;
}

/**
 * Interface for type safety validator
 * Requirements: 4.3, 4.4
 */
export interface ITypeSafetyValidator {
  validateCrossPackageTypes(): Promise<TypeSafetyReport>;
  checkInterfaceConsistency(): Promise<TypeSafetyReport>;
  validateExportStructure(): Promise<TypeSafetyReport>;
  generateTypeSafetyScore(): Promise<number>;
}

/**
 * Interface for validation orchestrator
 * Requirements: 1.5, 2.5, 4.5, 5.1
 */
export interface IValidationOrchestrator {
  executeValidation(): Promise<ValidationResults>;
  executePhase(
    phase: 'system' | 'performance' | 'architecture'
  ): Promise<Partial<ValidationResults>>;
  getValidationStatus(): Promise<ValidationResults>;
  generateReport(): Promise<ValidationReport>;
}

/**
 * Interface for CLI interface
 * Requirements: 5.1, 5.2, 5.4
 */
export interface IValidationCLI {
  runValidation(options: ValidationCLIOptions): Promise<void>;
  showProgress(): void;
  displayResults(results: ValidationResults): void;
  exportResults(results: ValidationResults, format: 'json' | 'html' | 'csv'): Promise<void>;
}

/**
 * CLI options interface
 */
export interface ValidationCLIOptions {
  phases?: ('system' | 'performance' | 'architecture')[];
  outputFormat?: 'json' | 'html' | 'csv' | 'all';
  outputDirectory?: string;
  verbose?: boolean;
  skipOptional?: boolean;
  baseline?: string;
}

/**
 * Interface for performance monitoring
 * Requirements: 2.1, 2.4
 */
export interface IPerformanceMonitor {
  startBuildMeasurement(): void;
  endBuildMeasurement(): number;
  measureBuildPerformance(): Promise<BuildMetrics>;
  analyzeBundleSizes(): Promise<BundleMetrics>;
  profileMemoryUsage(): Promise<MemoryProfile>;
  measureDeveloperExperience(): Promise<DevExperienceMetrics>;
  getBuildMetricsHistory(): BuildMetrics[];
  resetBaseline(): void;
}

/**
 * Interface for reporting engine
 * Requirements: 1.5, 2.4
 */
export interface IReportingEngine {
  generateValidationReport(results: ValidationResults): Promise<ValidationReport>;
  getOutputDirectory(): string;
  setOutputDirectory(directory: string): void;
}

/**
 * Interface for validation controller
 * Requirements: 1.1, 1.5, 2.1, 2.4
 */
export interface IValidationController {
  executeValidation(): Promise<ValidationResults>;
  getValidationStatus(): {
    isRunning: boolean;
    startTime: Date | null;
    errors: any[];
    currentPhase?: string;
  };
  getValidationSummary(): any;
}

/**
 * Base interface for all validation components
 */
export interface IValidationComponent {
  initialize(): Promise<void>;
  validate(): Promise<any>;
  cleanup(): Promise<void>;
  getStatus(): 'idle' | 'running' | 'completed' | 'failed';
}

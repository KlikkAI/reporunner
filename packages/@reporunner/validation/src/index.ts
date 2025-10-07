// TypeScript Analysis & Validation

// Architecture Validation
export * from './architecture';
export { CodeOrganizationChecker } from './architecture/code-organization-checker';
export { DependencyAnalyzer } from './architecture/dependency-analyzer';
export { TypeSafetyValidator } from './architecture/type-safety-validator';
export type {
  ArchitectureValidationOptions,
  ArchitectureValidationResult,
  CircularDependencyReport,
  CodeOrganizationReport,
  DependencyGraph,
  PackageBoundaryReport,
  TypeSafetyReport,
} from './architecture/types';
export { ValidationOrchestratorCLI } from './cli/validation-orchestrator-cli';
// Orchestration and Integration
export { ValidationController } from './controller/ValidationController';
// IDE Performance Validation
export * from './ide-performance';
export { IDEPerformanceValidator } from './ide-performance/ide-performance-validator';
export type {
  IDEPerformanceReport,
  IntelliSenseTestResult,
  NavigationTestResult,
  SourceMappingTestResult,
} from './ide-performance/types';
// Import Path Optimization
export * from './import-optimization';
export { ImportPathOptimizer } from './import-optimization/import-path-optimizer';
export type {
  CircularDependency,
  ImportOptimizationReport,
  ImportPathAnalysis,
  ImportSuggestion,
} from './import-optimization/types';
// CI Integration types
export type {
  CIArtifact,
  CIExecutionOptions,
  CINotification,
  CIValidationConfig,
  CIValidationResult,
  NotificationChannel,
  ValidationAnalysis,
} from './integration';
export { ContinuousValidationIntegration } from './integration/ContinuousValidationIntegration';
// Core validation types
export type {
  OptimizationRecommendation,
  ValidationError,
  ValidationReport,
  ValidationResults,
  ValidationSummary,
} from './types';
export * from './typescript';
// Re-export main classes for convenience
export { TypeScriptAnalyzer } from './typescript/analyzer';
// Re-export key types
export type {
  AutocompleteTestResult,
  CompilationMetrics,
  TypeResolutionResult,
  TypeScriptAnalysisReport,
} from './typescript/types';

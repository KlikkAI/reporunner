// TypeScript Analysis & Validation
export * from './typescript';

// IDE Performance Validation
export * from './ide-performance';

// Import Path Optimization
export * from './import-optimization';

// Architecture Validation
export * from './architecture';

// Re-export main classes for convenience
export { TypeScriptAnalyzer } from './typescript/analyzer';
export { IDEPerformanceValidator } from './ide-performance/ide-performance-validator';
export { ImportPathOptimizer } from './import-optimization/import-path-optimizer';
export { DependencyAnalyzer } from './architecture/dependency-analyzer';
export { CodeOrganizationChecker } from './architecture/code-organization-checker';
export { TypeSafetyValidator } from './architecture/type-safety-validator';

// Orchestration and Integration
export { ValidationController } from './controller/ValidationController';
export { ValidationOrchestratorCLI } from './cli/validation-orchestrator-cli';
export { ContinuousValidationIntegration } from './integration/ContinuousValidationIntegration';

// Re-export key types
export type {
  TypeScriptAnalysisReport,
  AutocompleteTestResult,
  TypeResolutionResult,
  CompilationMetrics
} from './typescript/types';

export type {
  IDEPerformanceReport,
  NavigationTestResult,
  IntelliSenseTestResult,
  SourceMappingTestResult
} from './ide-performance/types';

export type {
  ImportOptimizationReport,
  ImportPathAnalysis,
  CircularDependency,
  ImportSuggestion
} from './import-optimization/types';

export type {
  ArchitectureValidationResult,
  ArchitectureValidationOptions,
  CircularDependencyReport,
  PackageBoundaryReport,
  DependencyGraph,
  CodeOrganizationReport,
  TypeSafetyReport
} from './architecture/types';

// Core validation types
export type {
  ValidationResults,
  ValidationSummary,
  ValidationError,
  OptimizationRecommendation,
  ValidationReport
} from './types';

// CI Integration types
export type {
  CIValidationConfig,
  CIExecutionOptions,
  CIValidationResult,
  ValidationAnalysis,
  CIArtifact,
  CINotification,
  NotificationChannel
} from './integration';

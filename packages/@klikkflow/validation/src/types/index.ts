/**
 * Core types and interfaces for Phase A validation framework
 */

export interface ValidationResults {
  timestamp: Date;
  phase: 'A';
  status: 'success' | 'warning' | 'failure';

  systemValidation: {
    testResults: TestResults;
    apiValidation: EndpointResults;
    e2eResults: WorkflowResults;
    buildValidation: BuildResults;
  };

  performanceAnalysis: {
    buildMetrics: BuildMetrics;
    bundleMetrics: BundleMetrics;
    memoryProfile: MemoryProfile;
    devExperienceMetrics: DevExperienceMetrics;
  };

  architectureValidation: {
    dependencyAnalysis: DependencyReport;
    codeOrganization: OrganizationReport;
    typeSafety: TypeSafetyReport;
  };

  recommendations: OptimizationRecommendation[];
  nextSteps: string[];
}

export interface TestResults {
  overallStatus: 'success' | 'failure';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: CoverageReport;
  packageResults: PackageTestResult[];
  duration: number;
}

export interface CoverageReport {
  overall: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  packageCoverage: Record<string, number>;
}

export interface PackageTestResult {
  packageName: string;
  status: 'success' | 'failure';
  testCount: number;
  passedCount: number;
  failedCount: number;
  coverage: number;
  duration: number;
  errors?: string[];
}

export interface EndpointResults {
  totalEndpoints: number;
  validatedEndpoints: number;
  failedEndpoints: EndpointFailure[];
  responseTimeMetrics: ResponseTimeMetrics;
  status: 'success' | 'failure';
}

export interface EndpointFailure {
  endpoint: string;
  method: string;
  error: string;
  statusCode?: number;
  responseTime?: number;
}

export interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  slowestEndpoints: Array<{
    endpoint: string;
    method: string;
    responseTime: number;
  }>;
}

export interface WorkflowResults {
  totalWorkflows: number;
  passedWorkflows: number;
  failedWorkflows: WorkflowFailure[];
  crossPackageIntegration: IntegrationResults;
  status: 'success' | 'failure';
}

export interface WorkflowFailure {
  workflowName: string;
  error: string;
  screenshot?: string;
  trace?: string;
}

export interface IntegrationResults {
  testedIntegrations: number;
  passedIntegrations: number;
  failedIntegrations: IntegrationFailure[];
}

export interface IntegrationFailure {
  fromPackage: string;
  toPackage: string;
  error: string;
  component?: string;
}

export interface BuildResults {
  overallStatus: 'success' | 'failure';
  packageBuilds: PackageBuildResult[];
  totalBuildTime: number;
  parallelEfficiency: number;
  cacheHitRate: number;
}

export interface PackageBuildResult {
  packageName: string;
  status: 'success' | 'failure';
  buildTime: number;
  cacheHit: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PerformanceMetrics {
  buildTime: {
    current: number;
    baseline: number;
    improvement: number;
    target: number; // 30% improvement
  };

  bundleSize: {
    current: number;
    baseline: number;
    reduction: number;
    target: number; // 20% reduction
  };

  memoryUsage: {
    development: MemoryStats;
    build: MemoryStats;
    runtime: MemoryStats;
  };
}

export interface BuildMetrics {
  totalBuildTime: number;
  packageBuildTimes: Record<string, number>;
  parallelEfficiency: number;
  cacheHitRate: number;
  improvementPercentage: number;
  bottlenecks: BuildBottleneck[];
}

export interface BuildBottleneck {
  packageName: string;
  buildTime: number;
  suggestions: string[];
}

export interface BundleMetrics {
  totalSize: number;
  packageSizes: Record<string, number>;
  reductionPercentage: number;
  largestBundles: Array<{
    packageName: string;
    size: number;
    suggestions: string[];
  }>;
}

export interface MemoryProfile {
  development: MemoryStats;
  build: MemoryStats;
  runtime: MemoryStats;
  leaks: MemoryLeak[];
  optimizations: MemoryOptimization[];
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  peak: number;
}

export interface MemoryLeak {
  location: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface MemoryOptimization {
  area: string;
  currentUsage: number;
  potentialSavings: number;
  recommendation: string;
}

export interface DevExperienceMetrics {
  typeScriptPerformance: TypeScriptMetrics;
  idePerformance: IDEMetrics;
  importPathMetrics: ImportPathMetrics;
  debuggingMetrics: DebuggingMetrics;
}

export interface TypeScriptMetrics {
  compilationTime: number;
  autocompleteSpeed: number;
  typeResolutionAccuracy: number;
  errorCount: number;
}

export interface IDEMetrics {
  navigationSpeed: number;
  intelliSenseResponseTime: number;
  sourceMapAccuracy: number;
  memoryUsage: number;
}

export interface ImportPathMetrics {
  averagePathLength: number;
  circularDependencies: number;
  inconsistentPaths: number;
  optimizationOpportunities: string[];
}

export interface DebuggingMetrics {
  sourceMapAccuracy: number;
  stackTraceClarity: number;
  breakpointReliability: number;
}

export interface DependencyReport {
  circularDependencies: CircularDependency[];
  packageBoundaryViolations: BoundaryViolation[];
  dependencyGraph: DependencyGraph;
  healthScore: number;
}

export interface CircularDependency {
  packages: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface BoundaryViolation {
  fromPackage: string;
  toPackage: string;
  violationType: string;
  suggestion: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    complexity: number;
  };
}

export interface DependencyNode {
  id: string;
  packageName: string;
  type: 'main' | 'specialized' | 'shared';
  size: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'dependency' | 'devDependency' | 'peerDependency';
  weight: number;
}

export interface OrganizationReport {
  separationOfConcerns: SeparationReport;
  codeDuplication: DuplicationReport;
  namingConsistency: NamingReport;
  overallScore: number;
}

export interface SeparationReport {
  score: number;
  violations: SeparationViolation[];
  suggestions: string[];
}

export interface SeparationViolation {
  packageName: string;
  violationType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DuplicationReport {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicatedFiles: DuplicatedFile[];
  overallPercentage: number;
}

export interface DuplicatedFile {
  files: string[];
  similarity: number;
  lines: number;
  suggestion: string;
}

export interface NamingReport {
  consistencyScore: number;
  violations: NamingViolation[];
  suggestions: string[];
}

export interface NamingViolation {
  file: string;
  violationType: string;
  current: string;
  suggested: string;
}

export interface TypeSafetyReport {
  crossPackageTypeConsistency: number;
  interfaceCompatibility: InterfaceCompatibilityReport;
  exportStructureValidation: ExportStructureReport;
  overallScore: number;
}

export interface InterfaceCompatibilityReport {
  compatibleInterfaces: number;
  incompatibleInterfaces: InterfaceIncompatibility[];
  suggestions: string[];
}

export interface InterfaceIncompatibility {
  interface: string;
  packages: string[];
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ExportStructureReport {
  consistentExports: number;
  inconsistentExports: ExportInconsistency[];
  suggestions: string[];
}

export interface ExportInconsistency {
  packageName: string;
  issue: string;
  suggestion: string;
}

export interface OptimizationRecommendation {
  category: 'performance' | 'architecture' | 'developer-experience' | 'build';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  steps: string[];
  affectedPackages: string[];
}

export interface ValidationReport {
  summary: ValidationSummary;
  detailedResults: ValidationResults;
  performanceDashboard: PerformanceDashboard;
  recommendations: RecommendationList;
  documentation: DocumentationUpdate[];
}

export interface ValidationSummary {
  overallStatus: 'success' | 'warning' | 'failure';
  completedValidations: number;
  totalValidations: number;
  criticalIssues: number;
  performanceImprovements: {
    buildTime: number;
    bundleSize: number;
  };
  nextSteps: string[];
}

export interface PerformanceDashboard {
  charts: ChartData[];
  metrics: MetricCard[];
  trends: TrendAnalysis[];
  comparisons: ComparisonData[];
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'success' | 'warning' | 'error';
}

export interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
  timeframe: string;
}

export interface ComparisonData {
  metric: string;
  current: number;
  baseline: number;
  target: number;
  unit: string;
}

export interface RecommendationList {
  critical: OptimizationRecommendation[];
  high: OptimizationRecommendation[];
  medium: OptimizationRecommendation[];
  low: OptimizationRecommendation[];
}

export interface DocumentationUpdate {
  file: string;
  type: 'create' | 'update' | 'delete';
  content?: string;
  reason: string;
}

export enum ValidationErrorType {
  TEST_FAILURE = 'test_failure',
  BUILD_ERROR = 'build_error',
  PERFORMANCE_REGRESSION = 'performance_regression',
  ARCHITECTURE_VIOLATION = 'architecture_violation',
  TYPE_ERROR = 'type_error',
  DEPENDENCY_ISSUE = 'dependency_issue',
}

export interface ValidationError {
  type: ValidationErrorType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  context: ErrorContext;
  suggestions: string[];
  affectedPackages: string[];
}

export interface ErrorContext {
  packageName?: string;
  fileName?: string;
  lineNumber?: number;
  stackTrace?: string;
  additionalInfo?: Record<string, any>;
}

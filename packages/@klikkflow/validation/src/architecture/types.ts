export interface CircularDependencyReport {
  hasCircularDependencies: boolean;
  circularDependencies: CircularDependency[];
  totalPackages: number;
  affectedPackages: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface CircularDependency {
  cycle: string[];
  depth: number;
  type: 'package' | 'file';
  impact: 'low' | 'medium' | 'high';
}

export interface PackageBoundaryReport {
  violations: BoundaryViolation[];
  totalChecks: number;
  violationCount: number;
  complianceScore: number;
  recommendations: string[];
}

export interface BoundaryViolation {
  sourcePackage: string;
  targetPackage: string;
  violationType: 'unauthorized_access' | 'circular_reference' | 'layer_violation';
  filePath: string;
  lineNumber?: number;
  severity: 'warning' | 'error';
  suggestion: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  metrics: DependencyMetrics;
  visualization: string; // DOT format for graphviz
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'package' | 'module';
  size: number;
  dependencies: number;
  dependents: number;
  layer: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  weight: number;
  type: 'direct' | 'transitive';
}

export interface DependencyMetrics {
  totalNodes: number;
  totalEdges: number;
  averageDependencies: number;
  maxDependencies: number;
  cyclomaticComplexity: number;
  instability: number;
  abstractness: number;
}

export interface CodeOrganizationReport {
  separationOfConcerns: SeparationReport;
  codeDuplication: DuplicationReport;
  namingConventions: NamingReport;
  overallScore: number;
  recommendations: string[];
}

export interface SeparationReport {
  score: number;
  violations: SeparationViolation[];
  packageScores: Record<string, number>;
}

export interface SeparationViolation {
  packageName: string;
  filePath: string;
  violationType: 'mixed_concerns' | 'tight_coupling' | 'god_class';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface DuplicationReport {
  duplicatedBlocks: DuplicatedBlock[];
  totalDuplication: number;
  duplicationPercentage: number;
  affectedFiles: string[];
  recommendations: string[];
}

export interface DuplicatedBlock {
  files: string[];
  lines: number;
  tokens: number;
  similarity: number;
  startLines: number[];
  endLines: number[];
}

export interface NamingReport {
  violations: NamingViolation[];
  complianceScore: number;
  conventionsCovered: string[];
  recommendations: string[];
}

export interface NamingViolation {
  filePath: string;
  elementName: string;
  elementType: 'function' | 'class' | 'variable' | 'interface' | 'type';
  expectedPattern: string;
  actualPattern: string;
  suggestion: string;
}

export interface TypeSafetyReport {
  crossPackageConsistency: TypeConsistencyReport;
  interfaceCompatibility: InterfaceCompatibilityReport;
  exportStructure: ExportStructureReport;
  overallScore: number;
  recommendations: string[];
}

export interface TypeConsistencyReport {
  inconsistencies: TypeInconsistency[];
  totalTypes: number;
  consistencyScore: number;
}

export interface TypeInconsistency {
  typeName: string;
  packages: string[];
  definitions: TypeDefinition[];
  conflictType: 'structure' | 'naming' | 'compatibility';
  severity: 'warning' | 'error';
  suggestion: string;
}

export interface TypeDefinition {
  packageName: string;
  filePath: string;
  definition: string;
  lineNumber: number;
  typeName: string;
}

export interface InterfaceCompatibilityReport {
  incompatibilities: InterfaceIncompatibility[];
  totalInterfaces: number;
  compatibilityScore: number;
}

export interface InterfaceIncompatibility {
  interfaceName: string;
  sourcePackage: string;
  targetPackage: string;
  incompatibilityType: 'missing_property' | 'type_mismatch' | 'breaking_change';
  details: string;
  severity: 'warning' | 'error';
  suggestion: string;
}

export interface ExportStructureReport {
  issues: ExportIssue[];
  totalExports: number;
  structureScore: number;
  optimizationOpportunities: string[];
}

export interface ExportIssue {
  packageName: string;
  filePath: string;
  issueType: 'unused_export' | 'missing_export' | 'circular_export' | 'inconsistent_naming';
  description: string;
  severity: 'info' | 'warning' | 'error';
  suggestion: string;
}

export interface ArchitectureValidationOptions {
  includeCircularDependencies?: boolean;
  includeBoundaryValidation?: boolean;
  includeDependencyGraph?: boolean;
  includeCodeOrganization?: boolean;
  includeTypeSafety?: boolean;
  outputFormat?: 'json' | 'html' | 'markdown';
  generateVisualization?: boolean;
}

export interface ArchitectureValidationResult {
  timestamp: Date;
  dependencyAnalysis?: {
    circularDependencies: CircularDependencyReport;
    packageBoundaries: PackageBoundaryReport;
    dependencyGraph: DependencyGraph;
  };
  codeOrganization?: CodeOrganizationReport;
  typeSafety?: TypeSafetyReport;
  overallScore: number;
  criticalIssues: number;
  recommendations: string[];
}

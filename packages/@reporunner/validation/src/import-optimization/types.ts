export interface ImportPathAnalysis {
  filePath: string;
  imports: ImportStatement[];
  issues: ImportIssue[];
  suggestions: ImportSuggestion[];
}

export interface ImportStatement {
  source: string;
  specifiers: string[];
  isTypeOnly: boolean;
  line: number;
  column: number;
  raw: string;
}

export interface ImportIssue {
  type: 'circular-dependency' | 'inconsistent-path' | 'unnecessary-relative' | 'missing-barrel' | 'deep-import';
  severity: 'error' | 'warning' | 'info';
  message: string;
  filePath: string;
  line: number;
  suggestion?: string;
}

export interface ImportSuggestion {
  type: 'optimize-path' | 'use-barrel' | 'consolidate-imports' | 'remove-unused';
  description: string;
  currentImport: string;
  suggestedImport: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface CircularDependency {
  cycle: string[];
  severity: 'critical' | 'warning';
  description: string;
  suggestions: string[];
}

export interface ImportOptimizationReport {
  timestamp: Date;
  totalFiles: number;
  totalImports: number;
  issues: ImportIssue[];
  circularDependencies: CircularDependency[];
  suggestions: ImportSuggestion[];
  metrics: {
    consistencyScore: number;
    circularDependencyCount: number;
    averageImportsPerFile: number;
    deepImportCount: number;
    relativeImportCount: number;
  };
  recommendations: string[];
}

export interface PackageExports {
  packageName: string;
  mainExport: string;
  namedExports: string[];
  typeExports: string[];
  barrelFiles: string[];
}

export interface ImportPathRule {
  name: string;
  description: string;
  check: (importPath: string, filePath: string) => boolean;
  suggestion: (importPath: string, filePath: string) => string;
  severity: 'error' | 'warning' | 'info';
}

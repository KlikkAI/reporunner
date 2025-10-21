export interface AutocompleteTestResult {
  packageName: string;
  testFile: string;
  position: { line: number; character: number };
  expectedSuggestions: string[];
  actualSuggestions: string[];
  accuracy: number;
  responseTime: number;
  passed: boolean;
}

export interface TypeResolutionResult {
  packageName: string;
  typeDefinition: string;
  resolutionTime: number;
  resolved: boolean;
  errorMessage?: string;
  sourceFile: string;
}

export interface CompilationMetrics {
  packageName: string;
  totalFiles: number;
  compilationTime: number;
  memoryUsage: number;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  incrementalBuildTime?: number;
}

export interface CompilationError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: number;
}

export interface CompilationWarning {
  file: string;
  line: number;
  column: number;
  message: string;
  code: number;
}

export interface TypeScriptAnalysisReport {
  timestamp: Date;
  autocompleteResults: AutocompleteTestResult[];
  typeResolutionResults: TypeResolutionResult[];
  compilationMetrics: CompilationMetrics[];
  overallScore: number;
  recommendations: string[];
}

export interface AutocompleteTestCase {
  packageName: string;
  testFile: string;
  position: { line: number; character: number };
  expectedSuggestions: string[];
  description: string;
}

export interface TypeResolutionTestCase {
  packageName: string;
  typeDefinition: string;
  sourceFile: string;
  description: string;
}

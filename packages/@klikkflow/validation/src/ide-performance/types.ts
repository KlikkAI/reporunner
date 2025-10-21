export interface NavigationTestResult {
  testName: string;
  sourceFile: string;
  targetFile: string;
  navigationTime: number;
  successful: boolean;
  errorMessage?: string;
}

export interface IntelliSenseTestResult {
  testName: string;
  sourceFile: string;
  position: { line: number; character: number };
  expectedFeatures: string[];
  actualFeatures: string[];
  responseTime: number;
  accuracy: number;
  successful: boolean;
}

export interface SourceMappingTestResult {
  testName: string;
  sourceFile: string;
  compiledFile: string;
  sourceMappingAccurate: boolean;
  debuggingExperience: 'excellent' | 'good' | 'poor' | 'broken';
  issues: string[];
}

export interface IDEPerformanceReport {
  timestamp: Date;
  navigationResults: NavigationTestResult[];
  intelliSenseResults: IntelliSenseTestResult[];
  sourceMappingResults: SourceMappingTestResult[];
  overallScore: number;
  recommendations: string[];
  performanceMetrics: {
    averageNavigationTime: number;
    averageIntelliSenseTime: number;
    navigationSuccessRate: number;
    intelliSenseAccuracy: number;
    sourceMappingReliability: number;
  };
}

export interface NavigationTestCase {
  testName: string;
  sourceFile: string;
  targetSymbol: string;
  expectedTargetFile: string;
  description: string;
}

export interface IntelliSenseTestCase {
  testName: string;
  sourceFile: string;
  position: { line: number; character: number };
  expectedFeatures: string[];
  description: string;
}

export interface SourceMappingTestCase {
  testName: string;
  sourceFile: string;
  compiledFile: string;
  testBreakpoints: Array<{ line: number; expectedSourceLine: number }>;
  description: string;
}

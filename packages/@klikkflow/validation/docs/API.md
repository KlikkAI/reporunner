# @klikkflow/validation API Documentation

## Table of Contents

- [TypeScript Analysis & Validation](#typescript-analysis--validation)
- [IDE Performance Validation](#ide-performance-validation)
- [Import Path Optimization](#import-path-optimization)
- [Architecture Validation](#architecture-validation)
- [Advanced Reporting & Analytics](#advanced-reporting--analytics)
- [Validation Orchestration](#validation-orchestration)
- [CLI Tools](#cli-tools)
- [Types](#types)

## TypeScript Analysis & Validation

### TypeScriptAnalyzer

Main class for analyzing TypeScript setup and performance.

```typescript
import { TypeScriptAnalyzer } from '@klikkflow/validation/typescript';

const analyzer = new TypeScriptAnalyzer(workspaceRoot: string);
```

#### Methods

##### `analyzeTypeScriptSetup(): Promise<TypeScriptAnalysisReport>`

Runs comprehensive TypeScript analysis including autocomplete testing, type resolution validation, and compilation performance analysis.

```typescript
const report = await analyzer.analyzeTypeScriptSetup();
console.log(`Overall Score: ${report.overallScore}/100`);
```

##### `getPackageDirectories(): Promise<string[]>`

Returns list of all package directories in the workspace.

```typescript
const packages = await analyzer.getPackageDirectories();
```

### AutocompleteTester

Tests autocomplete functionality across packages.

```typescript
import { AutocompleteTester } from '@klikkflow/validation/typescript';

const tester = new AutocompleteTester(workspaceRoot: string);
const results = await tester.runAutocompleteTests();
```

### TypeResolutionValidator

Validates type resolution across package boundaries.

```typescript
import { TypeResolutionValidator } from '@klikkflow/validation/typescript';

const validator = new TypeResolutionValidator(workspaceRoot: string);
const results = await validator.validateTypeResolution();
```

### CompilationAnalyzer

Analyzes TypeScript compilation performance.

```typescript
import { CompilationAnalyzer } from '@klikkflow/validation/typescript';

const analyzer = new CompilationAnalyzer(workspaceRoot: string);
const metrics = await analyzer.analyzeCompilation();
```

## IDE Performance Validation

### IDEPerformanceValidator

Main class for validating IDE performance and developer experience.

```typescript
import { IDEPerformanceValidator } from '@klikkflow/validation/ide-performance';

const validator = new IDEPerformanceValidator(workspaceRoot: string);
```

#### Methods

##### `validateIDEPerformance(): Promise<IDEPerformanceReport>`

Runs comprehensive IDE performance validation including navigation, IntelliSense, and source mapping tests.

```typescript
const report = await validator.validateIDEPerformance();
console.log(`Navigation Success Rate: ${report.performanceMetrics.navigationSuccessRate * 100}%`);
```

### NavigationTester

Tests navigation speed and accuracy between files and packages.

```typescript
import { NavigationTester } from '@klikkflow/validation/ide-performance';

const tester = new NavigationTester(workspaceRoot: string);
const results = await tester.runNavigationTests();
```

### IntelliSenseTester

Tests IntelliSense functionality including completions, hover, and signature help.

```typescript
import { IntelliSenseTester } from '@klikkflow/validation/ide-performance';

const tester = new IntelliSenseTester(workspaceRoot: string);
const results = await tester.runIntelliSenseTests();
```

### SourceMappingValidator

Validates source mapping accuracy for debugging experience.

```typescript
import { SourceMappingValidator } from '@klikkflow/validation/ide-performance';

const validator = new SourceMappingValidator(workspaceRoot: string);
const results = await validator.validateSourceMapping();
```

## Import Path Optimization

### ImportPathOptimizer

Main class for analyzing and optimizing import paths.

```typescript
import { ImportPathOptimizer } from '@klikkflow/validation/import-optimization';

const optimizer = new ImportPathOptimizer(workspaceRoot: string);
```

#### Methods

##### `optimizeImportPaths(): Promise<ImportOptimizationReport>`

Runs comprehensive import path analysis including circular dependency detection, consistency validation, and optimization suggestions.

```typescript
const report = await optimizer.optimizeImportPaths();
console.log(`Consistency Score: ${report.metrics.consistencyScore}%`);
console.log(`Circular Dependencies: ${report.metrics.circularDependencyCount}`);
```

##### `analyzePackageStructure(): Promise<PackageStructureAnalysis>`

Analyzes package structure and export patterns.

```typescript
const structure = await optimizer.analyzePackageStructure();
```

### CircularDependencyDetector

Detects circular dependencies using graph analysis.

```typescript
import { CircularDependencyDetector } from '@klikkflow/validation/import-optimization';

const detector = new CircularDependencyDetector(workspaceRoot: string);
const cycles = await detector.detectCircularDependencies();
```

#### Methods

##### `detectCircularDependencies(): Promise<CircularDependency[]>`

Detects all circular dependencies in the codebase.

##### `wouldCreateCycle(fromFile: string, toFile: string): Promise<boolean>`

Checks if adding a dependency would create a circular dependency.

##### `getDependencyGraph(): Map<string, Set<string>>`

Returns the internal dependency graph for analysis.

### ImportConsistencyValidator

Validates import path consistency across the codebase.

```typescript
import { ImportConsistencyValidator } from '@klikkflow/validation/import-optimization';

const validator = new ImportConsistencyValidator(workspaceRoot: string);
const results = await validator.validateImportConsistency();
```

### PathSuggestionEngine

Generates optimization suggestions for import paths.

```typescript
import { PathSuggestionEngine } from '@klikkflow/validation/import-optimization';

const engine = new PathSuggestionEngine(workspaceRoot: string);
const suggestions = await engine.generateSuggestions(analyses);
```

## Architecture Validation

### DependencyAnalyzer

Analyzes package dependencies and detects architectural issues.

```typescript
import { DependencyAnalyzer } from '@klikkflow/validation/architecture';

const analyzer = new DependencyAnalyzer(workspaceRoot: string);
await analyzer.initialize();
```

#### Methods

##### `analyzeDependencies(): Promise<DependencyReport>`

Runs comprehensive dependency analysis including circular dependency detection and boundary validation.

```typescript
const report = await analyzer.analyzeDependencies();
console.log(`Health Score: ${report.healthScore}/100`);
```

### CodeOrganizationChecker

Validates code organization and separation of concerns.

```typescript
import { CodeOrganizationChecker } from '@klikkflow/validation/architecture';

const checker = new CodeOrganizationChecker(workspaceRoot: string);
const report = await checker.validateOrganization();
```

### TypeSafetyValidator

Validates type safety across package boundaries.

```typescript
import { TypeSafetyValidator } from '@klikkflow/validation/architecture';

const validator = new TypeSafetyValidator(workspaceRoot: string);
const report = await validator.validateTypeSafety();
```

## Advanced Reporting & Analytics

### ValidationReportAggregator

Aggregates validation results from multiple sources.

```typescript
import { ValidationReportAggregator } from '@klikkflow/validation/reporting';

const aggregator = new ValidationReportAggregator();
aggregator.addValidationResults(results);
const report = await aggregator.generateComprehensiveReport();
```

### RecommendationEngine

Generates AI-powered optimization recommendations.

```typescript
import { RecommendationEngine } from '@klikkflow/validation/reporting';

const engine = new RecommendationEngine();
const recommendations = engine.generateRecommendations(validationResults);
```

### DashboardGenerator

Creates interactive HTML dashboards.

```typescript
import { DashboardGenerator } from '@klikkflow/validation/reporting';

const generator = new DashboardGenerator();
const dashboardPath = await generator.generateDashboard(report);
```

### PerformanceTracker

Tracks performance metrics over time.

```typescript
import { PerformanceTracker } from '@klikkflow/validation/reporting';

const tracker = new PerformanceTracker();
await tracker.storePerformanceData(results, metadata);
const trends = await tracker.analyzeTrends(30);
```

## Validation Orchestration

### ValidationController

Main orchestration controller that integrates all validation phases.

```typescript
import { ValidationController } from '@klikkflow/validation';

const controller = new ValidationController(workspaceRoot: string);
```

#### Methods

##### `executeValidation(): Promise<ValidationResults>`

Executes the complete Phase A validation workflow with all phases.

```typescript
// Setup event listeners
controller.on('validation:started', () => console.log('Starting validation...'));
controller.on('phase:started', (phase) => console.log(`Starting ${phase}...`));
controller.on('phase:completed', (phase) => console.log(`Completed ${phase}`));
controller.on('validation:completed', (results) => console.log('Validation complete!'));

// Execute validation
const results = await controller.executeValidation();
console.log(`Overall Status: ${results.status}`);
console.log(`Recommendations: ${results.recommendations.length}`);
```

##### `getValidationStatus(): ValidationStatus`

Returns current validation status and progress.

```typescript
const status = controller.getValidationStatus();
console.log(`Running: ${status.isRunning}`);
console.log(`Current Phase: ${status.currentPhase}`);
console.log(`Errors: ${status.errors.length}`);
```

##### `getValidationSummary(): ValidationSummary | null`

Returns validation summary after execution.

```typescript
const summary = controller.getValidationSummary();
if (summary) {
  console.log(`Overall Status: ${summary.overallStatus}`);
  console.log(`Critical Issues: ${summary.criticalIssues}`);
  console.log(`Performance Improvements: Build ${summary.performanceImprovements.buildTime}%, Bundle ${summary.performanceImprovements.bundleSize}%`);
}
```

#### Events

The ValidationController emits the following events:

- `validation:started` - Validation workflow started
- `validation:completed` - Validation workflow completed successfully
- `validation:failed` - Validation workflow failed
- `phase:started` - Validation phase started (system-validation, performance-analysis, architecture-validation)
- `phase:completed` - Validation phase completed
- `phase:failed` - Validation phase failed
- `component:started` - Individual component started (test-suite, api-validation, etc.)
- `component:completed` - Individual component completed
- `component:failed` - Individual component failed

### ValidationOrchestratorCLI

Command-line interface for validation execution.

```typescript
import { ValidationOrchestratorCLI } from '@klikkflow/validation';

const cli = new ValidationOrchestratorCLI(workspaceRoot: string, outputDir?: string);
```

#### Methods

##### `executeValidation(options): Promise<ValidationResults>`

Executes validation with CLI options.

```typescript
const results = await cli.executeValidation({
  output: './validation-results',
  format: 'html',
  verbose: true
});
```

##### `executePhases(phases, options): Promise<void>`

Executes specific validation phases.

```typescript
await cli.executePhases(['system-validation', 'performance-analysis'], {
  output: './results',
  format: 'json',
  verbose: true
});
```

##### `getStatus(): void`

Displays current validation status.

```typescript
cli.getStatus(); // Prints status to console
```

### ContinuousValidationIntegration

CI/CD integration with historical tracking and notifications.

```typescript
import { ContinuousValidationIntegration } from '@klikkflow/validation';

const integration = new ContinuousValidationIntegration(workspaceRoot: string);
```

#### Methods

##### `executeForCI(options): Promise<CIValidationResult>`

Executes validation for CI/CD pipeline with trend analysis.

```typescript
const ciResult = await integration.executeForCI({
  branch: 'main',
  commitSha: 'abc123',
  pullRequestNumber: 42,
  environment: 'ci'
});

console.log(`Success: ${ciResult.success}`);
console.log(`Exit Code: ${ciResult.exitCode}`);
console.log(`Notifications: ${ciResult.notifications.length}`);
```

##### `generateGitHubActionsWorkflow(): string`

Generates GitHub Actions workflow configuration.

```typescript
const workflow = integration.generateGitHubActionsWorkflow();
fs.writeFileSync('.github/workflows/validation.yml', workflow);
```

##### `generateGitLabCIConfig(): string`

Generates GitLab CI configuration.

```typescript
const config = integration.generateGitLabCIConfig();
fs.writeFileSync('.gitlab-ci.yml', config);
```

##### `generateJenkinsfile(): string`

Generates Jenkins pipeline configuration.

```typescript
const jenkinsfile = integration.generateJenkinsfile();
fs.writeFileSync('Jenkinsfile', jenkinsfile);
```

## CLI Tools

### TypeScript Analyzer CLI

```bash
# Comprehensive analysis
node dist/cli/typescript-analyzer-cli.js analyze

# Specific analysis types
node dist/cli/typescript-analyzer-cli.js analyze --autocomplete-only
node dist/cli/typescript-analyzer-cli.js analyze --type-resolution-only
node dist/cli/typescript-analyzer-cli.js analyze --compilation-only

# Generate reports
node dist/cli/typescript-analyzer-cli.js analyze --output report.json --verbose
node dist/cli/typescript-analyzer-cli.js report report.json --format markdown --output report.md
```

### IDE Performance CLI

```bash
# Comprehensive validation
node dist/cli/ide-performance-cli.js validate

# Specific validation types
node dist/cli/ide-performance-cli.js validate --navigation-only
node dist/cli/ide-performance-cli.js validate --intellisense-only
node dist/cli/ide-performance-cli.js validate --sourcemap-only

# Generate reports
node dist/cli/ide-performance-cli.js validate --output performance.json --verbose
node dist/cli/ide-performance-cli.js report performance.json --format html --output performance.html
```

### Import Optimizer CLI

```bash
# Comprehensive analysis
node dist/cli/import-optimizer-cli.js analyze

# Specific analysis types
node dist/cli/import-optimizer-cli.js analyze --circular-only
node dist/cli/import-optimizer-cli.js analyze --consistency-only

# Apply fixes
node dist/cli/import-optimizer-cli.js analyze --output imports.json
node dist/cli/import-optimizer-cli.js fix imports.json --dry-run
node dist/cli/import-optimizer-cli.js fix imports.json --auto-fix

# Generate reports
node dist/cli/import-optimizer-cli.js report imports.json --format markdown --output imports.md
```

### Validation Orchestrator CLI

```bash
# Run complete Phase A validation workflow
npx @klikkflow/validation run --output ./validation-results --format html --verbose

# Run specific validation phases
npx @klikkflow/validation phases system-validation performance-analysis
npx @klikkflow/validation phases architecture-validation

# Check current validation status
npx @klikkflow/validation status

# Export results in different formats
npx @klikkflow/validation run --format json --output ./results.json
npx @klikkflow/validation run --format markdown --output ./report.md
```

### Architecture Validator CLI

```bash
# Run complete architecture validation
pnpm architecture:validate

# Run specific validations
pnpm architecture:dependencies
pnpm architecture:organization
pnpm architecture:types

# Generate reports with different formats
pnpm architecture:validate -- --output html --output-file architecture-report.html
pnpm architecture:validate -- --output markdown --output-file architecture-report.md
```

## Types

### TypeScript Analysis Types

```typescript
interface TypeScriptAnalysisReport {
  timestamp: Date;
  autocompleteResults: AutocompleteTestResult[];
  typeResolutionResults: TypeResolutionResult[];
  compilationMetrics: CompilationMetrics[];
  overallScore: number;
  recommendations: string[];
}

interface AutocompleteTestResult {
  packageName: string;
  testFile: string;
  position: { line: number; character: number };
  expectedSuggestions: string[];
  actualSuggestions: string[];
  accuracy: number;
  responseTime: number;
  passed: boolean;
}

interface TypeResolutionResult {
  packageName: string;
  typeDefinition: string;
  resolutionTime: number;
  resolved: boolean;
  errorMessage?: string;
  sourceFile: string;
}

interface CompilationMetrics {
  packageName: string;
  totalFiles: number;
  compilationTime: number;
  memoryUsage: number;
  errors: CompilationError[];
  warnings: CompilationWarning[];
  incrementalBuildTime?: number;
}
```

### IDE Performance Types

```typescript
interface IDEPerformanceReport {
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

interface NavigationTestResult {
  testName: string;
  sourceFile: string;
  targetFile: string;
  navigationTime: number;
  successful: boolean;
  errorMessage?: string;
}

interface IntelliSenseTestResult {
  testName: string;
  sourceFile: string;
  position: { line: number; character: number };
  expectedFeatures: string[];
  actualFeatures: string[];
  responseTime: number;
  accuracy: number;
  successful: boolean;
}

interface SourceMappingTestResult {
  testName: string;
  sourceFile: string;
  compiledFile: string;
  sourceMappingAccurate: boolean;
  debuggingExperience: 'excellent' | 'good' | 'poor' | 'broken';
  issues: string[];
}
```

### Import Optimization Types

```typescript
interface ImportOptimizationReport {
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

interface CircularDependency {
  cycle: string[];
  severity: 'critical' | 'warning';
  description: string;
  suggestions: string[];
}

interface ImportSuggestion {
  type: 'optimize-path' | 'use-barrel' | 'consolidate-imports' | 'remove-unused';
  description: string;
  currentImport: string;
  suggestedImport: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

interface ImportPathAnalysis {
  filePath: string;
  imports: ImportStatement[];
  issues: ImportIssue[];
  suggestions: ImportSuggestion[];
}
```

### Orchestration Types

```typescript
interface ValidationResults {
  timestamp: Date;
  phase: 'A';
  status: 'success' | 'warning' | 'failure';
  systemValidation: SystemValidationResults;
  performanceAnalysis: PerformanceAnalysisResults;
  architectureValidation: ArchitectureValidationResults;
  recommendations: OptimizationRecommendation[];
  nextSteps: string[];
}

interface ValidationSummary {
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

interface OptimizationRecommendation {
  category: 'performance' | 'architecture' | 'developer-experience' | 'build';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  steps: string[];
  affectedPackages: string[];
}

interface CIValidationResult {
  success: boolean;
  results: ValidationResults | null;
  analysis: ValidationAnalysis | null;
  artifacts: CIArtifact[];
  notifications: CINotification[];
  exitCode: number;
  duration: number;
}

interface ValidationAnalysis {
  isRegression: boolean;
  improvements: string[];
  regressions: string[];
  newIssues: string[];
  resolvedIssues: string[];
  trends: {
    buildTime: 'improving' | 'degrading' | 'stable';
    bundleSize: 'improving' | 'degrading' | 'stable';
    coverage: 'improving' | 'degrading' | 'stable';
    issues: 'improving' | 'degrading' | 'stable';
  };
}
```

### Architecture Validation Types

```typescript
interface DependencyReport {
  circularDependencies: CircularDependency[];
  packageBoundaryViolations: BoundaryViolation[];
  dependencyGraph: DependencyGraph;
  healthScore: number;
}

interface CodeOrganizationReport {
  separationOfConcerns: SeparationReport;
  codeDuplication: DuplicationReport;
  namingConsistency: NamingReport;
  overallScore: number;
}

interface TypeSafetyReport {
  crossPackageTypeConsistency: number;
  interfaceCompatibility: InterfaceCompatibilityReport;
  exportStructureValidation: ExportStructureReport;
  overallScore: number;
}
```

## Error Handling

All validation methods include comprehensive error handling:

```typescript
try {
  const report = await analyzer.analyzeTypeScriptSetup();
  // Handle successful analysis
} catch (error) {
  console.error('Analysis failed:', error.message);
  // Handle analysis failure
}
```

## Performance Considerations

- **Large Codebases**: Analysis time scales with codebase size. For very large projects, consider using specific analysis modes.
- **Memory Usage**: Peak memory usage is approximately 200MB for typical monorepos.
- **Incremental Analysis**: Future versions will support incremental analysis for faster repeated runs.

## Extensibility

The validation framework is designed to be extensible:

```typescript
// Custom validation rules
const customRules: ImportPathRule[] = [
  {
    name: 'custom-rule',
    description: 'Custom validation rule',
    check: (importPath, filePath) => /* validation logic */,
    suggestion: (importPath, filePath) => /* suggestion logic */,
    severity: 'warning'
  }
];

// Add custom rules to validator
validator.addRules(customRules);
```

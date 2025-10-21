# @klikkflow/validation

Phase A validation framework for the consolidated package architecture. This package provides comprehensive tools to validate and optimize the developer experience in the KlikkFlow monorepo, featuring advanced reporting, performance tracking, and automated documentation generation.

## Overview

The validation package includes seven main validation systems:

1. **TypeScript Analysis & Validation** - Validates TypeScript setup, autocomplete functionality, and compilation performance
2. **IDE Performance Validation** - Tests navigation speed, IntelliSense functionality, and debugging experience
3. **Import Path Optimization** - Analyzes import consistency, detects circular dependencies, and suggests optimizations
4. **Architecture Validation** - Validates package dependencies, code organization, and type safety across the consolidated architecture
5. **Advanced Reporting & Analytics** - Comprehensive reporting with interactive dashboards, performance tracking, and trend analysis
6. **Documentation Generation** - Automated architecture documentation, setup guides, and best practices generation
7. **Validation Orchestration** - Integrated workflow orchestration with CLI interface and CI/CD integration

## Installation

```bash
pnpm install @klikkflow/validation
```

## Quick Start

### TypeScript Analysis

```typescript
import { TypeScriptAnalyzer } from '@klikkflow/validation/typescript';

const analyzer = new TypeScriptAnalyzer('/path/to/workspace');
const report = await analyzer.analyzeTypeScriptSetup();

console.log(`Overall Score: ${report.overallScore}/100`);
console.log(`Recommendations: ${report.recommendations.join(', ')}`);
```

### IDE Performance Validation

```typescript
import { IDEPerformanceValidator } from '@klikkflow/validation/ide-performance';

const validator = new IDEPerformanceValidator('/path/to/workspace');
const report = await validator.validateIDEPerformance();

console.log(`Navigation Success Rate: ${report.performanceMetrics.navigationSuccessRate * 100}%`);
console.log(`IntelliSense Accuracy: ${report.performanceMetrics.intelliSenseAccuracy}%`);
```

### Import Path Optimization

```typescript
import { ImportPathOptimizer } from '@klikkflow/validation/import-optimization';

const optimizer = new ImportPathOptimizer('/path/to/workspace');
const report = await optimizer.optimizeImportPaths();

console.log(`Consistency Score: ${report.metrics.consistencyScore}%`);
console.log(`Circular Dependencies: ${report.metrics.circularDependencyCount}`);
```

### Architecture Validation

```typescript
import {
  DependencyAnalyzer,
  CodeOrganizationChecker,
  TypeSafetyValidator
} from '@klikkflow/validation/architecture';

// Dependency Analysis
const analyzer = new DependencyAnalyzer('/path/to/workspace');
await analyzer.initialize();
const depReport = await analyzer.checkCircularDependencies();
console.log(`Circular Dependencies: ${depReport.circularDependencies.length}`);

// Code Organization
const checker = new CodeOrganizationChecker('/path/to/workspace');
await checker.initialize();
const orgReport = await checker.validateCodeOrganization();
console.log(`Organization Score: ${orgReport.overallScore}/100`);

// Type Safety
const validator = new TypeSafetyValidator('/path/to/workspace');
await validator.initialize();
const typeReport = await validator.validateTypeSafety();
console.log(`Type Safety Score: ${typeReport.overallScore}/100`);
```

### Advanced Reporting & Analytics

```typescript
import {
  ValidationReportAggregator,
  RecommendationEngine,
  DashboardGenerator,
  PerformanceTracker,
  BenchmarkingSystem
} from '@klikkflow/validation/reporting';

// Comprehensive Report Generation
const aggregator = new ValidationReportAggregator();
aggregator.addValidationResults(validationResults);
const report = await aggregator.generateComprehensiveReport();

// AI-Powered Recommendations
const recommendationEngine = new RecommendationEngine();
const recommendations = recommendationEngine.generateRecommendations(validationResults);
console.log(`Critical Issues: ${recommendations.filter(r => r.priority === 'critical').length}`);

// Interactive Dashboard
const dashboardGenerator = new DashboardGenerator();
const dashboardPath = await dashboardGenerator.generateDashboard(report);
console.log(`Dashboard generated: ${dashboardPath}`);

// Performance Tracking
const tracker = new PerformanceTracker();
await tracker.storePerformanceData(validationResults, {
  gitCommit: 'abc123',
  branch: 'main',
  environment: 'ci'
});

const trends = await tracker.analyzeTrends(30); // Last 30 days
const regressions = await tracker.detectRegressions();

// Benchmarking
const benchmarking = new BenchmarkingSystem();
await benchmarking.createDefaultConfigs();
const benchmarkResult = await benchmarking.runBenchmark('phase-a-validation', validationResults);
console.log(`Benchmark Score: ${benchmarkResult.overallScore}/100 (Grade: ${benchmarkResult.grade})`);
```

### Documentation Generation

```typescript
import { DocumentationGenerator } from '@klikkflow/validation/reporting';

const docGenerator = new DocumentationGenerator('./docs');

// Generate architecture documentation
const archDocs = await docGenerator.generateArchitectureDocumentation(validationResults);
console.log(`Generated ${archDocs.length} architecture documents`);

// Generate setup guides
const setupDocs = await docGenerator.generateSetupGuides(validationResults);

// Generate best practices documentation
const bestPracticesDocs = await docGenerator.generateBestPracticesDocumentation(validationResults);

// Generate comprehensive documentation
const allDocs = await docGenerator.generateComprehensiveDocumentation(report);
console.log(`Generated ${allDocs.length} total documents`);
```

### Validation Orchestration

```typescript
import {
  ValidationController,
  ValidationOrchestratorCLI,
  ContinuousValidationIntegration
} from '@klikkflow/validation';

// Programmatic orchestration
const controller = new ValidationController('/path/to/workspace');
controller.on('phase:started', (phase) => console.log(`Starting ${phase}...`));
controller.on('phase:completed', (phase) => console.log(`Completed ${phase}`));

const results = await controller.executeValidation();
console.log(`Overall Status: ${results.status}`);
console.log(`Recommendations: ${results.recommendations.length}`);

// CLI orchestration
const cli = new ValidationOrchestratorCLI('/path/to/workspace');
await cli.executeValidation({
  output: './validation-results',
  format: 'html',
  verbose: true
});

// CI/CD integration
const integration = new ContinuousValidationIntegration('/path/to/workspace');
const ciResult = await integration.executeForCI();

// Generate CI configurations
const githubWorkflow = integration.generateGitHubActionsWorkflow();
const gitlabConfig = integration.generateGitLabCIConfig();
const jenkinsfile = integration.generateJenkinsfile();
```

## CLI Tools

### TypeScript Analyzer CLI

```bash
# Run comprehensive TypeScript analysis
pnpm typescript:analyze

# Run specific analysis types
node dist/cli/typescript-analyzer-cli.js analyze --autocomplete-only
node dist/cli/typescript-analyzer-cli.js analyze --type-resolution-only
node dist/cli/typescript-analyzer-cli.js analyze --compilation-only

# Generate reports
node dist/cli/typescript-analyzer-cli.js analyze --output report.json
node dist/cli/typescript-analyzer-cli.js report report.json --format markdown
```

### IDE Performance CLI

```bash
# Run comprehensive IDE performance validation
node dist/cli/ide-performance-cli.js validate

# Run specific validation types
node dist/cli/ide-performance-cli.js validate --navigation-only
node dist/cli/ide-performance-cli.js validate --intellisense-only
node dist/cli/ide-performance-cli.js validate --sourcemap-only

# Generate reports
node dist/cli/ide-performance-cli.js validate --output performance.json
node dist/cli/ide-performance-cli.js report performance.json --format html
```

### Import Optimizer CLI

```bash
# Run comprehensive import path analysis
node dist/cli/import-optimizer-cli.js analyze

# Run specific analysis types
node dist/cli/import-optimizer-cli.js analyze --circular-only
node dist/cli/import-optimizer-cli.js analyze --consistency-only

# Generate reports and apply fixes
node dist/cli/import-optimizer-cli.js analyze --output imports.json
node dist/cli/import-optimizer-cli.js fix imports.json --dry-run
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

# Generate dependency graph visualization
pnpm architecture:dependencies -- --generate-graph

# Advanced usage
node dist/cli/architecture-validator-cli.js validate --dependencies --organization --types
node dist/cli/architecture-validator-cli.js dependencies --output json --generate-visualization
node dist/cli/architecture-validator-cli.js organization --output-file code-org-report.json
node dist/cli/architecture-validator-cli.js types --output html --output-file type-safety.html
```

### Advanced Reporting CLI

```bash
# Generate comprehensive reports with dashboard
node dist/cli/reporting-cli.js generate --dashboard --output ./reports

# Performance tracking
node dist/cli/reporting-cli.js track --store --metadata '{"branch":"main","commit":"abc123"}'
node dist/cli/reporting-cli.js trends --days 30
node dist/cli/reporting-cli.js regressions --baseline 7 --comparison 1

# Benchmarking
node dist/cli/reporting-cli.js benchmark --config phase-a-validation
node dist/cli/reporting-cli.js benchmark --compare baseline-id current-id

# Documentation generation
node dist/cli/reporting-cli.js docs --architecture --setup --best-practices
node dist/cli/reporting-cli.js docs --comprehensive --output ./docs

# Export data
node dist/cli/reporting-cli.js export --format csv --output performance-data.csv
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

# CI/CD integration examples
npx @klikkflow/validation run --format json | jq '.status'  # Check exit status
npx @klikkflow/validation run --verbose 2>&1 | tee validation.log  # Log output
```

## Features

### TypeScript Analysis & Validation

- **Autocomplete Testing**: Validates IntelliSense completions across packages
- **Type Resolution Validation**: Ensures cross-package type resolution works correctly
- **Compilation Performance**: Measures compilation speed and identifies bottlenecks
- **Comprehensive Reporting**: Provides actionable recommendations for improvements

### IDE Performance Validation

- **Navigation Testing**: Measures "Go to Definition" and cross-package navigation speed
- **IntelliSense Validation**: Tests completions, hover info, signature help, and other IDE features
- **Source Mapping Validation**: Ensures proper debugging experience with accurate source maps
- **Performance Metrics**: Tracks response times and success rates for all IDE features

### Import Path Optimization

- **Consistency Analysis**: Validates import path patterns across the entire codebase
- **Circular Dependency Detection**: Identifies and suggests fixes for circular dependencies
- **Path Optimization**: Suggests barrel exports, import consolidation, and path improvements
- **Automated Suggestions**: Provides actionable recommendations with impact assessment

### Architecture Validation

- **Dependency Analysis**: Detects circular dependencies at package and file levels, validates package boundaries and layer compliance
- **Code Organization**: Validates separation of concerns, detects code duplication, enforces naming conventions
- **Type Safety**: Ensures cross-package type consistency, validates interface compatibility, analyzes export structure
- **Comprehensive Reporting**: Provides weighted scoring, severity-based issue classification, and actionable recommendations

### Advanced Reporting & Analytics

- **Interactive Dashboards**: HTML dashboards with charts, metrics, and trend visualizations using Chart.js
- **Performance Tracking**: Historical data storage with trend analysis and regression detection
- **Recommendation Engine**: AI-powered optimization suggestions with priority-based categorization
- **Benchmarking System**: Performance scoring against baselines and industry standards
- **Export Capabilities**: CSV, JSON, and HTML report formats for external analysis

### Documentation Generation

- **Architecture Documentation**: Automated package structure, dependency graphs, and health metrics documentation
- **Setup Guides**: Environment-specific setup instructions with performance expectations
- **Troubleshooting Guides**: Common issues and solutions based on validation results
- **Best Practices**: Development, performance, and testing guidelines with code examples
- **Template System**: Customizable documentation templates with variable substitution

### Validation Orchestration

- **Integrated Workflow**: Orchestrates all validation phases with error recovery and graceful degradation
- **CLI Interface**: User-friendly command-line interface with progress reporting and multiple output formats
- **CI/CD Integration**: Ready-to-use configurations for GitHub Actions, GitLab CI, and Jenkins
- **Historical Tracking**: Performance trend analysis and regression detection with configurable thresholds
- **Notification System**: Multi-channel alerting (Slack, email, webhook) with severity-based notifications
- **Event System**: Real-time progress tracking with phase and component-level events

## Architecture

### Package Structure

```
src/
├── typescript/           # TypeScript analysis tools
│   ├── analyzer.ts       # Main TypeScript analyzer
│   ├── autocomplete-tester.ts
│   ├── type-resolution-validator.ts
│   └── compilation-analyzer.ts
├── ide-performance/      # IDE performance validation
│   ├── ide-performance-validator.ts
│   ├── navigation-tester.ts
│   ├── intellisense-tester.ts
│   └── source-mapping-validator.ts
├── import-optimization/  # Import path optimization
│   ├── import-path-optimizer.ts
│   ├── circular-dependency-detector.ts
│   ├── import-consistency-validator.ts
│   └── path-suggestion-engine.ts
├── architecture/         # Architecture validation
│   ├── dependency-analyzer.ts
│   ├── code-organization-checker.ts
│   ├── type-safety-validator.ts
│   └── types.ts
├── reporting/           # Advanced reporting and documentation
│   ├── ValidationReportAggregator.ts    # Comprehensive report generation
│   ├── RecommendationEngine.ts          # AI-powered optimization suggestions
│   ├── DashboardGenerator.ts            # Interactive HTML dashboards
│   ├── PerformanceTracker.ts            # Historical performance tracking
│   ├── BenchmarkingSystem.ts            # Performance benchmarking
│   ├── DocumentationGenerator.ts        # Automated documentation generation
│   └── ReportingEngine.ts               # Core reporting functionality
├── controller/          # Validation orchestration
│   └── ValidationController.ts          # Main orchestration controller
├── integration/         # CI/CD integration
│   └── ContinuousValidationIntegration.ts # CI/CD integration and automation
└── cli/                 # Command-line interfaces
    ├── typescript-analyzer-cli.ts
    ├── ide-performance-cli.ts
    ├── import-optimizer-cli.ts
    ├── architecture-validator-cli.ts
    ├── reporting-cli.ts                 # Advanced reporting CLI
    └── validation-orchestrator-cli.ts   # Main orchestration CLI
```

### Key Components

#### TypeScript Analyzer
- Validates autocomplete accuracy and performance
- Tests type resolution across package boundaries
- Analyzes compilation speed and suggests optimizations
- Generates comprehensive reports with scoring

#### IDE Performance Validator
- Tests navigation speed between files and packages
- Validates IntelliSense functionality and response times
- Checks source mapping accuracy for debugging
- Provides performance metrics and recommendations

#### Import Path Optimizer
- Analyzes import consistency across the codebase
- Detects circular dependencies using graph analysis
- Suggests path optimizations and barrel exports
- Provides automated fix suggestions

#### Architecture Validators
- **DependencyAnalyzer**: Validates package dependencies, detects circular dependencies, enforces layer boundaries
- **CodeOrganizationChecker**: Validates separation of concerns, detects code duplication, enforces naming conventions
- **TypeSafetyValidator**: Ensures cross-package type consistency, validates interface compatibility, analyzes export structure

#### Advanced Reporting Components
- **ValidationReportAggregator**: Aggregates validation results from multiple sources and generates comprehensive reports with performance dashboards
- **RecommendationEngine**: Analyzes validation results using configurable thresholds to generate prioritized optimization recommendations
- **DashboardGenerator**: Creates interactive HTML dashboards with Chart.js visualizations, metrics cards, and trend analysis
- **PerformanceTracker**: Stores historical performance data, analyzes trends using statistical methods, and detects regressions automatically
- **BenchmarkingSystem**: Compares performance against configurable baselines and targets with scoring and grading systems
- **DocumentationGenerator**: Generates architecture documentation, setup guides, and best practices using customizable templates

#### Orchestration Components
- **ValidationController**: Main orchestration controller that integrates all validation phases with error recovery and event system
- **ValidationOrchestratorCLI**: Command-line interface for validation execution with progress reporting and multiple output formats
- **ContinuousValidationIntegration**: CI/CD integration with historical tracking, trend analysis, and notification system

## Configuration

### TypeScript Configuration

The validation tools respect your existing TypeScript configuration (`tsconfig.base.json`) and work with:

- Project references
- Path mapping
- Incremental compilation
- Source maps
- Declaration maps

### Validation Rules

Import path validation includes configurable rules:

- No deep package imports
- Consistent relative import patterns
- Prefer barrel exports
- Circular dependency detection

## Integration

### CI/CD Integration

#### Using the Orchestration CLI

```yaml
# .github/workflows/validation.yml
name: Phase A Validation
on: [push, pull_request, schedule]

jobs:
  validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build --filter=@klikkflow/validation

      # Run complete Phase A validation
      - name: Run Phase A Validation
        run: |
          npx @klikkflow/validation run \
            --output ./validation-results \
            --format json \
            --verbose
        env:
          CI: true

      # Upload results as artifacts
      - name: Upload validation results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: validation-results
          path: validation-results/

      # Comment on PR with results
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            try {
              const resultsPath = path.join(process.cwd(), 'validation-results');
              const files = fs.readdirSync(resultsPath);
              const jsonFile = files.find(f => f.endsWith('.json'));

              if (jsonFile) {
                const results = JSON.parse(fs.readFileSync(path.join(resultsPath, jsonFile), 'utf8'));

                const comment = `## 🔍 Phase A Validation Results

**Status:** ${results.status === 'success' ? '✅ Success' : results.status === 'warning' ? '⚠️ Warning' : '❌ Failure'}

### Summary
- **Tests:** ${results.systemValidation.testResults.passedTests}/${results.systemValidation.testResults.totalTests} passed
- **Coverage:** ${results.systemValidation.testResults.coverage.overall.toFixed(1)}%
- **Build Time Improvement:** ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%
- **Bundle Size Reduction:** ${results.performanceAnalysis.bundleMetrics.reductionPercentage.toFixed(1)}%

${results.recommendations.length > 0 ? `### 📋 Recommendations (${results.recommendations.length})
${results.recommendations.slice(0, 3).map(r => `- **${r.priority.toUpperCase()}:** ${r.title}`).join('\n')}
${results.recommendations.length > 3 ? `\n... and ${results.recommendations.length - 3} more` : ''}` : ''}
                `;

                github.rest.issues.createComment({
                  issue_number: context.issue.number,
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  body: comment
                });
              }
            } catch (error) {
              console.error('Failed to post comment:', error);
            }
```

#### Individual Component Integration

```yaml
# Legacy approach - individual components
- run: pnpm typescript:analyze
- run: node dist/cli/ide-performance-cli.js validate
- run: node dist/cli/import-optimizer-cli.js analyze
- run: pnpm architecture:validate
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx @klikkflow/validation phases system-validation architecture-validation --format json"
    }
  }
}
```

### Continuous Integration Setup

The `ContinuousValidationIntegration` class can generate ready-to-use CI configurations:

```typescript
import { ContinuousValidationIntegration } from '@klikkflow/validation';

const integration = new ContinuousValidationIntegration();

// Generate GitHub Actions workflow
const githubWorkflow = integration.generateGitHubActionsWorkflow();
fs.writeFileSync('.github/workflows/validation.yml', githubWorkflow);

// Generate GitLab CI configuration
const gitlabConfig = integration.generateGitLabCIConfig();
fs.writeFileSync('.gitlab-ci.yml', gitlabConfig);

// Generate Jenkinsfile
const jenkinsfile = integration.generateJenkinsfile();
fs.writeFileSync('Jenkinsfile', jenkinsfile);
```

## Performance Benchmarks

Based on the KlikkFlow codebase analysis:

- **Files Analyzed**: 990+ TypeScript files
- **Imports Processed**: 1,700+ import statements
- **Packages Validated**: 12 consolidated packages (@klikkflow/* and main packages)
- **Architecture Components**: Dependencies, code organization, and type safety validation
- **Analysis Time**: ~45 seconds for full validation (including architecture)
- **Memory Usage**: ~250MB peak during analysis

## Troubleshooting

### Common Issues

1. **TypeScript Language Service Errors**
   - Ensure TypeScript configuration is valid
   - Check that all dependencies are installed
   - Verify path mappings are correct

2. **Source Map Validation Failures**
   - Ensure `sourceMap: true` in TypeScript config
   - Check that compiled files exist in expected locations
   - Verify source map files are generated

3. **Import Analysis Issues**
   - Ensure all packages have valid package.json files
   - Check that barrel exports (index.ts) exist where expected
   - Verify workspace configuration is correct

### Debug Mode

Enable verbose logging for detailed analysis:

```bash
node dist/cli/typescript-analyzer-cli.js analyze --verbose
node dist/cli/ide-performance-cli.js validate --verbose
node dist/cli/import-optimizer-cli.js analyze --verbose
node dist/cli/architecture-validator-cli.js validate --verbose
```

## Contributing

When adding new validation rules or features:

1. Add comprehensive tests in the `__tests__` directories
2. Update the CLI interfaces to expose new functionality
3. Document new features in this README
4. Ensure backward compatibility with existing reports

## License

MIT License - see LICENSE file for details.

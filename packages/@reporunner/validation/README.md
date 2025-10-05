# @reporunner/validation

Phase A validation framework for the consolidated package architecture. This package provides comprehensive validation, performance monitoring, and reporting capabilities to ensure the package consolidation was successful and delivers expected improvements.

## Overview

The validation framework addresses the requirements for Phase A: Validation & Optimization by providing:

- **System Validation**: Comprehensive testing of all functionality after consolidation
- **Performance Analysis**: Measurement and documentation of performance improvements
- **Architecture Validation**: Validation of architectural best practices and scalability
- **Developer Experience Enhancement**: Tools and metrics for improved development workflows
- **Comprehensive Reporting**: Detailed reports and dashboards for validation results

## Requirements Addressed

- **1.1, 1.5**: System validation with comprehensive test suite execution
- **2.1, 2.4**: Performance monitoring and baseline measurement tools
- **1.5, 2.4**: Reporting engine with data models for validation results

## Installation

```bash
pnpm add @reporunner/validation
```

## Quick Start

### Basic Usage

```typescript
import {
  ValidationController,
  PerformanceMonitor,
  ReportingEngine,
  DevExperienceMetrics,
  IDEPerformanceAnalyzer,
  ProductivityTracker
} from '@reporunner/validation';

// Initialize validation components
const controller = new ValidationController();
const performanceMonitor = new PerformanceMonitor();
const reportingEngine = new ReportingEngine('./reports');

// Initialize developer experience metrics
const devMetrics = new DevExperienceMetrics();
const ideAnalyzer = new IDEPerformanceAnalyzer();
const productivityTracker = new ProductivityTracker();

// Execute validation
const results = await controller.executeValidation();

// Analyze developer experience
const devReport = await devMetrics.generateReport();
const ideReport = await ideAnalyzer.analyzeIDEPerformance();

// Generate reports
const report = await reportingEngine.generateValidationReport(results);

console.log(`Validation status: ${results.status}`);
console.log(`Build improvement: ${results.performanceAnalysis.buildMetrics.improvementPercentage}%`);
console.log(`Developer Experience Score: ${devReport.score}/100`);
console.log(`IDE Performance Score: ${ideReport.overallScore}/100`);
```

### CLI Usage

```bash
# Run full validation
npx @reporunner/validation

# Custom output directory and format
npx @reporunner/validation -o ./my-reports -f json

# Verbose mode
npx @reporunner/validation --verbose

# Developer experience analysis
npx dev-experience-cli analyze

# IDE performance benchmark
npx dev-experience-cli benchmark

# Start productivity tracking
npx dev-experience-cli track

# Generate productivity report
npx dev-experience-cli report 30

# Show help
npx @reporunner/validation --help
```

## Architecture

The validation framework consists of several key components:

### ValidationController
Main orchestrator that coordinates all validation phases:
- System validation (tests, API endpoints, E2E workflows, builds)
- Performance analysis (build times, bundle sizes, memory usage)
- Architecture validation (dependencies, code organization, type safety)

### PerformanceMonitor
Monitors and measures performance metrics:
- Build time analysis and bottleneck identification
- Bundle size analysis and optimization suggestions
- Memory profiling and leak detection
- Developer experience metrics

### Developer Experience Metrics System
Comprehensive measurement and analysis of development workflows:
- IDE performance analysis (TypeScript, autocomplete, navigation, IntelliSense)
- Development workflow timing (hot reload, build startup, testing, linting)
- Productivity tracking with session management and trend analysis
- Automated reporting with actionable optimization recommendations

### ReportingEngine
Generates comprehensive reports and dashboards:
- JSON, HTML, CSV, and Markdown formats
- Performance dashboards with charts and metrics
- Optimization recommendations
- Documentation updates

## API Reference

### ValidationController

```typescript
class ValidationController {
  async executeValidation(): Promise<ValidationResults>
  getValidationStatus(): ValidationStatus
  getValidationSummary(): ValidationSummary
}
```

### PerformanceMonitor

```typescript
class PerformanceMonitor {
  async measureBuildPerformance(): Promise<BuildMetrics>
  async analyzeBundleSizes(): Promise<BundleMetrics>
  async profileMemoryUsage(): Promise<MemoryProfile>
  async measureDeveloperExperience(): Promise<DevExperienceMetrics>
}
```

### Developer Experience Metrics

```typescript
class DevExperienceMetrics {
  async measureIDEPerformance(): Promise<IDEPerformanceMetrics>
  async measureWorkflowTiming(): Promise<WorkflowTimingMetrics>
  async measureProductivity(): Promise<ProductivityMetrics>
  async generateReport(): Promise<DevExperienceReport>
  recordMeasurement(metric: string, value: number): void
}

class IDEPerformanceAnalyzer {
  async analyzeIDEPerformance(): Promise<IDEPerformanceReport>
  async analyzeTypeScriptPerformance(): Promise<TypeScriptPerformance>
  async analyzeAutocompletePerformance(): Promise<AutocompletePerformance>
  async analyzeNavigationPerformance(): Promise<NavigationPerformance>
  async analyzeIntelliSensePerformance(): Promise<IntelliSensePerformance>
}

class ProductivityTracker {
  async startSession(sessionId?: string): Promise<string>
  async endSession(): Promise<ProductivitySession | null>
  async startActivity(type: ActivityType, description?: string): Promise<void>
  async endActivity(success?: boolean, errorCount?: number): Promise<void>
  async getProductivityTrends(days?: number): Promise<ProductivityTrends>
  async generateProductivityReport(days?: number): Promise<string>
}
```

### ReportingEngine

```typescript
class ReportingEngine {
  async generateValidationReport(results: ValidationResults): Promise<ValidationReport>
  getOutputDirectory(): string
  setOutputDirectory(directory: string): void
}
```

## Validation Results

The framework provides comprehensive validation results including:

### System Validation
- Test execution results with coverage metrics
- API endpoint validation and response time analysis
- E2E workflow validation and cross-package integration testing
- Build process validation and artifact verification

### Performance Analysis
- Build time measurements and improvement calculations
- Bundle size analysis and reduction tracking
- Memory usage profiling and optimization suggestions
- Developer experience metrics and IDE performance analysis

### Developer Experience Analysis
- IDE performance benchmarking (TypeScript, autocomplete, navigation, IntelliSense)
- Development workflow timing analysis (hot reload, build startup, testing, linting)
- Productivity tracking with session management and activity monitoring
- Automated optimization recommendations and trend analysis

### Architecture Validation
- Dependency analysis and circular dependency detection
- Code organization validation and duplication analysis
- Type safety validation and interface consistency checks

## Performance Targets

The validation framework measures against these consolidation targets:

- **Build Time**: 30% improvement over pre-consolidation baseline
- **Bundle Size**: 20% reduction in total bundle size
- **Test Coverage**: Maintain or improve existing coverage levels
- **Architecture Health**: Score of 90+ out of 100

## Event System

The ValidationController emits events for progress tracking:

```typescript
controller.on('validation:started', () => console.log('Started'));
controller.on('phase:started', (phase) => console.log(`Phase ${phase} started`));
controller.on('phase:completed', (phase) => console.log(`Phase ${phase} completed`));
controller.on('validation:completed', (results) => console.log('Completed'));
controller.on('validation:failed', (error) => console.error('Failed', error));
```

## Output Formats

The reporting engine supports multiple output formats:

- **JSON**: Machine-readable validation results
- **HTML**: Interactive dashboard with charts and metrics
- **CSV**: Metrics data for analysis tools
- **Markdown**: Human-readable summary reports

## Examples

See the `examples/` directory for complete usage examples:

- `basic-validation.ts`: Simple validation execution
- `advanced-monitoring.ts`: Custom performance monitoring
- `custom-reporting.ts`: Custom report generation
- `dev-experience-example.ts`: Developer experience metrics demonstration
- `memory-monitoring-example.ts`: Memory profiling and leak detection

## Detailed Documentation

For comprehensive documentation on specific components:

- [Developer Experience Metrics](./README-dev-experience.md) - IDE performance, workflow timing, and productivity tracking
- [Build Time Analyzer](./README-build-analyzer.md) - Build performance analysis and optimization
- [Bundle Size Analyzer](./README-bundle-analyzer.md) - Bundle size analysis and reduction strategies

## Integration

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Phase A Validation
  run: |
    pnpm install
    npx @reporunner/validation --output-format json --output-directory ./validation-reports

- name: Upload Validation Reports
  uses: actions/upload-artifact@v3
  with:
    name: validation-reports
    path: ./validation-reports/
```

### Package.json Scripts

```json
{
  "scripts": {
    "validate": "npx @reporunner/validation",
    "validate:performance": "npx @reporunner/validation --phases performance",
    "validate:verbose": "npx @reporunner/validation --verbose"
  }
}
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Type Checking

```bash
pnpm type-check
```

## Contributing

This package is part of the Phase A validation effort. When contributing:

1. Ensure all validation components follow the established interfaces
2. Add comprehensive tests for new validation logic
3. Update documentation for new features
4. Follow the existing error handling patterns

## License

MIT - See LICENSE file for details.

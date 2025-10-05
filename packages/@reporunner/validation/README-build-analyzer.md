# Build Time Analyzer

The Build Time Analyzer is a comprehensive tool for measuring, analyzing, and optimizing build performance in the consolidated package architecture. It addresses Phase A requirements for performance analysis and measurement.

## Features

### 🔍 Build Time Measurement
- Measures individual package build times
- Tracks total build duration
- Monitors cache hit rates
- Calculates parallel efficiency

### 📊 Baseline Comparison
- Establishes performance baselines
- Compares current metrics with historical data
- Calculates improvement percentages
- Identifies performance regressions

### 🚨 Bottleneck Identification
- Identifies packages consuming >15% of build time
- Provides package-specific optimization suggestions
- Analyzes dependency chains and critical paths
- Recommends parallelization improvements

### 💡 Optimization Recommendations
- Cache optimization strategies
- Parallelization improvements
- Configuration optimizations
- Dependency management suggestions

## Requirements Coverage

This implementation addresses the following Phase A requirements:

- **Requirement 2.1**: Build time measurement and comparison system
- **Requirement 2.2**: Baseline comparison and improvement calculation tools
- **Requirement 2.5**: Performance analysis and reporting

## Installation

The build time analyzer is part of the `@reporunner/validation` package:

```bash
pnpm install @reporunner/validation
```

## Usage

### CLI Usage

The analyzer provides a command-line interface for easy integration:

```bash
# Run complete analysis
pnpm run analyze:build

# Establish baseline metrics
pnpm run analyze:build:baseline

# Compare with baseline
pnpm run analyze:build:compare

# Generate detailed report
pnpm run analyze:build:report
```

#### CLI Options

```bash
build-analyzer [options]

Options:
  --baseline     Run baseline measurement only
  --compare      Run comparison with baseline only
  --report       Generate comprehensive report only
  --output FILE  Save output to specified file
  --verbose      Show detailed information
  --help         Show help message
```

### Programmatic Usage

```typescript
import { BuildTimeAnalyzer } from '@reporunner/validation/build-analyzer';

const analyzer = new BuildTimeAnalyzer();

// Measure current build performance
const metrics = await analyzer.measureBuildTimes();

// Compare with baseline
const comparison = await analyzer.compareWithBaseline(metrics);

// Generate optimization recommendations
const recommendations = analyzer.generateOptimizationRecommendations(metrics, comparison);

// Create comprehensive report
const report = await analyzer.generateAnalysisReport();
```

## API Reference

### BuildTimeAnalyzer

Main class for build time analysis and optimization.

#### Methods

##### `measureBuildTimes(): Promise<BuildMetrics>`

Measures build times for all packages and generates comprehensive metrics.

**Returns**: `BuildMetrics` object containing:
- `totalBuildTime`: Total build duration in milliseconds
- `packageBuildTimes`: Individual package build times
- `cacheHitRate`: Percentage of cached builds (0-1)
- `parallelEfficiency`: Parallel execution efficiency (0-1)
- `bottlenecks`: Array of identified bottlenecks

##### `compareWithBaseline(metrics: BuildMetrics): Promise<BuildComparison | null>`

Compares current metrics with saved baseline.

**Parameters**:
- `metrics`: Current build metrics to compare

**Returns**: `BuildComparison` object or `null` if no baseline exists

##### `generateOptimizationRecommendations(metrics: BuildMetrics, comparison?: BuildComparison): OptimizationRecommendation[]`

Generates actionable optimization recommendations.

**Parameters**:
- `metrics`: Current build metrics
- `comparison`: Optional baseline comparison

**Returns**: Array of `OptimizationRecommendation` objects

##### `generateAnalysisReport(): Promise<BuildAnalysisReport>`

Creates a comprehensive analysis report with metrics, comparisons, and recommendations.

**Returns**: `BuildAnalysisReport` object containing complete analysis

### TurboMetricsCollector

Advanced metrics collection for Turbo-based builds.

#### Methods

##### `runWithMetrics(command: string[]): Promise<TurboRunSummary>`

Executes Turbo command and collects detailed metrics.

##### `getLatestRunSummary(): Promise<TurboRunSummary | null>`

Retrieves the most recent Turbo run summary.

##### `calculateCacheEffectiveness(summary: TurboRunSummary): CacheAnalysis`

Analyzes cache performance and provides recommendations.

##### `analyzeParallelism(summary: TurboRunSummary): ParallelismAnalysis`

Analyzes build parallelism and identifies optimization opportunities.

## Data Models

### BuildMetrics

```typescript
interface BuildMetrics {
  timestamp: Date;
  totalBuildTime: number;
  packageBuildTimes: Record<string, number>;
  cacheHitRate: number;
  parallelEfficiency: number;
  bottlenecks: BuildBottleneck[];
}
```

### BuildComparison

```typescript
interface BuildComparison {
  current: BuildMetrics;
  baseline: BuildMetrics;
  improvement: {
    totalTimeImprovement: number;
    percentageImprovement: number;
    packageImprovements: Record<string, number>;
  };
  regressions: string[];
  achievements: string[];
}
```

### OptimizationRecommendation

```typescript
interface OptimizationRecommendation {
  type: 'cache' | 'dependency' | 'parallelization' | 'configuration';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedImprovement: string;
  implementation: string[];
}
```

## Examples

### Basic Analysis

```typescript
import { BuildTimeAnalyzer } from '@reporunner/validation';

async function analyzeBuilds() {
  const analyzer = new BuildTimeAnalyzer();

  // Measure current performance
  const metrics = await analyzer.measureBuildTimes();
  console.log(`Build time: ${metrics.totalBuildTime / 1000}s`);

  // Check for bottlenecks
  if (metrics.bottlenecks.length > 0) {
    console.log('Bottlenecks found:');
    for (const bottleneck of metrics.bottlenecks) {
      console.log(`- ${bottleneck.packageName}: ${bottleneck.percentage}%`);
    }
  }
}
```

### Continuous Integration

```typescript
import { BuildTimeAnalyzer } from '@reporunner/validation';

async function ciAnalysis() {
  const analyzer = new BuildTimeAnalyzer();
  const report = await analyzer.generateAnalysisReport();

  // Check if target is achieved
  if (!report.summary.targetAchieved) {
    console.error('Build time target not achieved');
    process.exit(1);
  }

  // Check for regressions
  if (report.comparison?.regressions.length > 0) {
    console.warn('Performance regressions detected');
    for (const regression of report.comparison.regressions) {
      console.warn(`- ${regression}`);
    }
  }
}
```

### Advanced Turbo Analysis

```typescript
import { TurboMetricsCollector } from '@reporunner/validation';

async function advancedAnalysis() {
  const collector = new TurboMetricsCollector();

  // Run build with metrics collection
  const summary = await collector.runWithMetrics(['run', 'build']);

  // Analyze cache effectiveness
  const cacheAnalysis = collector.calculateCacheEffectiveness(summary);
  console.log(`Cache hit rate: ${cacheAnalysis.hitRate * 100}%`);

  // Analyze parallelism
  const parallelAnalysis = collector.analyzeParallelism(summary);
  console.log(`Parallel efficiency: ${parallelAnalysis.efficiency * 100}%`);
}
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Build Performance Analysis
on: [push, pull_request]

jobs:
  analyze-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run build analysis
        run: pnpm run analyze:build --output build-report.json

      - name: Upload analysis report
        uses: actions/upload-artifact@v4
        with:
          name: build-analysis-report
          path: build-report.json
```

### Performance Monitoring

```typescript
// monitor-builds.ts
import { BuildTimeAnalyzer } from '@reporunner/validation';

async function monitorBuilds() {
  const analyzer = new BuildTimeAnalyzer();
  const report = await analyzer.generateAnalysisReport();

  // Send metrics to monitoring system
  await sendMetrics({
    buildTime: report.metrics.totalBuildTime,
    cacheHitRate: report.metrics.cacheHitRate,
    targetAchieved: report.summary.targetAchieved
  });

  // Alert on regressions
  if (report.comparison?.improvement.percentageImprovement < -5) {
    await sendAlert('Build performance regression detected');
  }
}
```

## Configuration

### Turbo Configuration

Ensure your `turbo.json` is optimized for metrics collection:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"]
    }
  }
}
```

### Package-specific Optimization

The analyzer provides package-specific recommendations:

- **Frontend packages**: Bundle optimization, code splitting
- **Backend packages**: TypeScript compilation, dependency bundling
- **Shared packages**: Incremental builds, caching strategies

## Troubleshooting

### Common Issues

1. **No baseline found**: Run with `--baseline` flag first
2. **Build failures**: Check individual package build logs
3. **Inaccurate metrics**: Ensure clean build environment
4. **Cache issues**: Clear Turbo cache and re-run analysis

### Debug Mode

Enable verbose logging for detailed analysis:

```bash
pnpm run analyze:build --verbose
```

## Performance Targets

The analyzer validates against Phase A performance targets:

- **30% build time improvement** over pre-consolidation baseline
- **70%+ cache hit rate** for optimal caching
- **60%+ parallel efficiency** for good parallelization

## Contributing

When extending the build time analyzer:

1. Add comprehensive tests for new functionality
2. Update type definitions and interfaces
3. Document new CLI options and API methods
4. Ensure compatibility with existing Turbo configuration

## License

MIT License - see LICENSE file for details.

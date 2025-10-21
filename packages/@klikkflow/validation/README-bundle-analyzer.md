# Bundle Size Analyzer

The Bundle Size Analyzer is a comprehensive tool for measuring, tracking, and optimizing bundle sizes in the Phase A validation framework. It implements the requirements for bundle size analysis and optimization identification as specified in task 3.2.

## Features

### 📊 Bundle Size Measurement
- **Comprehensive Analysis**: Measures total size, gzipped size, JavaScript, CSS, and asset sizes
- **File-Level Details**: Analyzes individual files with compression ratios and categorization
- **Chunk Analysis**: Identifies and categorizes chunks (vendor vs. app code)
- **Format Support**: Handles JS, CSS, and various asset file types

### 📈 Size Reduction Tracking
- **Baseline Comparison**: Compare current bundle sizes against saved baselines
- **Percentage Calculations**: Track size reduction percentages across all categories
- **Target Validation**: Validates against the 20% reduction target from requirements
- **Historical Tracking**: Maintains baseline metrics for trend analysis

### 🔧 Optimization Identification
- **Large Chunk Detection**: Identifies chunks larger than recommended thresholds
- **Vendor Bundle Analysis**: Detects oversized vendor bundles and potential duplicates
- **Compression Opportunities**: Finds files with poor compression ratios
- **Tree Shaking Suggestions**: Identifies potential unused code elimination opportunities
- **Severity Ranking**: Prioritizes optimizations by impact (high/medium/low)

### 📋 Comprehensive Reporting
- **Status Assessment**: Overall health check (success/warning/failure)
- **Requirements Validation**: Checks against Phase A requirements 2.2 and 2.5
- **Actionable Recommendations**: Specific optimization suggestions with estimated savings
- **Multiple Formats**: JSON, table, and summary output formats

## Installation

The bundle analyzer is part of the `@reporunner/validation` package:

```bash
pnpm install @reporunner/validation
```

## Usage

### Programmatic API

```typescript
import { BundleSizeAnalyzer } from '@reporunner/validation';

// Create analyzer instance
const analyzer = new BundleSizeAnalyzer('./packages/frontend/dist');

// Analyze current bundle sizes
const metrics = await analyzer.analyzeBundleSizes();
console.log(`Total size: ${BundleSizeAnalyzer.formatBytes(metrics.totalSize)}`);

// Compare with baseline
const comparison = await analyzer.compareWithBaseline(metrics);
console.log(`Reduction: ${comparison.improvement.totalSizeReductionPercent}%`);

// Identify optimizations
const optimizations = await analyzer.identifyOptimizations(metrics);
console.log(`Found ${optimizations.length} optimization opportunities`);

// Generate comprehensive report
const report = await analyzer.generateReport();
console.log(`Status: ${report.summary.status}`);
```

### CLI Interface

```bash
# Create baseline from current bundle
pnpm analyze:bundle:baseline

# Compare current bundle with baseline
pnpm analyze:bundle:compare

# Generate full analysis report
pnpm analyze:bundle:report

# Generate summary report
pnpm analyze:bundle --format summary

# Save report to JSON file
pnpm analyze:bundle --format json --output bundle-report.json
```

### CLI Options

- `--baseline`: Create baseline from current bundle
- `--compare`: Compare current bundle with baseline
- `--update-baseline`: Update baseline with current metrics
- `--report`: Generate full analysis report (default)
- `--dist-path <path>`: Path to distribution directory
- `--format <format>`: Output format (json, table, summary)
- `--output <file>`: Save output to file (JSON format only)

## Configuration

### Default Settings

```typescript
const analyzer = new BundleSizeAnalyzer(
  './packages/frontend/dist',  // Distribution path
  './baseline-bundle-metrics.json'  // Baseline file path
);
```

### Thresholds

The analyzer uses the following thresholds for optimization detection:

- **Large Chunks**: > 500KB
- **Large Vendor Bundle**: > 300KB
- **Poor Compression**: Compression ratio > 0.7 for files > 10KB
- **Tree Shaking Opportunity**: App code > 50% of vendor code size

## Integration with Build Process

### Vite Integration

The analyzer works seamlessly with Vite builds. After running `pnpm build` in the frontend package:

```bash
# Analyze the Vite build output
pnpm analyze:bundle --dist-path ./packages/frontend/dist
```

### Turbo Integration

Add bundle analysis to your Turbo pipeline:

```json
{
  "pipeline": {
    "bundle-analysis": {
      "dependsOn": ["build"],
      "outputs": ["bundle-report.json"]
    }
  }
}
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Analyze Bundle Size
  run: |
    pnpm build
    pnpm analyze:bundle:compare

- name: Generate Bundle Report
  run: pnpm analyze:bundle --format json --output bundle-report.json

- name: Upload Bundle Report
  uses: actions/upload-artifact@v3
  with:
    name: bundle-report
    path: bundle-report.json
```

## API Reference

### BundleSizeAnalyzer

#### Constructor
```typescript
constructor(distPath?: string, baselinePath?: string)
```

#### Methods

##### `analyzeBundleSizes(): Promise<BundleMetrics>`
Analyzes bundle files in the distribution directory and returns comprehensive metrics.

##### `compareWithBaseline(metrics: BundleMetrics): Promise<BundleSizeComparison>`
Compares current metrics with saved baseline, creating baseline if none exists.

##### `identifyOptimizations(metrics: BundleMetrics): Promise<BundleOptimization[]>`
Identifies optimization opportunities and returns them sorted by severity.

##### `generateReport(): Promise<BundleAnalysisReport>`
Generates a comprehensive analysis report including metrics, comparison, and optimizations.

##### `saveBaseline(metrics: BundleMetrics): Promise<void>`
Saves current metrics as baseline (only if no baseline exists).

##### `updateBaseline(metrics: BundleMetrics): Promise<void>`
Updates existing baseline with current metrics.

#### Static Methods

##### `formatBytes(bytes: number): string`
Formats byte values into human-readable strings (B, KB, MB, GB).

##### `formatPercentage(value: number): string`
Formats percentage values with appropriate signs (+/-).

### Types

#### BundleMetrics
```typescript
interface BundleMetrics {
  totalSize: number;
  totalGzipSize: number;
  jsSize: number;
  cssSize: number;
  assetSize: number;
  chunkCount: number;
  vendorSize: number;
  appSize: number;
  files: BundleFile[];
  timestamp: Date;
}
```

#### BundleSizeComparison
```typescript
interface BundleSizeComparison {
  current: BundleMetrics;
  baseline?: BundleMetrics;
  improvement: {
    totalSizeReduction: number;
    totalSizeReductionPercent: number;
    gzipSizeReduction: number;
    gzipSizeReductionPercent: number;
    jsSizeReduction: number;
    cssSizeReduction: number;
  };
  meetsTarget: boolean;
  targetReduction: number;
}
```

#### BundleOptimization
```typescript
interface BundleOptimization {
  type: 'duplicate-dependencies' | 'large-chunks' | 'unused-code' | 'compression' | 'tree-shaking';
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
  estimatedSavings: number;
  files?: string[];
}
```

## Requirements Compliance

### Requirement 2.2 - Bundle Size Analysis
✅ **Implemented**: Bundle size measurement and tracking system
- Measures total bundle size, gzipped size, and individual file sizes
- Tracks size reductions and validates against 20% target
- Provides detailed breakdown by file type and chunk category

### Requirement 2.5 - Performance Tracking
✅ **Implemented**: Size reduction calculation and reporting tools
- Baseline comparison with percentage calculations
- Historical tracking through baseline management
- Performance dashboard with metrics and trends

### Additional Features
✅ **Bundle optimization identification and recommendation system**
- Automated detection of optimization opportunities
- Severity-based prioritization of recommendations
- Estimated savings calculations for each optimization

## Examples

See `examples/bundle-analysis-example.ts` for comprehensive usage examples including:

- Basic bundle size analysis
- Baseline comparison
- Optimization identification
- Complete reporting
- CLI usage
- Requirements validation

## Testing

Run the test suite:

```bash
pnpm test bundle-size-analyzer
```

The test suite covers:
- Bundle size analysis functionality
- Baseline comparison logic
- Optimization identification algorithms
- Report generation
- Error handling
- Utility functions

## Troubleshooting

### Common Issues

1. **Distribution directory not found**
   - Ensure the frontend package has been built: `pnpm build:frontend`
   - Check the distribution path is correct

2. **No baseline for comparison**
   - Create a baseline first: `pnpm analyze:bundle:baseline`
   - Or let the analyzer create one automatically on first run

3. **Permission errors with baseline file**
   - Ensure write permissions in the project root
   - Check if the baseline file is not locked by another process

### Debug Mode

Enable verbose logging by setting the environment variable:

```bash
DEBUG=bundle-analyzer pnpm analyze:bundle
```

## Contributing

When contributing to the bundle analyzer:

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure requirements compliance is maintained
5. Test with real bundle outputs from the frontend package

## Related Tools

- **Build Time Analyzer**: For build performance analysis
- **Bundlemon**: For bundle size monitoring in CI/CD
- **Turbo**: For build orchestration and caching
- **Vite**: For frontend bundling and optimization

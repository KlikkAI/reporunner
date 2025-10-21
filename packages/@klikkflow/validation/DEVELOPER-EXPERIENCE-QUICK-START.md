# Developer Experience Metrics - Quick Start Guide

## 🚀 Quick Commands

```bash
# Analyze overall developer experience
npx dev-experience-cli analyze

# Benchmark IDE performance
npx dev-experience-cli benchmark

# Start productivity tracking
npx dev-experience-cli track

# Generate 30-day productivity report
npx dev-experience-cli report 30
```

## 📊 Key Metrics at a Glance

### IDE Performance (0-100 score)
- **TypeScript**: Compilation time, type checking speed
- **Autocomplete**: Response time, accuracy, relevance
- **Navigation**: Go to definition, find references, symbol search
- **IntelliSense**: Hover info, signature help, diagnostics

### Workflow Timing
- **Hot Reload**: Development server update time
- **Build Startup**: Time to initialize build process
- **Test Execution**: Test suite run time
- **Linting/Formatting**: Code quality tool performance

### Productivity Tracking
- **Session Management**: Track coding sessions with activities
- **Build/Test Events**: Success rates and timing
- **Code Changes**: Lines modified, files touched
- **Trends**: Daily/weekly productivity patterns

## 🔧 Quick Integration

### Basic Usage
```typescript
import { DevExperienceMetrics } from '@reporunner/validation';

const metrics = new DevExperienceMetrics();
const report = await metrics.generateReport();

console.log(`Score: ${report.score}/100`);
console.log(`Recommendations: ${report.recommendations.length}`);
```

### Productivity Tracking
```typescript
import { ProductivityTracker } from '@reporunner/validation';

const tracker = new ProductivityTracker();
await tracker.startSession();
await tracker.startActivity('coding', 'New feature');
// ... do work ...
await tracker.endActivity(true);
const session = await tracker.endSession();
```

### IDE Benchmarking
```typescript
import { IDEPerformanceAnalyzer } from '@reporunner/validation';

const analyzer = new IDEPerformanceAnalyzer();
const report = await analyzer.analyzeIDEPerformance();

console.log(`IDE Score: ${report.overallScore}/100`);
console.log(`TypeScript: ${report.typescript.compilationTime}ms`);
```

## 📈 Interpreting Scores

### Excellent (90-100)
- TypeScript compilation < 5s
- Autocomplete response < 200ms
- High productivity efficiency
- Minimal debugging time

### Good (70-89)
- TypeScript compilation < 15s
- Autocomplete response < 500ms
- Balanced workflow timing
- Reasonable error resolution

### Needs Improvement (50-69)
- TypeScript compilation < 30s
- Autocomplete response < 1s
- Some workflow bottlenecks
- Higher debugging ratio

### Poor (0-49)
- TypeScript compilation > 30s
- Autocomplete response > 1s
- Significant workflow issues
- Low productivity metrics

## 🎯 Common Optimizations

### IDE Performance
```bash
# Enable TypeScript incremental compilation
echo '{"compilerOptions": {"incremental": true}}' > tsconfig.json

# Use project references for large codebases
# Configure workspace-specific TypeScript settings
```

### Workflow Speed
```bash
# Enable Turbo cache
turbo build --cache-dir=.turbo

# Parallelize tests
vitest run --reporter=verbose --threads

# Incremental linting
biome check --changed
```

### Productivity
- Use watch mode for faster iteration
- Set up automated testing workflows
- Configure IDE shortcuts for navigation
- Organize code to reduce complexity

## 📁 Data Location

Productivity data is stored locally:
```
.kiro/
└── productivity-data/
    ├── session_*.json
    └── trends-summary.json
```

## 🔗 Integration Examples

### Package.json
```json
{
  "scripts": {
    "dx": "npx dev-experience-cli analyze",
    "dx:track": "npx dev-experience-cli track",
    "dx:report": "npx dev-experience-cli report"
  }
}
```

### CI/CD (GitHub Actions)
```yaml
- name: Developer Experience Analysis
  run: npx dev-experience-cli benchmark --output-format json
```

### Pre-commit Hook
```bash
#!/bin/sh
npx dev-experience-cli benchmark --quick
```

## 🆘 Troubleshooting

**High measurement times**: Normal in test/CI environments
**Missing TypeScript**: Install as dev dependency
**Permission errors**: Check `.kiro/` directory permissions
**Command timeouts**: Expected behavior for performance measurement

## 📚 Full Documentation

- [Complete Developer Experience Guide](./README-dev-experience.md)
- [Main Package Documentation](./README.md)
- [API Reference](./README-dev-experience.md#api-reference)

# @reporunner/validation Usage Examples

This document provides practical examples of using the validation framework in different scenarios.

## Basic Usage Examples

### 1. Quick TypeScript Health Check

```typescript
import { TypeScriptAnalyzer } from '@reporunner/validation/typescript';

async function quickHealthCheck() {
  const analyzer = new TypeScriptAnalyzer(process.cwd());
  const report = await analyzer.analyzeTypeScriptSetup();

  console.log(`🎯 Overall Score: ${report.overallScore}/100`);

  if (report.overallScore < 70) {
    console.log('⚠️  Issues found:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  } else {
    console.log('✅ TypeScript setup looks good!');
  }
}

quickHealthCheck().catch(console.error);
```

### 2. IDE Performance Monitoring

```typescript
import { IDEPerformanceValidator } from '@reporunner/validation/ide-performance';

async function monitorIDEPerformance() {
  const validator = new IDEPerformanceValidator(process.cwd());
  const report = await validator.validateIDEPerformance();

  const metrics = report.performanceMetrics;

  console.log('🚀 IDE Performance Metrics:');
  console.log(`  Navigation Success: ${(metrics.navigationSuccessRate * 100).toFixed(1)}%`);
  console.log(`  IntelliSense Accuracy: ${metrics.intelliSenseAccuracy.toFixed(1)}%`);
  console.log(`  Avg Navigation Time: ${metrics.averageNavigationTime}ms`);
  console.log(`  Avg IntelliSense Time: ${metrics.averageIntelliSenseTime}ms`);

  // Alert on performance issues
  if (metrics.averageNavigationTime > 1000) {
    console.log('⚠️  Navigation is slow - consider optimizing TypeScript config');
  }

  if (metrics.intelliSenseAccuracy < 80) {
    console.log('⚠️  IntelliSense accuracy is low - check type definitions');
  }
}

monitorIDEPerformance().catch(console.error);
```

### 3. Import Path Cleanup

```typescript
import { ImportPathOptimizer } from '@reporunner/validation/import-optimization';

async function cleanupImports() {
  const optimizer = new ImportPathOptimizer(process.cwd());
  const report = await optimizer.optimizeImportPaths();

  console.log('📦 Import Analysis Results:');
  console.log(`  Files: ${report.totalFiles}`);
  console.log(`  Imports: ${report.totalImports}`);
  console.log(`  Consistency Score: ${report.metrics.consistencyScore}%`);

  // Show circular dependencies
  if (report.circularDependencies.length > 0) {
    console.log('\n🔄 Circular Dependencies:');
    report.circularDependencies.forEach(cycle => {
      const severity = cycle.severity === 'critical' ? '🚨' : '⚠️';
      console.log(`  ${severity} ${cycle.cycle.join(' → ')}`);
      console.log(`     💡 ${cycle.suggestions[0]}`);
    });
  }

  // Show optimization suggestions
  const highImpactSuggestions = report.suggestions.filter(s => s.estimatedImpact === 'high');
  if (highImpactSuggestions.length > 0) {
    console.log('\n💡 High Impact Optimizations:');
    highImpactSuggestions.forEach(suggestion => {
      console.log(`  ${suggestion.type}: ${suggestion.description}`);
    });
  }
}

cleanupImports().catch(console.error);
```

## Advanced Usage Examples

### 4. Custom Validation Pipeline

```typescript
import {
  TypeScriptAnalyzer,
  IDEPerformanceValidator,
  ImportPathOptimizer
} from '@reporunner/validation';

class ValidationPipeline {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async runFullValidation() {
    console.log('🔍 Starting comprehensive validation...\n');

    // 1. TypeScript Analysis
    console.log('1️⃣ Analyzing TypeScript setup...');
    const tsAnalyzer = new TypeScriptAnalyzer(this.workspaceRoot);
    const tsReport = await tsAnalyzer.analyzeTypeScriptSetup();

    // 2. IDE Performance Validation
    console.log('2️⃣ Validating IDE performance...');
    const ideValidator = new IDEPerformanceValidator(this.workspaceRoot);
    const ideReport = await ideValidator.validateIDEPerformance();

    // 3. Import Path Optimization
    console.log('3️⃣ Optimizing import paths...');
    const importOptimizer = new ImportPathOptimizer(this.workspaceRoot);
    const importReport = await importOptimizer.optimizeImportPaths();

    // Generate combined report
    return this.generateCombinedReport(tsReport, ideReport, importReport);
  }

  private generateCombinedReport(tsReport: any, ideReport: any, importReport: any) {
    const overallScore = Math.round(
      (tsReport.overallScore + ideReport.overallScore + importReport.metrics.consistencyScore) / 3
    );

    return {
      timestamp: new Date(),
      overallScore,
      typescript: {
        score: tsReport.overallScore,
        issues: tsReport.compilationMetrics.reduce((sum: number, m: any) => sum + m.errors.length, 0),
        recommendations: tsReport.recommendations
      },
      ide: {
        score: ideReport.overallScore,
        navigationSuccess: ideReport.performanceMetrics.navigationSuccessRate,
        intelliSenseAccuracy: ideReport.performanceMetrics.intelliSenseAccuracy,
        recommendations: ideReport.recommendations
      },
      imports: {
        score: importReport.metrics.consistencyScore,
        circularDependencies: importReport.metrics.circularDependencyCount,
        suggestions: importReport.suggestions.length,
        recommendations: importReport.recommendations
      }
    };
  }
}

// Usage
const pipeline = new ValidationPipeline(process.cwd());
pipeline.runFullValidation()
  .then(report => {
    console.log('\n📊 Combined Validation Report:');
    console.log(`Overall Score: ${report.overallScore}/100`);
    console.log(`TypeScript: ${report.typescript.score}/100`);
    console.log(`IDE Performance: ${report.ide.score}/100`);
    console.log(`Import Consistency: ${report.imports.score}/100`);
  })
  .catch(console.error);
```

### 5. CI/CD Integration Example

```typescript
// scripts/validate-pr.ts
import {
  TypeScriptAnalyzer,
  ImportPathOptimizer
} from '@reporunner/validation';

async function validatePullRequest() {
  const workspaceRoot = process.cwd();
  const exitCode = { value: 0 };

  try {
    // Quick TypeScript check
    console.log('🔍 Checking TypeScript setup...');
    const tsAnalyzer = new TypeScriptAnalyzer(workspaceRoot);
    const tsReport = await tsAnalyzer.analyzeTypeScriptSetup();

    if (tsReport.overallScore < 80) {
      console.error(`❌ TypeScript score too low: ${tsReport.overallScore}/100`);
      exitCode.value = 1;
    }

    // Check for circular dependencies
    console.log('🔄 Checking for circular dependencies...');
    const importOptimizer = new ImportPathOptimizer(workspaceRoot);
    const importReport = await importOptimizer.optimizeImportPaths();

    const criticalCycles = importReport.circularDependencies.filter(c => c.severity === 'critical');
    if (criticalCycles.length > 0) {
      console.error(`❌ Critical circular dependencies found: ${criticalCycles.length}`);
      criticalCycles.forEach(cycle => {
        console.error(`  🚨 ${cycle.cycle.join(' → ')}`);
      });
      exitCode.value = 1;
    }

    // Check import consistency
    if (importReport.metrics.consistencyScore < 70) {
      console.error(`❌ Import consistency too low: ${importReport.metrics.consistencyScore}%`);
      exitCode.value = 1;
    }

    if (exitCode.value === 0) {
      console.log('✅ All validation checks passed!');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    exitCode.value = 1;
  }

  process.exit(exitCode.value);
}

validatePullRequest();
```

### 6. Performance Monitoring Dashboard

```typescript
// scripts/performance-dashboard.ts
import { IDEPerformanceValidator } from '@reporunner/validation/ide-performance';
import * as fs from 'fs';

class PerformanceDashboard {
  private validator: IDEPerformanceValidator;
  private historyFile: string;

  constructor(workspaceRoot: string) {
    this.validator = new IDEPerformanceValidator(workspaceRoot);
    this.historyFile = 'performance-history.json';
  }

  async collectMetrics() {
    const report = await this.validator.validateIDEPerformance();

    // Load historical data
    let history: any[] = [];
    if (fs.existsSync(this.historyFile)) {
      history = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
    }

    // Add current metrics
    const metrics = {
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      navigationTime: report.performanceMetrics.averageNavigationTime,
      intelliSenseTime: report.performanceMetrics.averageIntelliSenseTime,
      navigationSuccess: report.performanceMetrics.navigationSuccessRate,
      intelliSenseAccuracy: report.performanceMetrics.intelliSenseAccuracy
    };

    history.push(metrics);

    // Keep only last 30 entries
    if (history.length > 30) {
      history = history.slice(-30);
    }

    // Save updated history
    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));

    return this.generateDashboard(history);
  }

  private generateDashboard(history: any[]) {
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : latest;

    console.log('📊 IDE Performance Dashboard');
    console.log('================================');
    console.log(`Overall Score: ${latest.overallScore}/100 ${this.getTrend(latest.overallScore, previous.overallScore)}`);
    console.log(`Navigation Time: ${latest.navigationTime}ms ${this.getTrend(previous.navigationTime, latest.navigationTime)}`);
    console.log(`IntelliSense Time: ${latest.intelliSenseTime}ms ${this.getTrend(previous.intelliSenseTime, latest.intelliSenseTime)}`);
    console.log(`Navigation Success: ${(latest.navigationSuccess * 100).toFixed(1)}% ${this.getTrend(latest.navigationSuccess, previous.navigationSuccess)}`);
    console.log(`IntelliSense Accuracy: ${latest.intelliSenseAccuracy.toFixed(1)}% ${this.getTrend(latest.intelliSenseAccuracy, previous.intelliSenseAccuracy)}`);

    // Show trends over last 7 entries
    if (history.length >= 7) {
      const weekAgo = history[history.length - 7];
      console.log('\n📈 Weekly Trends:');
      console.log(`  Score: ${this.getWeeklyTrend(latest.overallScore, weekAgo.overallScore)}`);
      console.log(`  Navigation: ${this.getWeeklyTrend(weekAgo.navigationTime, latest.navigationTime)}ms`);
      console.log(`  IntelliSense: ${this.getWeeklyTrend(weekAgo.intelliSenseTime, latest.intelliSenseTime)}ms`);
    }

    return { latest, history };
  }

  private getTrend(current: number, previous: number): string {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  }

  private getWeeklyTrend(current: number, weekAgo: number): string {
    const change = current - weekAgo;
    const changePercent = ((change / weekAgo) * 100).toFixed(1);
    return change > 0 ? `+${changePercent}%` : `${changePercent}%`;
  }
}

// Usage
const dashboard = new PerformanceDashboard(process.cwd());
dashboard.collectMetrics()
  .then(() => console.log('\n✅ Performance metrics collected'))
  .catch(console.error);
```

### 7. Automated Fix Application

```typescript
// scripts/auto-fix-imports.ts
import { ImportPathOptimizer } from '@reporunner/validation/import-optimization';
import * as fs from 'fs';

class ImportAutoFixer {
  private optimizer: ImportPathOptimizer;

  constructor(workspaceRoot: string) {
    this.optimizer = new ImportPathOptimizer(workspaceRoot);
  }

  async applyAutomaticFixes() {
    const report = await this.optimizer.optimizeImportPaths();

    console.log('🔧 Applying automatic import fixes...');

    let fixesApplied = 0;

    // Apply safe fixes only
    const safeFixes = report.suggestions.filter(s =>
      s.type === 'consolidate-imports' && s.estimatedImpact === 'low'
    );

    for (const fix of safeFixes) {
      try {
        await this.applySingleFix(fix);
        fixesApplied++;
        console.log(`✅ Applied: ${fix.description}`);
      } catch (error) {
        console.warn(`⚠️  Could not apply fix: ${fix.description}`);
      }
    }

    console.log(`\n🎉 Applied ${fixesApplied} automatic fixes`);

    // Report remaining issues
    const remainingIssues = report.suggestions.length - fixesApplied;
    if (remainingIssues > 0) {
      console.log(`📋 ${remainingIssues} suggestions require manual review`);
    }

    return { fixesApplied, remainingIssues };
  }

  private async applySingleFix(fix: any): Promise<void> {
    // This would contain the actual file modification logic
    // For now, just simulate the fix
    console.log(`  Simulating fix: ${fix.type}`);

    // In a real implementation, this would:
    // 1. Parse the file with AST
    // 2. Apply the transformation
    // 3. Write the modified file back
    // 4. Verify the fix doesn't break anything
  }
}

// Usage
const fixer = new ImportAutoFixer(process.cwd());
fixer.applyAutomaticFixes()
  .then(result => {
    console.log(`\n📊 Fix Summary:`);
    console.log(`  Applied: ${result.fixesApplied}`);
    console.log(`  Remaining: ${result.remainingIssues}`);
  })
  .catch(console.error);
```

## Integration Examples

### 8. GitHub Actions Workflow

```yaml
# .github/workflows/validation.yml
name: Code Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'

    - name: Install dependencies
      run: pnpm install

    - name: Build validation package
      run: pnpm build --filter=@reporunner/validation

    - name: Run TypeScript analysis
      run: |
        cd packages/@reporunner/validation
        pnpm typescript:analyze --output ts-report.json

    - name: Run IDE performance validation
      run: |
        cd packages/@reporunner/validation
        pnpm ide:validate --output ide-report.json

    - name: Run import optimization
      run: |
        cd packages/@reporunner/validation
        pnpm imports:analyze --output import-report.json

    - name: Upload validation reports
      uses: actions/upload-artifact@v3
      with:
        name: validation-reports
        path: packages/@reporunner/validation/*-report.json

    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const tsReport = JSON.parse(fs.readFileSync('packages/@reporunner/validation/ts-report.json'));
          const ideReport = JSON.parse(fs.readFileSync('packages/@reporunner/validation/ide-report.json'));
          const importReport = JSON.parse(fs.readFileSync('packages/@reporunner/validation/import-report.json'));

          const comment = `## 📊 Validation Results

          | Metric | Score | Status |
          |--------|-------|--------|
          | TypeScript | ${tsReport.overallScore}/100 | ${tsReport.overallScore >= 80 ? '✅' : '❌'} |
          | IDE Performance | ${ideReport.overallScore}/100 | ${ideReport.overallScore >= 70 ? '✅' : '❌'} |
          | Import Consistency | ${importReport.metrics.consistencyScore}/100 | ${importReport.metrics.consistencyScore >= 70 ? '✅' : '❌'} |

          ${importReport.circularDependencies.length > 0 ? `⚠️ **${importReport.circularDependencies.length} circular dependencies found**` : '✅ No circular dependencies'}
          `;

          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### 9. Pre-commit Hook

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running validation checks..."

# Quick TypeScript check
cd packages/@reporunner/validation
node dist/cli/typescript-analyzer-cli.js analyze --compilation-only

if [ $? -ne 0 ]; then
  echo "❌ TypeScript validation failed"
  exit 1
fi

# Check for circular dependencies
node dist/cli/import-optimizer-cli.js analyze --circular-only

if [ $? -ne 0 ]; then
  echo "❌ Circular dependency check failed"
  exit 1
fi

echo "✅ All validation checks passed"
```

These examples demonstrate the flexibility and power of the validation framework for maintaining code quality and developer experience in the consolidated package architecture.

#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { ImportPathOptimizer } from '../import-optimization/import-path-optimizer';
import { ImportOptimizationReport } from '../import-optimization/types';

const program = new Command();

program
  .name('import-optimizer')
  .description('Optimize import paths and detect circular dependencies in the consolidated package architecture')
  .version('1.0.0');

program
  .command('analyze')
  .description('Run comprehensive import path analysis')
  .option('-o, --output <file>', 'Output file for analysis report (JSON format)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--circular-only', 'Run only circular dependency detection')
  .option('--consistency-only', 'Run only import consistency validation')
  .option('--suggestions-only', 'Run only path optimization suggestions')
  .action(async (options) => {
    try {
      const workspaceRoot = findWorkspaceRoot();
      console.log(`Analyzing import paths in: ${workspaceRoot}`);

      const optimizer = new ImportPathOptimizer(workspaceRoot);

      let report: ImportOptimizationReport;

      if (options.circularOnly) {
        console.log('Running circular dependency detection only...');
        const circularDependencies = await optimizer['circularDependencyDetector'].detectCircularDependencies();
        report = {
          timestamp: new Date(),
          totalFiles: 0,
          totalImports: 0,
          issues: [],
          circularDependencies,
          suggestions: [],
          metrics: {
            consistencyScore: 0,
            circularDependencyCount: circularDependencies.length,
            averageImportsPerFile: 0,
            deepImportCount: 0,
            relativeImportCount: 0
          },
          recommendations: []
        };
      } else if (options.consistencyOnly) {
        console.log('Running import consistency validation only...');
        const consistencyResults = await optimizer['importConsistencyValidator'].validateImportConsistency();
        const allIssues = consistencyResults.analyses.flatMap((analysis: any) => analysis.issues);
        report = {
          timestamp: new Date(),
          totalFiles: consistencyResults.analyses.length,
          totalImports: consistencyResults.analyses.reduce((sum: number, analysis: any) => sum + analysis.imports.length, 0),
          issues: allIssues,
          circularDependencies: [],
          suggestions: [],
          metrics: {
            consistencyScore: 0,
            circularDependencyCount: 0,
            averageImportsPerFile: 0,
            deepImportCount: 0,
            relativeImportCount: 0
          },
          recommendations: []
        };
      } else {
        report = await optimizer.optimizeImportPaths();
      }

      // Display results
      displayResults(report, options.verbose);

      // Save to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\nAnalysis report saved to: ${outputPath}`);
      }

      // Exit with appropriate code
      const hasErrors = report.issues.some(issue => issue.severity === 'error') ||
                       report.circularDependencies.some(cycle => cycle.severity === 'critical');

      if (hasErrors) {
        process.exit(1);
      }

    } catch (error) {
      console.error('Error running import path analysis:', error);
      process.exit(1);
    }
  });

program
  .command('fix')
  .description('Apply suggested import path optimizations')
  .argument('<input>', 'Input JSON file with analysis results')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('--auto-fix', 'Automatically apply safe fixes')
  .action(async (input, options) => {
    try {
      const inputPath = path.resolve(input);
      const reportData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

      console.log('Import path optimization fixes:');
      console.log('This feature would apply the suggested optimizations.');
      console.log('Implementation would include:');
      console.log('- Consolidating duplicate imports');
      console.log('- Converting deep imports to barrel exports');
      console.log('- Standardizing import path patterns');

      if (options.dryRun) {
        console.log('\n[DRY RUN] No changes were made.');
      } else {
        console.log('\n[NOT IMPLEMENTED] Fix functionality is not yet implemented.');
      }

    } catch (error) {
      console.error('Error applying fixes:', error);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a formatted report from analysis results')
  .argument('<input>', 'Input JSON file with analysis results')
  .option('-f, --format <format>', 'Output format (console, markdown, html)', 'console')
  .option('-o, --output <file>', 'Output file for formatted report')
  .action(async (input, options) => {
    try {
      const inputPath = path.resolve(input);
      const reportData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

      let formattedReport: string;

      switch (options.format) {
        case 'markdown':
          formattedReport = generateMarkdownReport(reportData);
          break;
        case 'html':
          formattedReport = generateHtmlReport(reportData);
          break;
        default:
          displayResults(reportData, true);
          return;
      }

      if (options.output) {
        fs.writeFileSync(options.output, formattedReport);
        console.log(`Report saved to: ${options.output}`);
      } else {
        console.log(formattedReport);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      process.exit(1);
    }
  });

function findWorkspaceRoot(): string {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    const pnpmWorkspacePath = path.join(currentDir, 'pnpm-workspace.yaml');

    if (fs.existsSync(packageJsonPath) && fs.existsSync(pnpmWorkspacePath)) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find workspace root (looking for package.json and pnpm-workspace.yaml)');
}

function displayResults(report: ImportOptimizationReport, verbose: boolean = false): void {
  console.log('\n=== Import Path Optimization Report ===');
  console.log(`Generated: ${report.timestamp.toISOString()}`);
  console.log(`Files Analyzed: ${report.totalFiles}`);
  console.log(`Total Imports: ${report.totalImports}`);

  // Metrics Summary
  console.log('\n--- Metrics ---');
  console.log(`Consistency Score: ${report.metrics.consistencyScore}%`);
  console.log(`Circular Dependencies: ${report.metrics.circularDependencyCount}`);
  console.log(`Average Imports per File: ${report.metrics.averageImportsPerFile}`);
  console.log(`Deep Imports: ${report.metrics.deepImportCount}`);
  console.log(`Relative Imports: ${report.metrics.relativeImportCount}`);

  // Circular Dependencies
  if (report.circularDependencies.length > 0) {
    console.log('\n--- Circular Dependencies ---');
    const critical = report.circularDependencies.filter(cycle => cycle.severity === 'critical').length;
    const warnings = report.circularDependencies.filter(cycle => cycle.severity === 'warning').length;
    console.log(`Critical: ${critical}, Warnings: ${warnings}`);

    if (verbose) {
      report.circularDependencies.forEach(cycle => {
        const severity = cycle.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`  ${severity} ${cycle.description}`);
        if (cycle.suggestions.length > 0) {
          console.log(`    Suggestion: ${cycle.suggestions[0]}`);
        }
      });
    }
  }

  // Issues Summary
  if (report.issues.length > 0) {
    console.log('\n--- Issues ---');
    const errors = report.issues.filter(issue => issue.severity === 'error').length;
    const warnings = report.issues.filter(issue => issue.severity === 'warning').length;
    const info = report.issues.filter(issue => issue.severity === 'info').length;
    console.log(`Errors: ${errors}, Warnings: ${warnings}, Info: ${info}`);

    if (verbose) {
      const issueTypes = new Map<string, number>();
      report.issues.forEach(issue => {
        issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
      });

      console.log('\nIssue Types:');
      issueTypes.forEach((count, type) => {
        console.log(`  ${type}: ${count}`);
      });
    }
  }

  // Suggestions
  if (report.suggestions.length > 0) {
    console.log('\n--- Optimization Suggestions ---');
    const highImpact = report.suggestions.filter(s => s.estimatedImpact === 'high').length;
    const mediumImpact = report.suggestions.filter(s => s.estimatedImpact === 'medium').length;
    const lowImpact = report.suggestions.filter(s => s.estimatedImpact === 'low').length;

    console.log(`High Impact: ${highImpact}, Medium Impact: ${mediumImpact}, Low Impact: ${lowImpact}`);

    if (verbose) {
      const suggestionTypes = new Map<string, number>();
      report.suggestions.forEach(suggestion => {
        suggestionTypes.set(suggestion.type, (suggestionTypes.get(suggestion.type) || 0) + 1);
      });

      console.log('\nSuggestion Types:');
      suggestionTypes.forEach((count, type) => {
        console.log(`  ${type}: ${count}`);
      });
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n--- Recommendations ---');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

function generateMarkdownReport(report: ImportOptimizationReport): string {
  let markdown = `# Import Path Optimization Report\n\n`;
  markdown += `**Generated:** ${report.timestamp.toISOString()}\n`;
  markdown += `**Files Analyzed:** ${report.totalFiles}\n`;
  markdown += `**Total Imports:** ${report.totalImports}\n\n`;

  // Metrics
  markdown += `## Metrics\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Consistency Score | ${report.metrics.consistencyScore}% |\n`;
  markdown += `| Circular Dependencies | ${report.metrics.circularDependencyCount} |\n`;
  markdown += `| Average Imports per File | ${report.metrics.averageImportsPerFile} |\n`;
  markdown += `| Deep Imports | ${report.metrics.deepImportCount} |\n`;
  markdown += `| Relative Imports | ${report.metrics.relativeImportCount} |\n\n`;

  // Add other sections...

  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
  }

  return markdown;
}

function generateHtmlReport(report: ImportOptimizationReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Import Path Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { font-size: 18px; margin: 10px 0; }
        .section { margin: 20px 0; }
        .error { color: #F44336; }
        .warning { color: #FF9800; }
        .info { color: #2196F3; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Import Path Optimization Report</h1>
    <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
    <p><strong>Files Analyzed:</strong> ${report.totalFiles}</p>
    <p><strong>Total Imports:</strong> ${report.totalImports}</p>

    <!-- Add HTML content for each section -->

</body>
</html>
  `;
}

if (require.main === module) {
  program.parse();
}

export { program };

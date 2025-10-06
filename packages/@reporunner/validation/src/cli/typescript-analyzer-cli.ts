#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { TypeScriptAnalyzer } from '../typescript/analyzer';
import { TypeScriptAnalysisReport } from '../typescript/types';

const program = new Command();

program
  .name('typescript-analyzer')
  .description('Analyze TypeScript setup and performance in the consolidated package architecture')
  .version('1.0.0');

program
  .command('analyze')
  .description('Run comprehensive TypeScript analysis')
  .option('-o, --output <file>', 'Output file for analysis report (JSON format)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--autocomplete-only', 'Run only autocomplete tests')
  .option('--type-resolution-only', 'Run only type resolution validation')
  .option('--compilation-only', 'Run only compilation analysis')
  .action(async (options) => {
    try {
      const workspaceRoot = findWorkspaceRoot();
      console.log(`Analyzing TypeScript setup in: ${workspaceRoot}`);

      const analyzer = new TypeScriptAnalyzer(workspaceRoot);

      let report: TypeScriptAnalysisReport;

      if (options.autocompleteOnly) {
        console.log('Running autocomplete tests only...');
        const autocompleteResults = await analyzer['autocompleteTester'].runAutocompleteTests();
        report = {
          timestamp: new Date(),
          autocompleteResults,
          typeResolutionResults: [],
          compilationMetrics: [],
          overallScore: 0,
          recommendations: []
        };
      } else if (options.typeResolutionOnly) {
        console.log('Running type resolution validation only...');
        const typeResolutionResults = await analyzer['typeResolutionValidator'].validateTypeResolution();
        report = {
          timestamp: new Date(),
          autocompleteResults: [],
          typeResolutionResults,
          compilationMetrics: [],
          overallScore: 0,
          recommendations: []
        };
      } else if (options.compilationOnly) {
        console.log('Running compilation analysis only...');
        const compilationMetrics = await analyzer['compilationAnalyzer'].analyzeCompilation();
        report = {
          timestamp: new Date(),
          autocompleteResults: [],
          typeResolutionResults: [],
          compilationMetrics,
          overallScore: 0,
          recommendations: []
        };
      } else {
        report = await analyzer.analyzeTypeScriptSetup();
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
      const hasErrors = report.compilationMetrics.some(m => m.errors.length > 0);
      const hasFailedTests = report.autocompleteResults.some(r => !r.passed) ||
                            report.typeResolutionResults.some(r => !r.resolved);

      if (hasErrors || hasFailedTests) {
        process.exit(1);
      }

    } catch (error) {
      console.error('Error running TypeScript analysis:', error);
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

function displayResults(report: TypeScriptAnalysisReport, verbose: boolean = false): void {
  console.log('\n=== TypeScript Analysis Report ===');
  console.log(`Generated: ${report.timestamp.toISOString()}`);
  console.log(`Overall Score: ${report.overallScore}/100`);

  // Autocomplete Results
  if (report.autocompleteResults.length > 0) {
    console.log('\n--- Autocomplete Tests ---');
    const passed = report.autocompleteResults.filter(r => r.passed).length;
    const total = report.autocompleteResults.length;
    console.log(`Passed: ${passed}/${total} (${Math.round((passed/total) * 100)}%)`);

    if (verbose) {
      report.autocompleteResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${result.packageName}: ${result.accuracy.toFixed(1)}% accuracy (${result.responseTime}ms)`);
        if (!result.passed) {
          console.log(`    Expected: ${result.expectedSuggestions.join(', ')}`);
          console.log(`    Got: ${result.actualSuggestions.slice(0, 5).join(', ')}${result.actualSuggestions.length > 5 ? '...' : ''}`);
        }
      });
    }
  }

  // Type Resolution Results
  if (report.typeResolutionResults.length > 0) {
    console.log('\n--- Type Resolution ---');
    const resolved = report.typeResolutionResults.filter(r => r.resolved).length;
    const total = report.typeResolutionResults.length;
    console.log(`Resolved: ${resolved}/${total} (${Math.round((resolved/total) * 100)}%)`);

    if (verbose) {
      report.typeResolutionResults.forEach(result => {
        const status = result.resolved ? '✅' : '❌';
        console.log(`  ${status} ${result.packageName}.${result.typeDefinition} (${result.resolutionTime}ms)`);
        if (!result.resolved && result.errorMessage) {
          console.log(`    Error: ${result.errorMessage}`);
        }
      });
    }
  }

  // Compilation Metrics
  if (report.compilationMetrics.length > 0) {
    console.log('\n--- Compilation Analysis ---');
    const totalErrors = report.compilationMetrics.reduce((sum, m) => sum + m.errors.length, 0);
    const totalWarnings = report.compilationMetrics.reduce((sum, m) => sum + m.warnings.length, 0);
    const avgCompilationTime = report.compilationMetrics.reduce((sum, m) => sum + m.compilationTime, 0) / report.compilationMetrics.length;

    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    console.log(`Average Compilation Time: ${Math.round(avgCompilationTime)}ms`);

    if (verbose) {
      report.compilationMetrics.forEach(metrics => {
        console.log(`  📦 ${metrics.packageName}:`);
        console.log(`    Files: ${metrics.totalFiles}`);
        console.log(`    Time: ${metrics.compilationTime}ms`);
        console.log(`    Memory: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
        console.log(`    Errors: ${metrics.errors.length}`);
        console.log(`    Warnings: ${metrics.warnings.length}`);
        if (metrics.incrementalBuildTime) {
          console.log(`    Incremental: ${metrics.incrementalBuildTime}ms`);
        }

        if (metrics.errors.length > 0) {
          metrics.errors.slice(0, 3).forEach(error => {
            console.log(`      ❌ ${error.file}:${error.line}:${error.column} - ${error.message}`);
          });
          if (metrics.errors.length > 3) {
            console.log(`      ... and ${metrics.errors.length - 3} more errors`);
          }
        }
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

function generateMarkdownReport(report: TypeScriptAnalysisReport): string {
  let markdown = `# TypeScript Analysis Report\n\n`;
  markdown += `**Generated:** ${report.timestamp.toISOString()}\n`;
  markdown += `**Overall Score:** ${report.overallScore}/100\n\n`;

  // Add sections for each analysis type
  if (report.autocompleteResults.length > 0) {
    markdown += `## Autocomplete Tests\n\n`;
    const passed = report.autocompleteResults.filter(r => r.passed).length;
    const total = report.autocompleteResults.length;
    markdown += `**Results:** ${passed}/${total} passed (${Math.round((passed/total) * 100)}%)\n\n`;

    markdown += `| Package | Accuracy | Response Time | Status |\n`;
    markdown += `|---------|----------|---------------|--------|\n`;

    report.autocompleteResults.forEach(result => {
      const status = result.passed ? '✅ Pass' : '❌ Fail';
      markdown += `| ${result.packageName} | ${result.accuracy.toFixed(1)}% | ${result.responseTime}ms | ${status} |\n`;
    });
    markdown += '\n';
  }

  // Add other sections...

  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
  }

  return markdown;
}

function generateHtmlReport(report: TypeScriptAnalysisReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>TypeScript Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .score { font-size: 24px; font-weight: bold; color: #2196F3; }
        .section { margin: 20px 0; }
        .passed { color: #4CAF50; }
        .failed { color: #F44336; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>TypeScript Analysis Report</h1>
    <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
    <p class="score">Overall Score: ${report.overallScore}/100</p>

    <!-- Add HTML content for each section -->

</body>
</html>
  `;
}

if (require.main === module) {
  program.parse();
}

export { program };

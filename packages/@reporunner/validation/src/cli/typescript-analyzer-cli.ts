#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { TypeScriptAnalyzer } from '../typescript/analyzer';
import type { TypeScriptAnalysisReport } from '../typescript/types';

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

      const analyzer = new TypeScriptAnalyzer(workspaceRoot);

      let report: TypeScriptAnalysisReport;

      if (options.autocompleteOnly) {
        const autocompleteResults = await analyzer.autocompleteTester.runAutocompleteTests();
        report = {
          timestamp: new Date(),
          autocompleteResults,
          typeResolutionResults: [],
          compilationMetrics: [],
          overallScore: 0,
          recommendations: [],
        };
      } else if (options.typeResolutionOnly) {
        const typeResolutionResults =
          await analyzer.typeResolutionValidator.validateTypeResolution();
        report = {
          timestamp: new Date(),
          autocompleteResults: [],
          typeResolutionResults,
          compilationMetrics: [],
          overallScore: 0,
          recommendations: [],
        };
      } else if (options.compilationOnly) {
        const compilationMetrics = await analyzer.compilationAnalyzer.analyzeCompilation();
        report = {
          timestamp: new Date(),
          autocompleteResults: [],
          typeResolutionResults: [],
          compilationMetrics,
          overallScore: 0,
          recommendations: [],
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
      }

      // Exit with appropriate code
      const hasErrors = report.compilationMetrics.some((m) => m.errors.length > 0);
      const hasFailedTests =
        report.autocompleteResults.some((r) => !r.passed) ||
        report.typeResolutionResults.some((r) => !r.resolved);

      if (hasErrors || hasFailedTests) {
        process.exit(1);
      }
    } catch (_error) {
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
      } else {
      }
    } catch (_error) {
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

  throw new Error(
    'Could not find workspace root (looking for package.json and pnpm-workspace.yaml)'
  );
}

function displayResults(report: TypeScriptAnalysisReport, verbose: boolean = false): void {
  // Autocomplete Results
  if (report.autocompleteResults.length > 0) {
    const _passed = report.autocompleteResults.filter((r) => r.passed).length;
    const _total = report.autocompleteResults.length;

    if (verbose) {
      report.autocompleteResults.forEach((result) => {
        const _status = result.passed ? '✅' : '❌';
        if (!result.passed) {
        }
      });
    }
  }

  // Type Resolution Results
  if (report.typeResolutionResults.length > 0) {
    const _resolved = report.typeResolutionResults.filter((r) => r.resolved).length;
    const _total = report.typeResolutionResults.length;

    if (verbose) {
      report.typeResolutionResults.forEach((result) => {
        const _status = result.resolved ? '✅' : '❌';
        if (!result.resolved && result.errorMessage) {
        }
      });
    }
  }

  // Compilation Metrics
  if (report.compilationMetrics.length > 0) {
    const _totalErrors = report.compilationMetrics.reduce((sum, m) => sum + m.errors.length, 0);
    const _totalWarnings = report.compilationMetrics.reduce((sum, m) => sum + m.warnings.length, 0);
    const _avgCompilationTime =
      report.compilationMetrics.reduce((sum, m) => sum + m.compilationTime, 0) /
      report.compilationMetrics.length;

    if (verbose) {
      report.compilationMetrics.forEach((metrics) => {
        if (metrics.incrementalBuildTime) {
        }

        if (metrics.errors.length > 0) {
          metrics.errors.slice(0, 3).forEach((_error) => {});
          if (metrics.errors.length > 3) {
          }
        }
      });
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    report.recommendations.forEach((_rec, _index) => {});
  }
}

function generateMarkdownReport(report: TypeScriptAnalysisReport): string {
  let markdown = `# TypeScript Analysis Report\n\n`;
  markdown += `**Generated:** ${report.timestamp.toISOString()}\n`;
  markdown += `**Overall Score:** ${report.overallScore}/100\n\n`;

  // Add sections for each analysis type
  if (report.autocompleteResults.length > 0) {
    markdown += `## Autocomplete Tests\n\n`;
    const passed = report.autocompleteResults.filter((r) => r.passed).length;
    const total = report.autocompleteResults.length;
    markdown += `**Results:** ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)\n\n`;

    markdown += `| Package | Accuracy | Response Time | Status |\n`;
    markdown += `|---------|----------|---------------|--------|\n`;

    report.autocompleteResults.forEach((result) => {
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

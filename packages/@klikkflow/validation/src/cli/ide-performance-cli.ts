#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { IDEPerformanceValidator } from '../ide-performance/ide-performance-validator';
import type { IDEPerformanceReport } from '../ide-performance/types';

const program = new Command();

program
  .name('ide-performance')
  .description(
    'Validate IDE performance and developer experience in the consolidated package architecture'
  )
  .version('1.0.0');

program
  .command('validate')
  .description('Run comprehensive IDE performance validation')
  .option('-o, --output <file>', 'Output file for validation report (JSON format)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--navigation-only', 'Run only navigation tests')
  .option('--intellisense-only', 'Run only IntelliSense tests')
  .option('--sourcemap-only', 'Run only source mapping validation')
  .action(async (options) => {
    try {
      const workspaceRoot = findWorkspaceRoot();

      const validator = new IDEPerformanceValidator(workspaceRoot);

      let report: IDEPerformanceReport;

      if (options.navigationOnly) {
        const navigationResults = await validator.navigationTester.runNavigationTests();
        report = {
          timestamp: new Date(),
          navigationResults,
          intelliSenseResults: [],
          sourceMappingResults: [],
          overallScore: 0,
          recommendations: [],
          performanceMetrics: {
            averageNavigationTime: 0,
            averageIntelliSenseTime: 0,
            navigationSuccessRate: 0,
            intelliSenseAccuracy: 0,
            sourceMappingReliability: 0,
          },
        };
      } else if (options.intellisenseOnly) {
        const intelliSenseResults = await validator.intelliSenseTester.runIntelliSenseTests();
        report = {
          timestamp: new Date(),
          navigationResults: [],
          intelliSenseResults,
          sourceMappingResults: [],
          overallScore: 0,
          recommendations: [],
          performanceMetrics: {
            averageNavigationTime: 0,
            averageIntelliSenseTime: 0,
            navigationSuccessRate: 0,
            intelliSenseAccuracy: 0,
            sourceMappingReliability: 0,
          },
        };
      } else if (options.sourcemapOnly) {
        const sourceMappingResults = await validator.sourceMappingValidator.validateSourceMapping();
        report = {
          timestamp: new Date(),
          navigationResults: [],
          intelliSenseResults: [],
          sourceMappingResults,
          overallScore: 0,
          recommendations: [],
          performanceMetrics: {
            averageNavigationTime: 0,
            averageIntelliSenseTime: 0,
            navigationSuccessRate: 0,
            intelliSenseAccuracy: 0,
            sourceMappingReliability: 0,
          },
        };
      } else {
        report = await validator.validateIDEPerformance();
      }

      // Display results
      displayResults(report, options.verbose);

      // Save to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      }

      // Exit with appropriate code
      const hasIssues =
        report.overallScore < 70 ||
        report.navigationResults.some((r) => !r.successful) ||
        report.intelliSenseResults.some((r) => !r.successful) ||
        report.sourceMappingResults.some((r) => r.debuggingExperience === 'broken');

      if (hasIssues) {
        process.exit(1);
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a formatted report from validation results')
  .argument('<input>', 'Input JSON file with validation results')
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

function displayResults(report: IDEPerformanceReport, verbose: boolean = false): void {
  // Navigation Results
  if (report.navigationResults.length > 0) {
    const _successful = report.navigationResults.filter((r) => r.successful).length;
    const _total = report.navigationResults.length;

    if (verbose) {
      report.navigationResults.forEach((result) => {
        const _status = result.successful ? '✅' : '❌';
        if (!result.successful && result.errorMessage) {
        }
      });
    }
  }

  // IntelliSense Results
  if (report.intelliSenseResults.length > 0) {
    const _successful = report.intelliSenseResults.filter((r) => r.successful).length;
    const _total = report.intelliSenseResults.length;

    if (verbose) {
      report.intelliSenseResults.forEach((result) => {
        const _status = result.successful ? '✅' : '❌';
        if (verbose && result.actualFeatures.length > 0) {
        }
      });
    }
  }

  // Source Mapping Results
  if (report.sourceMappingResults.length > 0) {
    const _reliable = report.sourceMappingResults.filter((r) => r.sourceMappingAccurate).length;
    const _total = report.sourceMappingResults.length;

    if (verbose) {
      report.sourceMappingResults.forEach((result) => {
        const _status = result.sourceMappingAccurate ? '✅' : '❌';
        const _experience = result.debuggingExperience;
        if (result.issues.length > 0) {
          result.issues.forEach((_issue) => {});
        }
      });
    }
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    report.recommendations.forEach((_rec, _index) => {});
  }
}

function generateMarkdownReport(report: IDEPerformanceReport): string {
  let markdown = `# IDE Performance Validation Report\n\n`;
  markdown += `**Generated:** ${report.timestamp.toISOString()}\n`;
  markdown += `**Overall Score:** ${report.overallScore}/100\n\n`;

  // Performance Metrics
  markdown += `## Performance Metrics\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Navigation Success Rate | ${Math.round(report.performanceMetrics.navigationSuccessRate * 100)}% |\n`;
  markdown += `| Average Navigation Time | ${Math.round(report.performanceMetrics.averageNavigationTime)}ms |\n`;
  markdown += `| IntelliSense Accuracy | ${Math.round(report.performanceMetrics.intelliSenseAccuracy)}% |\n`;
  markdown += `| Average IntelliSense Time | ${Math.round(report.performanceMetrics.averageIntelliSenseTime)}ms |\n`;
  markdown += `| Source Mapping Reliability | ${Math.round(report.performanceMetrics.sourceMappingReliability * 100)}% |\n\n`;

  // Add detailed sections for each test type...

  if (report.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
  }

  return markdown;
}

function generateHtmlReport(report: IDEPerformanceReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>IDE Performance Validation Report</title>
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
    <h1>IDE Performance Validation Report</h1>
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

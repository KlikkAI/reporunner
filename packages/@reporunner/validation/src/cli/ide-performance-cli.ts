#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { IDEPerformanceValidator } from '../ide-performance/ide-performance-validator';
import { IDEPerformanceReport } from '../ide-performance/types';

const program = new Command();

program
  .name('ide-performance')
  .description('Validate IDE performance and developer experience in the consolidated package architecture')
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
      console.log(`Validating IDE performance in: ${workspaceRoot}`);

      const validator = new IDEPerformanceValidator(workspaceRoot);

      let report: IDEPerformanceReport;

      if (options.navigationOnly) {
        console.log('Running navigation tests only...');
        const navigationResults = await validator['navigationTester'].runNavigationTests();
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
            sourceMappingReliability: 0
          }
        };
      } else if (options.intellisenseOnly) {
        console.log('Running IntelliSense tests only...');
        const intelliSenseResults = await validator['intelliSenseTester'].runIntelliSenseTests();
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
            sourceMappingReliability: 0
          }
        };
      } else if (options.sourcemapOnly) {
        console.log('Running source mapping validation only...');
        const sourceMappingResults = await validator['sourceMappingValidator'].validateSourceMapping();
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
            sourceMappingReliability: 0
          }
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
        console.log(`\nValidation report saved to: ${outputPath}`);
      }

      // Exit with appropriate code
      const hasIssues = report.overallScore < 70 ||
                       report.navigationResults.some(r => !r.successful) ||
                       report.intelliSenseResults.some(r => !r.successful) ||
                       report.sourceMappingResults.some(r => r.debuggingExperience === 'broken');

      if (hasIssues) {
        process.exit(1);
      }

    } catch (error) {
      console.error('Error running IDE performance validation:', error);
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

function displayResults(report: IDEPerformanceReport, verbose: boolean = false): void {
  console.log('\n=== IDE Performance Validation Report ===');
  console.log(`Generated: ${report.timestamp.toISOString()}`);
  console.log(`Overall Score: ${report.overallScore}/100`);

  // Performance Metrics Summary
  console.log('\n--- Performance Metrics ---');
  console.log(`Navigation Success Rate: ${Math.round(report.performanceMetrics.navigationSuccessRate * 100)}%`);
  console.log(`Average Navigation Time: ${Math.round(report.performanceMetrics.averageNavigationTime)}ms`);
  console.log(`IntelliSense Accuracy: ${Math.round(report.performanceMetrics.intelliSenseAccuracy)}%`);
  console.log(`Average IntelliSense Time: ${Math.round(report.performanceMetrics.averageIntelliSenseTime)}ms`);
  console.log(`Source Mapping Reliability: ${Math.round(report.performanceMetrics.sourceMappingReliability * 100)}%`);

  // Navigation Results
  if (report.navigationResults.length > 0) {
    console.log('\n--- Navigation Tests ---');
    const successful = report.navigationResults.filter(r => r.successful).length;
    const total = report.navigationResults.length;
    console.log(`Passed: ${successful}/${total} (${Math.round((successful/total) * 100)}%)`);

    if (verbose) {
      report.navigationResults.forEach(result => {
        const status = result.successful ? '✅' : '❌';
        console.log(`  ${status} ${result.testName}: ${result.navigationTime}ms`);
        if (!result.successful && result.errorMessage) {
          console.log(`    Error: ${result.errorMessage}`);
        }
      });
    }
  }

  // IntelliSense Results
  if (report.intelliSenseResults.length > 0) {
    console.log('\n--- IntelliSense Tests ---');
    const successful = report.intelliSenseResults.filter(r => r.successful).length;
    const total = report.intelliSenseResults.length;
    console.log(`Passed: ${successful}/${total} (${Math.round((successful/total) * 100)}%)`);

    if (verbose) {
      report.intelliSenseResults.forEach(result => {
        const status = result.successful ? '✅' : '❌';
        console.log(`  ${status} ${result.testName}: ${result.accuracy.toFixed(1)}% accuracy (${result.responseTime}ms)`);
        if (verbose && result.actualFeatures.length > 0) {
          console.log(`    Features: ${result.actualFeatures.join(', ')}`);
        }
      });
    }
  }

  // Source Mapping Results
  if (report.sourceMappingResults.length > 0) {
    console.log('\n--- Source Mapping Validation ---');
    const reliable = report.sourceMappingResults.filter(r => r.sourceMappingAccurate).length;
    const total = report.sourceMappingResults.length;
    console.log(`Reliable: ${reliable}/${total} (${Math.round((reliable/total) * 100)}%)`);

    if (verbose) {
      report.sourceMappingResults.forEach(result => {
        const status = result.sourceMappingAccurate ? '✅' : '❌';
        const experience = result.debuggingExperience;
        console.log(`  ${status} ${result.testName}: ${experience} debugging experience`);
        if (result.issues.length > 0) {
          result.issues.forEach(issue => {
            console.log(`    Issue: ${issue}`);
          });
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

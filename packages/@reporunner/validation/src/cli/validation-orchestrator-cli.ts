#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ValidationController } from '../controller/ValidationController.js';
import type { ValidationResults, ValidationSummary } from '../types/index.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * CLI interface for validation orchestration
 * Requirements: 5.1, 5.2, 5.4
 */
export class ValidationOrchestratorCLI {
  private controller: ValidationController;
  private spinner: ora.Ora;
  private outputDir: string;
  private verbose: boolean = false;

  constructor(workspaceRoot: string = process.cwd(), outputDir?: string) {
    this.controller = new ValidationController(workspaceRoot);
    this.spinner = ora();
    this.outputDir = outputDir || join(workspaceRoot, 'validation-results');
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for progress reporting
   */
  private setupEventListeners(): void {
    this.controller.on('validation:started', () => {
      this.spinner.start(chalk.blue('Starting Phase A validation...'));
    });

    this.controller.on('phase:started', (phase: string) => {
      this.spinner.text = chalk.blue(`Executing ${this.formatPhaseName(phase)}...`);
    });

    this.controller.on('component:started', (component: string) => {
      if (this.verbose) {
        this.spinner.text = chalk.cyan(`  Running ${this.formatComponentName(component)}...`);
      }
    });

    this.controller.on('component:completed', (component: string) => {
      if (this.verbose) {
        console.log(chalk.green(`  ✓ ${this.formatComponentName(component)} completed`));
      }
    });

    this.controller.on('component:failed', (component: string, error: any) => {
      console.log(chalk.yellow(`  ⚠ ${this.formatComponentName(component)} failed: ${error.message}`));
    });

    this.controller.on('phase:completed', (phase: string) => {
      console.log(chalk.green(`✓ ${this.formatPhaseName(phase)} completed`));
    });

    this.controller.on('phase:failed', (phase: string, error: any) => {
      console.log(chalk.red(`✗ ${this.formatPhaseName(phase)} failed: ${error.message}`));
    });

    this.controller.on('validation:completed', (results: ValidationResults) => {
      this.spinner.succeed(chalk.green('Phase A validation completed!'));
      this.displayResults(results);
    });

    this.controller.on('validation:failed', (error: any) => {
      this.spinner.fail(chalk.red(`Validation failed: ${error.message}`));
    });
  }

  /**
   * Execute full validation workflow
   */
  async executeValidation(options: {
    output?: string;
    format?: 'json' | 'html' | 'markdown';
    verbose?: boolean;
    phases?: string[];
  } = {}): Promise<ValidationResults> {
    this.verbose = options.verbose || false;

    if (options.output) {
      this.outputDir = options.output;
    }

    try {
      const results = await this.controller.executeValidation();

      // Export results in requested format
      await this.exportResults(results, options.format || 'json');

      return results;
    } catch (error) {
      console.error(chalk.red('Validation execution failed:'), error);
      process.exit(1);
    }
  }

  /**
   * Execute specific validation phases
   */
  async executePhases(phases: string[], options: {
    output?: string;
    format?: 'json' | 'html' | 'markdown';
    verbose?: boolean;
  } = {}): Promise<void> {
    console.log(chalk.blue(`Executing phases: ${phases.join(', ')}`));

    // For now, we execute the full validation
    // In a more advanced implementation, we could support partial execution
    await this.executeValidation(options);
  }

  /**
   * Get current validation status
   */
  getStatus(): void {
    const status = this.controller.getValidationStatus();

    console.log(chalk.blue('\n=== Validation Status ==='));
    console.log(`Running: ${status.isRunning ? chalk.green('Yes') : chalk.gray('No')}`);

    if (status.startTime) {
      console.log(`Started: ${chalk.cyan(status.startTime.toISOString())}`);
    }

    if (status.currentPhase) {
      console.log(`Current Phase: ${chalk.yellow(this.formatPhaseName(status.currentPhase))}`);
    }

    if (status.errors.length > 0) {
      console.log(`\nErrors (${status.errors.length}):`);
      status.errors.forEach((error, index) => {
        const severityColor = error.severity === 'critical' ? chalk.red :
                             error.severity === 'warning' ? chalk.yellow : chalk.gray;
        console.log(`  ${index + 1}. ${severityColor(error.severity.toUpperCase())}: ${error.message}`);
      });
    }
  }

  /**
   * Display validation results summary
   */
  private displayResults(results: ValidationResults): void {
    console.log(chalk.blue('\n=== Validation Results Summary ==='));

    const statusColor = results.status === 'success' ? chalk.green :
                       results.status === 'warning' ? chalk.yellow : chalk.red;
    console.log(`Overall Status: ${statusColor(results.status.toUpperCase())}`);

    // System Validation Summary
    console.log(chalk.blue('\nSystem Validation:'));
    console.log(`  Tests: ${results.systemValidation.testResults.passedTests}/${results.systemValidation.testResults.totalTests} passed`);
    console.log(`  Coverage: ${results.systemValidation.testResults.coverage.overall.toFixed(1)}%`);
    console.log(`  API Endpoints: ${results.systemValidation.apiValidation.validatedEndpoints}/${results.systemValidation.apiValidation.totalEndpoints} validated`);
    console.log(`  E2E Workflows: ${results.systemValidation.e2eResults.passedWorkflows}/${results.systemValidation.e2eResults.totalWorkflows} passed`);

    // Performance Analysis Summary
    console.log(chalk.blue('\nPerformance Analysis:'));
    console.log(`  Build Time Improvement: ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%`);
    console.log(`  Bundle Size Reduction: ${results.performanceAnalysis.bundleMetrics.reductionPercentage.toFixed(1)}%`);
    console.log(`  Memory Usage: ${(results.performanceAnalysis.memoryProfile.development.heapUsed / 1024 / 1024).toFixed(1)}MB`);

    // Architecture Validation Summary
    console.log(chalk.blue('\nArchitecture Validation:'));
    console.log(`  Dependency Health: ${results.architectureValidation.dependencyAnalysis.healthScore}/100`);
    console.log(`  Code Organization: ${results.architectureValidation.codeOrganization.overallScore}/100`);
    console.log(`  Type Safety: ${results.architectureValidation.typeSafety.overallScore}/100`);

    // Recommendations
    if (results.recommendations.length > 0) {
      console.log(chalk.blue(`\nRecommendations (${results.recommendations.length}):`));
      results.recommendations.slice(0, 5).forEach((rec, index) => {
        const priorityColor = rec.priority === 'critical' ? chalk.red :
                             rec.priority === 'high' ? chalk.yellow :
                             rec.priority === 'medium' ? chalk.blue : chalk.gray;
        console.log(`  ${index + 1}. ${priorityColor(rec.priority.toUpperCase())}: ${rec.title}`);
      });

      if (results.recommendations.length > 5) {
        console.log(`  ... and ${results.recommendations.length - 5} more`);
      }
    }

    // Next Steps
    if (results.nextSteps.length > 0) {
      console.log(chalk.blue('\nNext Steps:'));
      results.nextSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
    }

    console.log(chalk.gray(`\nResults exported to: ${this.outputDir}`));
  }

  /**
   * Export validation results in specified format
   */
  private async exportResults(results: ValidationResults, format: 'json' | 'html' | 'markdown'): Promise<void> {
    try {
      mkdirSync(this.outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      switch (format) {
        case 'json':
          await this.exportJSON(results, timestamp);
          break;
        case 'html':
          await this.exportHTML(results, timestamp);
          break;
        case 'markdown':
          await this.exportMarkdown(results, timestamp);
          break;
      }
    } catch (error) {
      console.error(chalk.red('Failed to export results:'), error);
    }
  }

  /**
   * Export results as JSON
   */
  private async exportJSON(results: ValidationResults, timestamp: string): Promise<void> {
    const filename = join(this.outputDir, `validation-results-${timestamp}.json`);
    writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(chalk.green(`JSON results exported to: ${filename}`));
  }

  /**
   * Export results as HTML
   */
  private async exportHTML(results: ValidationResults, timestamp: string): Promise<void> {
    const filename = join(this.outputDir, `validation-report-${timestamp}.html`);
    const html = this.generateHTMLReport(results);
    writeFileSync(filename, html);
    console.log(chalk.green(`HTML report exported to: ${filename}`));
  }

  /**
   * Export results as Markdown
   */
  private async exportMarkdown(results: ValidationResults, timestamp: string): Promise<void> {
    const filename = join(this.outputDir, `validation-report-${timestamp}.md`);
    const markdown = this.generateMarkdownReport(results);
    writeFileSync(filename, markdown);
    console.log(chalk.green(`Markdown report exported to: ${filename}`));
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(results: ValidationResults): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Phase A Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .status-success { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-failure { color: #dc3545; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 3px; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .priority-critical { border-left-color: #dc3545; }
        .priority-high { border-left-color: #ffc107; }
        .priority-medium { border-left-color: #007bff; }
        .priority-low { border-left-color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Phase A Validation Report</h1>
        <p>Generated: ${results.timestamp.toISOString()}</p>
        <p class="status-${results.status}">Status: ${results.status.toUpperCase()}</p>
    </div>

    <div class="section">
        <h2>System Validation</h2>
        <div class="metric">Tests: ${results.systemValidation.testResults.passedTests}/${results.systemValidation.testResults.totalTests}</div>
        <div class="metric">Coverage: ${results.systemValidation.testResults.coverage.overall.toFixed(1)}%</div>
        <div class="metric">API Endpoints: ${results.systemValidation.apiValidation.validatedEndpoints}/${results.systemValidation.apiValidation.totalEndpoints}</div>
    </div>

    <div class="section">
        <h2>Performance Analysis</h2>
        <div class="metric">Build Time Improvement: ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%</div>
        <div class="metric">Bundle Size Reduction: ${results.performanceAnalysis.bundleMetrics.reductionPercentage.toFixed(1)}%</div>
    </div>

    <div class="section">
        <h2>Architecture Validation</h2>
        <div class="metric">Dependency Health: ${results.architectureValidation.dependencyAnalysis.healthScore}/100</div>
        <div class="metric">Code Organization: ${results.architectureValidation.codeOrganization.overallScore}/100</div>
        <div class="metric">Type Safety: ${results.architectureValidation.typeSafety.overallScore}/100</div>
    </div>

    ${results.recommendations.length > 0 ? `
    <div class="section">
        <h2>Recommendations</h2>
        ${results.recommendations.map(rec => `
        <div class="recommendation priority-${rec.priority}">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
            <p><strong>Impact:</strong> ${rec.impact}</p>
            <p><strong>Effort:</strong> ${rec.effort}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `.trim();
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(results: ValidationResults): string {
    return `
# Phase A Validation Report

**Generated:** ${results.timestamp.toISOString()}
**Status:** ${results.status.toUpperCase()}

## System Validation

- **Tests:** ${results.systemValidation.testResults.passedTests}/${results.systemValidation.testResults.totalTests} passed
- **Coverage:** ${results.systemValidation.testResults.coverage.overall.toFixed(1)}%
- **API Endpoints:** ${results.systemValidation.apiValidation.validatedEndpoints}/${results.systemValidation.apiValidation.totalEndpoints} validated
- **E2E Workflows:** ${results.systemValidation.e2eResults.passedWorkflows}/${results.systemValidation.e2eResults.totalWorkflows} passed

## Performance Analysis

- **Build Time Improvement:** ${results.performanceAnalysis.buildMetrics.improvementPercentage.toFixed(1)}%
- **Bundle Size Reduction:** ${results.performanceAnalysis.bundleMetrics.reductionPercentage.toFixed(1)}%
- **Memory Usage:** ${(results.performanceAnalysis.memoryProfile.development.heapUsed / 1024 / 1024).toFixed(1)}MB

## Architecture Validation

- **Dependency Health:** ${results.architectureValidation.dependencyAnalysis.healthScore}/100
- **Code Organization:** ${results.architectureValidation.codeOrganization.overallScore}/100
- **Type Safety:** ${results.architectureValidation.typeSafety.overallScore}/100

${results.recommendations.length > 0 ? `
## Recommendations

${results.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.title} (${rec.priority.toUpperCase()})

${rec.description}

**Impact:** ${rec.impact}
**Effort:** ${rec.effort}

**Steps:**
${rec.steps.map(step => `- ${step}`).join('\n')}

**Affected Packages:** ${rec.affectedPackages.join(', ')}
`).join('\n')}
` : ''}

${results.nextSteps.length > 0 ? `
## Next Steps

${results.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
` : ''}
    `.trim();
  }

  /**
   * Format phase name for display
   */
  private formatPhaseName(phase: string): string {
    return phase.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Format component name for display
   */
  private formatComponentName(component: string): string {
    return component.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

// CLI Program Setup
const program = new Command();

program
  .name('validation-orchestrator')
  .description('Phase A Validation Orchestrator')
  .version('1.0.0');

program
  .command('run')
  .description('Execute full validation workflow')
  .option('-o, --output <dir>', 'Output directory for results')
  .option('-f, --format <format>', 'Output format (json|html|markdown)', 'json')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const cli = new ValidationOrchestratorCLI();
    await cli.executeValidation(options);
  });

program
  .command('phases <phases...>')
  .description('Execute specific validation phases')
  .option('-o, --output <dir>', 'Output directory for results')
  .option('-f, --format <format>', 'Output format (json|html|markdown)', 'json')
  .option('-v, --verbose', 'Verbose output')
  .action(async (phases, options) => {
    const cli = new ValidationOrchestratorCLI();
    await cli.executePhases(phases, options);
  });

program
  .command('status')
  .description('Get current validation status')
  .action(() => {
    const cli = new ValidationOrchestratorCLI();
    cli.getStatus();
  });

// Export for programmatic use is already done above in the class definition

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

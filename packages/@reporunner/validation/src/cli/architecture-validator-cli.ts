#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import { Command } from 'commander';
import { CodeOrganizationChecker } from '../architecture/code-organization-checker';
import { DependencyAnalyzer } from '../architecture/dependency-analyzer';
import { TypeSafetyValidator } from '../architecture/type-safety-validator';
import type {
  ArchitectureValidationOptions,
  ArchitectureValidationResult,
} from '../architecture/types';

const program = new Command();

program
  .name('architecture-validator')
  .description('Validate architecture components: dependencies, code organization, and type safety')
  .version('1.0.0');

program
  .command('validate')
  .description('Run complete architecture validation')
  .option('--dependencies', 'Include dependency analysis')
  .option('--organization', 'Include code organization validation')
  .option('--types', 'Include type safety validation')
  .option('--output <format>', 'Output format (json|html|markdown)', 'json')
  .option('--output-file <path>', 'Output file path')
  .option('--generate-visualization', 'Generate dependency graph visualization')
  .action(async (options) => {
    try {
      const validationOptions: ArchitectureValidationOptions = {
        includeCircularDependencies: true,
        includeBoundaryValidation: true,
        includeDependencyGraph: true,
        includeCodeOrganization: true,
        includeTypeSafety: true,
        outputFormat: options.output as 'json' | 'html' | 'markdown',
        generateVisualization: options.generateVisualization,
      };
      const result = await runArchitectureValidation(validationOptions);

      await outputResults(result, options.outputFile, validationOptions.outputFormat);

      if (result.overallScore >= 80) {
        process.exit(0);
      } else if (result.overallScore >= 60) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('dependencies')
  .description('Analyze package dependencies and circular dependencies')
  .option('--output <format>', 'Output format (json|html|markdown)', 'json')
  .option('--output-file <path>', 'Output file path')
  .option('--generate-graph', 'Generate dependency graph visualization')
  .action(async (options) => {
    try {
      const analyzer = new DependencyAnalyzer();
      await analyzer.initialize();

      const circularDeps = await analyzer.checkCircularDependencies();
      const boundaries = await analyzer.validatePackageBoundaries();
      const graph = await analyzer.generateDependencyGraph();

      const result = {
        timestamp: new Date(),
        dependencyAnalysis: {
          circularDependencies: circularDeps,
          packageBoundaries: boundaries,
          dependencyGraph: graph,
        },
      };

      await outputResults(result, options.outputFile, options.output);

      if (options.generateGraph && graph.visualization) {
        const graphPath = 'dependency-graph.dot';
        await fs.writeFile(graphPath, graph.visualization);
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('organization')
  .description('Validate code organization and structure')
  .option('--output <format>', 'Output format (json|html|markdown)', 'json')
  .option('--output-file <path>', 'Output file path')
  .action(async (options) => {
    try {
      const checker = new CodeOrganizationChecker();
      await checker.initialize();

      const result = await checker.validateCodeOrganization();

      await outputResults(result, options.outputFile, options.output);
    } catch (_error) {
      process.exit(1);
    }
  });

program
  .command('types')
  .description('Validate type safety across packages')
  .option('--output <format>', 'Output format (json|html|markdown)', 'json')
  .option('--output-file <path>', 'Output file path')
  .action(async (options) => {
    try {
      const validator = new TypeSafetyValidator();
      await validator.initialize();

      const result = await validator.validateTypeSafety();

      await outputResults(result, options.outputFile, options.output);
    } catch (_error) {
      process.exit(1);
    }
  });

async function runArchitectureValidation(
  options: ArchitectureValidationOptions
): Promise<ArchitectureValidationResult> {
  const result: ArchitectureValidationResult = {
    timestamp: new Date(),
    overallScore: 0,
    criticalIssues: 0,
    recommendations: [],
  };

  // Dependency Analysis
  if (
    options.includeCircularDependencies ||
    options.includeBoundaryValidation ||
    options.includeDependencyGraph
  ) {
    const analyzer = new DependencyAnalyzer();
    await analyzer.initialize();

    result.dependencyAnalysis = {
      circularDependencies: await analyzer.checkCircularDependencies(options),
      packageBoundaries: await analyzer.validatePackageBoundaries(),
      dependencyGraph: await analyzer.generateDependencyGraph(),
    };

    // Count critical issues
    result.criticalIssues +=
      result.dependencyAnalysis.circularDependencies.circularDependencies.filter(
        (cd) => cd.impact === 'high' || cd.type === 'package'
      ).length;
    result.criticalIssues += result.dependencyAnalysis.packageBoundaries.violations.filter(
      (v) => v.severity === 'error'
    ).length;
  }

  // Code Organization
  if (options.includeCodeOrganization) {
    const checker = new CodeOrganizationChecker();
    await checker.initialize();

    result.codeOrganization = await checker.validateCodeOrganization(options);

    // Count critical issues
    result.criticalIssues += result.codeOrganization.separationOfConcerns.violations.filter(
      (v) => v.severity === 'high'
    ).length;
  }

  // Type Safety
  if (options.includeTypeSafety) {
    const validator = new TypeSafetyValidator();
    await validator.initialize();

    result.typeSafety = await validator.validateTypeSafety(options);

    // Count critical issues
    result.criticalIssues += result.typeSafety.crossPackageConsistency.inconsistencies.filter(
      (i) => i.severity === 'error'
    ).length;
    result.criticalIssues += result.typeSafety.interfaceCompatibility.incompatibilities.filter(
      (i) => i.severity === 'error'
    ).length;
  }

  // Calculate overall score
  const scores: number[] = [];

  if (result.dependencyAnalysis) {
    const depScore =
      (result.dependencyAnalysis.packageBoundaries.complianceScore +
        (result.dependencyAnalysis.circularDependencies.hasCircularDependencies ? 50 : 100)) /
      2;
    scores.push(depScore);
  }

  if (result.codeOrganization) {
    scores.push(result.codeOrganization.overallScore);
  }

  if (result.typeSafety) {
    scores.push(result.typeSafety.overallScore);
  }

  result.overallScore =
    scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 100;

  // Generate recommendations
  result.recommendations = generateOverallRecommendations(result);

  return result;
}

function generateOverallRecommendations(result: ArchitectureValidationResult): string[] {
  const recommendations: string[] = [];

  if (result.overallScore >= 90) {
    recommendations.push('✅ Excellent architecture! Your codebase follows best practices.');
  } else if (result.overallScore >= 70) {
    recommendations.push('✅ Good architecture with some areas for improvement.');
  } else {
    recommendations.push('⚠️ Architecture needs attention. Consider refactoring efforts.');
  }

  // Priority recommendations based on critical issues
  if (result.criticalIssues > 0) {
    recommendations.push(
      `🚨 ${result.criticalIssues} critical issues found that should be addressed immediately:`,
      '• Review circular dependencies and package boundaries',
      '• Fix type inconsistencies across packages',
      '• Address separation of concerns violations'
    );
  }

  // Specific recommendations from each component
  if (result.dependencyAnalysis) {
    recommendations.push(...result.dependencyAnalysis.circularDependencies.recommendations);
    recommendations.push(...result.dependencyAnalysis.packageBoundaries.recommendations);
  }

  if (result.codeOrganization) {
    recommendations.push(...result.codeOrganization.recommendations);
  }

  if (result.typeSafety) {
    recommendations.push(...result.typeSafety.recommendations);
  }

  return recommendations;
}

async function outputResults(
  result: any,
  outputFile?: string,
  format: string = 'json'
): Promise<void> {
  let output: string;

  switch (format) {
    case 'html':
      output = generateHtmlReport(result);
      break;
    case 'markdown':
      output = generateMarkdownReport(result);
      break;
    default:
      output = JSON.stringify(result, null, 2);
  }

  if (outputFile) {
    await fs.writeFile(outputFile, output);
  } else {
  }
}

function generateHtmlReport(result: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Architecture Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; color: #2196F3; }
        .critical { color: #f44336; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #2196F3; }
        .recommendations { background: #e8f5e9; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Architecture Validation Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <div class="score">Overall Score: ${result.overallScore?.toFixed(1) || 'N/A'}/100</div>
        <div class="critical">Critical Issues: ${result.criticalIssues || 0}</div>
    </div>

    <div class="section">
        <h2>Results</h2>
        <pre>${JSON.stringify(result, null, 2)}</pre>
    </div>

    ${
      result.recommendations
        ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${result.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    `
        : ''
    }
</body>
</html>
  `;
}

function generateMarkdownReport(result: any): string {
  const timestamp = new Date().toISOString();
  const score = result.overallScore?.toFixed(1) || 'N/A';
  const criticalIssues = result.criticalIssues || 0;

  let markdown = `# Architecture Validation Report

**Generated:** ${timestamp}
**Overall Score:** ${score}/100
**Critical Issues:** ${criticalIssues}

## Summary

`;

  if (result.dependencyAnalysis) {
    markdown += `### Dependency Analysis
- **Circular Dependencies:** ${result.dependencyAnalysis.circularDependencies?.circularDependencies?.length || 0}
- **Boundary Violations:** ${result.dependencyAnalysis.packageBoundaries?.violationCount || 0}
- **Compliance Score:** ${result.dependencyAnalysis.packageBoundaries?.complianceScore?.toFixed(1) || 'N/A'}%

`;
  }

  if (result.codeOrganization) {
    markdown += `### Code Organization
- **Overall Score:** ${result.codeOrganization.overallScore?.toFixed(1) || 'N/A'}/100
- **Separation Score:** ${result.codeOrganization.separationOfConcerns?.score?.toFixed(1) || 'N/A'}/100
- **Duplication:** ${result.codeOrganization.codeDuplication?.duplicationPercentage?.toFixed(1) || 'N/A'}%
- **Naming Compliance:** ${result.codeOrganization.namingConventions?.complianceScore?.toFixed(1) || 'N/A'}%

`;
  }

  if (result.typeSafety) {
    markdown += `### Type Safety
- **Overall Score:** ${result.typeSafety.overallScore?.toFixed(1) || 'N/A'}/100
- **Type Consistency:** ${result.typeSafety.crossPackageConsistency?.consistencyScore?.toFixed(1) || 'N/A'}%
- **Interface Compatibility:** ${result.typeSafety.interfaceCompatibility?.compatibilityScore?.toFixed(1) || 'N/A'}%
- **Export Structure:** ${result.typeSafety.exportStructure?.structureScore?.toFixed(1) || 'N/A'}%

`;
  }

  if (result.recommendations && result.recommendations.length > 0) {
    markdown += `## Recommendations

${result.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

`;
  }

  markdown += `## Detailed Results

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
`;

  return markdown;
}

if (require.main === module) {
  program.parse();
}

export { program };

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { DocumentationUpdate, ValidationReport, ValidationResults } from '../types/index.js';

/**
 * Documentation template configuration
 */
export interface DocumentationTemplate {
  name: string;
  description: string;
  filePath: string;
  template: string;
  variables: string[];
  category: 'architecture' | 'setup' | 'troubleshooting' | 'best-practices' | 'performance';
}

/**
 * Documentation section
 */
export interface DocumentationSection {
  title: string;
  content: string;
  order: number;
  category: string;
}

/**
 * Generated documentation result
 */
export interface GeneratedDocumentation {
  filePath: string;
  content: string;
  template: string;
  generatedAt: Date;
  variables: Record<string, any>;
}

/**
 * Documentation generation and update system
 * Requirements: 5.3, 5.4, 5.5
 */
export class DocumentationGenerator {
  private outputDirectory: string;
  private templatesDirectory: string;
  private templates: Map<string, DocumentationTemplate> = new Map();

  constructor(
    outputDirectory = './docs',
    templatesDirectory = './validation-reports/doc-templates'
  ) {
    this.outputDirectory = outputDirectory;
    this.templatesDirectory = templatesDirectory;
    this.ensureDirectories();
    this.initializeDefaultTemplates();
  }

  /**
   * Generate architecture documentation from validation results
   * Requirements: 5.3, 5.4, 5.5
   */
  async generateArchitectureDocumentation(
    results: ValidationResults
  ): Promise<GeneratedDocumentation[]> {
    try {
      const docs: GeneratedDocumentation[] = [];

      // Package structure documentation
      const packageStructureDoc = await this.generateFromTemplate(
        'package-structure',
        this.extractArchitectureVariables(results)
      );
      docs.push(packageStructureDoc);

      // Dependency graph documentation
      const dependencyGraphDoc = await this.generateFromTemplate(
        'dependency-graph',
        this.extractDependencyVariables(results)
      );
      docs.push(dependencyGraphDoc);

      // Architecture health documentation
      const architectureHealthDoc = await this.generateFromTemplate(
        'architecture-health',
        this.extractHealthVariables(results)
      );
      docs.push(architectureHealthDoc);

      return docs;
    } catch (error) {
      throw new Error(
        `Failed to generate architecture documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate setup and troubleshooting guides
   * Requirements: 5.3, 5.4, 5.5
   */
  async generateSetupGuides(results: ValidationResults): Promise<GeneratedDocumentation[]> {
    try {
      const docs: GeneratedDocumentation[] = [];

      // Development setup guide
      const setupGuideDoc = await this.generateFromTemplate(
        'development-setup',
        this.extractSetupVariables(results)
      );
      docs.push(setupGuideDoc);

      // Troubleshooting guide
      const troubleshootingDoc = await this.generateFromTemplate(
        'troubleshooting-guide',
        this.extractTroubleshootingVariables(results)
      );
      docs.push(troubleshootingDoc);

      // Build optimization guide
      const buildOptimizationDoc = await this.generateFromTemplate(
        'build-optimization',
        this.extractBuildOptimizationVariables(results)
      );
      docs.push(buildOptimizationDoc);

      return docs;
    } catch (error) {
      throw new Error(
        `Failed to generate setup guides: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate best practices documentation
   * Requirements: 5.3, 5.4, 5.5
   */
  async generateBestPracticesDocumentation(
    results: ValidationResults
  ): Promise<GeneratedDocumentation[]> {
    try {
      const docs: GeneratedDocumentation[] = [];

      // Development best practices
      const devBestPracticesDoc = await this.generateFromTemplate(
        'development-best-practices',
        this.extractBestPracticesVariables(results)
      );
      docs.push(devBestPracticesDoc);

      // Performance optimization best practices
      const perfBestPracticesDoc = await this.generateFromTemplate(
        'performance-best-practices',
        this.extractPerformanceBestPracticesVariables(results)
      );
      docs.push(perfBestPracticesDoc);

      // Testing best practices
      const testingBestPracticesDoc = await this.generateFromTemplate(
        'testing-best-practices',
        this.extractTestingBestPracticesVariables(results)
      );
      docs.push(testingBestPracticesDoc);

      return docs;
    } catch (error) {
      throw new Error(
        `Failed to generate best practices documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update existing documentation based on validation results
   * Requirements: 5.3, 5.4, 5.5
   */
  async updateDocumentation(updates: DocumentationUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        const filePath = join(this.outputDirectory, update.file);

        switch (update.type) {
          case 'create':
            await this.createDocumentationFile(filePath, update.content || '');
            break;
          case 'update':
            await this.updateDocumentationFile(filePath, update.content || '');
            break;
          case 'delete':
            await this.deleteDocumentationFile(filePath);
            break;
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to update documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate comprehensive documentation from validation report
   * Requirements: 5.3, 5.4, 5.5
   */
  async generateComprehensiveDocumentation(
    report: ValidationReport
  ): Promise<GeneratedDocumentation[]> {
    try {
      const allDocs: GeneratedDocumentation[] = [];

      // Generate architecture documentation
      const archDocs = await this.generateArchitectureDocumentation(report.detailedResults);
      allDocs.push(...archDocs);

      // Generate setup guides
      const setupDocs = await this.generateSetupGuides(report.detailedResults);
      allDocs.push(...setupDocs);

      // Generate best practices documentation
      const bestPracticesDocs = await this.generateBestPracticesDocumentation(
        report.detailedResults
      );
      allDocs.push(...bestPracticesDocs);

      // Generate validation report documentation
      const reportDoc = await this.generateValidationReportDoc(report);
      allDocs.push(reportDoc);

      // Update existing documentation
      await this.updateDocumentation(report.documentation);

      return allDocs;
    } catch (error) {
      throw new Error(
        `Failed to generate comprehensive documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create custom documentation template
   */
  async createTemplate(template: DocumentationTemplate): Promise<void> {
    try {
      this.templates.set(template.name, template);

      const templatePath = join(this.templatesDirectory, `${template.name}.md`);
      writeFileSync(templatePath, template.template);
    } catch (error) {
      throw new Error(
        `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate documentation from template
   */
  private async generateFromTemplate(
    templateName: string,
    variables: Record<string, any>
  ): Promise<GeneratedDocumentation> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let content = template.template;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = this.formatValue(value);
      content = content.replace(new RegExp(placeholder, 'g'), replacement);
    }

    // Write to file
    const filePath = join(this.outputDirectory, template.filePath);
    await this.createDocumentationFile(filePath, content);

    return {
      filePath,
      content,
      template: templateName,
      generatedAt: new Date(),
      variables,
    };
  }

  /**
   * Extract architecture variables from validation results
   */
  private extractArchitectureVariables(results: ValidationResults): Record<string, any> {
    const depAnalysis = results.architectureValidation?.dependencyAnalysis;

    return {
      timestamp: results.timestamp.toISOString(),
      status: results.status.toUpperCase(),
      totalPackages: depAnalysis?.dependencyGraph?.metrics?.totalNodes || 0,
      totalDependencies: depAnalysis?.dependencyGraph?.metrics?.totalEdges || 0,
      maxDepth: depAnalysis?.dependencyGraph?.metrics?.maxDepth || 0,
      healthScore: depAnalysis?.healthScore || 0,
      circularDependencies: depAnalysis?.circularDependencies?.length || 0,
      boundaryViolations: depAnalysis?.packageBoundaryViolations?.length || 0,
      packageList:
        depAnalysis?.dependencyGraph?.nodes?.map((node) => ({
          name: node.packageName,
          type: node.type,
          size: `${Math.round(node.size / 1024)}KB`,
        })) || [],
      dependencyList:
        depAnalysis?.dependencyGraph?.edges?.map((edge) => ({
          from: edge.from,
          to: edge.to,
          type: edge.type,
        })) || [],
    };
  }

  /**
   * Extract dependency variables from validation results
   */
  private extractDependencyVariables(results: ValidationResults): Record<string, any> {
    const depAnalysis = results.architectureValidation?.dependencyAnalysis;

    return {
      timestamp: results.timestamp.toISOString(),
      circularDeps:
        depAnalysis?.circularDependencies?.map((dep) => ({
          packages: dep.packages.join(' → '),
          severity: dep.severity,
          suggestion: dep.suggestion,
        })) || [],
      boundaryViolations:
        depAnalysis?.packageBoundaryViolations?.map((violation) => ({
          from: violation.fromPackage,
          to: violation.toPackage,
          type: violation.violationType,
          suggestion: violation.suggestion,
        })) || [],
      dependencyGraph: this.generateDependencyGraphVisualization(depAnalysis?.dependencyGraph),
    };
  }

  /**
   * Extract health variables from validation results
   */
  private extractHealthVariables(results: ValidationResults): Record<string, any> {
    const depAnalysis = results.architectureValidation?.dependencyAnalysis;
    const codeOrg = results.architectureValidation?.codeOrganization;
    const typeSafety = results.architectureValidation?.typeSafety;

    return {
      timestamp: results.timestamp.toISOString(),
      overallHealthScore: depAnalysis?.healthScore || 0,
      separationScore: codeOrg?.separationOfConcerns?.score || 0,
      duplicationPercentage: codeOrg?.codeDuplication?.overallPercentage || 0,
      namingScore: codeOrg?.namingConsistency?.consistencyScore || 0,
      typeConsistencyScore: typeSafety?.crossPackageTypeConsistency || 0,
      interfaceCompatibilityScore: typeSafety?.interfaceCompatibility?.compatibleInterfaces || 0,
      healthStatus: this.getHealthStatus(depAnalysis?.healthScore || 0),
      recommendations: results.recommendations.filter((r) => r.category === 'architecture'),
    };
  }

  /**
   * Extract setup variables from validation results
   */
  private extractSetupVariables(results: ValidationResults): Record<string, any> {
    const buildMetrics = results.performanceAnalysis?.buildMetrics;
    const devMetrics = results.performanceAnalysis?.devExperienceMetrics;

    return {
      timestamp: results.timestamp.toISOString(),
      buildTime: Math.round((buildMetrics?.totalBuildTime || 0) / 1000),
      cacheHitRate: buildMetrics?.cacheHitRate || 0,
      parallelEfficiency: buildMetrics?.parallelEfficiency || 0,
      typeScriptCompilationTime: Math.round(
        (devMetrics?.typeScriptPerformance?.compilationTime || 0) / 1000
      ),
      autocompleteSpeed: devMetrics?.typeScriptPerformance?.autocompleteSpeed || 0,
      testCoverage: results.systemValidation?.testResults?.coverage?.overall || 0,
      packageCount:
        results.architectureValidation?.dependencyAnalysis?.dependencyGraph?.metrics?.totalNodes ||
        0,
      setupSteps: this.generateSetupSteps(results),
      prerequisites: this.generatePrerequisites(results),
    };
  }

  /**
   * Extract troubleshooting variables from validation results
   */
  private extractTroubleshootingVariables(results: ValidationResults): Record<string, any> {
    const criticalIssues = results.recommendations.filter((r) => r.priority === 'critical');
    const highIssues = results.recommendations.filter((r) => r.priority === 'high');
    const commonIssues = [...criticalIssues, ...highIssues];

    return {
      timestamp: results.timestamp.toISOString(),
      criticalIssuesCount: criticalIssues.length,
      highIssuesCount: highIssues.length,
      commonIssues: commonIssues.map((issue) => ({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        steps: issue.steps,
        affectedPackages: issue.affectedPackages,
      })),
      buildIssues: this.extractBuildIssues(results),
      testIssues: this.extractTestIssues(results),
      performanceIssues: this.extractPerformanceIssues(results),
    };
  }

  /**
   * Extract build optimization variables
   */
  private extractBuildOptimizationVariables(results: ValidationResults): Record<string, any> {
    const buildMetrics = results.performanceAnalysis?.buildMetrics;
    const bundleMetrics = results.performanceAnalysis?.bundleMetrics;

    return {
      timestamp: results.timestamp.toISOString(),
      currentBuildTime: Math.round((buildMetrics?.totalBuildTime || 0) / 1000),
      improvementPercentage: buildMetrics?.improvementPercentage || 0,
      cacheHitRate: buildMetrics?.cacheHitRate || 0,
      parallelEfficiency: buildMetrics?.parallelEfficiency || 0,
      bundleSize: Math.round((bundleMetrics?.totalSize || 0) / 1024 / 1024),
      bundleReduction: bundleMetrics?.reductionPercentage || 0,
      bottlenecks:
        buildMetrics?.bottlenecks?.map((b) => ({
          package: b.packageName,
          time: Math.round(b.buildTime / 1000),
          suggestions: b.suggestions,
        })) || [],
      optimizationTips: this.generateOptimizationTips(results),
    };
  }

  /**
   * Extract best practices variables
   */
  private extractBestPracticesVariables(results: ValidationResults): Record<string, any> {
    const devMetrics = results.performanceAnalysis?.devExperienceMetrics;
    const codeOrg = results.architectureValidation?.codeOrganization;

    return {
      timestamp: results.timestamp.toISOString(),
      importPathOptimizations: devMetrics?.importPathMetrics?.optimizationOpportunities || [],
      codeDuplicationPercentage: codeOrg?.codeDuplication?.overallPercentage || 0,
      namingViolations: codeOrg?.namingConsistency?.violations?.length || 0,
      separationViolations: codeOrg?.separationOfConcerns?.violations?.length || 0,
      bestPractices: this.generateBestPractices(results),
      codeExamples: this.generateCodeExamples(results),
    };
  }

  /**
   * Extract performance best practices variables
   */
  private extractPerformanceBestPracticesVariables(
    results: ValidationResults
  ): Record<string, any> {
    const buildMetrics = results.performanceAnalysis?.buildMetrics;
    const bundleMetrics = results.performanceAnalysis?.bundleMetrics;
    const memoryProfile = results.performanceAnalysis?.memoryProfile;

    return {
      timestamp: results.timestamp.toISOString(),
      buildOptimizations: this.generateBuildOptimizations(buildMetrics),
      bundleOptimizations: this.generateBundleOptimizations(bundleMetrics),
      memoryOptimizations: this.generateMemoryOptimizations(memoryProfile),
      performanceTips: this.generatePerformanceTips(results),
    };
  }

  /**
   * Extract testing best practices variables
   */
  private extractTestingBestPracticesVariables(results: ValidationResults): Record<string, any> {
    const testResults = results.systemValidation?.testResults;

    return {
      timestamp: results.timestamp.toISOString(),
      currentCoverage: testResults?.coverage?.overall || 0,
      packageCoverage: Object.entries(testResults?.coverage?.packageCoverage || {}).map(
        ([pkg, coverage]) => ({
          package: pkg,
          coverage,
        })
      ),
      testingGuidelines: this.generateTestingGuidelines(results),
      coverageImprovements: this.generateCoverageImprovements(results),
    };
  }

  /**
   * Generate validation report documentation
   */
  private async generateValidationReportDoc(
    report: ValidationReport
  ): Promise<GeneratedDocumentation> {
    const template = `# Phase A Validation Report

## Executive Summary

**Overall Status**: {{status}}
**Validation Date**: {{timestamp}}
**Completed Validations**: {{completedValidations}}/{{totalValidations}}
**Critical Issues**: {{criticalIssues}}

### Performance Improvements
- **Build Time**: {{buildTimeImprovement}}% improvement
- **Bundle Size**: {{bundleSizeReduction}}% reduction

## Key Metrics

{{#each metrics}}
### {{title}}
- **Current Value**: {{value}}{{unit}}
- **Status**: {{status}}
{{#if trend}}
- **Trend**: {{trend}} ({{trendValue}}%)
{{/if}}

{{/each}}

## Recommendations Summary

### Critical Priority ({{criticalCount}})
{{#each criticalRecommendations}}
- **{{title}}**: {{description}}
{{/each}}

### High Priority ({{highCount}})
{{#each highRecommendations}}
- **{{title}}**: {{description}}
{{/each}}

## Next Steps

{{#each nextSteps}}
{{@index}}. {{this}}
{{/each}}

---
*Generated automatically by Phase A Validation Framework*
`;

    const variables = {
      status: report.summary.overallStatus.toUpperCase(),
      timestamp: report.detailedResults.timestamp.toISOString(),
      completedValidations: report.summary.completedValidations,
      totalValidations: report.summary.totalValidations,
      criticalIssues: report.summary.criticalIssues,
      buildTimeImprovement: report.summary.performanceImprovements.buildTime.toFixed(1),
      bundleSizeReduction: report.summary.performanceImprovements.bundleSize.toFixed(1),
      metrics: report.performanceDashboard.metrics,
      criticalCount: report.recommendations.critical.length,
      highCount: report.recommendations.high.length,
      criticalRecommendations: report.recommendations.critical,
      highRecommendations: report.recommendations.high,
      nextSteps: report.summary.nextSteps,
    };

    let content = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), this.formatValue(value));
    }

    const filePath = join(this.outputDirectory, 'validation-report.md');
    await this.createDocumentationFile(filePath, content);

    return {
      filePath,
      content,
      template: 'validation-report',
      generatedAt: new Date(),
      variables,
    };
  }

  /**
   * Initialize default documentation templates
   */
  private initializeDefaultTemplates(): void {
    // Package structure template
    this.templates.set('package-structure', {
      name: 'package-structure',
      description: 'Package architecture and structure documentation',
      filePath: 'architecture/package-structure.md',
      template: `# Package Structure

## Overview
Last updated: {{timestamp}}
Overall status: {{status}}

## Architecture Metrics
- **Total Packages**: {{totalPackages}}
- **Dependencies**: {{totalDependencies}}
- **Max Dependency Depth**: {{maxDepth}}
- **Health Score**: {{healthScore}}/100

## Package Inventory

{{#each packageList}}
### {{name}} ({{type}})
- **Size**: {{size}}
{{/each}}

## Dependency Relationships

{{#each dependencyList}}
- {{from}} → {{to}} ({{type}})
{{/each}}

## Issues
- **Circular Dependencies**: {{circularDependencies}}
- **Boundary Violations**: {{boundaryViolations}}
`,
      variables: [
        'timestamp',
        'status',
        'totalPackages',
        'totalDependencies',
        'maxDepth',
        'healthScore',
        'packageList',
        'dependencyList',
        'circularDependencies',
        'boundaryViolations',
      ],
      category: 'architecture',
    });

    // Development setup template
    this.templates.set('development-setup', {
      name: 'development-setup',
      description: 'Development environment setup guide',
      filePath: 'setup/development-setup.md',
      template: `# Development Setup Guide

## Prerequisites

{{#each prerequisites}}
- {{this}}
{{/each}}

## Setup Steps

{{#each setupSteps}}
{{@index}}. {{this}}
{{/each}}

## Performance Expectations

After setup, you should expect:
- **Build Time**: ~{{buildTime}} seconds
- **Cache Hit Rate**: {{cacheHitRate}}%
- **Test Coverage**: {{testCoverage}}%
- **TypeScript Compilation**: ~{{typeScriptCompilationTime}} seconds

## Verification

Run the following commands to verify your setup:

\`\`\`bash
pnpm run build
pnpm run test
pnpm run type-check
\`\`\`

Last updated: {{timestamp}}
`,
      variables: [
        'prerequisites',
        'setupSteps',
        'buildTime',
        'cacheHitRate',
        'testCoverage',
        'typeScriptCompilationTime',
        'timestamp',
      ],
      category: 'setup',
    });

    // Add more default templates...
    this.addDefaultTemplates();
  }

  /**
   * Add additional default templates
   */
  private addDefaultTemplates(): void {
    // Dependency graph template
    this.templates.set('dependency-graph', {
      name: 'dependency-graph',
      description: 'Dependency graph and relationships documentation',
      filePath: 'architecture/dependency-graph.md',
      template: `# Dependency Graph

## Overview
Last updated: {{timestamp}}

## Circular Dependencies

{{#each circularDeps}}
### {{packages}} ({{severity}})
**Suggestion**: {{suggestion}}
{{/each}}

## Boundary Violations

{{#each boundaryViolations}}
### {{from}} → {{to}}
**Type**: {{type}}
**Suggestion**: {{suggestion}}
{{/each}}

## Dependency Visualization

{{dependencyGraph}}
`,
      variables: ['timestamp', 'circularDeps', 'boundaryViolations', 'dependencyGraph'],
      category: 'architecture',
    });

    // Architecture health template
    this.templates.set('architecture-health', {
      name: 'architecture-health',
      description: 'Architecture health metrics and status',
      filePath: 'architecture/health-report.md',
      template: `# Architecture Health Report

## Overall Health Score: {{overallHealthScore}}/100
**Status**: {{healthStatus}}

## Component Scores
- **Separation of Concerns**: {{separationScore}}/100
- **Code Duplication**: {{duplicationPercentage}}%
- **Naming Consistency**: {{namingScore}}/100
- **Type Consistency**: {{typeConsistencyScore}}/100

## Recommendations

{{#each recommendations}}
### {{title}} ({{priority}})
{{description}}

**Steps**:
{{#each steps}}
{{@index}}. {{this}}
{{/each}}
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'overallHealthScore',
        'healthStatus',
        'separationScore',
        'duplicationPercentage',
        'namingScore',
        'typeConsistencyScore',
        'recommendations',
        'timestamp',
      ],
      category: 'architecture',
    });

    // Build optimization template
    this.templates.set('build-optimization', {
      name: 'build-optimization',
      description: 'Build optimization guide and recommendations',
      filePath: 'optimization/build-optimization.md',
      template: `# Build Optimization Guide

## Current Performance
- **Build Time**: {{currentBuildTime}} seconds
- **Improvement**: {{improvementPercentage}}%
- **Cache Hit Rate**: {{cacheHitRate}}%
- **Parallel Efficiency**: {{parallelEfficiency}}%

## Bundle Analysis
- **Total Size**: {{bundleSize}}MB
- **Size Reduction**: {{bundleReduction}}%

## Bottlenecks

{{#each bottlenecks}}
### {{package}} ({{time}}s)
{{#each suggestions}}
- {{this}}
{{/each}}
{{/each}}

## Optimization Tips

{{#each optimizationTips}}
- {{this}}
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'currentBuildTime',
        'improvementPercentage',
        'cacheHitRate',
        'parallelEfficiency',
        'bundleSize',
        'bundleReduction',
        'bottlenecks',
        'optimizationTips',
        'timestamp',
      ],
      category: 'performance',
    });

    // Performance best practices template
    this.templates.set('performance-best-practices', {
      name: 'performance-best-practices',
      description: 'Performance optimization best practices',
      filePath: 'best-practices/performance.md',
      template: `# Performance Best Practices

## Build Optimizations

{{#each buildOptimizations}}
- {{this}}
{{/each}}

## Bundle Optimizations

{{#each bundleOptimizations}}
- {{this}}
{{/each}}

## Memory Optimizations

{{#each memoryOptimizations}}
- {{this}}
{{/each}}

## Performance Tips

{{#each performanceTips}}
- {{this}}
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'buildOptimizations',
        'bundleOptimizations',
        'memoryOptimizations',
        'performanceTips',
        'timestamp',
      ],
      category: 'best-practices',
    });

    // Testing best practices template
    this.templates.set('testing-best-practices', {
      name: 'testing-best-practices',
      description: 'Testing best practices and guidelines',
      filePath: 'best-practices/testing.md',
      template: `# Testing Best Practices

## Current Coverage: {{currentCoverage}}%

## Package Coverage

{{#each packageCoverage}}
- **{{package}}**: {{coverage}}%
{{/each}}

## Testing Guidelines

{{#each testingGuidelines}}
- {{this}}
{{/each}}

## Coverage Improvements

{{#each coverageImprovements}}
- {{this}}
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'currentCoverage',
        'packageCoverage',
        'testingGuidelines',
        'coverageImprovements',
        'timestamp',
      ],
      category: 'best-practices',
    });

    // Troubleshooting guide template
    this.templates.set('troubleshooting-guide', {
      name: 'troubleshooting-guide',
      description: 'Common issues and troubleshooting guide',
      filePath: 'troubleshooting/common-issues.md',
      template: `# Troubleshooting Guide

## Critical Issues ({{criticalIssuesCount}})

{{#each commonIssues}}
### {{title}}
**Category**: {{category}}
**Description**: {{description}}

**Solution Steps**:
{{#each steps}}
{{@index}}. {{this}}
{{/each}}

**Affected Packages**: {{affectedPackages}}

---
{{/each}}

## Build Issues

{{#each buildIssues}}
### {{title}}
{{description}}

**Solution**: {{solution}}
{{/each}}

## Test Issues

{{#each testIssues}}
### {{title}}
{{description}}

**Solution**: {{solution}}
{{/each}}

## Performance Issues

{{#each performanceIssues}}
### {{title}}
{{description}}

**Solution**: {{solution}}
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'criticalIssuesCount',
        'commonIssues',
        'buildIssues',
        'testIssues',
        'performanceIssues',
        'timestamp',
      ],
      category: 'troubleshooting',
    });

    // Best practices template
    this.templates.set('development-best-practices', {
      name: 'development-best-practices',
      description: 'Development best practices and guidelines',
      filePath: 'best-practices/development.md',
      template: `# Development Best Practices

## Code Organization

Current metrics:
- **Code Duplication**: {{codeDuplicationPercentage}}%
- **Naming Violations**: {{namingViolations}}
- **Separation Violations**: {{separationViolations}}

## Best Practices

{{#each bestPractices}}
### {{title}}
{{description}}

**Example**:
\`\`\`{{language}}
{{example}}
\`\`\`
{{/each}}

## Import Path Optimizations

{{#each importPathOptimizations}}
- {{this}}
{{/each}}

## Code Examples

{{#each codeExamples}}
### {{title}}
\`\`\`{{language}}
{{code}}
\`\`\`
{{/each}}

Last updated: {{timestamp}}
`,
      variables: [
        'codeDuplicationPercentage',
        'namingViolations',
        'separationViolations',
        'bestPractices',
        'importPathOptimizations',
        'codeExamples',
        'timestamp',
      ],
      category: 'best-practices',
    });
  }

  /**
   * Helper methods for generating content
   */
  private generateDependencyGraphVisualization(graph: any): string {
    if (!graph) {
      return 'No dependency graph available';
    }

    return `\`\`\`mermaid
graph TD
${graph.nodes?.map((node: any) => `  ${node.id}[${node.packageName}]`).join('\n') || ''}
${graph.edges?.map((edge: any) => `  ${edge.from} --> ${edge.to}`).join('\n') || ''}
\`\`\``;
  }

  private getHealthStatus(score: number): string {
    if (score >= 90) {
      return 'Excellent';
    }
    if (score >= 80) {
      return 'Good';
    }
    if (score >= 70) {
      return 'Fair';
    }
    if (score >= 60) {
      return 'Poor';
    }
    return 'Critical';
  }

  private generateSetupSteps(_results: ValidationResults): string[] {
    return [
      'Clone the repository',
      'Install Node.js (version 18 or higher)',
      'Install pnpm: `npm install -g pnpm`',
      'Install dependencies: `pnpm install`',
      'Build all packages: `pnpm run build`',
      'Run tests: `pnpm run test`',
      'Start development server: `pnpm run dev`',
    ];
  }

  private generatePrerequisites(_results: ValidationResults): string[] {
    return [
      'Node.js 18+',
      'pnpm 8+',
      'Git',
      'VS Code (recommended)',
      'TypeScript extension for VS Code',
    ];
  }

  private extractBuildIssues(
    results: ValidationResults
  ): Array<{ title: string; description: string; solution: string }> {
    const issues = [];
    const buildMetrics = results.performanceAnalysis?.buildMetrics;

    if (buildMetrics && buildMetrics.totalBuildTime > 60000) {
      issues.push({
        title: 'Slow Build Times',
        description: `Build takes ${Math.round(buildMetrics.totalBuildTime / 1000)} seconds`,
        solution: 'Enable build caching and optimize dependencies',
      });
    }

    if (buildMetrics && buildMetrics.cacheHitRate < 80) {
      issues.push({
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is only ${buildMetrics.cacheHitRate}%`,
        solution: 'Review cache configuration and ensure deterministic builds',
      });
    }

    return issues;
  }

  private extractTestIssues(
    results: ValidationResults
  ): Array<{ title: string; description: string; solution: string }> {
    const issues = [];
    const testResults = results.systemValidation?.testResults;

    if (testResults && testResults.failedTests > 0) {
      issues.push({
        title: 'Failing Tests',
        description: `${testResults.failedTests} tests are currently failing`,
        solution: 'Review test failures and fix underlying issues',
      });
    }

    if (testResults && testResults.coverage.overall < 80) {
      issues.push({
        title: 'Low Test Coverage',
        description: `Test coverage is ${testResults.coverage.overall}%`,
        solution: 'Add tests for uncovered code paths',
      });
    }

    return issues;
  }

  private extractPerformanceIssues(
    results: ValidationResults
  ): Array<{ title: string; description: string; solution: string }> {
    const issues = [];
    const bundleMetrics = results.performanceAnalysis?.bundleMetrics;
    const memoryProfile = results.performanceAnalysis?.memoryProfile;

    if (bundleMetrics && bundleMetrics.totalSize > 10 * 1024 * 1024) {
      issues.push({
        title: 'Large Bundle Size',
        description: `Bundle size is ${Math.round(bundleMetrics.totalSize / 1024 / 1024)}MB`,
        solution: 'Implement code splitting and remove unused dependencies',
      });
    }

    if (memoryProfile && memoryProfile.leaks.length > 0) {
      issues.push({
        title: 'Memory Leaks',
        description: `${memoryProfile.leaks.length} memory leaks detected`,
        solution: 'Fix memory leaks in event handlers and cleanup code',
      });
    }

    return issues;
  }

  private generateOptimizationTips(_results: ValidationResults): string[] {
    return [
      'Use Turbo for build caching and parallelization',
      'Enable TypeScript incremental compilation',
      'Implement proper code splitting',
      'Optimize bundle sizes with tree shaking',
      'Use build output caching',
      'Monitor and fix memory leaks',
    ];
  }

  private generateBestPractices(
    _results: ValidationResults
  ): Array<{ title: string; description: string; language: string; example: string }> {
    return [
      {
        title: 'Consistent Import Paths',
        description: 'Use TypeScript path mapping for cleaner imports',
        language: 'typescript',
        example: `// Good
import { UserService } from '@/services/UserService';

// Avoid
import { UserService } from '../../../services/UserService';`,
      },
      {
        title: 'Proper Error Handling',
        description: 'Always handle errors appropriately',
        language: 'typescript',
        example: `try {
  const result = await apiCall();
  return result;
} catch (error) {
  logger.error('API call failed:', error);
  throw new ServiceError('Failed to fetch data');
}`,
      },
    ];
  }

  private generateCodeExamples(
    _results: ValidationResults
  ): Array<{ title: string; language: string; code: string }> {
    return [
      {
        title: 'Package Export Pattern',
        language: 'typescript',
        code: `// src/index.ts
export { UserService } from './services/UserService';
export { ApiClient } from './clients/ApiClient';
export type { User, UserCreateRequest } from './types';`,
      },
    ];
  }

  private generateBuildOptimizations(buildMetrics: any): string[] {
    const optimizations = [];

    if (buildMetrics?.cacheHitRate < 90) {
      optimizations.push('Improve build cache configuration');
    }

    if (buildMetrics?.parallelEfficiency < 80) {
      optimizations.push('Optimize parallel build execution');
    }

    return optimizations;
  }

  private generateBundleOptimizations(bundleMetrics: any): string[] {
    const optimizations = [];

    if (bundleMetrics?.totalSize > 5 * 1024 * 1024) {
      optimizations.push('Implement code splitting');
      optimizations.push('Remove unused dependencies');
    }

    return optimizations;
  }

  private generateMemoryOptimizations(memoryProfile: any): string[] {
    const optimizations = [];

    if (memoryProfile?.leaks?.length > 0) {
      optimizations.push('Fix memory leaks');
    }

    return optimizations;
  }

  private generatePerformanceTips(_results: ValidationResults): string[] {
    return [
      'Monitor bundle sizes regularly',
      'Use performance profiling tools',
      'Implement lazy loading',
      'Optimize images and assets',
      'Use CDN for static assets',
    ];
  }

  private generateTestingGuidelines(_results: ValidationResults): string[] {
    return [
      'Aim for 80%+ test coverage',
      'Write unit tests for business logic',
      'Add integration tests for APIs',
      'Use E2E tests for critical workflows',
      'Mock external dependencies',
    ];
  }

  private generateCoverageImprovements(results: ValidationResults): string[] {
    const improvements = [];
    const testResults = results.systemValidation?.testResults;

    if (testResults?.coverage.overall < 80) {
      improvements.push('Add tests for uncovered functions');
      improvements.push('Test error handling paths');
      improvements.push('Add edge case testing');
    }

    return improvements;
  }

  /**
   * Format value for template replacement
   */
  private formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
        .join('\n');
    }

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  /**
   * Create documentation file
   */
  private async createDocumentationFile(filePath: string, content: string): Promise<void> {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, content);
  }

  /**
   * Update documentation file
   */
  private async updateDocumentationFile(filePath: string, content: string): Promise<void> {
    await this.createDocumentationFile(filePath, content);
  }

  /**
   * Delete documentation file
   */
  private async deleteDocumentationFile(filePath: string): Promise<void> {
    if (existsSync(filePath)) {
      require('node:fs').unlinkSync(filePath);
    }
  }

  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.outputDirectory)) {
      mkdirSync(this.outputDirectory, { recursive: true });
    }
    if (!existsSync(this.templatesDirectory)) {
      mkdirSync(this.templatesDirectory, { recursive: true });
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): DocumentationTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Set output directory
   */
  setOutputDirectory(directory: string): void {
    this.outputDirectory = directory;
    this.ensureDirectories();
  }

  /**
   * Get output directory
   */
  getOutputDirectory(): string {
    return this.outputDirectory;
  }
}

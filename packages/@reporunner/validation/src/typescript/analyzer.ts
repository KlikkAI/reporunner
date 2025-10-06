import * as path from 'path';
import * as fs from 'fs';
import { AutocompleteTester } from './autocomplete-tester';
import { TypeResolutionValidator } from './type-resolution-validator';
import { CompilationAnalyzer } from './compilation-analyzer';
import { TypeScriptAnalysisReport, CompilationMetrics } from './types';

export class TypeScriptAnalyzer {
  private workspaceRoot: string;
  private autocompleteTester: AutocompleteTester;
  private typeResolutionValidator: TypeResolutionValidator;
  private compilationAnalyzer: CompilationAnalyzer;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.autocompleteTester = new AutocompleteTester(workspaceRoot);
    this.typeResolutionValidator = new TypeResolutionValidator(workspaceRoot);
    this.compilationAnalyzer = new CompilationAnalyzer(workspaceRoot);
  }

  async analyzeTypeScriptSetup(): Promise<TypeScriptAnalysisReport> {
    console.log('Starting TypeScript analysis...');

    const startTime = Date.now();

    // Run autocomplete tests
    console.log('Testing autocomplete functionality...');
    const autocompleteResults = await this.autocompleteTester.runAutocompleteTests();

    // Validate type resolution
    console.log('Validating type resolution...');
    const typeResolutionResults = await this.typeResolutionValidator.validateTypeResolution();

    // Analyze compilation performance
    console.log('Analyzing compilation performance...');
    const compilationMetrics = await this.compilationAnalyzer.analyzeCompilation();

    const endTime = Date.now();
    console.log(`TypeScript analysis completed in ${endTime - startTime}ms`);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      autocompleteResults,
      typeResolutionResults,
      compilationMetrics
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      autocompleteResults,
      typeResolutionResults,
      compilationMetrics
    );

    return {
      timestamp: new Date(),
      autocompleteResults,
      typeResolutionResults,
      compilationMetrics,
      overallScore,
      recommendations
    };
  }

  private calculateOverallScore(
    autocompleteResults: any[],
    typeResolutionResults: any[],
    compilationMetrics: CompilationMetrics[]
  ): number {
    // Calculate autocomplete score (0-40 points)
    const autocompleteScore = autocompleteResults.length > 0
      ? (autocompleteResults.filter(r => r.passed).length / autocompleteResults.length) * 40
      : 0;

    // Calculate type resolution score (0-30 points)
    const typeResolutionScore = typeResolutionResults.length > 0
      ? (typeResolutionResults.filter(r => r.resolved).length / typeResolutionResults.length) * 30
      : 0;

    // Calculate compilation score (0-30 points)
    const compilationScore = compilationMetrics.length > 0
      ? Math.max(0, 30 - (compilationMetrics.reduce((sum, m) => sum + m.errors.length, 0) * 5))
      : 0;

    return Math.round(autocompleteScore + typeResolutionScore + compilationScore);
  }

  private generateRecommendations(
    autocompleteResults: any[],
    typeResolutionResults: any[],
    compilationMetrics: CompilationMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    // Autocomplete recommendations
    const failedAutocomplete = autocompleteResults.filter(r => !r.passed);
    if (failedAutocomplete.length > 0) {
      recommendations.push(
        `Improve autocomplete accuracy: ${failedAutocomplete.length} tests failed. ` +
        'Consider updating TypeScript configuration or package exports.'
      );
    }

    // Type resolution recommendations
    const unresolvedTypes = typeResolutionResults.filter(r => !r.resolved);
    if (unresolvedTypes.length > 0) {
      recommendations.push(
        `Fix type resolution issues: ${unresolvedTypes.length} types failed to resolve. ` +
        'Check import paths and type definitions.'
      );
    }

    // Compilation recommendations
    const totalErrors = compilationMetrics.reduce((sum, m) => sum + m.errors.length, 0);
    if (totalErrors > 0) {
      recommendations.push(
        `Address compilation errors: ${totalErrors} errors found across packages. ` +
        'Fix type errors to improve development experience.'
      );
    }

    // Performance recommendations
    const slowCompilations = compilationMetrics.filter(m => m.compilationTime > 5000);
    if (slowCompilations.length > 0) {
      recommendations.push(
        `Optimize compilation performance: ${slowCompilations.length} packages have slow compilation times. ` +
        'Consider enabling incremental compilation or optimizing TypeScript configuration.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('TypeScript setup is performing well. Continue monitoring for regressions.');
    }

    return recommendations;
  }

  async getPackageDirectories(): Promise<string[]> {
    const packagesDir = path.join(this.workspaceRoot, 'packages');
    const packages: string[] = [];

    // Get main packages
    const mainPackages = ['backend', 'frontend', 'shared'];
    for (const pkg of mainPackages) {
      const pkgPath = path.join(packagesDir, pkg);
      if (fs.existsSync(pkgPath)) {
        packages.push(pkgPath);
      }
    }

    // Get @reporunner packages
    const reporunnerDir = path.join(packagesDir, '@reporunner');
    if (fs.existsSync(reporunnerDir)) {
      const reporunnerPackages = fs.readdirSync(reporunnerDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(reporunnerDir, dirent.name));
      packages.push(...reporunnerPackages);
    }

    return packages;
  }
}

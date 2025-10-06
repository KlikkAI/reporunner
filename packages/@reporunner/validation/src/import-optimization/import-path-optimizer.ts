import * as path from 'path';
import { CircularDependencyDetector } from './circular-dependency-detector';
import { ImportConsistencyValidator } from './import-consistency-validator';
import { PathSuggestionEngine } from './path-suggestion-engine';
import { ImportOptimizationReport } from './types';

export class ImportPathOptimizer {
  private workspaceRoot: string;
  private circularDependencyDetector: CircularDependencyDetector;
  private importConsistencyValidator: ImportConsistencyValidator;
  private pathSuggestionEngine: PathSuggestionEngine;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.circularDependencyDetector = new CircularDependencyDetector(workspaceRoot);
    this.importConsistencyValidator = new ImportConsistencyValidator(workspaceRoot);
    this.pathSuggestionEngine = new PathSuggestionEngine(workspaceRoot);
  }

  async optimizeImportPaths(): Promise<ImportOptimizationReport> {
    console.log('Starting import path optimization analysis...');

    const startTime = Date.now();

    // Detect circular dependencies
    console.log('Detecting circular dependencies...');
    const circularDependencies = await this.circularDependencyDetector.detectCircularDependencies();

    // Validate import consistency
    console.log('Validating import consistency...');
    const consistencyResults = await this.importConsistencyValidator.validateImportConsistency();

    // Generate path suggestions
    console.log('Generating path optimization suggestions...');
    const suggestions = await this.pathSuggestionEngine.generateSuggestions(consistencyResults.analyses);

    const endTime = Date.now();
    console.log(`Import path optimization completed in ${endTime - startTime}ms`);

    // Aggregate all issues
    const allIssues = consistencyResults.analyses.flatMap(analysis => analysis.issues);

    // Add circular dependency issues
    circularDependencies.forEach(cycle => {
      allIssues.push({
        type: 'circular-dependency',
        severity: cycle.severity === 'critical' ? 'error' : 'warning',
        message: `Circular dependency detected: ${cycle.cycle.join(' → ')}`,
        filePath: cycle.cycle[0],
        line: 0,
        suggestion: cycle.suggestions[0]
      });
    });

    // Calculate metrics
    const metrics = this.calculateMetrics(consistencyResults.analyses, circularDependencies);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues, circularDependencies, metrics);

    return {
      timestamp: new Date(),
      totalFiles: consistencyResults.analyses.length,
      totalImports: consistencyResults.analyses.reduce((sum, analysis) => sum + analysis.imports.length, 0),
      issues: allIssues,
      circularDependencies,
      suggestions,
      metrics,
      recommendations
    };
  }

  private calculateMetrics(analyses: any[], circularDependencies: any[]) {
    const totalFiles = analyses.length;
    const totalImports = analyses.reduce((sum, analysis) => sum + analysis.imports.length, 0);

    // Consistency score (0-100)
    const totalIssues = analyses.reduce((sum, analysis) => sum + analysis.issues.length, 0);
    const consistencyScore = totalImports > 0
      ? Math.max(0, 100 - (totalIssues / totalImports * 100))
      : 100;

    // Count different types of imports
    let deepImportCount = 0;
    let relativeImportCount = 0;

    analyses.forEach(analysis => {
      analysis.imports.forEach((imp: any) => {
        if (imp.source.includes('/src/') && imp.source.split('/').length > 3) {
          deepImportCount++;
        }
        if (imp.source.startsWith('./') || imp.source.startsWith('../')) {
          relativeImportCount++;
        }
      });
    });

    return {
      consistencyScore: Math.round(consistencyScore),
      circularDependencyCount: circularDependencies.length,
      averageImportsPerFile: totalFiles > 0 ? Math.round(totalImports / totalFiles) : 0,
      deepImportCount,
      relativeImportCount
    };
  }

  private generateRecommendations(
    issues: any[],
    circularDependencies: any[],
    metrics: any
  ): string[] {
    const recommendations: string[] = [];

    // Circular dependency recommendations
    if (circularDependencies.length > 0) {
      const criticalCycles = circularDependencies.filter(cycle => cycle.severity === 'critical');
      if (criticalCycles.length > 0) {
        recommendations.push(
          `Critical: Fix ${criticalCycles.length} circular dependencies immediately. ` +
          'These can cause runtime errors and build issues.'
        );
      }

      const warningCycles = circularDependencies.filter(cycle => cycle.severity === 'warning');
      if (warningCycles.length > 0) {
        recommendations.push(
          `Address ${warningCycles.length} potential circular dependencies. ` +
          'Consider refactoring to improve code organization.'
        );
      }
    }

    // Consistency recommendations
    if (metrics.consistencyScore < 80) {
      recommendations.push(
        `Improve import consistency: Current score is ${metrics.consistencyScore}%. ` +
        'Standardize import paths and use barrel exports where appropriate.'
      );
    }

    // Deep import recommendations
    if (metrics.deepImportCount > 0) {
      recommendations.push(
        `Reduce deep imports: Found ${metrics.deepImportCount} deep imports. ` +
        'Use barrel exports to provide cleaner import paths.'
      );
    }

    // Relative import recommendations
    if (metrics.relativeImportCount > metrics.averageImportsPerFile * 2) {
      recommendations.push(
        `Consider using absolute imports: Found ${metrics.relativeImportCount} relative imports. ` +
        'Absolute imports can be more maintainable in large codebases.'
      );
    }

    // Issue-specific recommendations
    const issueTypes = new Set(issues.map(issue => issue.type));

    if (issueTypes.has('inconsistent-path')) {
      recommendations.push(
        'Standardize import path patterns across the codebase for better maintainability.'
      );
    }

    if (issueTypes.has('missing-barrel')) {
      recommendations.push(
        'Create barrel exports (index.ts files) to simplify import paths and improve API design.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Import paths are well-organized. Continue monitoring for consistency.');
    }

    return recommendations;
  }

  async analyzePackageStructure(): Promise<any> {
    // Get all packages in the workspace
    const packages = await this.getPackageDirectories();
    const packageAnalysis: any = {};

    for (const packageDir of packages) {
      const packageName = this.getPackageName(packageDir);
      packageAnalysis[packageName] = {
        path: packageDir,
        exports: await this.analyzePackageExports(packageDir),
        imports: await this.analyzePackageImports(packageDir)
      };
    }

    return packageAnalysis;
  }

  private async getPackageDirectories(): Promise<string[]> {
    const packagesDir = path.join(this.workspaceRoot, 'packages');
    const packages: string[] = [];

    const fs = require('fs');

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
        .filter((dirent: any) => dirent.isDirectory())
        .map((dirent: any) => path.join(reporunnerDir, dirent.name));
      packages.push(...reporunnerPackages);
    }

    return packages;
  }

  private getPackageName(packageDir: string): string {
    const fs = require('fs');
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.name || path.basename(packageDir);
      } catch (error) {
        console.warn(`Could not read package.json for ${packageDir}:`, error);
      }
    }

    return path.basename(packageDir);
  }

  private async analyzePackageExports(packageDir: string): Promise<any> {
    const fs = require('fs');
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return { main: null, exports: {}, types: null };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return {
        main: packageJson.main,
        exports: packageJson.exports || {},
        types: packageJson.types,
        files: packageJson.files || []
      };
    } catch (error) {
      console.warn(`Could not analyze exports for ${packageDir}:`, error);
      return { main: null, exports: {}, types: null };
    }
  }

  private async analyzePackageImports(packageDir: string): Promise<string[]> {
    const fs = require('fs');
    const imports: string[] = [];
    const srcDir = path.join(packageDir, 'src');

    if (!fs.existsSync(srcDir)) {
      return imports;
    }

    const scanDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
            if (importMatches) {
              importMatches.forEach((match: string) => {
                const importPath = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                if (importPath && !imports.includes(importPath)) {
                  imports.push(importPath);
                }
              });
            }
          } catch (error) {
            console.warn(`Could not read file ${fullPath}:`, error);
          }
        }
      }
    };

    scanDirectory(srcDir);
    return imports;
  }
}

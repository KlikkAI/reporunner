import * as path from 'path';
import * as fs from 'fs';
import { ImportSuggestion, ImportPathAnalysis } from './types';

export class PathSuggestionEngine {
  private workspaceRoot: string;
  private packageExports: Map<string, any> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async generateSuggestions(analyses: ImportPathAnalysis[]): Promise<ImportSuggestion[]> {
    // Load package export information
    await this.loadPackageExports();

    const suggestions: ImportSuggestion[] = [];

    for (const analysis of analyses) {
      // Generate suggestions for each file's imports
      const fileSuggestions = await this.generateFileSuggestions(analysis);
      suggestions.push(...fileSuggestions);
    }

    // Generate global suggestions based on patterns
    const globalSuggestions = this.generateGlobalSuggestions(analyses);
    suggestions.push(...globalSuggestions);

    return suggestions;
  }

  private async generateFileSuggestions(analysis: ImportPathAnalysis): Promise<ImportSuggestion[]> {
    const suggestions: ImportSuggestion[] = [];
    const filePath = path.resolve(this.workspaceRoot, analysis.filePath);

    for (const importStmt of analysis.imports) {
      // Suggest optimizations for each import
      const importSuggestions = await this.analyzeImport(importStmt, filePath);
      suggestions.push(...importSuggestions);
    }

    // Suggest consolidating imports from same source
    const consolidationSuggestions = this.suggestImportConsolidation(analysis);
    suggestions.push(...consolidationSuggestions);

    return suggestions;
  }

  private async analyzeImport(importStmt: any, filePath: string): Promise<ImportSuggestion[]> {
    const suggestions: ImportSuggestion[] = [];

    // Suggest barrel exports for deep imports
    if (this.isDeepImport(importStmt.source)) {
      const barrelSuggestion = this.suggestBarrelExport(importStmt);
      if (barrelSuggestion) {
        suggestions.push(barrelSuggestion);
      }
    }

    // Suggest absolute imports for complex relative paths
    if (this.isComplexRelativeImport(importStmt.source)) {
      const absoluteSuggestion = this.suggestAbsoluteImport(importStmt, filePath);
      if (absoluteSuggestion) {
        suggestions.push(absoluteSuggestion);
      }
    }

    // Suggest optimized package imports
    if (this.isPackageImport(importStmt.source)) {
      const packageSuggestion = this.suggestOptimizedPackageImport(importStmt);
      if (packageSuggestion) {
        suggestions.push(packageSuggestion);
      }
    }

    return suggestions;
  }

  private isDeepImport(importPath: string): boolean {
    // Check if import goes deep into package structure
    if (importPath.startsWith('@reporunner/')) {
      const parts = importPath.split('/');
      return parts.length > 2 && parts.includes('src');
    }

    if (importPath.includes('/src/') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
      return importPath.split('/').length > 3;
    }

    return false;
  }

  private isComplexRelativeImport(importPath: string): boolean {
    if (!importPath.startsWith('../')) return false;

    const upLevels = (importPath.match(/\.\.\//g) || []).length;
    return upLevels > 2;
  }

  private isPackageImport(importPath: string): boolean {
    return importPath.startsWith('@reporunner/') ||
           importPath.startsWith('../packages/') ||
           (!importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/'));
  }

  private suggestBarrelExport(importStmt: any): ImportSuggestion | null {
    if (!importStmt.source.startsWith('@reporunner/')) return null;

    const parts = importStmt.source.split('/');
    const packageName = parts.slice(0, 2).join('/');

    return {
      type: 'use-barrel',
      description: `Use barrel export instead of deep import`,
      currentImport: `import { ${importStmt.specifiers.join(', ')} } from '${importStmt.source}'`,
      suggestedImport: `import { ${importStmt.specifiers.join(', ')} } from '${packageName}'`,
      estimatedImpact: 'medium'
    };
  }

  private suggestAbsoluteImport(importStmt: any, filePath: string): ImportSuggestion | null {
    if (!importStmt.source.startsWith('../')) return null;

    try {
      // Try to convert relative path to absolute workspace path
      const fromDir = path.dirname(filePath);
      const resolvedPath = path.resolve(fromDir, importStmt.source);
      const relativePath = path.relative(this.workspaceRoot, resolvedPath);

      // Check if this could be a package import
      if (relativePath.startsWith('packages/@reporunner/')) {
        const pathParts = relativePath.split('/');
        const packageName = `@reporunner/${pathParts[2]}`;

        return {
          type: 'optimize-path',
          description: `Use absolute package import instead of relative path`,
          currentImport: `import { ${importStmt.specifiers.join(', ')} } from '${importStmt.source}'`,
          suggestedImport: `import { ${importStmt.specifiers.join(', ')} } from '${packageName}'`,
          estimatedImpact: 'high'
        };
      }
    } catch (error) {
      // Ignore resolution errors
    }

    return null;
  }

  private suggestOptimizedPackageImport(importStmt: any): ImportSuggestion | null {
    const packageInfo = this.packageExports.get(importStmt.source);
    if (!packageInfo) return null;

    // Check if there's a more efficient way to import
    if (packageInfo.hasBarrelExport && importStmt.source.includes('/src/')) {
      const packageName = importStmt.source.split('/src/')[0];

      return {
        type: 'optimize-path',
        description: `Use package barrel export for cleaner imports`,
        currentImport: `import { ${importStmt.specifiers.join(', ')} } from '${importStmt.source}'`,
        suggestedImport: `import { ${importStmt.specifiers.join(', ')} } from '${packageName}'`,
        estimatedImpact: 'medium'
      };
    }

    return null;
  }

  private suggestImportConsolidation(analysis: ImportPathAnalysis): ImportSuggestion[] {
    const suggestions: ImportSuggestion[] = [];

    // Group imports by source
    const importGroups = new Map<string, any[]>();
    analysis.imports.forEach(imp => {
      if (!importGroups.has(imp.source)) {
        importGroups.set(imp.source, []);
      }
      importGroups.get(imp.source)!.push(imp);
    });

    // Suggest consolidation for multiple imports from same source
    importGroups.forEach((imports, source) => {
      if (imports.length > 1) {
        const allSpecifiers = imports.flatMap(imp => imp.specifiers);
        const hasTypeImports = imports.some(imp => imp.isTypeOnly);
        const hasValueImports = imports.some(imp => !imp.isTypeOnly);

        let suggestedImport: string;

        if (hasTypeImports && hasValueImports) {
          // Mixed type and value imports
          const typeSpecifiers = imports.filter(imp => imp.isTypeOnly).flatMap(imp => imp.specifiers);
          const valueSpecifiers = imports.filter(imp => !imp.isTypeOnly).flatMap(imp => imp.specifiers);

          suggestedImport = `import { ${valueSpecifiers.join(', ')}, type ${typeSpecifiers.join(', type ')} } from '${source}'`;
        } else {
          // All same type
          const prefix = hasTypeImports ? 'type ' : '';
          suggestedImport = `import ${prefix}{ ${allSpecifiers.join(', ')} } from '${source}'`;
        }

        suggestions.push({
          type: 'consolidate-imports',
          description: `Consolidate ${imports.length} imports from ${source}`,
          currentImport: imports.map(imp => imp.raw).join('\n'),
          suggestedImport,
          estimatedImpact: 'low'
        });
      }
    });

    return suggestions;
  }

  private generateGlobalSuggestions(analyses: ImportPathAnalysis[]): ImportSuggestion[] {
    const suggestions: ImportSuggestion[] = [];

    // Analyze patterns across all files
    const allImports = analyses.flatMap(analysis => analysis.imports);

    // Suggest creating barrel exports for frequently imported packages
    const importCounts = new Map<string, number>();
    allImports.forEach(imp => {
      if (this.isDeepImport(imp.source)) {
        const packageName = this.extractPackageName(imp.source);
        importCounts.set(packageName, (importCounts.get(packageName) || 0) + 1);
      }
    });

    importCounts.forEach((count, packageName) => {
      if (count > 5) { // Threshold for suggesting barrel exports
        suggestions.push({
          type: 'use-barrel',
          description: `Create barrel export for ${packageName} (used in ${count} deep imports)`,
          currentImport: `Multiple deep imports from ${packageName}`,
          suggestedImport: `Create index.ts barrel export in ${packageName}`,
          estimatedImpact: 'high'
        });
      }
    });

    // Suggest removing unused imports (placeholder - would need more analysis)
    const potentialUnusedImports = this.identifyPotentialUnusedImports(analyses);
    suggestions.push(...potentialUnusedImports);

    return suggestions;
  }

  private extractPackageName(importPath: string): string {
    if (importPath.startsWith('@reporunner/')) {
      return importPath.split('/').slice(0, 2).join('/');
    }

    if (importPath.includes('/packages/')) {
      const parts = importPath.split('/');
      const packagesIndex = parts.indexOf('packages');
      if (packagesIndex !== -1 && packagesIndex + 1 < parts.length) {
        return parts[packagesIndex + 1];
      }
    }

    return importPath.split('/')[0];
  }

  private identifyPotentialUnusedImports(analyses: ImportPathAnalysis[]): ImportSuggestion[] {
    const suggestions: ImportSuggestion[] = [];

    // This is a simplified check - in a real implementation, you'd need
    // to parse the file content to see if imports are actually used
    analyses.forEach(analysis => {
      analysis.imports.forEach(imp => {
        if (imp.specifiers.length === 0 && !imp.source.endsWith('.css') && !imp.source.endsWith('.scss')) {
          // Side-effect import that might be unused
          suggestions.push({
            type: 'remove-unused',
            description: `Verify if side-effect import is needed`,
            currentImport: imp.raw,
            suggestedImport: `// Remove if not needed: ${imp.raw}`,
            estimatedImpact: 'low'
          });
        }
      });
    });

    return suggestions;
  }

  private async loadPackageExports(): Promise<void> {
    const packagesDir = path.join(this.workspaceRoot, 'packages');

    // Load main packages
    const mainPackages = ['backend', 'frontend', 'shared'];
    for (const pkg of mainPackages) {
      const pkgPath = path.join(packagesDir, pkg);
      await this.loadPackageInfo(pkg, pkgPath);
    }

    // Load @reporunner packages
    const reporunnerDir = path.join(packagesDir, '@reporunner');
    if (fs.existsSync(reporunnerDir)) {
      const reporunnerPackages = fs.readdirSync(reporunnerDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const pkg of reporunnerPackages) {
        const pkgPath = path.join(reporunnerDir, pkg);
        await this.loadPackageInfo(`@reporunner/${pkg}`, pkgPath);
      }
    }
  }

  private async loadPackageInfo(packageName: string, packagePath: string): Promise<void> {
    if (!fs.existsSync(packagePath)) return;

    const packageJsonPath = path.join(packagePath, 'package.json');
    const indexPath = path.join(packagePath, 'src', 'index.ts');

    const info: any = {
      hasBarrelExport: fs.existsSync(indexPath),
      exports: {},
      main: null
    };

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        info.exports = packageJson.exports || {};
        info.main = packageJson.main;
      } catch (error) {
        console.warn(`Could not read package.json for ${packageName}:`, error);
      }
    }

    this.packageExports.set(packageName, info);
  }
}

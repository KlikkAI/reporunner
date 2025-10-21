import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ImportIssue, ImportPathAnalysis, ImportPathRule, ImportStatement } from './types';

export class ImportConsistencyValidator {
  private workspaceRoot: string;
  private rules: ImportPathRule[];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.rules = this.createImportPathRules();
  }

  async validateImportConsistency(): Promise<{ analyses: ImportPathAnalysis[] }> {
    const tsFiles = await this.getAllTypeScriptFiles();
    const analyses: ImportPathAnalysis[] = [];

    for (const filePath of tsFiles) {
      try {
        const analysis = await this.analyzeFile(filePath);
        analyses.push(analysis);
      } catch (error) {
        analyses.push({
          filePath,
          imports: [],
          issues: [
            {
              type: 'inconsistent-path',
              severity: 'error',
              message: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`,
              filePath,
              line: 0,
            },
          ],
          suggestions: [],
        });
      }
    }

    return { analyses };
  }

  private async analyzeFile(filePath: string): Promise<ImportPathAnalysis> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = this.extractImports(content, filePath);
    const issues = this.validateImports(imports, filePath);
    const suggestions = this.generateSuggestions(imports, filePath);

    return {
      filePath: path.relative(this.workspaceRoot, filePath),
      imports,
      issues,
      suggestions,
    };
  }

  private extractImports(content: string, _filePath: string): ImportStatement[] {
    const imports: ImportStatement[] = [];
    const lines = content.split('\n');

    // Enhanced regex to capture different import patterns
    const importRegexes = [
      // import { a, b } from 'module'
      /import\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
      // import * as name from 'module'
      /import\s*\*\s*as\s+(\w+)\s*from\s*['"]([^'"]+)['"]/g,
      // import name from 'module'
      /import\s+(\w+)\s*from\s*['"]([^'"]+)['"]/g,
      // import 'module' (side effect)
      /import\s*['"]([^'"]+)['"]/g,
      // import type { ... } from 'module'
      /import\s+type\s*\{\s*([^}]*)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
      // import type name from 'module'
      /import\s+type\s+(\w+)\s*from\s*['"]([^'"]+)['"]/g,
    ];

    lines.forEach((line, lineIndex) => {
      importRegexes.forEach((regex) => {
        let match;
        regex.lastIndex = 0; // Reset regex state

        while ((match = regex.exec(line)) !== null) {
          let specifiers: string[] = [];
          let source: string;
          let isTypeOnly = false;

          if (line.includes('import type')) {
            isTypeOnly = true;
          }

          // Handle different import patterns
          if (match[2]) {
            // Named imports or namespace imports
            source = match[2];
            if (match[1]) {
              if (match[1].includes(',')) {
                // Named imports: { a, b, c }
                specifiers = match[1]
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s);
              } else {
                // Single import or namespace
                specifiers = [match[1].trim()];
              }
            }
          } else {
            // Side effect import
            source = match[1];
            specifiers = [];
          }

          imports.push({
            source,
            specifiers,
            isTypeOnly,
            line: lineIndex + 1,
            column: match.index || 0,
            raw: match[0],
          });
        }
      });
    });

    return imports;
  }

  private validateImports(imports: ImportStatement[], filePath: string): ImportIssue[] {
    const issues: ImportIssue[] = [];

    imports.forEach((importStmt) => {
      // Apply all rules to each import
      this.rules.forEach((rule) => {
        if (!rule.check(importStmt.source, filePath)) {
          issues.push({
            type: this.getIssueType(rule.name),
            severity: rule.severity,
            message: rule.description,
            filePath: path.relative(this.workspaceRoot, filePath),
            line: importStmt.line,
            suggestion: rule.suggestion(importStmt.source, filePath),
          });
        }
      });

      // Additional specific validations
      this.validateSpecificImportPatterns(importStmt, filePath, issues);
    });

    return issues;
  }

  private validateSpecificImportPatterns(
    importStmt: ImportStatement,
    filePath: string,
    issues: ImportIssue[]
  ): void {
    const relativePath = path.relative(this.workspaceRoot, filePath);

    // Check for deep imports into other packages
    if (
      importStmt.source.includes('/src/') &&
      !importStmt.source.startsWith('./') &&
      !importStmt.source.startsWith('../')
    ) {
      const pathParts = importStmt.source.split('/');
      if (pathParts.length > 3) {
        issues.push({
          type: 'deep-import',
          severity: 'warning',
          message: `Deep import detected: ${importStmt.source}. Consider using barrel exports.`,
          filePath: relativePath,
          line: importStmt.line,
          suggestion: `Use barrel export from package root instead of deep import`,
        });
      }
    }

    // Check for inconsistent relative import patterns
    if (importStmt.source.startsWith('../')) {
      const upLevels = (importStmt.source.match(/\.\.\//g) || []).length;
      if (upLevels > 2) {
        issues.push({
          type: 'inconsistent-path',
          severity: 'info',
          message: `Deep relative import: ${importStmt.source}. Consider using absolute imports.`,
          filePath: relativePath,
          line: importStmt.line,
          suggestion: `Use absolute import path instead of deep relative path`,
        });
      }
    }

    // Check for missing file extensions in relative imports
    if (
      (importStmt.source.startsWith('./') || importStmt.source.startsWith('../')) &&
      !importStmt.source.includes('.')
    ) {
      // This is actually fine for TypeScript, but flag for consistency
      issues.push({
        type: 'inconsistent-path',
        severity: 'info',
        message: `Relative import without extension: ${importStmt.source}`,
        filePath: relativePath,
        line: importStmt.line,
        suggestion: `Consider adding .ts extension for clarity`,
      });
    }
  }

  private generateSuggestions(imports: ImportStatement[], _filePath: string): any[] {
    const suggestions: any[] = [];

    // Group imports by source to suggest consolidation
    const importGroups = new Map<string, ImportStatement[]>();
    imports.forEach((imp) => {
      if (!importGroups.has(imp.source)) {
        importGroups.set(imp.source, []);
      }
      importGroups.get(imp.source)?.push(imp);
    });

    // Suggest consolidating multiple imports from same source
    importGroups.forEach((imps, source) => {
      if (imps.length > 1) {
        const allSpecifiers = imps.flatMap((imp) => imp.specifiers);
        suggestions.push({
          type: 'consolidate-imports',
          description: `Consolidate ${imps.length} imports from ${source}`,
          currentImport: imps.map((imp) => imp.raw).join(', '),
          suggestedImport: `import { ${allSpecifiers.join(', ')} } from '${source}'`,
          estimatedImpact: 'low',
        });
      }
    });

    // Suggest barrel exports for packages with many internal imports
    const internalImports = imports.filter(
      (imp) => imp.source.startsWith('./') || imp.source.startsWith('../')
    );

    if (internalImports.length > 5) {
      suggestions.push({
        type: 'use-barrel',
        description: `Consider creating barrel exports to simplify ${internalImports.length} internal imports`,
        currentImport: 'Multiple internal imports',
        suggestedImport: 'Barrel export pattern',
        estimatedImpact: 'medium',
      });
    }

    return suggestions;
  }

  private createImportPathRules(): ImportPathRule[] {
    return [
      {
        name: 'no-deep-package-imports',
        description: 'Avoid deep imports into package internals',
        check: (importPath: string) => {
          // Allow deep imports for relative paths and known patterns
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return true;
          }

          // Check for deep imports into @klikkflow packages
          if (importPath.startsWith('@klikkflow/')) {
            const parts = importPath.split('/');
            // Allow @klikkflow/package-name but not @klikkflow/package-name/src/internal/deep
            return parts.length <= 2 || !parts.includes('src');
          }

          return true;
        },
        suggestion: (importPath: string) => {
          if (importPath.startsWith('@klikkflow/')) {
            const packageName = importPath.split('/').slice(0, 2).join('/');
            return `Use barrel export: ${packageName}`;
          }
          return 'Use package main export';
        },
        severity: 'warning',
      },

      {
        name: 'consistent-relative-imports',
        description: 'Use consistent relative import patterns',
        check: (importPath: string, _filePath: string) => {
          // This rule checks for overly complex relative paths
          if (importPath.startsWith('../')) {
            const upLevels = (importPath.match(/\.\.\//g) || []).length;
            return upLevels <= 3; // Allow up to 3 levels up
          }
          return true;
        },
        suggestion: () => 'Consider using absolute imports for deep relative paths',
        severity: 'info',
      },

      {
        name: 'prefer-barrel-exports',
        description: 'Prefer barrel exports over direct file imports',
        check: (importPath: string) => {
          // Check if importing directly from src directories
          return (
            !importPath.includes('/src/') ||
            importPath.startsWith('./') ||
            importPath.startsWith('../')
          );
        },
        suggestion: (importPath: string) => {
          const parts = importPath.split('/');
          const packagePart = parts.slice(0, 2).join('/');
          return `Use barrel export: ${packagePart}`;
        },
        severity: 'info',
      },

      {
        name: 'no-circular-imports',
        description: 'Avoid circular import dependencies',
        check: () => {
          // This is handled by the CircularDependencyDetector
          return true;
        },
        suggestion: () => 'Refactor to break circular dependency',
        severity: 'error',
      },
    ];
  }

  private getIssueType(ruleName: string): any {
    const typeMap: { [key: string]: any } = {
      'no-deep-package-imports': 'deep-import',
      'consistent-relative-imports': 'inconsistent-path',
      'prefer-barrel-exports': 'missing-barrel',
      'no-circular-imports': 'circular-dependency',
    };

    return typeMap[ruleName] || 'inconsistent-path';
  }

  private async getAllTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    const packagesDir = path.join(this.workspaceRoot, 'packages');

    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.includes('node_modules') &&
          !entry.name.includes('dist') &&
          !entry.name.includes('build')
        ) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(packagesDir);
    return files;
  }
}

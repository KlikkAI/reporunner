import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  CodeOrganizationReport,
  SeparationReport,
  DuplicationReport,
  NamingReport,
  SeparationViolation,
  DuplicatedBlock,
  NamingViolation,
  ArchitectureValidationOptions
} from './types';

export class CodeOrganizationChecker {
  private workspaceRoot: string;
  private packagePaths: string[];

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.packagePaths = [];
  }

  async initialize(): Promise<void> {
    this.packagePaths = await this.discoverPackages();
  }

  private async discoverPackages(): Promise<string[]> {
    const packagesDir = path.join(this.workspaceRoot, 'packages');
    const packages: string[] = [];

    try {
      // Main packages
      const mainPackages = await fs.readdir(packagesDir);
      for (const pkg of mainPackages) {
        const pkgPath = path.join(packagesDir, pkg);
        const stat = await fs.stat(pkgPath);
        if (stat.isDirectory() && pkg !== '@reporunner') {
          packages.push(pkgPath);
        }
      }

      // @reporunner scoped packages
      const scopedDir = path.join(packagesDir, '@reporunner');
      try {
        const scopedPackages = await fs.readdir(scopedDir);
        for (const pkg of scopedPackages) {
          const pkgPath = path.join(scopedDir, pkg);
          const stat = await fs.stat(pkgPath);
          if (stat.isDirectory()) {
            packages.push(pkgPath);
          }
        }
      } catch (error) {
        // @reporunner directory might not exist
      }

      return packages;
    } catch (error) {
      console.warn('Failed to discover packages:', error);
      return [];
    }
  }

  async validateCodeOrganization(options: ArchitectureValidationOptions = {}): Promise<CodeOrganizationReport> {
    const separationOfConcerns = await this.validateSeparationOfConcerns();
    const codeDuplication = await this.detectCodeDuplication();
    const namingConventions = await this.validateNamingConventions();

    const overallScore = this.calculateOverallScore(separationOfConcerns, codeDuplication, namingConventions);
    const recommendations = this.generateOrganizationRecommendations(separationOfConcerns, codeDuplication, namingConventions);

    return {
      separationOfConcerns,
      codeDuplication,
      namingConventions,
      overallScore,
      recommendations
    };
  }

  private async validateSeparationOfConcerns(): Promise<SeparationReport> {
    const violations: SeparationViolation[] = [];
    const packageScores: Record<string, number> = {};

    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const packageViolations = await this.analyzePackageConcerns(packagePath, packageName);
      violations.push(...packageViolations);

      // Calculate package score based on violations
      const totalFiles = await this.countSourceFiles(packagePath);
      const violationCount = packageViolations.length;
      packageScores[packageName] = totalFiles > 0 ? Math.max(0, (totalFiles - violationCount) / totalFiles * 100) : 100;
    }

    const score = Object.values(packageScores).reduce((sum, score) => sum + score, 0) / Object.keys(packageScores).length || 100;

    return {
      score,
      violations,
      packageScores
    };
  }

  private async analyzePackageConcerns(packagePath: string, packageName: string): Promise<SeparationViolation[]> {
    const violations: SeparationViolation[] = [];
    const srcPath = path.join(packagePath, 'src');

    try {
      const exists = await fs.access(srcPath).then(() => true).catch(() => false);
      if (!exists) return violations;

      const files = await this.getSourceFiles(srcPath);

      for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativeFilePath = path.relative(this.workspaceRoot, filePath);

        // Check for mixed concerns
        const mixedConcerns = this.detectMixedConcerns(content, filePath);
        violations.push(...mixedConcerns.map(concern => ({
          packageName,
          filePath: relativeFilePath,
          violationType: 'mixed_concerns' as const,
          description: concern,
          severity: 'medium' as const,
          suggestion: 'Consider separating concerns into different modules or classes'
        })));

        // Check for tight coupling
        const tightCoupling = this.detectTightCoupling(content, filePath);
        violations.push(...tightCoupling.map(coupling => ({
          packageName,
          filePath: relativeFilePath,
          violationType: 'tight_coupling' as const,
          description: coupling,
          severity: 'high' as const,
          suggestion: 'Use dependency injection or interfaces to reduce coupling'
        })));

        // Check for god classes/files
        const godClass = this.detectGodClass(content, filePath);
        if (godClass) {
          violations.push({
            packageName,
            filePath: relativeFilePath,
            violationType: 'god_class',
            description: godClass,
            severity: 'high',
            suggestion: 'Break down large classes/files into smaller, focused components'
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to analyze concerns for ${packagePath}:`, error);
    }

    return violations;
  }

  private detectMixedConcerns(content: string, filePath: string): string[] {
    const concerns: string[] = [];
    const fileName = path.basename(filePath, path.extname(filePath));

    // Check for mixed responsibilities in a single file
    const patterns = [
      { pattern: /class.*Controller.*{[\s\S]*database|db|query/i, concern: 'Controller mixing with database logic' },
      { pattern: /class.*Service.*{[\s\S]*render|component|jsx/i, concern: 'Service mixing with UI logic' },
      { pattern: /class.*Model.*{[\s\S]*http|fetch|axios/i, concern: 'Model mixing with HTTP logic' },
      { pattern: /function.*Component.*{[\s\S]*database|db|query/i, concern: 'Component mixing with database logic' },
      { pattern: /export.*{[\s\S]*}.*from.*['"].*\.(css|scss|less)/i, concern: 'Logic file importing styles directly' }
    ];

    for (const { pattern, concern } of patterns) {
      if (pattern.test(content)) {
        concerns.push(concern);
      }
    }

    // Check for files that seem to handle multiple unrelated concerns
    const concernKeywords = {
      auth: /auth|login|password|token|jwt/i,
      database: /database|db|query|sql|mongo/i,
      ui: /component|render|jsx|tsx|style/i,
      api: /api|endpoint|route|controller/i,
      validation: /validate|schema|joi|zod/i,
      logging: /log|logger|winston/i,
      config: /config|env|setting/i
    };

    const detectedConcerns = Object.entries(concernKeywords)
      .filter(([_, pattern]) => pattern.test(content))
      .map(([concern]) => concern);

    if (detectedConcerns.length > 2 && !fileName.includes('index') && !fileName.includes('util')) {
      concerns.push(`File handles multiple concerns: ${detectedConcerns.join(', ')}`);
    }

    return concerns;
  }

  private detectTightCoupling(content: string, filePath: string): string[] {
    const coupling: string[] = [];

    // Check for direct instantiation of classes (should use DI)
    const directInstantiation = content.match(/new\s+[A-Z][a-zA-Z]*\(/g);
    if (directInstantiation && directInstantiation.length > 3) {
      coupling.push(`High number of direct class instantiations (${directInstantiation.length})`);
    }

    // Check for hardcoded dependencies
    const hardcodedPatterns = [
      /require\(['"][^'"]*\/[^'"]*['"]\)/g, // Hardcoded require paths
      /import.*from\s+['"][^'"]*\/[^'"]*['"]/g, // Hardcoded import paths (relative)
      /process\.env\.[A-Z_]+/g // Direct environment variable access
    ];

    for (const pattern of hardcodedPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 5) {
        coupling.push(`High number of hardcoded dependencies (${matches.length})`);
      }
    }

    // Check for singleton patterns (often indicate tight coupling)
    if (/getInstance|\.instance\s*=/i.test(content)) {
      coupling.push('Singleton pattern detected - may indicate tight coupling');
    }

    return coupling;
  }

  private detectGodClass(content: string, filePath: string): string | null {
    const lines = content.split('\n').length;
    const methods = (content.match(/^\s*(public|private|protected)?\s*(async\s+)?function|^\s*(public|private|protected)?\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/gm) || []).length;
    const classes = (content.match(/class\s+[A-Z][a-zA-Z0-9_]*\s*{/g) || []).length;

    // Thresholds for god class detection
    const MAX_LINES = 500;
    const MAX_METHODS = 20;

    if (lines > MAX_LINES) {
      return `File is too large (${lines} lines, recommended < ${MAX_LINES})`;
    }

    if (methods > MAX_METHODS && classes > 0) {
      return `Class has too many methods (${methods}, recommended < ${MAX_METHODS})`;
    }

    return null;
  }

  private async detectCodeDuplication(): Promise<DuplicationReport> {
    try {
      // Use jscpd for code duplication detection
      const jscpdConfigPath = path.join(this.workspaceRoot, '.jscpd.json');
      const hasConfig = await fs.access(jscpdConfigPath).then(() => true).catch(() => false);

      let command = 'npx jscpd --reporters json --output ./reports/duplication';

      if (hasConfig) {
        command += ' --config .jscpd.json';
      } else {
        command += ' --min-lines 5 --min-tokens 50 --threshold 0 packages/';
      }

      const output = execSync(command, {
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const reportPath = path.join(this.workspaceRoot, 'reports/duplication/jscpd-report.json');
      const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);

      if (reportExists) {
        const reportContent = await fs.readFile(reportPath, 'utf-8');
        const report = JSON.parse(reportContent);
        return this.parseJscpdReport(report);
      }
    } catch (error) {
      console.warn('Failed to run jscpd for duplication detection:', error);
    }

    // Fallback: simple duplication detection
    return await this.simpleDuplicationDetection();
  }

  private parseJscpdReport(report: any): DuplicationReport {
    const duplicatedBlocks: DuplicatedBlock[] = [];
    const affectedFiles = new Set<string>();

    if (report.duplicates) {
      for (const duplicate of report.duplicates) {
        const files = duplicate.map((d: any) => d.sourceId);
        const lines = duplicate[0]?.lines || 0;
        const tokens = duplicate[0]?.tokens || 0;
        const startLines = duplicate.map((d: any) => d.start?.line || 0);
        const endLines = duplicate.map((d: any) => d.end?.line || 0);

        duplicatedBlocks.push({
          files,
          lines,
          tokens,
          similarity: 100, // jscpd finds exact duplicates
          startLines,
          endLines
        });

        files.forEach(file => affectedFiles.add(file));
      }
    }

    const totalDuplication = duplicatedBlocks.reduce((sum, block) => sum + block.lines, 0);
    const duplicationPercentage = report.statistics?.total?.percentage || 0;

    return {
      duplicatedBlocks,
      totalDuplication,
      duplicationPercentage,
      affectedFiles: Array.from(affectedFiles),
      recommendations: this.generateDuplicationRecommendations(duplicatedBlocks, duplicationPercentage)
    };
  }

  private async simpleDuplicationDetection(): Promise<DuplicationReport> {
    // Simple hash-based duplication detection for fallback
    const fileHashes = new Map<string, string[]>();
    const duplicatedBlocks: DuplicatedBlock[] = [];

    for (const packagePath of this.packagePaths) {
      const srcPath = path.join(packagePath, 'src');
      const files = await this.getSourceFiles(srcPath);

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');

          // Create hashes for blocks of 5+ lines
          for (let i = 0; i <= lines.length - 5; i++) {
            const block = lines.slice(i, i + 5).join('\n').trim();
            if (block.length > 50) { // Minimum block size
              const hash = this.simpleHash(block);
              if (!fileHashes.has(hash)) {
                fileHashes.set(hash, []);
              }
              fileHashes.get(hash)!.push(`${filePath}:${i + 1}`);
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    // Find duplicates
    Array.from(fileHashes.entries()).forEach(([hash, locations]) => {
      if (locations.length > 1) {
        const files = locations.map(loc => loc.split(':')[0]);
        const startLines = locations.map(loc => parseInt(loc.split(':')[1]));

        duplicatedBlocks.push({
          files,
          lines: 5,
          tokens: 50,
          similarity: 100,
          startLines,
          endLines: startLines.map(line => line + 4)
        });
      }
    });

    const totalDuplication = duplicatedBlocks.reduce((sum, block) => sum + block.lines, 0);
    const affectedFiles = Array.from(new Set(duplicatedBlocks.flatMap(block => block.files)));

    return {
      duplicatedBlocks,
      totalDuplication,
      duplicationPercentage: 0, // Can't calculate without total lines
      affectedFiles,
      recommendations: this.generateDuplicationRecommendations(duplicatedBlocks, 0)
    };
  }

  private simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private generateDuplicationRecommendations(blocks: DuplicatedBlock[], percentage: number): string[] {
    const recommendations: string[] = [];

    if (blocks.length === 0) {
      recommendations.push('✅ No significant code duplication detected!');
      return recommendations;
    }

    if (percentage > 10) {
      recommendations.push('🚨 High code duplication detected (>10%). Immediate refactoring recommended.');
    } else if (percentage > 5) {
      recommendations.push('⚠️ Moderate code duplication detected (>5%). Consider refactoring.');
    } else {
      recommendations.push('ℹ️ Low code duplication detected. Monitor and refactor when convenient.');
    }

    recommendations.push(
      '📋 Duplication reduction strategies:',
      '• Extract common functionality into shared utilities',
      '• Create base classes or mixins for common patterns',
      '• Use composition over inheritance',
      '• Implement template method pattern for similar algorithms',
      '• Consider using higher-order functions for repeated logic'
    );

    return recommendations;
  }

  private async validateNamingConventions(): Promise<NamingReport> {
    const violations: NamingViolation[] = [];

    for (const packagePath of this.packagePaths) {
      const srcPath = path.join(packagePath, 'src');
      const files = await this.getSourceFiles(srcPath);

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativeFilePath = path.relative(this.workspaceRoot, filePath);
          const fileViolations = this.analyzeNamingConventions(content, relativeFilePath);
          violations.push(...fileViolations);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    const complianceScore = this.calculateNamingComplianceScore(violations);
    const conventionsCovered = this.getCoveredConventions();
    const recommendations = this.generateNamingRecommendations(violations, complianceScore);

    return {
      violations,
      complianceScore,
      conventionsCovered,
      recommendations
    };
  }

  private analyzeNamingConventions(content: string, filePath: string): NamingViolation[] {
    const violations: NamingViolation[] = [];

    // Class naming (PascalCase)
    const classMatches = Array.from(content.matchAll(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g));
    classMatches.forEach(match => {
      const className = match[1];
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
        violations.push({
          filePath,
          elementName: className,
          elementType: 'class',
          expectedPattern: 'PascalCase',
          actualPattern: this.getActualPattern(className),
          suggestion: `Rename to ${this.toPascalCase(className)}`
        });
      }
    });

    // Function naming (camelCase)
    const functionMatches = Array.from(content.matchAll(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(?:async\s+)?(?:function|\()|(?:async\s+)?function|\()/g));
    functionMatches.forEach(match => {
      const functionName = match[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(functionName) && !functionName.startsWith('_')) {
        violations.push({
          filePath,
          elementName: functionName,
          elementType: 'function',
          expectedPattern: 'camelCase',
          actualPattern: this.getActualPattern(functionName),
          suggestion: `Rename to ${this.toCamelCase(functionName)}`
        });
      }
    });

    // Variable naming (camelCase)
    const variableMatches = Array.from(content.matchAll(/(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g));
    variableMatches.forEach(match => {
      const variableName = match[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(variableName) && !variableName.startsWith('_') && !/^[A-Z_]+$/.test(variableName)) {
        violations.push({
          filePath,
          elementName: variableName,
          elementType: 'variable',
          expectedPattern: 'camelCase or CONSTANT_CASE',
          actualPattern: this.getActualPattern(variableName),
          suggestion: `Rename to ${this.toCamelCase(variableName)} or ${this.toConstantCase(variableName)}`
        });
      }
    });

    // Interface naming (PascalCase, optionally with 'I' prefix)
    const interfaceMatches = Array.from(content.matchAll(/interface\s+([a-zA-Z_][a-zA-Z0-9_]*)/g));
    interfaceMatches.forEach(match => {
      const interfaceName = match[1];
      if (!/^I?[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
        violations.push({
          filePath,
          elementName: interfaceName,
          elementType: 'interface',
          expectedPattern: 'PascalCase (optionally with I prefix)',
          actualPattern: this.getActualPattern(interfaceName),
          suggestion: `Rename to ${this.toPascalCase(interfaceName)}`
        });
      }
    });

    // Type naming (PascalCase)
    const typeMatches = Array.from(content.matchAll(/type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g));
    typeMatches.forEach(match => {
      const typeName = match[1];
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(typeName)) {
        violations.push({
          filePath,
          elementName: typeName,
          elementType: 'type',
          expectedPattern: 'PascalCase',
          actualPattern: this.getActualPattern(typeName),
          suggestion: `Rename to ${this.toPascalCase(typeName)}`
        });
      }
    });

    return violations;
  }

  private getActualPattern(name: string): string {
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
    if (/^[A-Z_]+$/.test(name)) return 'CONSTANT_CASE';
    if (/^[a-z_]+$/.test(name)) return 'snake_case';
    if (/^[a-z-]+$/.test(name)) return 'kebab-case';
    return 'mixed/unknown';
  }

  private toPascalCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase());
  }

  private toCamelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1).replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase());
  }

  private toConstantCase(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }

  private calculateNamingComplianceScore(violations: NamingViolation[]): number {
    // This is a simplified calculation - in practice, you'd want to count total elements
    const totalElements = violations.length + 100; // Assume some compliant elements
    return Math.max(0, (totalElements - violations.length) / totalElements * 100);
  }

  private getCoveredConventions(): string[] {
    return [
      'Class names (PascalCase)',
      'Function names (camelCase)',
      'Variable names (camelCase/CONSTANT_CASE)',
      'Interface names (PascalCase)',
      'Type names (PascalCase)'
    ];
  }

  private generateNamingRecommendations(violations: NamingViolation[], complianceScore: number): string[] {
    const recommendations: string[] = [];

    if (complianceScore >= 90) {
      recommendations.push('✅ Excellent naming convention compliance!');
    } else if (complianceScore >= 70) {
      recommendations.push('✅ Good naming convention compliance with room for improvement.');
    } else {
      recommendations.push('⚠️ Naming convention violations detected. Consider refactoring for consistency.');
    }

    if (violations.length > 0) {
      const violationTypes = Array.from(new Set(violations.map(v => v.elementType)));
      recommendations.push(
        `📋 Violations found in: ${violationTypes.join(', ')}`,
        '• Use consistent naming patterns across the codebase',
        '• Set up ESLint rules for naming conventions',
        '• Consider using automated refactoring tools',
        '• Document naming conventions in your style guide'
      );
    }

    return recommendations;
  }

  private async getPackageName(packagePath: string): Promise<string> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      return packageJson.name || path.basename(packagePath);
    } catch (error) {
      return path.basename(packagePath);
    }
  }

  private async countSourceFiles(packagePath: string): Promise<number> {
    const srcPath = path.join(packagePath, 'src');
    try {
      const files = await this.getSourceFiles(srcPath);
      return files.length;
    } catch (error) {
      return 0;
    }
  }

  private async getSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.getSourceFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return files;
  }

  private calculateOverallScore(
    separationReport: SeparationReport,
    duplicationReport: DuplicationReport,
    namingReport: NamingReport
  ): number {
    // Weighted average of different aspects
    const weights = {
      separation: 0.4,
      duplication: 0.3,
      naming: 0.3
    };

    const duplicationScore = Math.max(0, 100 - duplicationReport.duplicationPercentage * 10);

    return (
      separationReport.score * weights.separation +
      duplicationScore * weights.duplication +
      namingReport.complianceScore * weights.naming
    );
  }

  private generateOrganizationRecommendations(
    separationReport: SeparationReport,
    duplicationReport: DuplicationReport,
    namingReport: NamingReport
  ): string[] {
    const recommendations: string[] = [];

    // Overall assessment
    const overallScore = this.calculateOverallScore(separationReport, duplicationReport, namingReport);

    if (overallScore >= 80) {
      recommendations.push('✅ Excellent code organization! Keep up the good work.');
    } else if (overallScore >= 60) {
      recommendations.push('✅ Good code organization with some areas for improvement.');
    } else {
      recommendations.push('⚠️ Code organization needs attention. Consider refactoring efforts.');
    }

    // Specific recommendations based on each aspect
    if (separationReport.score < 70) {
      recommendations.push(
        '🏗️ Separation of concerns improvements needed:',
        '• Review package responsibilities and boundaries',
        '• Extract mixed concerns into separate modules',
        '• Use dependency injection to reduce coupling'
      );
    }

    if (duplicationReport.duplicationPercentage > 5) {
      recommendations.push(
        '🔄 Code duplication reduction needed:',
        '• Extract common functionality into shared utilities',
        '• Use composition patterns to reduce repetition',
        '• Set up automated duplication detection in CI'
      );
    }

    if (namingReport.complianceScore < 80) {
      recommendations.push(
        '📝 Naming convention improvements needed:',
        '• Establish and document naming standards',
        '• Use linting rules to enforce conventions',
        '• Refactor inconsistent naming gradually'
      );
    }

    recommendations.push(
      '🔧 General recommendations:',
      '• Set up automated code quality checks',
      '• Regular code reviews focusing on organization',
      '• Use architectural decision records (ADRs)',
      '• Consider using design patterns for common problems'
    );

    return recommendations;
  }
}

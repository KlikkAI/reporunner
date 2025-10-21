import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as ts from 'typescript';
import type {
  ArchitectureValidationOptions,
  ExportIssue,
  ExportStructureReport,
  InterfaceCompatibilityReport,
  InterfaceIncompatibility,
  TypeConsistencyReport,
  TypeDefinition,
  TypeInconsistency,
  TypeSafetyReport,
} from './types';

export class TypeSafetyValidator {
  private workspaceRoot: string;
  private packagePaths: string[];
  private typeChecker: ts.TypeChecker | null = null;
  private program: ts.Program | null = null;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.packagePaths = [];
  }

  async initialize(): Promise<void> {
    this.packagePaths = await this.discoverPackages();
    await this.initializeTypeScript();
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
        if (stat.isDirectory() && pkg !== '@klikkflow') {
          packages.push(pkgPath);
        }
      }

      // @klikkflow scoped packages
      const scopedDir = path.join(packagesDir, '@klikkflow');
      try {
        const scopedPackages = await fs.readdir(scopedDir);
        for (const pkg of scopedPackages) {
          const pkgPath = path.join(scopedDir, pkg);
          const stat = await fs.stat(pkgPath);
          if (stat.isDirectory()) {
            packages.push(pkgPath);
          }
        }
      } catch (_error) {
        // @klikkflow directory might not exist
      }

      return packages;
    } catch (_error) {
      return [];
    }
  }

  private async initializeTypeScript(): Promise<void> {
    try {
      // Find all TypeScript files across packages
      const allFiles: string[] = [];

      for (const packagePath of this.packagePaths) {
        const srcPath = path.join(packagePath, 'src');
        const files = await this.getTypeScriptFiles(srcPath);
        allFiles.push(...files);
      }

      if (allFiles.length === 0) {
        return;
      }

      // Create TypeScript program
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        baseUrl: '.',
        paths: {
          '@klikkflow/*': ['packages/@klikkflow/*/src'],
          shared: ['packages/shared/src'],
          backend: ['packages/backend/src'],
          frontend: ['packages/frontend/src'],
        },
      };

      this.program = ts.createProgram(allFiles, compilerOptions);
      this.typeChecker = this.program.getTypeChecker();
    } catch (_error) {}
  }

  async validateTypeSafety(
    _options: ArchitectureValidationOptions = {}
  ): Promise<TypeSafetyReport> {
    const crossPackageConsistency = await this.validateCrossPackageConsistency();
    const interfaceCompatibility = await this.validateInterfaceCompatibility();
    const exportStructure = await this.validateExportStructure();

    const overallScore = this.calculateOverallScore(
      crossPackageConsistency,
      interfaceCompatibility,
      exportStructure
    );
    const recommendations = this.generateTypeSafetyRecommendations(
      crossPackageConsistency,
      interfaceCompatibility,
      exportStructure
    );

    return {
      crossPackageConsistency,
      interfaceCompatibility,
      exportStructure,
      overallScore,
      recommendations,
    };
  }

  private async validateCrossPackageConsistency(): Promise<TypeConsistencyReport> {
    const inconsistencies: TypeInconsistency[] = [];
    const typeDefinitions = new Map<string, TypeDefinition[]>();

    // Collect all type definitions across packages
    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const srcPath = path.join(packagePath, 'src');
      const files = await this.getTypeScriptFiles(srcPath);

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativeFilePath = path.relative(this.workspaceRoot, filePath);
          const types = this.extractTypeDefinitions(content, packageName, relativeFilePath);

          for (const type of types) {
            if (!typeDefinitions.has(type.typeName)) {
              typeDefinitions.set(type.typeName, []);
            }
            typeDefinitions.get(type.typeName)?.push(type);
          }
        } catch (_error) {
          // Skip files that can't be read
        }
      }
    }

    // Find inconsistencies
    Array.from(typeDefinitions.entries()).forEach(([typeName, definitions]) => {
      if (definitions.length > 1) {
        const uniqueDefinitions = this.getUniqueDefinitions(definitions);
        if (uniqueDefinitions.length > 1) {
          inconsistencies.push({
            typeName,
            packages: Array.from(new Set(definitions.map((d) => d.packageName))),
            definitions: uniqueDefinitions,
            conflictType: this.determineConflictType(uniqueDefinitions),
            severity: this.determineSeverity(uniqueDefinitions),
            suggestion: this.generateTypeSuggestion(typeName, uniqueDefinitions),
          });
        }
      }
    });

    const totalTypes = typeDefinitions.size;
    const consistencyScore =
      totalTypes > 0
        ? Math.max(0, ((totalTypes - inconsistencies.length) / totalTypes) * 100)
        : 100;

    return {
      inconsistencies,
      totalTypes,
      consistencyScore,
    };
  }

  private extractTypeDefinitions(
    content: string,
    packageName: string,
    filePath: string
  ): TypeDefinition[] {
    const definitions: TypeDefinition[] = [];
    const _lines = content.split('\n');

    // Extract interface definitions
    const interfaceRegex = /interface\s+([A-Z][a-zA-Z0-9]*)\s*{/g;
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const interfaceEnd = this.findInterfaceEnd(content, match.index);
      const definition = content.substring(match.index, interfaceEnd);

      definitions.push({
        packageName,
        filePath,
        definition: definition.trim(),
        lineNumber,
        typeName: match[1],
      });
    }

    // Extract type definitions
    const typeRegex = /type\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
    while ((match = typeRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const typeEnd = this.findTypeEnd(content, match.index);
      const definition = content.substring(match.index, typeEnd);

      definitions.push({
        packageName,
        filePath,
        definition: definition.trim(),
        lineNumber,
        typeName: match[1],
      });
    }

    // Extract enum definitions
    const enumRegex = /enum\s+([A-Z][a-zA-Z0-9]*)\s*{/g;
    while ((match = enumRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const enumEnd = this.findEnumEnd(content, match.index);
      const definition = content.substring(match.index, enumEnd);

      definitions.push({
        packageName,
        filePath,
        definition: definition.trim(),
        lineNumber,
        typeName: match[1],
      });
    }

    return definitions;
  }

  private findInterfaceEnd(content: string, startIndex: number): number {
    let braceCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';

      if (!inString) {
        if (char === '"' || char === "'" || char === '`') {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            return i + 1;
          }
        }
      } else if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
    }

    return content.length;
  }

  private findTypeEnd(content: string, startIndex: number): number {
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';

      if (!inString) {
        if (char === '"' || char === "'" || char === '`') {
          inString = true;
          stringChar = char;
        } else if (char === '{' || char === '(' || char === '[') {
          depth++;
        } else if (char === '}' || char === ')' || char === ']') {
          depth--;
        } else if ((char === ';' || char === '\n') && depth === 0) {
          return i;
        }
      } else if (char === stringChar && prevChar !== '\\') {
        inString = false;
      }
    }

    return content.length;
  }

  private findEnumEnd(content: string, startIndex: number): number {
    return this.findInterfaceEnd(content, startIndex); // Same logic as interface
  }

  private getUniqueDefinitions(definitions: TypeDefinition[]): TypeDefinition[] {
    const unique: TypeDefinition[] = [];
    const seen = new Set<string>();

    for (const def of definitions) {
      const normalized = this.normalizeDefinition(def.definition);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(def);
      }
    }

    return unique;
  }

  private normalizeDefinition(definition: string): string {
    return definition.replace(/\s+/g, ' ').replace(/;\s*}/g, '}').replace(/,\s*}/g, '}').trim();
  }

  private determineConflictType(
    definitions: TypeDefinition[]
  ): 'structure' | 'naming' | 'compatibility' {
    // Simple heuristic to determine conflict type
    const hasStructuralDifferences = definitions.some(
      (def) =>
        def.definition.includes('{') &&
        definitions.some(
          (other) =>
            other.definition.includes('{') &&
            this.getStructureSignature(def.definition) !==
              this.getStructureSignature(other.definition)
        )
    );

    if (hasStructuralDifferences) {
      return 'structure';
    }

    const hasNamingDifferences = definitions.some((def) =>
      definitions.some((other) => def.typeName !== other.typeName)
    );

    if (hasNamingDifferences) {
      return 'naming';
    }

    return 'compatibility';
  }

  private getStructureSignature(definition: string): string {
    // Extract property names and types for comparison
    const properties = definition.match(/\w+\s*:\s*[^;,}]+/g) || [];
    return properties.sort().join('|');
  }

  private determineSeverity(definitions: TypeDefinition[]): 'warning' | 'error' {
    // If definitions are in different packages and structurally different, it's an error
    const packages = new Set(definitions.map((d) => d.packageName));
    if (packages.size > 1 && this.hasStructuralDifferences(definitions)) {
      return 'error';
    }
    return 'warning';
  }

  private hasStructuralDifferences(definitions: TypeDefinition[]): boolean {
    if (definitions.length < 2) {
      return false;
    }
    const first = this.getStructureSignature(definitions[0].definition);
    return definitions.slice(1).some((def) => this.getStructureSignature(def.definition) !== first);
  }

  private generateTypeSuggestion(typeName: string, definitions: TypeDefinition[]): string {
    const packages = Array.from(new Set(definitions.map((d) => d.packageName)));

    if (packages.length > 1) {
      return `Move ${typeName} to a shared package (e.g., @klikkflow/core or shared) to ensure consistency across ${packages.join(', ')}`;
    }

    return `Consolidate different definitions of ${typeName} within the same package`;
  }

  private async validateInterfaceCompatibility(): Promise<InterfaceCompatibilityReport> {
    const incompatibilities: InterfaceIncompatibility[] = [];

    if (!(this.program && this.typeChecker)) {
      return {
        incompatibilities: [],
        totalInterfaces: 0,
        compatibilityScore: 100,
      };
    }

    // Get all source files
    const sourceFiles = this.program
      .getSourceFiles()
      .filter((sf) => !sf.isDeclarationFile && sf.fileName.includes('packages/'));

    let totalInterfaces = 0;

    for (const sourceFile of sourceFiles) {
      const packageName = this.extractPackageNameFromPath(sourceFile.fileName);

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name) {
          totalInterfaces++;
          const _interfaceName = node.name.text;

          // Check for compatibility issues
          const issues = this.checkInterfaceCompatibility(node, sourceFile, packageName);
          incompatibilities.push(...issues);
        }
      });
    }

    const compatibilityScore =
      totalInterfaces > 0
        ? Math.max(0, ((totalInterfaces - incompatibilities.length) / totalInterfaces) * 100)
        : 100;

    return {
      incompatibilities,
      totalInterfaces,
      compatibilityScore,
    };
  }

  private checkInterfaceCompatibility(
    interfaceNode: ts.InterfaceDeclaration,
    _sourceFile: ts.SourceFile,
    packageName: string
  ): InterfaceIncompatibility[] {
    const incompatibilities: InterfaceIncompatibility[] = [];
    const interfaceName = interfaceNode.name.text;

    // Check for breaking changes in interface extensions
    if (interfaceNode.heritageClauses) {
      for (const heritageClause of interfaceNode.heritageClauses) {
        for (const typeRef of heritageClause.types) {
          if (ts.isIdentifier(typeRef.expression)) {
            const baseInterfaceName = typeRef.expression.text;

            // Check if base interface exists and is compatible
            const baseInterface = this.findInterfaceInOtherPackages(baseInterfaceName, packageName);
            if (baseInterface && !this.areInterfacesCompatible(interfaceNode, baseInterface.node)) {
              incompatibilities.push({
                interfaceName,
                sourcePackage: packageName,
                targetPackage: baseInterface.packageName,
                incompatibilityType: 'breaking_change',
                details: `Interface ${interfaceName} extends ${baseInterfaceName} but introduces breaking changes`,
                severity: 'error',
                suggestion: `Review interface inheritance and ensure backward compatibility`,
              });
            }
          }
        }
      }
    }

    // Check for missing required properties when used across packages
    const usages = this.findInterfaceUsages(interfaceName, packageName);
    for (const usage of usages) {
      const missingProperties = this.findMissingProperties(interfaceNode, usage);
      if (missingProperties.length > 0) {
        incompatibilities.push({
          interfaceName,
          sourcePackage: packageName,
          targetPackage: usage.packageName,
          incompatibilityType: 'missing_property',
          details: `Missing properties: ${missingProperties.join(', ')}`,
          severity: 'error',
          suggestion: `Add missing properties or make them optional`,
        });
      }
    }

    return incompatibilities;
  }

  private findInterfaceInOtherPackages(
    interfaceName: string,
    excludePackage: string
  ): { packageName: string; node: ts.InterfaceDeclaration } | null {
    if (!this.program) {
      return null;
    }

    const sourceFiles = this.program
      .getSourceFiles()
      .filter((sf) => !sf.isDeclarationFile && sf.fileName.includes('packages/'));

    for (const sourceFile of sourceFiles) {
      const packageName = this.extractPackageNameFromPath(sourceFile.fileName);
      if (packageName === excludePackage) {
        continue;
      }

      let foundInterface: ts.InterfaceDeclaration | null = null;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name && node.name.text === interfaceName) {
          foundInterface = node;
        }
      });

      if (foundInterface) {
        return { packageName, node: foundInterface };
      }
    }

    return null;
  }

  private areInterfacesCompatible(
    derived: ts.InterfaceDeclaration,
    base: ts.InterfaceDeclaration
  ): boolean {
    // Simplified compatibility check - in practice, this would be more sophisticated
    const derivedProps = this.getInterfaceProperties(derived);
    const baseProps = this.getInterfaceProperties(base);

    // Check if all base properties exist in derived
    for (const baseProp of baseProps) {
      const derivedProp = derivedProps.find((p) => p.name === baseProp.name);
      if (!derivedProp) {
        return false;
      }

      // Simple type compatibility check
      if (
        derivedProp.type !== baseProp.type &&
        !this.areTypesCompatible(derivedProp.type, baseProp.type)
      ) {
        return false;
      }
    }

    return true;
  }

  private getInterfaceProperties(
    interfaceNode: ts.InterfaceDeclaration
  ): Array<{ name: string; type: string; optional: boolean }> {
    const properties: Array<{ name: string; type: string; optional: boolean }> = [];

    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
        const name = member.name.text;
        const type = member.type ? member.type.getText() : 'any';
        const optional = !!member.questionToken;

        properties.push({ name, type, optional });
      }
    }

    return properties;
  }

  private areTypesCompatible(type1: string, type2: string): boolean {
    // Simplified type compatibility - in practice, this would use TypeScript's type checker
    const normalize = (type: string) => type.replace(/\s+/g, '').toLowerCase();
    return normalize(type1) === normalize(type2);
  }

  private findInterfaceUsages(
    _interfaceName: string,
    _sourcePackage: string
  ): Array<{ packageName: string; usage: string }> {
    // Simplified usage finding - in practice, this would analyze imports and usage patterns
    return [];
  }

  private findMissingProperties(
    _interfaceNode: ts.InterfaceDeclaration,
    _usage: { packageName: string; usage: string }
  ): string[] {
    // Simplified missing property detection
    return [];
  }

  private async validateExportStructure(): Promise<ExportStructureReport> {
    const issues: ExportIssue[] = [];
    let totalExports = 0;

    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const srcPath = path.join(packagePath, 'src');
      const files = await this.getTypeScriptFiles(srcPath);

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativeFilePath = path.relative(this.workspaceRoot, filePath);
          const fileIssues = this.analyzeExportStructure(content, packageName, relativeFilePath);
          issues.push(...fileIssues);

          // Count exports
          const exportCount = (content.match(/export\s+/g) || []).length;
          totalExports += exportCount;
        } catch (_error) {
          // Skip files that can't be read
        }
      }
    }

    const structureScore =
      totalExports > 0 ? Math.max(0, ((totalExports - issues.length) / totalExports) * 100) : 100;
    const optimizationOpportunities = this.generateOptimizationOpportunities(issues);

    return {
      issues,
      totalExports,
      structureScore,
      optimizationOpportunities,
    };
  }

  private analyzeExportStructure(
    content: string,
    packageName: string,
    filePath: string
  ): ExportIssue[] {
    const issues: ExportIssue[] = [];

    // Check for unused exports (simplified - would need usage analysis)
    const exportMatches = Array.from(
      content.matchAll(
        /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
      )
    );
    exportMatches.forEach((match) => {
      const exportName = match[1];

      // Simple heuristic: if export is not used in other files, it might be unused
      // In practice, this would require cross-file analysis
      if (this.isLikelyUnusedExport(exportName, content)) {
        issues.push({
          packageName,
          filePath,
          issueType: 'unused_export',
          description: `Export '${exportName}' appears to be unused`,
          severity: 'info',
          suggestion: `Consider removing unused export or documenting its purpose`,
        });
      }
    });

    // Check for missing index exports
    if (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')) {
      const hasReExports = /export\s+\*\s+from|export\s+{[^}]+}\s+from/.test(content);
      if (!hasReExports && content.includes('export')) {
        issues.push({
          packageName,
          filePath,
          issueType: 'missing_export',
          description: 'Index file should re-export from other modules',
          severity: 'warning',
          suggestion: 'Use re-export syntax to expose module contents',
        });
      }
    }

    // Check for circular exports
    const circularExports = this.detectCircularExports(content, filePath);
    issues.push(
      ...circularExports.map((circular) => ({
        packageName,
        filePath,
        issueType: 'circular_export' as const,
        description: circular,
        severity: 'warning' as const,
        suggestion: 'Refactor to avoid circular dependencies',
      }))
    );

    // Check for inconsistent naming
    const namingIssues = this.checkExportNaming(content);
    issues.push(
      ...namingIssues.map((naming) => ({
        packageName,
        filePath,
        issueType: 'inconsistent_naming' as const,
        description: naming,
        severity: 'info' as const,
        suggestion: 'Use consistent naming conventions for exports',
      }))
    );

    return issues;
  }

  private isLikelyUnusedExport(exportName: string, content: string): boolean {
    // Simple heuristic - check if the export is referenced elsewhere in the same file
    const usagePattern = new RegExp(`\\b${exportName}\\b`, 'g');
    const matches = content.match(usagePattern) || [];

    // If it appears only once (the export declaration), it might be unused
    return matches.length <= 1;
  }

  private detectCircularExports(content: string, _filePath: string): string[] {
    const circular: string[] = [];

    // Look for re-exports that might create cycles
    const reExportMatches = Array.from(content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g));
    reExportMatches.forEach((match) => {
      const importPath = match[1];

      // Check if the import path could create a circular dependency
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // This is a simplified check - in practice, you'd need to resolve the full path
        circular.push(`Potential circular export to ${importPath}`);
      }
    });

    return circular;
  }

  private checkExportNaming(content: string): string[] {
    const issues: string[] = [];

    // Check for inconsistent export naming patterns
    const exportMatches = content.matchAll(
      /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    );
    const exportNames = Array.from(exportMatches).map((match) => match[1]);

    // Check for mixed naming conventions
    const hasCamelCase = exportNames.some((name) => /^[a-z][a-zA-Z0-9]*$/.test(name));
    const hasPascalCase = exportNames.some((name) => /^[A-Z][a-zA-Z0-9]*$/.test(name));
    const hasSnakeCase = exportNames.some((name) => /^[a-z_]+$/.test(name));

    let conventionCount = 0;
    if (hasCamelCase) {
      conventionCount++;
    }
    if (hasPascalCase) {
      conventionCount++;
    }
    if (hasSnakeCase) {
      conventionCount++;
    }

    if (conventionCount > 1) {
      issues.push('Mixed naming conventions in exports (camelCase, PascalCase, snake_case)');
    }

    return issues;
  }

  private generateOptimizationOpportunities(issues: ExportIssue[]): string[] {
    const opportunities: string[] = [];

    const unusedExports = issues.filter((i) => i.issueType === 'unused_export');
    const missingExports = issues.filter((i) => i.issueType === 'missing_export');
    const circularExports = issues.filter((i) => i.issueType === 'circular_export');
    const namingIssues = issues.filter((i) => i.issueType === 'inconsistent_naming');

    if (unusedExports.length > 0) {
      opportunities.push(`Remove ${unusedExports.length} unused exports to reduce bundle size`);
    }

    if (missingExports.length > 0) {
      opportunities.push(
        `Add proper re-exports in ${missingExports.length} index files for better API structure`
      );
    }

    if (circularExports.length > 0) {
      opportunities.push(
        `Resolve ${circularExports.length} potential circular export dependencies`
      );
    }

    if (namingIssues.length > 0) {
      opportunities.push(`Standardize naming conventions across ${namingIssues.length} files`);
    }

    if (opportunities.length === 0) {
      opportunities.push('Export structure is well-organized!');
    }

    return opportunities;
  }

  private async getTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.getTypeScriptFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (_error) {
      // Directory might not exist or be accessible
    }

    return files;
  }

  private async getPackageName(packagePath: string): Promise<string> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      return packageJson.name || path.basename(packagePath);
    } catch (_error) {
      return path.basename(packagePath);
    }
  }

  private extractPackageNameFromPath(filePath: string): string {
    const match = filePath.match(/packages\/([^/]+(?:\/[^/]+)?)/);
    return match ? match[1] : 'unknown';
  }

  private calculateOverallScore(
    consistencyReport: TypeConsistencyReport,
    compatibilityReport: InterfaceCompatibilityReport,
    exportReport: ExportStructureReport
  ): number {
    // Weighted average of different aspects
    const weights = {
      consistency: 0.4,
      compatibility: 0.4,
      exports: 0.2,
    };

    return (
      consistencyReport.consistencyScore * weights.consistency +
      compatibilityReport.compatibilityScore * weights.compatibility +
      exportReport.structureScore * weights.exports
    );
  }

  private generateTypeSafetyRecommendations(
    consistencyReport: TypeConsistencyReport,
    compatibilityReport: InterfaceCompatibilityReport,
    exportReport: ExportStructureReport
  ): string[] {
    const recommendations: string[] = [];

    // Overall assessment
    const overallScore = this.calculateOverallScore(
      consistencyReport,
      compatibilityReport,
      exportReport
    );

    if (overallScore >= 90) {
      recommendations.push(
        '✅ Excellent type safety! Your types are well-organized and consistent.'
      );
    } else if (overallScore >= 70) {
      recommendations.push('✅ Good type safety with some areas for improvement.');
    } else {
      recommendations.push(
        '⚠️ Type safety issues detected. Consider refactoring for better consistency.'
      );
    }

    // Specific recommendations
    if (consistencyReport.consistencyScore < 80) {
      recommendations.push(
        '🔄 Type consistency improvements needed:',
        '• Move shared types to common packages (@klikkflow/core or shared)',
        '• Establish type naming conventions',
        '• Use type aliases for complex types',
        '• Document type definitions and their purposes'
      );
    }

    if (compatibilityReport.compatibilityScore < 80) {
      recommendations.push(
        '🔗 Interface compatibility improvements needed:',
        '• Review interface inheritance chains',
        '• Use generic types for flexibility',
        '• Implement proper versioning for breaking changes',
        '• Add compatibility tests for cross-package interfaces'
      );
    }

    if (exportReport.structureScore < 80) {
      recommendations.push(
        '📦 Export structure improvements needed:',
        '• Clean up unused exports',
        '• Implement proper barrel exports (index.ts files)',
        '• Use consistent naming conventions',
        '• Document public APIs clearly'
      );
    }

    recommendations.push(
      '🔧 General type safety recommendations:',
      '• Enable strict TypeScript compiler options',
      '• Use type-only imports where appropriate',
      '• Implement automated type checking in CI',
      '• Regular type safety audits and refactoring',
      '• Consider using branded types for domain-specific values'
    );

    return recommendations;
  }
}

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as madge from 'madge';
import type {
  ArchitectureValidationOptions,
  BoundaryViolation,
  CircularDependency,
  CircularDependencyReport,
  DependencyEdge,
  DependencyGraph,
  DependencyMetrics,
  DependencyNode,
  PackageBoundaryReport,
} from './types';

export class DependencyAnalyzer {
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
      } catch (_error) {
        // @reporunner directory might not exist
      }

      return packages;
    } catch (_error) {
      return [];
    }
  }

  async checkCircularDependencies(
    _options: ArchitectureValidationOptions = {}
  ): Promise<CircularDependencyReport> {
    try {
      const config = {
        fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
        excludeRegExp: [
          /node_modules/,
          /\.d\.ts$/,
          /\.test\./,
          /\.spec\./,
          /dist/,
          /build/,
          /__tests__/,
        ],
      };

      // Check for circular dependencies at package level
      const packageCirculars = await this.checkPackageLevelCirculars();

      // Check for circular dependencies at file level within packages
      const fileCirculars = await this.checkFileLevelCirculars(config);

      const allCirculars = [...packageCirculars, ...fileCirculars];
      const affectedPackages = this.getAffectedPackages(allCirculars);

      return {
        hasCircularDependencies: allCirculars.length > 0,
        circularDependencies: allCirculars,
        totalPackages: this.packagePaths.length,
        affectedPackages,
        severity: this.calculateSeverity(allCirculars),
        recommendations: this.generateCircularDependencyRecommendations(allCirculars),
      };
    } catch (_error) {
      return {
        hasCircularDependencies: false,
        circularDependencies: [],
        totalPackages: 0,
        affectedPackages: [],
        severity: 'low',
        recommendations: [
          'Failed to analyze circular dependencies. Please check the configuration.',
        ],
      };
    }
  }

  private async checkPackageLevelCirculars(): Promise<CircularDependency[]> {
    const packageDependencies = new Map<string, Set<string>>();

    // Build package dependency map
    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const dependencies = await this.getPackageDependencies(packagePath);
      packageDependencies.set(packageName, new Set(dependencies));
    }

    // Find circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circulars: CircularDependency[] = [];

    const dfs = (packageName: string, path: string[]): void => {
      visited.add(packageName);
      recursionStack.add(packageName);

      const dependencies = packageDependencies.get(packageName) || new Set();

      dependencies.forEach((dep) => {
        if (packageDependencies.has(dep)) {
          // Only check internal packages
          if (!visited.has(dep)) {
            dfs(dep, [...path, packageName]);
          } else if (recursionStack.has(dep)) {
            // Found circular dependency
            const cycleStart = path.indexOf(dep);
            const cycle = [...path.slice(cycleStart), packageName, dep];
            circulars.push({
              cycle,
              depth: cycle.length,
              type: 'package',
              impact: this.calculateImpact(cycle.length),
            });
          }
        }
      });

      recursionStack.delete(packageName);
    };

    Array.from(packageDependencies.keys()).forEach((packageName) => {
      if (!visited.has(packageName)) {
        dfs(packageName, []);
      }
    });

    return circulars;
  }

  private async checkFileLevelCirculars(config: any): Promise<CircularDependency[]> {
    const circulars: CircularDependency[] = [];

    for (const packagePath of this.packagePaths) {
      try {
        const srcPath = path.join(packagePath, 'src');
        const exists = await fs
          .access(srcPath)
          .then(() => true)
          .catch(() => false);

        if (!exists) {
          continue;
        }

        const result = await madge.default(srcPath, config);
        const packageCirculars = result.circular();

        for (const circular of packageCirculars) {
          circulars.push({
            cycle: circular,
            depth: circular.length,
            type: 'file',
            impact: this.calculateImpact(circular.length),
          });
        }
      } catch (_error) {}
    }

    return circulars;
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

  private async getPackageDependencies(packagePath: string): Promise<string[]> {
    try {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const dependencies = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
      ];

      // Filter to only internal packages
      return dependencies.filter(
        (dep) => dep.startsWith('@reporunner/') || ['backend', 'frontend', 'shared'].includes(dep)
      );
    } catch (_error) {
      return [];
    }
  }

  private getAffectedPackages(circulars: CircularDependency[]): string[] {
    const affected = new Set<string>();

    for (const circular of circulars) {
      for (const item of circular.cycle) {
        if (circular.type === 'package') {
          affected.add(item);
        } else {
          // Extract package name from file path
          const packageName = this.extractPackageFromFilePath(item);
          if (packageName) {
            affected.add(packageName);
          }
        }
      }
    }

    return Array.from(affected);
  }

  private extractPackageFromFilePath(filePath: string): string | null {
    const match = filePath.match(/packages\/([^/]+(?:\/[^/]+)?)/);
    return match ? match[1] : null;
  }

  private calculateSeverity(
    circulars: CircularDependency[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (circulars.length === 0) {
      return 'low';
    }

    const hasPackageLevel = circulars.some((c) => c.type === 'package');
    const hasHighImpact = circulars.some((c) => c.impact === 'high');
    const totalCirculars = circulars.length;

    if (hasPackageLevel || totalCirculars > 10) {
      return 'critical';
    }
    if (hasHighImpact || totalCirculars > 5) {
      return 'high';
    }
    if (totalCirculars > 2) {
      return 'medium';
    }
    return 'low';
  }

  private calculateImpact(cycleLength: number): 'low' | 'medium' | 'high' {
    if (cycleLength <= 2) {
      return 'low';
    }
    if (cycleLength <= 4) {
      return 'medium';
    }
    return 'high';
  }

  private generateCircularDependencyRecommendations(circulars: CircularDependency[]): string[] {
    const recommendations: string[] = [];

    if (circulars.length === 0) {
      recommendations.push(
        '✅ No circular dependencies detected. Great job maintaining clean architecture!'
      );
      return recommendations;
    }

    const packageCirculars = circulars.filter((c) => c.type === 'package');
    const fileCirculars = circulars.filter((c) => c.type === 'file');

    if (packageCirculars.length > 0) {
      recommendations.push(
        '🚨 Package-level circular dependencies detected. These are critical and should be resolved immediately.',
        '• Consider introducing a shared package for common functionality',
        '• Use dependency inversion principle to break cycles',
        '• Review package boundaries and responsibilities'
      );
    }

    if (fileCirculars.length > 0) {
      recommendations.push(
        '⚠️ File-level circular dependencies detected.',
        '• Extract shared functionality into separate modules',
        '• Use interfaces to break tight coupling',
        '• Consider refactoring to use event-driven patterns'
      );
    }

    recommendations.push(
      '📋 General recommendations:',
      '• Run `pnpm analyze:deps` regularly to catch new circular dependencies',
      '• Set up pre-commit hooks to prevent circular dependencies',
      '• Document package dependencies and their purposes'
    );

    return recommendations;
  }

  async validatePackageBoundaries(): Promise<PackageBoundaryReport> {
    const violations: BoundaryViolation[] = [];
    let totalChecks = 0;

    // Define package layers and allowed dependencies
    const packageLayers = {
      shared: 0,
      '@reporunner/core': 1,
      '@reporunner/auth': 2,
      '@reporunner/services': 2,
      '@reporunner/workflow': 2,
      '@reporunner/ai': 2,
      '@reporunner/integrations': 2,
      '@reporunner/platform': 3,
      '@reporunner/enterprise': 3,
      backend: 4,
      frontend: 4,
      '@reporunner/cli': 4,
      '@reporunner/validation': 4,
    };

    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const dependencies = await this.getPackageDependencies(packagePath);

      const currentLayer = (packageLayers as Record<string, number>)[packageName] || 999;

      for (const dep of dependencies) {
        totalChecks++;
        const depLayer = (packageLayers as Record<string, number>)[dep] || 999;

        // Check layer violations (higher layers shouldn't depend on lower layers)
        if (depLayer > currentLayer) {
          violations.push({
            sourcePackage: packageName,
            targetPackage: dep,
            violationType: 'layer_violation',
            filePath: path.join(packagePath, 'package.json'),
            severity: 'error',
            suggestion: `Package ${packageName} (layer ${currentLayer}) should not depend on ${dep} (layer ${depLayer}). Consider restructuring dependencies.`,
          });
        }

        // Check for unauthorized access patterns
        if (this.isUnauthorizedAccess(packageName, dep)) {
          violations.push({
            sourcePackage: packageName,
            targetPackage: dep,
            violationType: 'unauthorized_access',
            filePath: path.join(packagePath, 'package.json'),
            severity: 'warning',
            suggestion: `Consider if ${packageName} should directly depend on ${dep}. Use proper interfaces or go through appropriate layers.`,
          });
        }
      }
    }

    const violationCount = violations.length;
    const complianceScore =
      totalChecks > 0 ? Math.max(0, ((totalChecks - violationCount) / totalChecks) * 100) : 100;

    return {
      violations,
      totalChecks,
      violationCount,
      complianceScore,
      recommendations: this.generateBoundaryRecommendations(violations, complianceScore),
    };
  }

  private isUnauthorizedAccess(source: string, target: string): boolean {
    // Define unauthorized access patterns
    const unauthorizedPatterns = [
      // Frontend shouldn't directly access backend internals
      { source: 'frontend', target: '@reporunner/services' },
      // CLI shouldn't access frontend components
      { source: '@reporunner/cli', target: 'frontend' },
      // Core packages shouldn't depend on higher-level packages
      { source: '@reporunner/core', target: '@reporunner/platform' },
      { source: '@reporunner/core', target: '@reporunner/enterprise' },
    ];

    return unauthorizedPatterns.some(
      (pattern) => source === pattern.source && target === pattern.target
    );
  }

  private generateBoundaryRecommendations(
    violations: BoundaryViolation[],
    complianceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (complianceScore >= 90) {
      recommendations.push('✅ Excellent package boundary compliance!');
    } else if (complianceScore >= 70) {
      recommendations.push('✅ Good package boundary compliance with room for improvement.');
    } else {
      recommendations.push(
        '⚠️ Package boundary violations detected. Review and refactor dependencies.'
      );
    }

    const layerViolations = violations.filter((v) => v.violationType === 'layer_violation');
    const unauthorizedAccess = violations.filter((v) => v.violationType === 'unauthorized_access');

    if (layerViolations.length > 0) {
      recommendations.push(
        '🏗️ Layer violations found:',
        '• Review package architecture and layer definitions',
        '• Consider introducing adapter patterns for cross-layer communication',
        '• Move shared functionality to appropriate lower layers'
      );
    }

    if (unauthorizedAccess.length > 0) {
      recommendations.push(
        '🔒 Unauthorized access patterns detected:',
        '• Use proper interfaces and abstractions',
        '• Implement facade patterns for complex subsystems',
        '• Consider event-driven communication for loose coupling'
      );
    }

    return recommendations;
  }

  async generateDependencyGraph(): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const packageDependencies = new Map<string, string[]>();

    // Build nodes and collect dependencies
    for (const packagePath of this.packagePaths) {
      const packageName = await this.getPackageName(packagePath);
      const dependencies = await this.getPackageDependencies(packagePath);
      packageDependencies.set(packageName, dependencies);

      // Calculate package size (approximate)
      const size = await this.calculatePackageSize(packagePath);

      nodes.push({
        id: packageName,
        name: packageName,
        type: 'package',
        size,
        dependencies: dependencies.length,
        dependents: 0, // Will be calculated below
        layer: this.getPackageLayer(packageName),
      });
    }

    // Build edges and calculate dependents
    Array.from(packageDependencies.entries()).forEach(([packageName, dependencies]) => {
      dependencies.forEach((dep) => {
        if (packageDependencies.has(dep)) {
          edges.push({
            from: packageName,
            to: dep,
            weight: 1,
            type: 'direct',
          });

          // Update dependent count
          const depNode = nodes.find((n) => n.id === dep);
          if (depNode) {
            depNode.dependents++;
          }
        }
      });
    });

    const metrics = this.calculateDependencyMetrics(nodes, edges);
    const visualization = this.generateDotVisualization(nodes, edges);

    return {
      nodes,
      edges,
      metrics,
      visualization,
    };
  }

  private async calculatePackageSize(packagePath: string): Promise<number> {
    try {
      const srcPath = path.join(packagePath, 'src');
      const exists = await fs
        .access(srcPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return 0;
      }

      // Simple approximation: count TypeScript files
      const files = await this.getFilesRecursively(srcPath, ['.ts', '.tsx']);
      return files.length;
    } catch (_error) {
      return 0;
    }
  }

  private async getFilesRecursively(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath, extensions);
          files.push(...subFiles);
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (_error) {
      // Directory might not exist or be accessible
    }

    return files;
  }

  private getPackageLayer(packageName: string): string {
    if (packageName === 'shared') {
      return 'foundation';
    }
    if (packageName.startsWith('@reporunner/core')) {
      return 'core';
    }
    if (
      [
        '@reporunner/auth',
        '@reporunner/services',
        '@reporunner/workflow',
        '@reporunner/ai',
      ].includes(packageName)
    ) {
      return 'domain';
    }
    if (['@reporunner/platform', '@reporunner/enterprise'].includes(packageName)) {
      return 'platform';
    }
    if (['backend', 'frontend', '@reporunner/cli'].includes(packageName)) {
      return 'application';
    }
    return 'utility';
  }

  private calculateDependencyMetrics(
    nodes: DependencyNode[],
    edges: DependencyEdge[]
  ): DependencyMetrics {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const averageDependencies =
      totalNodes > 0 ? nodes.reduce((sum, n) => sum + n.dependencies, 0) / totalNodes : 0;
    const maxDependencies = Math.max(...nodes.map((n) => n.dependencies), 0);

    // Simple approximation of cyclomatic complexity
    const cyclomaticComplexity = totalEdges - totalNodes + 2;

    // Instability: Ce / (Ca + Ce) where Ce = efferent coupling, Ca = afferent coupling
    const instability =
      totalNodes > 0
        ? nodes.reduce((sum, n) => sum + n.dependencies / (n.dependencies + n.dependents || 1), 0) /
          totalNodes
        : 0;

    // Abstractness: placeholder (would need actual analysis of abstract classes/interfaces)
    const abstractness = 0.5;

    return {
      totalNodes,
      totalEdges,
      averageDependencies,
      maxDependencies,
      cyclomaticComplexity,
      instability,
      abstractness,
    };
  }

  private generateDotVisualization(nodes: DependencyNode[], edges: DependencyEdge[]): string {
    const lines = ['digraph Dependencies {'];
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=filled];');

    // Add nodes with colors based on layer
    const layerColors = {
      foundation: '#e1f5fe',
      core: '#f3e5f5',
      domain: '#e8f5e8',
      platform: '#fff3e0',
      application: '#ffebee',
      utility: '#f5f5f5',
    };

    for (const node of nodes) {
      const color = (layerColors as Record<string, string>)[node.layer] || '#ffffff';
      lines.push(
        `  "${node.id}" [fillcolor="${color}", label="${node.name}\\n(${node.dependencies} deps, ${node.dependents} dependents)"];`
      );
    }

    // Add edges
    for (const edge of edges) {
      lines.push(`  "${edge.from}" -> "${edge.to}";`);
    }

    lines.push('}');
    return lines.join('\n');
  }
}

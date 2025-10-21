import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CircularDependency } from './types';

export class CircularDependencyDetector {
  private workspaceRoot: string;
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async detectCircularDependencies(): Promise<CircularDependency[]> {
    // Build dependency graph
    await this.buildDependencyGraph();

    // Find cycles using DFS
    const cycles = this.findCycles();

    // Convert cycles to CircularDependency objects with analysis
    return cycles.map((cycle) => this.analyzeCycle(cycle));
  }

  private async buildDependencyGraph(): Promise<void> {
    this.dependencyGraph.clear();

    // Get all TypeScript files
    const tsFiles = await this.getAllTypeScriptFiles();

    for (const filePath of tsFiles) {
      try {
        const dependencies = await this.extractDependencies(filePath);
        this.dependencyGraph.set(filePath, new Set(dependencies));
      } catch (_error) {
        this.dependencyGraph.set(filePath, new Set());
      }
    }
  }

  private async extractDependencies(filePath: string): Promise<string[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const dependencies: string[] = [];

    // Match import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Resolve relative imports to absolute paths
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const resolvedPath = this.resolveRelativeImport(filePath, importPath);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
        }
      } else if (
        importPath.startsWith('@klikkflow/') ||
        importPath.startsWith('../packages/') ||
        importPath.startsWith('./packages/')
      ) {
        // Handle workspace package imports
        const resolvedPath = this.resolveWorkspaceImport(importPath);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
        }
      }
    }

    return dependencies;
  }

  private resolveRelativeImport(fromFile: string, importPath: string): string | null {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importPath);

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private resolveWorkspaceImport(importPath: string): string | null {
    // Handle @klikkflow/ imports
    if (importPath.startsWith('@klikkflow/')) {
      const packageName = importPath.split('/')[1];
      const packagePath = path.join(this.workspaceRoot, 'packages', '@klikkflow', packageName);

      if (fs.existsSync(packagePath)) {
        // Try to find the main entry point
        const packageJsonPath = path.join(packagePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const mainFile = packageJson.main || 'src/index.ts';
            const mainPath = path.join(packagePath, mainFile);

            if (fs.existsSync(mainPath)) {
              return mainPath;
            }
          } catch (_error) {
            // Fallback to src/index.ts
          }
        }

        // Fallback to src/index.ts
        const indexPath = path.join(packagePath, 'src', 'index.ts');
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    // Handle other workspace imports
    if (importPath.includes('packages/')) {
      const resolvedPath = path.resolve(this.workspaceRoot, importPath);
      if (fs.existsSync(`${resolvedPath}.ts`)) {
        return `${resolvedPath}.ts`;
      }
      if (fs.existsSync(`${resolvedPath}.tsx`)) {
        return `${resolvedPath}.tsx`;
      }
    }

    return null;
  }

  private findCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    for (const node of this.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        this.dfsForCycles(node, visited, recursionStack, currentPath, cycles);
      }
    }

    return cycles;
  }

  private dfsForCycles(
    node: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    currentPath: string[],
    cycles: string[][]
  ): void {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    const dependencies = this.dependencyGraph.get(node) || new Set();

    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        this.dfsForCycles(dependency, visited, recursionStack, currentPath, cycles);
      } else if (recursionStack.has(dependency)) {
        // Found a cycle
        const cycleStartIndex = currentPath.indexOf(dependency);
        if (cycleStartIndex !== -1) {
          const cycle = [...currentPath.slice(cycleStartIndex), dependency];
          cycles.push(cycle);
        }
      }
    }

    recursionStack.delete(node);
    currentPath.pop();
  }

  private analyzeCycle(cycle: string[]): CircularDependency {
    // Determine severity based on cycle characteristics
    let severity: 'critical' | 'warning' = 'warning';
    const suggestions: string[] = [];

    // Check if cycle involves core packages (more critical)
    const corePackages = ['@klikkflow/core', 'shared'];
    const involvesCorePackage = cycle.some((filePath) =>
      corePackages.some((pkg) => filePath.includes(pkg))
    );

    if (involvesCorePackage) {
      severity = 'critical';
      suggestions.push('Refactor core package dependencies to avoid circular references');
    }

    // Check cycle length (shorter cycles are more problematic)
    if (cycle.length <= 3) {
      severity = 'critical';
      suggestions.push('Short circular dependencies can cause immediate runtime issues');
    }

    // Generate specific suggestions based on file types
    const fileTypes = cycle.map((filePath) => {
      if (filePath.includes('/types/')) {
        return 'types';
      }
      if (filePath.includes('/services/')) {
        return 'services';
      }
      if (filePath.includes('/controllers/')) {
        return 'controllers';
      }
      if (filePath.includes('/components/')) {
        return 'components';
      }
      return 'other';
    });

    if (fileTypes.includes('types')) {
      suggestions.push('Consider moving shared types to a separate types-only package');
    }

    if (fileTypes.includes('services') && fileTypes.includes('controllers')) {
      suggestions.push(
        'Use dependency injection or event-driven patterns to decouple services and controllers'
      );
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Extract shared functionality into a separate module');
      suggestions.push('Use interfaces or abstract classes to break direct dependencies');
      suggestions.push('Consider using dependency injection patterns');
    }

    // Create readable cycle description
    const relativePaths = cycle.map((filePath) => path.relative(this.workspaceRoot, filePath));
    const description = `Circular dependency chain: ${relativePaths.join(' → ')}`;

    return {
      cycle: relativePaths,
      severity,
      description,
      suggestions,
    };
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

  // Public method to get dependency graph for analysis
  getDependencyGraph(): Map<string, Set<string>> {
    return new Map(this.dependencyGraph);
  }

  // Public method to check if a specific import would create a cycle
  async wouldCreateCycle(fromFile: string, toFile: string): Promise<boolean> {
    // Temporarily add the dependency and check for cycles
    const originalDeps = this.dependencyGraph.get(fromFile) || new Set();
    const tempDeps = new Set([...originalDeps, toFile]);
    this.dependencyGraph.set(fromFile, tempDeps);

    const cycles = this.findCycles();
    const wouldCreate = cycles.some((cycle) => cycle.includes(fromFile) && cycle.includes(toFile));

    // Restore original dependencies
    this.dependencyGraph.set(fromFile, originalDeps);

    return wouldCreate;
  }
}

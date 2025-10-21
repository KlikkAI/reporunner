import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

export interface IDEPerformanceMetrics {
  typeCheckingTime: number;
  autocompleteResponseTime: number;
  navigationSpeed: number;
  intelliSenseLatency: number;
  sourceMapResolutionTime: number;
}

export interface WorkflowTimingMetrics {
  hotReloadTime: number;
  buildStartupTime: number;
  testExecutionTime: number;
  lintingTime: number;
  formattingTime: number;
}

export interface ProductivityMetrics {
  averageCompileTime: number;
  errorResolutionTime: number;
  refactoringEfficiency: number;
  debuggingSpeed: number;
  codeNavigationEfficiency: number;
}

export interface DevExperienceReport {
  timestamp: Date;
  idePerformance: IDEPerformanceMetrics;
  workflowTiming: WorkflowTimingMetrics;
  productivity: ProductivityMetrics;
  recommendations: string[];
  score: number; // 0-100
}

export class DevExperienceMetrics {
  private workspaceRoot: string;
  private measurements: Map<string, number[]> = new Map();

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Measure IDE performance metrics
   */
  async measureIDEPerformance(): Promise<IDEPerformanceMetrics> {
    const typeCheckingTime = await this.measureTypeChecking();
    const autocompleteResponseTime = await this.measureAutocompleteResponse();
    const navigationSpeed = await this.measureNavigationSpeed();
    const intelliSenseLatency = await this.measureIntelliSenseLatency();
    const sourceMapResolutionTime = await this.measureSourceMapResolution();

    return {
      typeCheckingTime,
      autocompleteResponseTime,
      navigationSpeed,
      intelliSenseLatency,
      sourceMapResolutionTime,
    };
  }

  /**
   * Measure development workflow timing
   */
  async measureWorkflowTiming(): Promise<WorkflowTimingMetrics> {
    const hotReloadTime = await this.measureHotReload();
    const buildStartupTime = await this.measureBuildStartup();
    const testExecutionTime = await this.measureTestExecution();
    const lintingTime = await this.measureLinting();
    const formattingTime = await this.measureFormatting();

    return {
      hotReloadTime,
      buildStartupTime,
      testExecutionTime,
      lintingTime,
      formattingTime,
    };
  }

  /**
   * Calculate productivity metrics
   */
  async measureProductivity(): Promise<ProductivityMetrics> {
    const averageCompileTime = this.calculateAverageMetric('compile');
    const errorResolutionTime = this.calculateAverageMetric('errorResolution');
    const refactoringEfficiency = await this.measureRefactoringEfficiency();
    const debuggingSpeed = this.calculateAverageMetric('debugging');
    const codeNavigationEfficiency = await this.measureCodeNavigationEfficiency();

    return {
      averageCompileTime,
      errorResolutionTime,
      refactoringEfficiency,
      debuggingSpeed,
      codeNavigationEfficiency,
    };
  }

  /**
   * Generate comprehensive developer experience report
   */
  async generateReport(): Promise<DevExperienceReport> {
    const idePerformance = await this.measureIDEPerformance();
    const workflowTiming = await this.measureWorkflowTiming();
    const productivity = await this.measureProductivity();
    const recommendations = this.generateRecommendations(
      idePerformance,
      workflowTiming,
      productivity
    );
    const score = this.calculateOverallScore(idePerformance, workflowTiming, productivity);

    return {
      timestamp: new Date(),
      idePerformance,
      workflowTiming,
      productivity,
      recommendations,
      score,
    };
  }

  /**
   * Record a measurement for later analysis
   */
  recordMeasurement(metric: string, value: number): void {
    if (!this.measurements.has(metric)) {
      this.measurements.set(metric, []);
    }
    this.measurements.get(metric)?.push(value);
  }

  private async measureTypeChecking(): Promise<number> {
    const start = performance.now();

    try {
      await this.runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck']);
      const end = performance.now();
      return end - start;
    } catch (_error) {
      // If TypeScript check fails, still return timing
      const end = performance.now();
      return end - start;
    }
  }

  private async measureAutocompleteResponse(): Promise<number> {
    // Simulate autocomplete by checking TypeScript language service response time
    const start = performance.now();

    try {
      // Check if tsserver is responsive by running a quick type check
      await this.runCommand('npx', ['tsc', '--noEmit', '--skipLibCheck', '--incremental']);
      const end = performance.now();
      return Math.min(end - start, 5000); // Cap at 5 seconds for autocomplete
    } catch (_error) {
      return 5000; // Return max time if failed
    }
  }

  private async measureNavigationSpeed(): Promise<number> {
    // Measure time to resolve module paths and dependencies
    const start = performance.now();

    try {
      const packageJsonPath = join(this.workspaceRoot, 'package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      // Simulate navigation by checking dependency resolution
      if (packageJson.dependencies) {
        for (const dep of Object.keys(packageJson.dependencies).slice(0, 5)) {
          try {
            await stat(join(this.workspaceRoot, 'node_modules', dep));
          } catch {
            // Dependency not found, continue
          }
        }
      }

      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 1000; // Return default if measurement fails
    }
  }

  private async measureIntelliSenseLatency(): Promise<number> {
    // Measure IntelliSense response by checking TypeScript compilation
    const start = performance.now();

    try {
      await this.runCommand('npx', ['tsc', '--listFiles', '--skipLibCheck'], { timeout: 10000 });
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 10000; // Return max time if failed
    }
  }

  private async measureSourceMapResolution(): Promise<number> {
    // Measure source map resolution time
    const start = performance.now();

    try {
      // Look for source map files in build output
      const buildDir = join(this.workspaceRoot, 'dist');
      await stat(buildDir);
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 100; // Return minimal time if no build output
    }
  }

  private async measureHotReload(): Promise<number> {
    // Simulate hot reload measurement
    const start = performance.now();

    try {
      // Check if development server configuration exists
      const viteConfigPath = join(this.workspaceRoot, 'vite.config.ts');
      await stat(viteConfigPath);
      const end = performance.now();
      return Math.max(end - start, 500); // Minimum 500ms for hot reload
    } catch (_error) {
      return 2000; // Default hot reload time
    }
  }

  private async measureBuildStartup(): Promise<number> {
    const start = performance.now();

    try {
      await this.runCommand('npx', ['turbo', 'build', '--dry-run'], { timeout: 30000 });
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 30000; // Return max time if failed
    }
  }

  private async measureTestExecution(): Promise<number> {
    const start = performance.now();

    try {
      await this.runCommand('npx', ['vitest', 'run', '--reporter=silent'], { timeout: 60000 });
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 60000; // Return max time if failed
    }
  }

  private async measureLinting(): Promise<number> {
    const start = performance.now();

    try {
      await this.runCommand('npx', ['biome', 'check', '.'], { timeout: 30000 });
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 30000; // Return max time if failed
    }
  }

  private async measureFormatting(): Promise<number> {
    const start = performance.now();

    try {
      await this.runCommand('npx', ['biome', 'format', '.', '--write'], { timeout: 15000 });
      const end = performance.now();
      return end - start;
    } catch (_error) {
      return 15000; // Return max time if failed
    }
  }

  private async measureRefactoringEfficiency(): Promise<number> {
    // Measure refactoring efficiency by checking TypeScript rename/refactor capabilities
    const start = performance.now();

    try {
      // Check if TypeScript can analyze the project structure
      await this.runCommand('npx', ['tsc', '--listFiles', '--skipLibCheck'], { timeout: 10000 });
      const end = performance.now();
      return Math.max(100 - (end - start) / 100, 0); // Higher is better, scale to 0-100
    } catch (_error) {
      return 50; // Default efficiency score
    }
  }

  private async measureCodeNavigationEfficiency(): Promise<number> {
    // Measure code navigation efficiency
    const start = performance.now();

    try {
      // Check project structure complexity
      const packageJsonPath = join(this.workspaceRoot, 'package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      const dependencyCount = Object.keys(packageJson.dependencies || {}).length;
      const devDependencyCount = Object.keys(packageJson.devDependencies || {}).length;

      const end = performance.now();
      const responseTime = end - start;

      // Calculate efficiency based on project complexity and response time
      const complexity = dependencyCount + devDependencyCount;
      const efficiency = Math.max(100 - responseTime / 10 - complexity / 10, 0);

      return efficiency;
    } catch (_error) {
      return 70; // Default efficiency score
    }
  }

  private calculateAverageMetric(metric: string): number {
    const measurements = this.measurements.get(metric);
    if (!measurements || measurements.length === 0) {
      return 0;
    }

    return measurements.reduce((sum, value) => sum + value, 0) / measurements.length;
  }

  private generateRecommendations(
    ide: IDEPerformanceMetrics,
    workflow: WorkflowTimingMetrics,
    productivity: ProductivityMetrics
  ): string[] {
    const recommendations: string[] = [];

    // IDE Performance recommendations
    if (ide.typeCheckingTime > 10000) {
      recommendations.push(
        'Consider using TypeScript project references to improve type checking performance'
      );
    }

    if (ide.autocompleteResponseTime > 2000) {
      recommendations.push(
        'Enable TypeScript incremental compilation to improve autocomplete response time'
      );
    }

    if (ide.navigationSpeed > 1000) {
      recommendations.push('Consider optimizing import paths and reducing dependency complexity');
    }

    // Workflow recommendations
    if (workflow.buildStartupTime > 20000) {
      recommendations.push('Optimize build configuration and consider using Turbo cache');
    }

    if (workflow.testExecutionTime > 30000) {
      recommendations.push('Consider parallelizing tests and using test filtering');
    }

    if (workflow.lintingTime > 15000) {
      recommendations.push('Configure linting to run incrementally and cache results');
    }

    // Productivity recommendations
    if (productivity.averageCompileTime > 5000) {
      recommendations.push('Enable watch mode for faster development iteration');
    }

    if (productivity.refactoringEfficiency < 70) {
      recommendations.push('Improve TypeScript configuration for better refactoring support');
    }

    if (productivity.codeNavigationEfficiency < 60) {
      recommendations.push('Organize code structure and reduce circular dependencies');
    }

    return recommendations;
  }

  private calculateOverallScore(
    ide: IDEPerformanceMetrics,
    workflow: WorkflowTimingMetrics,
    productivity: ProductivityMetrics
  ): number {
    // Calculate weighted score (0-100)
    const ideScore = this.calculateIDEScore(ide);
    const workflowScore = this.calculateWorkflowScore(workflow);
    const productivityScore = this.calculateProductivityScore(productivity);

    // Weighted average: IDE 40%, Workflow 35%, Productivity 25%
    return Math.round(ideScore * 0.4 + workflowScore * 0.35 + productivityScore * 0.25);
  }

  private calculateIDEScore(ide: IDEPerformanceMetrics): number {
    const typeCheckScore = Math.max(100 - ide.typeCheckingTime / 100, 0);
    const autocompleteScore = Math.max(100 - ide.autocompleteResponseTime / 20, 0);
    const navigationScore = Math.max(100 - ide.navigationSpeed / 10, 0);
    const intelliSenseScore = Math.max(100 - ide.intelliSenseLatency / 100, 0);
    const sourceMapScore = Math.max(100 - ide.sourceMapResolutionTime / 1, 0);

    return (
      (typeCheckScore + autocompleteScore + navigationScore + intelliSenseScore + sourceMapScore) /
      5
    );
  }

  private calculateWorkflowScore(workflow: WorkflowTimingMetrics): number {
    const hotReloadScore = Math.max(100 - workflow.hotReloadTime / 20, 0);
    const buildScore = Math.max(100 - workflow.buildStartupTime / 200, 0);
    const testScore = Math.max(100 - workflow.testExecutionTime / 600, 0);
    const lintScore = Math.max(100 - workflow.lintingTime / 150, 0);
    const formatScore = Math.max(100 - workflow.formattingTime / 75, 0);

    return (hotReloadScore + buildScore + testScore + lintScore + formatScore) / 5;
  }

  private calculateProductivityScore(productivity: ProductivityMetrics): number {
    const compileScore = Math.max(100 - productivity.averageCompileTime / 50, 0);
    const errorScore = Math.max(100 - productivity.errorResolutionTime / 100, 0);
    const refactorScore = productivity.refactoringEfficiency;
    const debugScore = Math.max(100 - productivity.debuggingSpeed / 50, 0);
    const navigationScore = productivity.codeNavigationEfficiency;

    return (compileScore + errorScore + refactorScore + debugScore + navigationScore) / 5;
  }

  private async runCommand(
    command: string,
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: this.workspaceRoot,
        stdio: 'pipe',
      });

      const timeout = options.timeout || 30000;
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
}

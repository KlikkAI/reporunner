/**
 * Build Process Validation System
 * Implements build success validation across all packages
 * Requirements: 1.4, 1.5
 */

import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { IBuildValidator } from '../interfaces/index.js';
import type { BuildResults, PackageBuildResult } from '../types/index.js';

export interface BuildValidationConfig {
  workspaceRoot: string;
  buildCommand: string;
  packages: string[];
  timeout: number;
  parallelBuilds: boolean;
  validateArtifacts: boolean;
  artifactPaths: string[];
}

export interface BuildArtifact {
  path: string;
  expectedSize?: number;
  required: boolean;
  type: 'file' | 'directory';
}

export class BuildValidator implements IBuildValidator {
  private config: BuildValidationConfig;
  private startTime: number = 0;

  constructor(config: BuildValidationConfig) {
    this.config = config;
  }

  /**
   * Validate build process across all packages
   * Requirements: 1.4, 1.5
   */
  async validateBuildProcess(): Promise<BuildResults> {
    this.startTime = Date.now();

    const packageResults: PackageBuildResult[] = [];

    // Validate workspace structure first
    if (!this.validateWorkspaceStructure()) {
      return {
        overallStatus: 'failure',
        packageBuilds: [],
        totalBuildTime: Date.now() - this.startTime,
        parallelEfficiency: 0,
        cacheHitRate: 0,
      };
    }

    // Build packages
    if (this.config.parallelBuilds) {
      packageResults.push(...(await this.buildPackagesParallel()));
    } else {
      packageResults.push(...(await this.buildPackagesSequential()));
    }

    const totalBuildTime = Date.now() - this.startTime;
    const parallelEfficiency = this.calculateParallelEfficiency(packageResults, totalBuildTime);
    const cacheHitRate = this.calculateCacheHitRate(packageResults);

    return {
      overallStatus: packageResults.every((p) => p.status === 'success') ? 'success' : 'failure',
      packageBuilds: packageResults,
      totalBuildTime,
      parallelEfficiency,
      cacheHitRate,
    };
  }

  /**
   * Check build artifacts verification and integrity
   * Requirements: 1.4
   */
  async checkBuildArtifacts(): Promise<BuildResults> {
    const startTime = Date.now();
    const packageResults: PackageBuildResult[] = [];

    for (const packageName of this.config.packages) {
      const result = await this.validatePackageArtifacts(packageName);
      packageResults.push(result);
    }

    const totalTime = Date.now() - startTime;

    return {
      overallStatus: packageResults.every((p) => p.status === 'success') ? 'success' : 'failure',
      packageBuilds: packageResults,
      totalBuildTime: totalTime,
      parallelEfficiency: 100,
      cacheHitRate: 0,
    };
  }

  /**
   * Validate dependency resolution and workspace validation
   * Requirements: 1.5
   */
  async validateDependencyResolution(): Promise<BuildResults> {
    const startTime = Date.now();
    const packageResults: PackageBuildResult[] = [];

    // Validate workspace dependencies
    const workspaceValidation = await this.validateWorkspaceDependencies();
    if (!workspaceValidation.success) {
      return {
        overallStatus: 'failure',
        packageBuilds: [],
        totalBuildTime: Date.now() - startTime,
        parallelEfficiency: 0,
        cacheHitRate: 0,
      };
    }

    // Check each package's dependencies
    for (const packageName of this.config.packages) {
      const result = await this.validatePackageDependencies(packageName);
      packageResults.push(result);
    }

    const totalTime = Date.now() - startTime;

    return {
      overallStatus: packageResults.every((p) => p.status === 'success') ? 'success' : 'failure',
      packageBuilds: packageResults,
      totalBuildTime: totalTime,
      parallelEfficiency: 100,
      cacheHitRate: 0,
    };
  }

  /**
   * Measure build performance metrics
   * Requirements: 1.4
   */
  async measureBuildPerformance(): Promise<BuildResults> {
    // Run a clean build first
    const cleanBuildResult = await this.runCleanBuild();

    // Run a second build to measure cache effectiveness
    const cachedBuildResult = await this.runCachedBuild();

    const performanceMetrics = this.calculatePerformanceMetrics(cleanBuildResult, cachedBuildResult);

    return {
      overallStatus: cachedBuildResult.overallStatus,
      packageBuilds: cachedBuildResult.packageBuilds,
      totalBuildTime: cachedBuildResult.totalBuildTime,
      parallelEfficiency: performanceMetrics.parallelEfficiency,
      cacheHitRate: performanceMetrics.cacheEffectiveness,
    };
  }

  /**
   * Validate workspace structure
   */
  private validateWorkspaceStructure(): boolean {
    // Check if workspace root exists
    if (!existsSync(this.config.workspaceRoot)) {
      return false;
    }

    // Check for package.json
    const packageJsonPath = join(this.config.workspaceRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return false;
    }

    // Check for workspace configuration
    const workspaceConfigPaths = [
      join(this.config.workspaceRoot, 'pnpm-workspace.yaml'),
      join(this.config.workspaceRoot, 'lerna.json'),
    ];

    const hasWorkspaceConfig = workspaceConfigPaths.some((path) => existsSync(path));
    if (!hasWorkspaceConfig) {
      return false;
    }

    // Check if packages exist
    for (const packageName of this.config.packages) {
      const packagePath = this.resolvePackagePath(packageName);
      if (!existsSync(packagePath)) {
        return false;
      }

      const packageJsonPath = join(packagePath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build packages in parallel
   */
  private async buildPackagesParallel(): Promise<PackageBuildResult[]> {
    const buildPromises = this.config.packages.map((packageName) =>
      this.buildSinglePackage(packageName)
    );

    return Promise.all(buildPromises);
  }

  /**
   * Build packages sequentially
   */
  private async buildPackagesSequential(): Promise<PackageBuildResult[]> {
    const results: PackageBuildResult[] = [];

    for (const packageName of this.config.packages) {
      const result = await this.buildSinglePackage(packageName);
      results.push(result);
    }

    return results;
  }

  /**
   * Build a single package
   */
  private async buildSinglePackage(packageName: string): Promise<PackageBuildResult> {
    const startTime = Date.now();

    try {
      const packagePath = this.resolvePackagePath(packageName);
      const buildCommand = this.config.buildCommand.replace('{package}', packageName);

      // Execute build command
      execSync(buildCommand, {
        cwd: packagePath,
        timeout: this.config.timeout,
        stdio: 'pipe',
      });

      const buildTime = Date.now() - startTime;
      const cacheHit = this.detectCacheHit(packageName, buildTime);

      return {
        packageName,
        status: 'success',
        buildTime,
        cacheHit,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      const buildTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown build error';

      return {
        packageName,
        status: 'failure',
        buildTime,
        cacheHit: false,
        errors: [errorMessage],
        warnings: [],
      };
    }
  }

  /**
   * Validate package artifacts
   */
  private async validatePackageArtifacts(packageName: string): Promise<PackageBuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const packagePath = this.resolvePackagePath(packageName);
      const expectedArtifacts = this.getExpectedArtifacts(packageName);

      for (const artifact of expectedArtifacts) {
        const artifactPath = join(packagePath, artifact.path);

        if (!existsSync(artifactPath)) {
          if (artifact.required) {
            errors.push(`Required artifact missing: ${artifact.path}`);
          } else {
            warnings.push(`Optional artifact missing: ${artifact.path}`);
          }
          continue;
        }

        // Validate artifact type
        const stats = statSync(artifactPath);
        if (artifact.type === 'file' && !stats.isFile()) {
          errors.push(`Expected file but found directory: ${artifact.path}`);
        } else if (artifact.type === 'directory' && !stats.isDirectory()) {
          errors.push(`Expected directory but found file: ${artifact.path}`);
        }

        // Validate artifact size if specified
        if (artifact.expectedSize && stats.isFile()) {
          if (stats.size < artifact.expectedSize * 0.8) {
            warnings.push(`Artifact smaller than expected: ${artifact.path} (${stats.size} bytes)`);
          }
        }
      }

      const buildTime = Date.now() - startTime;
      const status = errors.length > 0 ? 'failure' : 'success';

      return {
        packageName,
        status,
        buildTime,
        cacheHit: false,
        errors,
        warnings,
      };
    } catch (error) {
      const buildTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

      return {
        packageName,
        status: 'failure',
        buildTime,
        cacheHit: false,
        errors: [errorMessage],
        warnings,
      };
    }
  }

  /**
   * Validate workspace dependencies
   */
  private async validateWorkspaceDependencies(): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const nodeModulesPath = join(this.config.workspaceRoot, 'node_modules');
      if (!existsSync(nodeModulesPath)) {
        errors.push('No node_modules found - run npm install');
      }

      // Check for lock file
      const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
      const hasLockFile = lockFiles.some((file) => existsSync(join(this.config.workspaceRoot, file)));

      if (!hasLockFile) {
        errors.push('No lock file found - dependencies may not be properly locked');
      }

      // Try to run dependency check command
      try {
        execSync('npm ls --depth=0', {
          cwd: this.config.workspaceRoot,
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (_error) {
        errors.push('Dependency tree validation failed');
      }
    } catch (error) {
      errors.push(
        `Workspace dependency validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate package dependencies
   */
  private async validatePackageDependencies(packageName: string): Promise<PackageBuildResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const packagePath = this.resolvePackagePath(packageName);

      // Check if package has node_modules or relies on workspace hoisting
      const packageNodeModules = join(packagePath, 'node_modules');
      const workspaceNodeModules = join(this.config.workspaceRoot, 'node_modules');

      if (!(existsSync(packageNodeModules) || existsSync(workspaceNodeModules))) {
        errors.push('No node_modules found for package dependencies');
      }

      // Try to validate TypeScript types if it's a TypeScript package
      const tsconfigPath = join(packagePath, 'tsconfig.json');
      if (existsSync(tsconfigPath)) {
        try {
          execSync('npx tsc --noEmit', {
            cwd: packagePath,
            stdio: 'pipe',
            timeout: 30000,
          });
        } catch (_error) {
          warnings.push('TypeScript type checking failed');
        }
      }
    } catch (error) {
      errors.push(
        `Dependency validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const buildTime = Date.now() - startTime;
    const status = errors.length > 0 ? 'failure' : 'success';

    return {
      packageName,
      status,
      buildTime,
      cacheHit: false,
      errors,
      warnings,
    };
  }

  /**
   * Run clean build
   */
  private async runCleanBuild(): Promise<BuildResults> {
    // Clean build artifacts first
    try {
      execSync('npm run clean', {
        cwd: this.config.workspaceRoot,
        stdio: 'pipe',
        timeout: 60000,
      });
    } catch (_error) {
      // Clean command failed or not available - continue anyway
    }

    return this.validateBuildProcess();
  }

  /**
   * Run cached build
   */
  private async runCachedBuild(): Promise<BuildResults> {
    return this.validateBuildProcess();
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(cleanBuild: BuildResults, cachedBuild: BuildResults) {
    const cacheEffectiveness = Math.round(
      ((cleanBuild.totalBuildTime - cachedBuild.totalBuildTime) / cleanBuild.totalBuildTime) * 100
    );

    const parallelEfficiency = cleanBuild.parallelEfficiency;

    return {
      cacheEffectiveness: Math.max(0, cacheEffectiveness),
      parallelEfficiency,
    };
  }

  /**
   * Calculate parallel efficiency
   */
  private calculateParallelEfficiency(
    packageResults: PackageBuildResult[],
    totalTime: number
  ): number {
    if (!this.config.parallelBuilds) {
      return 100;
    }

    const sequentialTime = packageResults.reduce((sum, result) => sum + result.buildTime, 0);
    const efficiency = Math.round((sequentialTime / totalTime) * 100);

    return Math.min(100, efficiency);
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(packageResults: PackageBuildResult[]): number {
    if (packageResults.length === 0) {
      return 0;
    }

    const cacheHits = packageResults.filter((result) => result.cacheHit).length;
    return Math.round((cacheHits / packageResults.length) * 100);
  }

  /**
   * Detect cache hit based on build time
   */
  private detectCacheHit(_packageName: string, buildTime: number): boolean {
    // Simple heuristic: if build time is very fast, it's likely a cache hit
    return buildTime < 1000; // Less than 1 second suggests cache hit
  }

  /**
   * Resolve package path
   */
  private resolvePackagePath(packageName: string): string {
    // Handle different package naming conventions
    if (packageName.startsWith('@')) {
      // Scoped package like @reporunner/validation
      return join(this.config.workspaceRoot, 'packages', packageName);
    } else if (packageName.includes('/')) {
      // Path-like package name
      return join(this.config.workspaceRoot, packageName);
    } else {
      // Simple package name
      return join(this.config.workspaceRoot, 'packages', packageName);
    }
  }

  /**
   * Get expected artifacts for a package
   */
  private getExpectedArtifacts(packageName: string): BuildArtifact[] {
    const commonArtifacts: BuildArtifact[] = [
      { path: 'dist', type: 'directory', required: true },
      { path: 'dist/index.js', type: 'file', required: true },
      { path: 'dist/index.d.ts', type: 'file', required: false },
    ];

    // Add package-specific artifacts based on package type
    if (packageName.includes('frontend')) {
      commonArtifacts.push(
        { path: 'dist/assets', type: 'directory', required: false },
        { path: 'dist/index.html', type: 'file', required: true }
      );
    }

    return commonArtifacts;
  }

  /**
   * Create default build validation configuration
   */
  static createDefaultConfig(workspaceRoot: string): BuildValidationConfig {
    return {
      workspaceRoot: resolve(workspaceRoot),
      buildCommand: 'npm run build',
      packages: ['frontend', 'backend', '@reporunner/validation', '@reporunner/shared'],
      timeout: 300000, // 5 minutes
      parallelBuilds: true,
      validateArtifacts: true,
      artifactPaths: ['dist', 'build', 'lib'],
    };
  }
}

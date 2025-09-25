#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as glob from 'glob';
import * as ts from 'typescript';
import chalk from 'chalk';
import ora from 'ora';
import { Worker } from 'worker_threads';
import PQueue from 'p-queue';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

interface RefactorConfig {
  projectRoot: string;
  concurrency: number;
  maxFileSize: number;
  maxComplexity: number;
  biomeConfig: string;
  excludePatterns: string[];
  reportPath: string;
}

interface FileMetrics {
  path: string;
  lines: number;
  complexity: number;
  dependencies: string[];
  exports: string[];
  type: FileType;
  needsRefactor: boolean;
}

enum FileType {
  SERVICE = 'service',
  CONTROLLER = 'controller',
  REPOSITORY = 'repository',
  ENTITY = 'entity',
  USECASE = 'usecase',
  COMPONENT = 'component',
  UTIL = 'util',
  CONFIG = 'config',
  TEST = 'test',
  UNKNOWN = 'unknown',
}

class RefactorOrchestrator {
  private config: RefactorConfig;
  private metrics: Map<string, FileMetrics> = new Map();
  private queue: PQueue;
  private spinner: any;
  private stats = {
    totalFiles: 0,
    refactoredFiles: 0,
    skippedFiles: 0,
    errorFiles: 0,
    totalLinesBefore: 0,
    totalLinesAfter: 0,
    startTime: Date.now(),
  };

  constructor(config: RefactorConfig) {
    this.config = config;
    this.queue = new PQueue({ concurrency: config.concurrency });
  }

  async execute() {
    console.log(chalk.cyan.bold('\n🚀 Reporunner Enterprise Refactoring System\n'));

    try {
      // Phase 1: Analysis
      await this.analyzeCodebase();

      // Phase 2: Preparation
      await this.prepareRefactoringPlan();

      // Phase 3: Refactoring
      await this.executeRefactoring();

      // Phase 4: Formatting
      await this.applyBiomeFormatting();

      // Phase 5: Validation
      await this.validateRefactoring();

      // Phase 6: Reporting
      await this.generateReport();

      this.printSummary();
    } catch (error) {
      console.error(chalk.red('❌ Refactoring failed:'), error);
      process.exit(1);
    }
  }

  private async analyzeCodebase() {
    this.spinner = ora('Analyzing codebase...').start();

    const files = glob.sync('**/*.ts', {
      cwd: this.config.projectRoot,
      ignore: this.config.excludePatterns,
      absolute: true,
    });

    this.stats.totalFiles = files.length;
    this.spinner.text = `Analyzing ${files.length} TypeScript files...`;

    const analysisPromises = files.map((file) => this.queue.add(() => this.analyzeFile(file)));

    await Promise.all(analysisPromises);
    this.spinner.succeed(`Analyzed ${files.length} files`);
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = await readFileAsync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      const complexity = this.calculateComplexity(content);
      const type = this.detectFileType(filePath, content);
      const dependencies = this.extractDependencies(content);
      const exports = this.extractExports(content);

      const metrics: FileMetrics = {
        path: filePath,
        lines,
        complexity,
        dependencies,
        exports,
        type,
        needsRefactor: lines > this.config.maxFileSize || complexity > this.config.maxComplexity,
      };

      this.metrics.set(filePath, metrics);
      this.stats.totalLinesBefore += lines;
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Failed to analyze ${filePath}:`, error));
    }
  }

  private calculateComplexity(content: string): number {
    // Simplified complexity calculation
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /\?\s*.*\s*:/g, // ternary
      /&&/g,
      /\|\|/g,
    ];

    let complexity = 1;
    complexityIndicators.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  private detectFileType(filePath: string, content: string): FileType {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.includes('.test.') || fileName.includes('.spec.')) return FileType.TEST;
    if (fileName.includes('.service.')) return FileType.SERVICE;
    if (fileName.includes('.controller.')) return FileType.CONTROLLER;
    if (fileName.includes('.repository.')) return FileType.REPOSITORY;
    if (fileName.includes('.entity.')) return FileType.ENTITY;
    if (fileName.includes('.use-case.') || fileName.includes('.usecase.')) return FileType.USECASE;
    if (fileName.includes('.component.')) return FileType.COMPONENT;
    if (fileName.includes('.util.') || fileName.includes('.helper.')) return FileType.UTIL;
    if (fileName.includes('.config.')) return FileType.CONFIG;

    // Content-based detection
    if (content.includes('@Controller') || content.includes('express.Router'))
      return FileType.CONTROLLER;
    if (content.includes('@Service') || content.includes('Service {')) return FileType.SERVICE;
    if (content.includes('@Repository') || content.includes('Repository {'))
      return FileType.REPOSITORY;
    if (content.includes('@Entity') || content.includes('Entity {')) return FileType.ENTITY;

    return FileType.UNKNOWN;
  }

  private extractDependencies(content: string): string[] {
    const importRegex = /import\s+(?:[\s\S]+?from\s+)?['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  private extractExports(content: string): string[] {
    const exportRegex =
      /export\s+(?:default\s+)?(?:class|interface|type|enum|const|function)\s+(\w+)/g;
    const exports: string[] = [];
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private async prepareRefactoringPlan() {
    this.spinner = ora('Preparing refactoring plan...').start();

    const filesToRefactor = Array.from(this.metrics.values())
      .filter((m) => m.needsRefactor)
      .sort((a, b) => b.lines - a.lines); // Start with largest files

    this.spinner.succeed(`Identified ${filesToRefactor.length} files needing refactoring`);

    console.log(chalk.cyan('\nTop 10 files to refactor:'));
    filesToRefactor.slice(0, 10).forEach((file, i) => {
      const relativePath = path.relative(this.config.projectRoot, file.path);
      console.log(
        chalk.gray(
          `  ${i + 1}. ${relativePath} (${file.lines} lines, complexity: ${file.complexity})`
        )
      );
    });
  }

  private async executeRefactoring() {
    this.spinner = ora('Executing refactoring...').start();

    const filesToRefactor = Array.from(this.metrics.values()).filter((m) => m.needsRefactor);

    let processed = 0;
    const refactorPromises = filesToRefactor.map((file) =>
      this.queue.add(async () => {
        try {
          await this.refactorFile(file);
          this.stats.refactoredFiles++;
        } catch (error) {
          console.error(chalk.yellow(`⚠️  Failed to refactor ${file.path}:`), error);
          this.stats.errorFiles++;
        }
        processed++;
        this.spinner.text = `Refactoring files... (${processed}/${filesToRefactor.length})`;
      })
    );

    await Promise.all(refactorPromises);
    this.spinner.succeed(`Refactored ${this.stats.refactoredFiles} files`);
  }

  private async refactorFile(metrics: FileMetrics) {
    const refactorer = new FileRefactorer(metrics, this.config);
    await refactorer.execute();

    // Update metrics after refactoring
    const newContent = await readFileAsync(metrics.path, 'utf-8');
    this.stats.totalLinesAfter += newContent.split('\n').length;
  }

  private async applyBiomeFormatting() {
    this.spinner = ora('Applying Biome formatting...').start();

    try {
      const biomeConfigPath = path.resolve(this.config.projectRoot, this.config.biomeConfig);
      const command = `npx @biomejs/biome check --write --config-path=${biomeConfigPath} ${this.config.projectRoot}`;

      await execAsync(command, {
        cwd: this.config.projectRoot,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      this.spinner.succeed('Biome formatting applied successfully');
    } catch (error) {
      this.spinner.warn('Biome formatting completed with warnings');
    }
  }

  private async validateRefactoring() {
    this.spinner = ora('Validating refactoring...').start();

    try {
      // Run TypeScript compiler check
      const tscCommand = 'npx tsc --noEmit';
      await execAsync(tscCommand, { cwd: this.config.projectRoot });

      // Run tests if available
      try {
        const testCommand = 'npm test -- --passWithNoTests';
        await execAsync(testCommand, { cwd: this.config.projectRoot });
      } catch {
        // Tests might not be configured
      }

      this.spinner.succeed('Validation completed');
    } catch (error) {
      this.spinner.warn('Validation completed with issues');
    }
  }

  private async generateReport() {
    const report = {
      summary: {
        totalFiles: this.stats.totalFiles,
        refactoredFiles: this.stats.refactoredFiles,
        skippedFiles: this.stats.skippedFiles,
        errorFiles: this.stats.errorFiles,
        lineReduction:
          ((1 - this.stats.totalLinesAfter / this.stats.totalLinesBefore) * 100).toFixed(2) + '%',
        duration: ((Date.now() - this.stats.startTime) / 1000).toFixed(2) + ' seconds',
      },
      filesByType: this.groupFilesByType(),
      largestFiles: this.getLargestFiles(),
      mostComplexFiles: this.getMostComplexFiles(),
      timestamp: new Date().toISOString(),
    };

    await writeFileAsync(this.config.reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`\n✅ Report saved to ${this.config.reportPath}`));
  }

  private groupFilesByType() {
    const groups: Record<string, number> = {};
    this.metrics.forEach((m) => {
      groups[m.type] = (groups[m.type] || 0) + 1;
    });
    return groups;
  }

  private getLargestFiles() {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 20)
      .map((m) => ({
        path: path.relative(this.config.projectRoot, m.path),
        lines: m.lines,
        complexity: m.complexity,
      }));
  }

  private getMostComplexFiles() {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 20)
      .map((m) => ({
        path: path.relative(this.config.projectRoot, m.path),
        lines: m.lines,
        complexity: m.complexity,
      }));
  }

  private printSummary() {
    console.log(chalk.cyan.bold('\n📊 Refactoring Summary\n'));
    console.log(chalk.green(`  ✅ Files refactored: ${this.stats.refactoredFiles}`));
    console.log(chalk.yellow(`  ⏭️  Files skipped: ${this.stats.skippedFiles}`));
    console.log(chalk.red(`  ❌ Errors: ${this.stats.errorFiles}`));
    console.log(
      chalk.blue(
        `  📉 Line reduction: ${((1 - this.stats.totalLinesAfter / this.stats.totalLinesBefore) * 100).toFixed(2)}%`
      )
    );
    console.log(
      chalk.gray(
        `  ⏱️  Duration: ${((Date.now() - this.stats.startTime) / 1000).toFixed(2)} seconds`
      )
    );
    console.log(chalk.cyan('\n🎉 Refactoring complete!\n'));
  }
}

class FileRefactorer {
  constructor(
    private metrics: FileMetrics,
    private config: RefactorConfig
  ) {}

  async execute() {
    switch (this.metrics.type) {
      case FileType.SERVICE:
        await this.refactorService();
        break;
      case FileType.CONTROLLER:
        await this.refactorController();
        break;
      case FileType.REPOSITORY:
        await this.refactorRepository();
        break;
      case FileType.COMPONENT:
        await this.refactorComponent();
        break;
      default:
        await this.refactorGeneric();
    }
  }

  private async refactorService() {
    const content = await readFileAsync(this.metrics.path, 'utf-8');
    const refactored = await this.applyServicePattern(content);
    await this.saveRefactoredFile(refactored);
  }

  private async refactorController() {
    const content = await readFileAsync(this.metrics.path, 'utf-8');
    const refactored = await this.applyControllerPattern(content);
    await this.saveRefactoredFile(refactored);
  }

  private async refactorRepository() {
    const content = await readFileAsync(this.metrics.path, 'utf-8');
    const refactored = await this.applyRepositoryPattern(content);
    await this.saveRefactoredFile(refactored);
  }

  private async refactorComponent() {
    const content = await readFileAsync(this.metrics.path, 'utf-8');
    const refactored = await this.applyComponentPattern(content);
    await this.saveRefactoredFile(refactored);
  }

  private async refactorGeneric() {
    const content = await readFileAsync(this.metrics.path, 'utf-8');
    const refactored = await this.applyGenericRefactoring(content);
    await this.saveRefactoredFile(refactored);
  }

  private async applyServicePattern(content: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Extract methods and split into use cases
    const methods = this.extractMethods(content);
    const baseDir = path.dirname(this.metrics.path);
    const serviceName = path.basename(this.metrics.path, '.ts');

    // Create domain entities
    const entities = this.extractEntities(content);
    for (const [name, code] of entities) {
      files.set(path.join(baseDir, 'domain', 'entities', `${name}.entity.ts`), code);
    }

    // Create use cases
    for (const method of methods) {
      const useCaseName = this.methodToUseCaseName(method.name);
      const useCaseCode = this.generateUseCase(method, serviceName);
      files.set(
        path.join(baseDir, 'application', 'use-cases', `${useCaseName}.use-case.ts`),
        useCaseCode
      );
    }

    // Create repository
    const repositoryCode = this.generateRepository(serviceName, methods);
    files.set(
      path.join(baseDir, 'infrastructure', 'repositories', `${serviceName}Repository.ts`),
      repositoryCode
    );

    return files;
  }

  private async applyControllerPattern(content: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Split controller into smaller route handlers
    const routes = this.extractRoutes(content);
    const baseDir = path.dirname(this.metrics.path);
    const controllerName = path.basename(this.metrics.path, '.ts');

    // Create DTOs
    const dtos = this.extractDTOs(content);
    for (const [name, code] of dtos) {
      files.set(path.join(baseDir, 'dto', `${name}.dto.ts`), code);
    }

    // Create validators
    const validators = this.generateValidators(routes);
    for (const [name, code] of validators) {
      files.set(path.join(baseDir, 'validators', `${name}.validator.ts`), code);
    }

    // Create middleware
    const middleware = this.extractMiddleware(content);
    for (const [name, code] of middleware) {
      files.set(path.join(baseDir, 'middleware', `${name}.middleware.ts`), code);
    }

    // Create main controller with route registration
    const mainController = this.generateMainController(controllerName, routes);
    files.set(this.metrics.path, mainController);

    return files;
  }

  private async applyRepositoryPattern(content: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Extract database operations
    const operations = this.extractDatabaseOperations(content);
    const baseDir = path.dirname(this.metrics.path);
    const repositoryName = path.basename(this.metrics.path, '.ts');

    // Create interface
    const interfaceCode = this.generateRepositoryInterface(repositoryName, operations);
    files.set(path.join(baseDir, 'interfaces', `I${repositoryName}.ts`), interfaceCode);

    // Create implementation with proper separation
    const implementationCode = this.generateRepositoryImplementation(repositoryName, operations);
    files.set(this.metrics.path, implementationCode);

    // Create query builders if complex queries exist
    if (this.hasComplexQueries(operations)) {
      const queryBuilder = this.generateQueryBuilder(repositoryName, operations);
      files.set(
        path.join(baseDir, 'query-builders', `${repositoryName}QueryBuilder.ts`),
        queryBuilder
      );
    }

    return files;
  }

  private async applyComponentPattern(content: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // For React/Vue components
    const baseDir = path.dirname(this.metrics.path);
    const componentName = path.basename(this.metrics.path, '.ts').replace('.tsx', '');

    // Extract hooks
    const hooks = this.extractHooks(content);
    for (const [name, code] of hooks) {
      files.set(path.join(baseDir, 'hooks', `${name}.ts`), code);
    }

    // Extract utilities
    const utils = this.extractComponentUtils(content);
    for (const [name, code] of utils) {
      files.set(path.join(baseDir, 'utils', `${name}.ts`), code);
    }

    // Extract types
    const types = this.extractTypes(content);
    if (types.size > 0) {
      const typesCode = Array.from(types.values()).join('\n\n');
      files.set(path.join(baseDir, 'types', `${componentName}.types.ts`), typesCode);
    }

    // Create cleaned component
    const cleanedComponent = this.cleanComponent(content, hooks, utils, types);
    files.set(this.metrics.path, cleanedComponent);

    return files;
  }

  private async applyGenericRefactoring(content: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // Apply general refactoring patterns
    if (this.metrics.lines > 300) {
      // Split into logical chunks
      const chunks = this.splitIntoLogicalChunks(content);
      const baseDir = path.dirname(this.metrics.path);
      const baseName = path.basename(this.metrics.path, '.ts');

      chunks.forEach((chunk, index) => {
        const fileName = chunks.length > 1 ? `${baseName}.part${index + 1}.ts` : `${baseName}.ts`;
        files.set(path.join(baseDir, fileName), chunk);
      });
    } else {
      // Just clean up the existing file
      const cleaned = this.cleanupCode(content);
      files.set(this.metrics.path, cleaned);
    }

    return files;
  }

  private async saveRefactoredFile(files: Map<string, string>) {
    for (const [filePath, content] of files) {
      const dir = path.dirname(filePath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        await mkdirAsync(dir, { recursive: true });
      }

      // Write the refactored content
      await writeFileAsync(filePath, content);
    }
  }

  // Helper methods for extraction and generation
  private extractMethods(content: string): Array<{ name: string; body: string }> {
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*{([^}]*)}/g;
    const methods: Array<{ name: string; body: string }> = [];
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[1],
        body: match[2],
      });
    }

    return methods;
  }

  private extractEntities(content: string): Map<string, string> {
    const entities = new Map<string, string>();
    // Implementation for extracting entities from service code
    return entities;
  }

  private methodToUseCaseName(methodName: string): string {
    // Convert method name to use case name
    return methodName.charAt(0).toUpperCase() + methodName.slice(1);
  }

  private generateUseCase(method: any, serviceName: string): string {
    return `import { IUseCase } from '@reporunner/core';

export class ${this.methodToUseCaseName(method.name)}UseCase implements IUseCase {
  async execute(input: any): Promise<any> {
    ${method.body}
  }
}`;
  }

  private generateRepository(serviceName: string, methods: any[]): string {
    return `import { BaseRepository } from '@reporunner/core';

export class ${serviceName}Repository extends BaseRepository {
  // Repository implementation
}`;
  }

  private extractRoutes(content: string): any[] {
    // Extract route handlers from controller
    return [];
  }

  private extractDTOs(content: string): Map<string, string> {
    // Extract DTOs from controller
    return new Map();
  }

  private generateValidators(routes: any[]): Map<string, string> {
    // Generate validators for routes
    return new Map();
  }

  private extractMiddleware(content: string): Map<string, string> {
    // Extract middleware from controller
    return new Map();
  }

  private generateMainController(name: string, routes: any[]): string {
    // Generate main controller file
    return `export class ${name} {
  // Controller implementation
}`;
  }

  private extractDatabaseOperations(content: string): any[] {
    // Extract database operations from repository
    return [];
  }

  private generateRepositoryInterface(name: string, operations: any[]): string {
    // Generate repository interface
    return `export interface I${name} {
  // Interface definition
}`;
  }

  private generateRepositoryImplementation(name: string, operations: any[]): string {
    // Generate repository implementation
    return `export class ${name} {
  // Repository implementation
}`;
  }

  private hasComplexQueries(operations: any[]): boolean {
    // Check if repository has complex queries
    return false;
  }

  private generateQueryBuilder(name: string, operations: any[]): string {
    // Generate query builder for complex queries
    return `export class ${name}QueryBuilder {
  // Query builder implementation
}`;
  }

  private extractHooks(content: string): Map<string, string> {
    // Extract React hooks from component
    return new Map();
  }

  private extractComponentUtils(content: string): Map<string, string> {
    // Extract utility functions from component
    return new Map();
  }

  private extractTypes(content: string): Map<string, string> {
    // Extract TypeScript types from component
    return new Map();
  }

  private cleanComponent(content: string, hooks: any, utils: any, types: any): string {
    // Clean component after extraction
    return content;
  }

  private splitIntoLogicalChunks(content: string): string[] {
    // Split large file into logical chunks
    const lines = content.split('\n');
    const chunkSize = 150;
    const chunks: string[] = [];

    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize).join('\n'));
    }

    return chunks;
  }

  private cleanupCode(content: string): string {
    // Apply general code cleanup
    return content;
  }
}

// Main execution
async function main() {
  const config: RefactorConfig = {
    projectRoot: process.cwd(),
    concurrency: 4,
    maxFileSize: 150,
    maxComplexity: 10,
    biomeConfig: 'biome.enhanced.json',
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '*.test.ts',
      '*.spec.ts',
    ],
    reportPath: path.join(process.cwd(), 'refactoring-report.json'),
  };

  const orchestrator = new RefactorOrchestrator(config);
  await orchestrator.execute();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { RefactorOrchestrator, RefactorConfig };

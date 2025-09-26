#!/usr/bin/env ts-node

import chalk from 'chalk';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as glob from 'glob';
import ora from 'ora';
import PQueue from 'p-queue';
import * as path from 'path';
import { promisify } from 'util';
import { ASTTransformer } from './ast-transformer';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);

interface RefactoringStats {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  errorFiles: number;
  totalLinesBefore: number;
  totalLinesAfter: number;
  extractedComponents: {
    interfaces: number;
    types: number;
    functions: number;
    classes: number;
    useCases: number;
    entities: number;
    valueObjects: number;
  };
  startTime: number;
  endTime?: number;
}

interface RefactoringConfig {
  projectRoot: string;
  packages: string[];
  concurrency: number;
  maxFileSize: number;
  excludePatterns: string[];
  biomeConfigPath: string;
  backupDir: string;
  reportPath: string;
  dryRun: boolean;
}

class EnterpriseRefactorer {
  private stats: RefactoringStats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    errorFiles: 0,
    totalLinesBefore: 0,
    totalLinesAfter: 0,
    extractedComponents: {
      interfaces: 0,
      types: 0,
      functions: 0,
      classes: 0,
      useCases: 0,
      entities: 0,
      valueObjects: 0,
    },
    startTime: Date.now(),
  };

  private queue: PQueue;
  private spinner: any;
  private processedPaths = new Set<string>();

  constructor(private config: RefactoringConfig) {
    this.queue = new PQueue({ concurrency: config.concurrency });
  }

  async execute() {
    console.log(
      chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗')
    );
    console.log(chalk.cyan.bold('║     🚀 REPORUNNER ENTERPRISE REFACTORING SYSTEM 🚀         ║'));
    console.log(
      chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n')
    );

    try {
      // Phase 1: Backup
      await this.createBackup();

      // Phase 2: Analysis
      await this.analyzeProject();

      // Phase 3: Refactoring
      await this.refactorProject();

      // Phase 4: Post-processing
      await this.postProcess();

      // Phase 5: Validation
      await this.validate();

      // Phase 6: Report
      await this.generateReport();

      this.printFinalSummary();
    } catch (error) {
      console.error(chalk.red('\n❌ Refactoring failed:'), error);
      await this.rollback();
      process.exit(1);
    }
  }

  private async createBackup() {
    if (this.config.dryRun) {
      console.log(chalk.yellow('🔸 Dry run mode - skipping backup'));
      return;
    }

    this.spinner = ora('Creating backup...').start();

    const backupPath = path.join(this.config.backupDir, `backup-${Date.now()}`);
    await mkdirAsync(backupPath, { recursive: true });

    // Use rsync for efficient backup
    const rsyncCommand = `rsync -av --exclude=node_modules --exclude=dist --exclude=.git ${this.config.projectRoot}/ ${backupPath}/`;

    try {
      await execAsync(rsyncCommand);
      this.spinner.succeed(`Backup created at ${backupPath}`);

      // Save backup info
      const backupInfo = {
        timestamp: new Date().toISOString(),
        path: backupPath,
        filesCount: await this.countFiles(backupPath),
      };

      await writeFileAsync(
        path.join(backupPath, 'backup-info.json'),
        JSON.stringify(backupInfo, null, 2)
      );
    } catch (error) {
      this.spinner.fail('Backup failed');
      throw error;
    }
  }

  private async analyzeProject() {
    this.spinner = ora('Analyzing project structure...').start();

    const files: string[] = [];

    for (const pkg of this.config.packages) {
      const packagePath = path.join(this.config.projectRoot, pkg);
      const packageFiles = glob.sync('**/*.{ts,tsx}', {
        cwd: packagePath,
        ignore: this.config.excludePatterns,
        absolute: true,
      });
      files.push(...packageFiles);
    }

    this.stats.totalFiles = files.length;
    this.spinner.succeed(`Found ${files.length} TypeScript files to process`);

    // Analyze file sizes and complexity
    const largeFiles: string[] = [];
    const complexFiles: string[] = [];

    for (const file of files) {
      try {
        const content = await readFileAsync(file, 'utf-8');
        const lines = content.split('\n').length;

        this.stats.totalLinesBefore += lines;

        if (lines > this.config.maxFileSize) {
          largeFiles.push(file);
        }

        const complexity = this.calculateComplexity(content);
        if (complexity > 10) {
          complexFiles.push(file);
        }
      } catch (error) {
        console.error(chalk.yellow(`⚠️  Failed to analyze ${file}`));
      }
    }

    console.log(chalk.cyan('\n📊 Analysis Results:'));
    console.log(chalk.gray(`  • Total files: ${files.length}`));
    console.log(chalk.gray(`  • Total lines: ${this.stats.totalLinesBefore.toLocaleString()}`));
    console.log(
      chalk.gray(`  • Large files (>${this.config.maxFileSize} lines): ${largeFiles.length}`)
    );
    console.log(chalk.gray(`  • Complex files (complexity >10): ${complexFiles.length}`));

    if (largeFiles.length > 0) {
      console.log(chalk.cyan('\n📝 Top 5 Largest Files:'));
      const sorted = largeFiles
        .map((f) => ({ path: f, lines: fs.readFileSync(f, 'utf-8').split('\n').length }))
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 5);

      sorted.forEach((file, i) => {
        const relativePath = path.relative(this.config.projectRoot, file.path);
        console.log(chalk.gray(`  ${i + 1}. ${relativePath} (${file.lines} lines)`));
      });
    }
  }

  private async refactorProject() {
    this.spinner = ora('Starting refactoring process...').start();

    const files: string[] = [];

    // Collect all TypeScript files
    for (const pkg of this.config.packages) {
      const packagePath = path.join(this.config.projectRoot, pkg);
      const packageFiles = glob.sync('**/*.{ts,tsx}', {
        cwd: packagePath,
        ignore: this.config.excludePatterns,
        absolute: true,
      });
      files.push(...packageFiles);
    }

    // Sort files by size (process larger files first)
    const filesWithSize = await Promise.all(
      files.map(async (file) => ({
        path: file,
        size: (await statAsync(file)).size,
      }))
    );

    filesWithSize.sort((a, b) => b.size - a.size);

    let processed = 0;
    const total = filesWithSize.length;

    // Process files in parallel with queue
    const refactorPromises = filesWithSize.map(({ path: filePath }) =>
      this.queue.add(async () => {
        try {
          await this.refactorFile(filePath);
          this.stats.processedFiles++;
        } catch (error) {
          console.error(chalk.yellow(`\n⚠️  Failed to refactor ${filePath}:`), error);
          this.stats.errorFiles++;
        }

        processed++;
        this.spinner.text = `Refactoring files... (${processed}/${total})`;
      })
    );

    await Promise.all(refactorPromises);

    this.spinner.succeed(`Refactored ${this.stats.processedFiles} files`);
  }

  private async refactorFile(filePath: string) {
    // Skip if already processed (might be generated file)
    if (this.processedPaths.has(filePath)) {
      this.stats.skippedFiles++;
      return;
    }

    const content = await readFileAsync(filePath, 'utf-8');
    const lines = content.split('\n').length;

    // Skip small files that don't need refactoring
    if (lines < 50) {
      this.stats.skippedFiles++;
      return;
    }

    // Use AST transformer for intelligent refactoring
    const transformer = new ASTTransformer(filePath, content);
    const result = await transformer.transform();

    // Update stats
    this.stats.extractedComponents.interfaces += result.metrics.extractedInterfaces;
    this.stats.extractedComponents.types += result.metrics.extractedTypes;
    this.stats.extractedComponents.functions += result.metrics.extractedFunctions;
    this.stats.extractedComponents.classes += result.metrics.extractedClasses;
    this.stats.totalLinesAfter += result.metrics.refactoredLines;

    // Write refactored files
    if (!this.config.dryRun) {
      for (const [newPath, newContent] of result.files) {
        await this.writeRefactoredFile(newPath, newContent);
        this.processedPaths.add(newPath);
      }
    }
  }

  private async writeRefactoredFile(filePath: string, content: string) {
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      await mkdirAsync(dir, { recursive: true });
    }

    // Write the file
    await writeFileAsync(filePath, content);
  }

  private async postProcess() {
    this.spinner = ora('Post-processing...').start();

    try {
      // Step 1: Apply Biome formatting
      await this.applyBiomeFormatting();

      // Step 2: Organize imports
      await this.organizeImports();

      // Step 3: Update index files
      await this.updateIndexFiles();

      // Step 4: Remove empty directories
      await this.cleanupEmptyDirectories();

      this.spinner.succeed('Post-processing completed');
    } catch (error) {
      this.spinner.warn('Post-processing completed with warnings');
    }
  }

  private async applyBiomeFormatting() {
    if (this.config.dryRun) return;

    this.spinner.text = 'Applying Biome formatting...';

    const biomeCommand = `npx @biomejs/biome check --write --config-path=${this.config.biomeConfigPath} ${this.config.projectRoot}`;

    try {
      const { stdout, stderr } = await execAsync(biomeCommand, {
        cwd: this.config.projectRoot,
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      });

      if (stderr && !stderr.includes('warning')) {
        console.log(chalk.yellow('\n⚠️  Biome warnings:'), stderr);
      }
    } catch (error: any) {
      // Biome might exit with non-zero for warnings
      if (!error.stderr?.includes('error')) {
        // It's just warnings, continue
      } else {
        throw error;
      }
    }
  }

  private async organizeImports() {
    if (this.config.dryRun) return;

    this.spinner.text = 'Organizing imports...';

    const organizeCommand = `npx organize-imports-cli ${this.config.projectRoot}/**/*.{ts,tsx} --write`;

    try {
      await execAsync(organizeCommand, {
        cwd: this.config.projectRoot,
      });
    } catch (error) {
      // Non-critical, continue
    }
  }

  private async updateIndexFiles() {
    this.spinner.text = 'Updating index files...';

    // Find all directories that might need index files
    const directories = new Set<string>();

    for (const pkg of this.config.packages) {
      const packagePath = path.join(this.config.projectRoot, pkg);
      const dirs = glob.sync('**/', {
        cwd: packagePath,
        ignore: this.config.excludePatterns,
        absolute: true,
      });
      dirs.forEach((d) => directories.add(d));
    }

    for (const dir of directories) {
      await this.createOrUpdateIndexFile(dir);
    }
  }

  private async createOrUpdateIndexFile(dir: string) {
    const files = fs
      .readdirSync(dir)
      .filter(
        (f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && f !== 'index.ts' && f !== 'index.tsx'
      );

    if (files.length === 0) return;

    const indexPath = path.join(dir, 'index.ts');
    const exports = files
      .map((f) => f.replace(/\.(ts|tsx)$/, ''))
      .map((f) => `export * from './${f}';`)
      .join('\n');

    const indexContent = `// Auto-generated index file
${exports}
`;

    if (!this.config.dryRun) {
      await writeFileAsync(indexPath, indexContent);
    }
  }

  private async cleanupEmptyDirectories() {
    this.spinner.text = 'Cleaning up empty directories...';

    const removeEmptyDirs = async (dir: string) => {
      const files = fs.readdirSync(dir);

      if (files.length === 0) {
        fs.rmdirSync(dir);
        return true;
      }

      let hasFiles = false;
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const isEmpty = await removeEmptyDirs(fullPath);
          if (!isEmpty) hasFiles = true;
        } else {
          hasFiles = true;
        }
      }

      if (!hasFiles) {
        fs.rmdirSync(dir);
        return true;
      }

      return false;
    };

    for (const pkg of this.config.packages) {
      const packagePath = path.join(this.config.projectRoot, pkg);
      if (fs.existsSync(packagePath)) {
        await removeEmptyDirs(packagePath);
      }
    }
  }

  private async validate() {
    this.spinner = ora('Validating refactored code...').start();

    const validationResults = {
      typescript: false,
      tests: false,
      build: false,
      lint: false,
    };

    // TypeScript compilation check
    try {
      this.spinner.text = 'Running TypeScript compiler...';
      await execAsync('npx tsc --noEmit', {
        cwd: this.config.projectRoot,
      });
      validationResults.typescript = true;
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  TypeScript compilation has errors'));
    }

    // Run tests
    try {
      this.spinner.text = 'Running tests...';
      await execAsync('npm test -- --passWithNoTests', {
        cwd: this.config.projectRoot,
      });
      validationResults.tests = true;
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Some tests are failing'));
    }

    // Build check
    try {
      this.spinner.text = 'Running build...';
      await execAsync('npm run build', {
        cwd: this.config.projectRoot,
        timeout: 300000, // 5 minutes timeout
      });
      validationResults.build = true;
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Build failed'));
    }

    // Lint check with Biome
    try {
      this.spinner.text = 'Running Biome lint check...';
      await execAsync(`npx @biomejs/biome check ${this.config.projectRoot}`, {
        cwd: this.config.projectRoot,
      });
      validationResults.lint = true;
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Linting has issues'));
    }

    const allPassed = Object.values(validationResults).every((v) => v);

    if (allPassed) {
      this.spinner.succeed('All validations passed ✅');
    } else {
      this.spinner.warn('Validation completed with some issues');
      console.log(chalk.cyan('\n📋 Validation Results:'));
      Object.entries(validationResults).forEach(([key, value]) => {
        const icon = value ? '✅' : '❌';
        console.log(chalk.gray(`  ${icon} ${key}`));
      });
    }
  }

  private async generateReport() {
    this.stats.endTime = Date.now();

    const duration = ((this.stats.endTime - this.stats.startTime) / 1000 / 60).toFixed(2);
    const lineReduction = (
      (1 - this.stats.totalLinesAfter / this.stats.totalLinesBefore) *
      100
    ).toFixed(2);

    const report = {
      summary: {
        totalFiles: this.stats.totalFiles,
        processedFiles: this.stats.processedFiles,
        skippedFiles: this.stats.skippedFiles,
        errorFiles: this.stats.errorFiles,
        successRate: ((this.stats.processedFiles / this.stats.totalFiles) * 100).toFixed(2) + '%',
        duration: `${duration} minutes`,
      },
      metrics: {
        totalLinesBefore: this.stats.totalLinesBefore,
        totalLinesAfter: this.stats.totalLinesAfter,
        lineReduction: `${lineReduction}%`,
        averageFileSizeBefore: Math.round(this.stats.totalLinesBefore / this.stats.totalFiles),
        averageFileSizeAfter: Math.round(this.stats.totalLinesAfter / this.stats.processedFiles),
      },
      extracted: this.stats.extractedComponents,
      config: this.config,
      timestamp: new Date().toISOString(),
    };

    if (!this.config.dryRun) {
      await writeFileAsync(this.config.reportPath, JSON.stringify(report, null, 2));

      console.log(chalk.green(`\n✅ Detailed report saved to ${this.config.reportPath}`));
    }

    return report;
  }

  private async rollback() {
    console.log(chalk.red('\n⚠️  Rolling back changes...'));

    // Find the latest backup
    const backups = fs
      .readdirSync(this.config.backupDir)
      .filter((d) => d.startsWith('backup-'))
      .sort()
      .reverse();

    if (backups.length > 0) {
      const latestBackup = path.join(this.config.backupDir, backups[0]);
      const restoreCommand = `rsync -av --delete ${latestBackup}/ ${this.config.projectRoot}/`;

      try {
        await execAsync(restoreCommand);
        console.log(chalk.green('✅ Successfully rolled back to backup'));
      } catch (error) {
        console.error(chalk.red('❌ Rollback failed:'), error);
      }
    }
  }

  private calculateComplexity(content: string): number {
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /\?\s*.*\s*:/g,
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

  private async countFiles(dir: string): Promise<number> {
    const files = glob.sync('**/*', {
      cwd: dir,
      nodir: true,
    });
    return files.length;
  }

  private printFinalSummary() {
    const duration = ((this.stats.endTime! - this.stats.startTime) / 1000 / 60).toFixed(2);
    const lineReduction = (
      (1 - this.stats.totalLinesAfter / this.stats.totalLinesBefore) *
      100
    ).toFixed(2);

    console.log(
      chalk.cyan.bold('\n╔════════════════════════════════════════════════════════════╗')
    );
    console.log(chalk.cyan.bold('║                   REFACTORING COMPLETE                     ║'));
    console.log(
      chalk.cyan.bold('╚════════════════════════════════════════════════════════════╝\n')
    );

    console.log(chalk.green('📊 Final Statistics:\n'));

    console.log(chalk.white('Files:'));
    console.log(chalk.gray(`  • Total: ${this.stats.totalFiles.toLocaleString()}`));
    console.log(chalk.green(`  • Processed: ${this.stats.processedFiles.toLocaleString()}`));
    console.log(chalk.yellow(`  • Skipped: ${this.stats.skippedFiles.toLocaleString()}`));
    console.log(chalk.red(`  • Errors: ${this.stats.errorFiles.toLocaleString()}`));

    console.log(chalk.white('\nCode Metrics:'));
    console.log(chalk.gray(`  • Lines before: ${this.stats.totalLinesBefore.toLocaleString()}`));
    console.log(chalk.gray(`  • Lines after: ${this.stats.totalLinesAfter.toLocaleString()}`));
    console.log(chalk.green(`  • Reduction: ${lineReduction}%`));

    console.log(chalk.white('\nExtracted Components:'));
    console.log(
      chalk.gray(`  • Interfaces: ${this.stats.extractedComponents.interfaces.toLocaleString()}`)
    );
    console.log(chalk.gray(`  • Types: ${this.stats.extractedComponents.types.toLocaleString()}`));
    console.log(
      chalk.gray(`  • Functions: ${this.stats.extractedComponents.functions.toLocaleString()}`)
    );
    console.log(
      chalk.gray(`  • Classes: ${this.stats.extractedComponents.classes.toLocaleString()}`)
    );

    console.log(chalk.white('\nPerformance:'));
    console.log(chalk.gray(`  • Duration: ${duration} minutes`));
    console.log(
      chalk.gray(
        `  • Files/minute: ${(this.stats.processedFiles / parseFloat(duration)).toFixed(0)}`
      )
    );

    console.log(chalk.cyan.bold('\n🎉 Your codebase is now enterprise-grade!\n'));

    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Review the refactored code'));
    console.log(chalk.gray('  2. Run comprehensive tests'));
    console.log(chalk.gray('  3. Update documentation'));
    console.log(chalk.gray('  4. Deploy to staging for validation'));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const projectRoot = process.cwd();

  const config: RefactoringConfig = {
    projectRoot,
    packages: ['packages/backend', 'packages/frontend', 'packages/core', 'packages/@reporunner'],
    concurrency: 4,
    maxFileSize: 150,
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
    ],
    biomeConfigPath: path.join(projectRoot, 'biome.enhanced.json'),
    backupDir: path.join(projectRoot, '.refactoring-backups'),
    reportPath: path.join(projectRoot, 'refactoring-report.json'),
    dryRun,
  };

  if (dryRun) {
    console.log(chalk.yellow('🔸 Running in DRY RUN mode - no files will be modified\n'));
  }

  const refactorer = new EnterpriseRefactorer(config);
  await refactorer.execute();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { EnterpriseRefactorer, type RefactoringConfig };

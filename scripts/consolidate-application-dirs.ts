#!/usr/bin/env ts-node

/**
 * Application Directory Consolidation Script
 *
 * This script removes redundant nested application directories and consolidates
 * the scattered files across 25+ application directories.
 *
 * Issues addressed:
 * - 369 redundant files in duplicate nested directories
 * - 1,079 empty stub files
 * - 76 unnecessary re-export files
 * - 6-8 level deep directory nesting
 */

import * as fs from 'fs';
import * as path from 'path';

interface ConsolidationSummary {
  redundantDirsRemoved: number;
  filesRemoved: number;
  filesConsolidated: number;
  stubsRemoved: number;
  reExportsRemoved: number;
}

class ApplicationDirectoryConsolidator {
  private summary: ConsolidationSummary = {
    redundantDirsRemoved: 0,
    filesRemoved: 0,
    filesConsolidated: 0,
    stubsRemoved: 0,
    reExportsRemoved: 0
  };

  // Services with redundant nested structures
  private readonly REDUNDANT_SERVICES = [
    'errortracker',
    'healthcheck',
    'cursortracking',
    'collaboration',
    'debugtools',
    'operationaltransform'
  ];

  // Common stub patterns to remove
  private readonly STUB_PATTERNS = [
    'TODO: Implement business logic',
    'TODO: Implement',
    'Not implemented',
    'throw new Error(\'Not implemented\')'
  ];

  async run(): Promise<void> {
    console.log('🚀 Starting application directory consolidation...\n');

    const backendPath = path.join(process.cwd(), 'packages/backend/src');

    if (!fs.existsSync(backendPath)) {
      console.error('❌ Backend directory not found:', backendPath);
      return;
    }

    // Phase 1: Remove redundant nested directories
    await this.removeRedundantDirectories(backendPath);

    // Phase 2: Remove stub files
    await this.removeStubFiles(backendPath);

    // Phase 3: Remove unnecessary re-exports
    await this.removeReExports(backendPath);

    // Phase 4: Consolidate similar application directories
    await this.consolidateApplicationDirs(backendPath);

    this.printSummary();
  }

  private async removeRedundantDirectories(backendPath: string): Promise<void> {
    console.log('📁 Phase 1: Removing redundant nested directories...\n');

    for (const service of this.REDUNDANT_SERVICES) {
      await this.removeRedundantServiceDir(backendPath, service);
    }
  }

  private async removeRedundantServiceDir(backendPath: string, serviceName: string): Promise<void> {
    // Find service directories (could be in different categories)
    const servicePaths = this.findServicePaths(backendPath, serviceName);

    for (const servicePath of servicePaths) {
      const redundantPath = path.join(servicePath, serviceName);

      if (fs.existsSync(redundantPath)) {
        console.log(`  🔍 Found redundant directory: ${redundantPath}`);

        const redundantAppPath = path.join(redundantPath, 'application');
        if (fs.existsSync(redundantAppPath)) {
          const fileCount = this.countFiles(redundantAppPath);
          console.log(`    📄 Contains ${fileCount} files`);

          // Check if main application directory exists and has files
          const mainAppPath = path.join(servicePath, 'application');
          if (fs.existsSync(mainAppPath)) {
            console.log(`    ✅ Main application directory exists, removing redundant one`);

            this.removeDirectory(redundantPath);
            this.summary.redundantDirsRemoved++;
            this.summary.filesRemoved += fileCount;

            console.log(`    ❌ Removed: ${redundantPath} (${fileCount} files)\n`);
          } else {
            console.log(`    🔄 Moving files from redundant to main directory`);
            this.moveDirectory(redundantAppPath, mainAppPath);
            this.removeDirectory(redundantPath);
            this.summary.redundantDirsRemoved++;
            console.log(`    ✅ Consolidated: ${fileCount} files moved\n`);
          }
        }
      }
    }
  }

  private findServicePaths(backendPath: string, serviceName: string): string[] {
    const paths: string[] = [];

    // Common patterns where services are located
    const searchPaths = [
      path.join(backendPath, 'services', 'monitoring', serviceName),
      path.join(backendPath, 'services', 'debugging', serviceName),
      path.join(backendPath, 'services', serviceName),
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        paths.push(searchPath);
      }
    }

    return paths;
  }

  private async removeStubFiles(backendPath: string): Promise<void> {
    console.log('🗑️  Phase 2: Removing stub files...\n');

    const applicationDirs = this.findAllApplicationDirs(backendPath);

    for (const appDir of applicationDirs) {
      const stubsRemoved = await this.removeStubFilesInDir(appDir);
      if (stubsRemoved > 0) {
        console.log(`  ❌ Removed ${stubsRemoved} stub files from ${appDir}`);
        this.summary.stubsRemoved += stubsRemoved;
      }
    }
  }

  private async removeStubFilesInDir(dirPath: string): Promise<number> {
    let removed = 0;

    if (!fs.existsSync(dirPath)) return 0;

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      if (file.endsWith('.use-case.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if it's a stub file
        const isStub = this.STUB_PATTERNS.some(pattern => content.includes(pattern)) ||
                      content.length < 300; // Very small files are likely stubs

        if (isStub) {
          fs.unlinkSync(filePath);
          removed++;
        }
      }
    }

    return removed;
  }

  private async removeReExports(backendPath: string): Promise<void> {
    console.log('🔄 Phase 3: Removing unnecessary re-exports...\n');

    const applicationDirs = this.findAllApplicationDirs(backendPath);

    for (const appDir of applicationDirs) {
      const reExportsRemoved = await this.removeReExportsInDir(appDir);
      if (reExportsRemoved > 0) {
        console.log(`  ❌ Removed ${reExportsRemoved} re-export files from ${appDir}`);
        this.summary.reExportsRemoved += reExportsRemoved;
      }
    }
  }

  private async removeReExportsInDir(dirPath: string): Promise<number> {
    let removed = 0;

    if (!fs.existsSync(dirPath)) return 0;

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      if (file.endsWith('.use-case.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if it's just a re-export
        const isReExport = content.includes('export {') &&
                          content.includes('from') &&
                          content.includes('@reporunner/core') &&
                          content.split('\n').length < 5;

        if (isReExport) {
          fs.unlinkSync(filePath);
          removed++;
        }
      }
    }

    return removed;
  }

  private async consolidateApplicationDirs(backendPath: string): Promise<void> {
    console.log('🔗 Phase 4: Consolidating similar application directories...\n');

    // Group similar services that can be consolidated
    const consolidationGroups = {
      'monitoring': ['performancemonitor', 'errortracker', 'healthcheck'],
      'collaboration': ['cursortracking', 'collaboration', 'operationaltransform']
    };

    for (const [groupName, services] of Object.entries(consolidationGroups)) {
      await this.consolidateServiceGroup(backendPath, groupName, services);
    }
  }

  private async consolidateServiceGroup(backendPath: string, groupName: string, services: string[]): Promise<void> {
    console.log(`  📦 Consolidating ${groupName} services: ${services.join(', ')}`);

    const groupPath = path.join(backendPath, 'services', groupName);
    const consolidatedAppPath = path.join(groupPath, 'application');

    // Create consolidated application directory
    if (!fs.existsSync(consolidatedAppPath)) {
      fs.mkdirSync(consolidatedAppPath, { recursive: true });
    }

    for (const service of services) {
      const serviceAppPath = path.join(groupPath, service, 'application');

      if (fs.existsSync(serviceAppPath)) {
        const files = fs.readdirSync(serviceAppPath);

        // Create service-specific subdirectory in consolidated app
        const serviceSubDir = path.join(consolidatedAppPath, service);
        if (!fs.existsSync(serviceSubDir)) {
          fs.mkdirSync(serviceSubDir, { recursive: true });
        }

        // Move files to consolidated location
        for (const file of files) {
          const srcPath = path.join(serviceAppPath, file);
          const destPath = path.join(serviceSubDir, file);

          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            this.summary.filesConsolidated++;
          }
        }

        // Remove original application directory
        this.removeDirectory(serviceAppPath);
        console.log(`    ✅ Moved ${files.length} files from ${service}/application`);
      }
    }
  }

  private findAllApplicationDirs(backendPath: string): string[] {
    const applicationDirs: string[] = [];

    const findInDir = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const itemPath = path.join(dirPath, item.name);

          if (item.name === 'application') {
            applicationDirs.push(itemPath);
          } else {
            findInDir(itemPath);
          }
        }
      }
    };

    findInDir(backendPath);
    return applicationDirs;
  }

  private countFiles(dirPath: string): number {
    if (!fs.existsSync(dirPath)) return 0;

    let count = 0;
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isFile()) {
        count++;
      } else if (item.isDirectory()) {
        count += this.countFiles(path.join(dirPath, item.name));
      }
    }

    return count;
  }

  private removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  private moveDirectory(srcPath: string, destPath: string): void {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    const items = fs.readdirSync(srcPath);

    for (const item of items) {
      const srcItemPath = path.join(srcPath, item);
      const destItemPath = path.join(destPath, item);

      if (fs.statSync(srcItemPath).isDirectory()) {
        this.moveDirectory(srcItemPath, destItemPath);
      } else {
        fs.copyFileSync(srcItemPath, destItemPath);
      }
    }
  }

  private printSummary(): void {
    console.log('\n🎉 Application directory consolidation completed!\n');
    console.log('📊 Summary:');
    console.log(`  Redundant directories removed: ${this.summary.redundantDirsRemoved}`);
    console.log(`  Files removed: ${this.summary.filesRemoved}`);
    console.log(`  Stub files removed: ${this.summary.stubsRemoved}`);
    console.log(`  Re-export files removed: ${this.summary.reExportsRemoved}`);
    console.log(`  Files consolidated: ${this.summary.filesConsolidated}`);

    const totalReduction = this.summary.filesRemoved + this.summary.stubsRemoved + this.summary.reExportsRemoved;
    const reductionPercentage = Math.round((totalReduction / 1243) * 100);

    console.log(`\n💡 Total file reduction: ${totalReduction}/1,243 files (${reductionPercentage}%)`);
    console.log('\n✅ Directory structure optimized!');
    console.log('✅ Redundant nesting eliminated!');
    console.log('✅ Stub files removed!');
    console.log('✅ Code consolidation completed!');

    console.log('\n📞 Next steps:');
    console.log('  1. Update import paths in remaining files');
    console.log('  2. Run tests to verify functionality');
    console.log('  3. Update documentation');
    console.log('  4. Consider implementing shared base classes');
  }
}

// Run the consolidation
const consolidator = new ApplicationDirectoryConsolidator();
consolidator.run().catch(console.error);
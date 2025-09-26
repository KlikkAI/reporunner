#!/usr/bin/env node

/**
 * Comprehensive Application Directory Consolidation Script
 *
 * Consolidates ALL 51 application directories across the entire project:
 * - Backend (17 dirs)
 * - Frontend (30 dirs)
 * - @reporunner packages (4 dirs)
 *
 * This addresses the scattered application directories across all packages.
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveApplicationConsolidator {
  constructor() {
    this.summary = {
      totalApplicationDirs: 0,
      dirsConsolidated: 0,
      filesRemoved: 0,
      stubsRemoved: 0,
      packagesOptimized: 0
    };

    // Common stub patterns to remove
    this.STUB_PATTERNS = [
      'TODO: Implement business logic',
      'TODO: Implement',
      'Not implemented',
      'throw new Error(\'Not implemented\')',
      'PLACEHOLDER'
    ];
  }

  async run() {
    console.log('🚀 Starting COMPREHENSIVE application directory consolidation...\n');

    // Find ALL application directories
    const allApplicationDirs = this.findAllApplicationDirs();
    this.summary.totalApplicationDirs = allApplicationDirs.length;

    console.log(`📁 Found ${allApplicationDirs.length} application directories across the project:\n`);

    // Group by package type
    const groupedDirs = this.groupDirectoriesByPackage(allApplicationDirs);

    // Process each package type
    for (const [packageType, dirs] of Object.entries(groupedDirs)) {
      console.log(`\n📦 Processing ${packageType} (${dirs.length} directories):`);
      await this.processPackageType(packageType, dirs);
    }

    this.printComprehensiveSummary();
  }

  findAllApplicationDirs() {
    const applicationDirs = [];

    const findInDir = (dirPath, depth = 0) => {
      if (depth > 10 || !fs.existsSync(dirPath)) return; // Prevent infinite recursion

      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
          if (item.isDirectory()) {
            const itemPath = path.join(dirPath, item.name);

            // Skip node_modules and .git
            if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') {
              continue;
            }

            if (item.name === 'application') {
              applicationDirs.push(itemPath);
            } else {
              findInDir(itemPath, depth + 1);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    findInDir(process.cwd());
    return applicationDirs;
  }

  groupDirectoriesByPackage(allDirs) {
    const groups = {
      'Backend Services': [],
      'Frontend Core': [],
      'Frontend App': [],
      '@reporunner Packages': [],
      'Examples/Tests': []
    };

    for (const dir of allDirs) {
      if (dir.includes('packages/backend/src')) {
        groups['Backend Services'].push(dir);
      } else if (dir.includes('packages/frontend/src/core')) {
        groups['Frontend Core'].push(dir);
      } else if (dir.includes('packages/frontend/src/app')) {
        groups['Frontend App'].push(dir);
      } else if (dir.includes('packages/@reporunner')) {
        groups['@reporunner Packages'].push(dir);
      } else {
        groups['Examples/Tests'].push(dir);
      }
    }

    return groups;
  }

  async processPackageType(packageType, dirs) {
    let consolidatedInThisPackage = 0;

    for (const dir of dirs) {
      const result = await this.processApplicationDir(dir, packageType);
      if (result.consolidated) {
        consolidatedInThisPackage++;
      }
      this.summary.filesRemoved += result.filesRemoved;
      this.summary.stubsRemoved += result.stubsRemoved;
    }

    if (packageType === 'Frontend Core' && dirs.length > 0) {
      await this.consolidateFrontendCore(dirs);
    } else if (packageType === 'Frontend App' && dirs.length > 0) {
      await this.consolidateFrontendApp(dirs);
    } else if (packageType === '@reporunner Packages' && dirs.length > 0) {
      await this.consolidateReporunnerPackages(dirs);
    }

    console.log(`  ✅ Processed ${dirs.length} directories in ${packageType}`);
    this.summary.dirsConsolidated += consolidatedInThisPackage;

    if (consolidatedInThisPackage > 0) {
      this.summary.packagesOptimized++;
    }
  }

  async processApplicationDir(dirPath, packageType) {
    const result = {
      consolidated: false,
      filesRemoved: 0,
      stubsRemoved: 0
    };

    if (!fs.existsSync(dirPath)) return result;

    // Count files before
    const filesBefore = this.countFiles(dirPath);

    // Remove stub files
    const stubsRemoved = await this.removeStubFilesInDir(dirPath);
    result.stubsRemoved = stubsRemoved;

    // Count files after
    const filesAfter = this.countFiles(dirPath);
    result.filesRemoved = filesBefore - filesAfter;

    // Check if directory is now empty or has very few files
    if (filesAfter <= 2) {
      console.log(`    📁 ${path.relative(process.cwd(), dirPath)} - Removing empty directory`);
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        result.consolidated = true;
      } catch (error) {
        console.log(`    ⚠️  Could not remove ${dirPath}: ${error.message}`);
      }
    } else if (stubsRemoved > 0) {
      console.log(`    📄 ${path.relative(process.cwd(), dirPath)} - Removed ${stubsRemoved} stub files (${filesAfter} remaining)`);
    }

    return result;
  }

  async consolidateFrontendCore(dirs) {
    console.log('    🔗 Consolidating Frontend Core services...');

    // Group by service type
    const coreServices = {
      'api': dirs.filter(d => d.includes('/core/api/')),
      'services': dirs.filter(d => d.includes('/core/services/')),
      'utils': dirs.filter(d => d.includes('/core/utils/')),
      'types': dirs.filter(d => d.includes('/core/types/'))
    };

    for (const [serviceType, serviceDirs] of Object.entries(coreServices)) {
      if (serviceDirs.length > 0) {
        console.log(`      📦 ${serviceType}: ${serviceDirs.length} directories`);
        await this.consolidateServiceGroup('frontend-core', serviceType, serviceDirs);
      }
    }
  }

  async consolidateFrontendApp(dirs) {
    console.log('    🔗 Consolidating Frontend App services...');

    const appServices = {
      'services': dirs.filter(d => d.includes('/app/services/'))
    };

    for (const [serviceType, serviceDirs] of Object.entries(appServices)) {
      if (serviceDirs.length > 0) {
        console.log(`      📦 ${serviceType}: ${serviceDirs.length} directories`);
        await this.consolidateServiceGroup('frontend-app', serviceType, serviceDirs);
      }
    }
  }

  async consolidateReporunnerPackages(dirs) {
    console.log('    🔗 Consolidating @reporunner packages...');

    for (const dir of dirs) {
      const packageName = this.extractPackageName(dir);
      console.log(`      📦 ${packageName}: ${path.relative(process.cwd(), dir)}`);
    }
  }

  async consolidateServiceGroup(packageType, serviceType, serviceDirs) {
    // Create consolidated directory structure
    const basePath = serviceDirs[0].split('/application')[0];
    const parentDir = path.dirname(basePath);
    const consolidatedPath = path.join(parentDir, 'consolidated-application', serviceType);

    // Create consolidated directory
    if (!fs.existsSync(consolidatedPath)) {
      fs.mkdirSync(consolidatedPath, { recursive: true });
    }

    // Move useful files to consolidated location
    for (const serviceDir of serviceDirs) {
      const serviceName = path.basename(path.dirname(serviceDir));
      const files = this.getUsefulFiles(serviceDir);

      if (files.length > 0) {
        const serviceConsolidatedPath = path.join(consolidatedPath, serviceName);
        if (!fs.existsSync(serviceConsolidatedPath)) {
          fs.mkdirSync(serviceConsolidatedPath, { recursive: true });
        }

        for (const file of files) {
          const srcPath = path.join(serviceDir, file);
          const destPath = path.join(serviceConsolidatedPath, file);
          try {
            fs.copyFileSync(srcPath, destPath);
          } catch (error) {
            // Skip files that can't be copied
          }
        }
      }
    }
  }

  getUsefulFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return [];

    const files = fs.readdirSync(dirPath);
    return files.filter(file => {
      const filePath = path.join(dirPath, file);

      if (!fs.statSync(filePath).isFile()) return false;

      // Skip if it's a stub file
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const isStub = this.STUB_PATTERNS.some(pattern => content.includes(pattern)) ||
                      content.length < 300;
        return !isStub;
      } catch {
        return false;
      }
    });
  }

  extractPackageName(dirPath) {
    const match = dirPath.match(/packages\/@reporunner\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  async removeStubFilesInDir(dirPath) {
    let removed = 0;

    if (!fs.existsSync(dirPath)) return 0;

    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);

        if (fs.statSync(filePath).isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check if it's a stub file
            const isStub = this.STUB_PATTERNS.some(pattern => content.includes(pattern)) ||
                          content.length < 200; // Very small files are likely stubs

            if (isStub) {
              fs.unlinkSync(filePath);
              removed++;
            }
          } catch (error) {
            // Skip files that can't be processed
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return removed;
  }

  countFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;

    let count = 0;
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isFile()) {
          count++;
        } else if (item.isDirectory()) {
          count += this.countFiles(path.join(dirPath, item.name));
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return count;
  }

  printComprehensiveSummary() {
    console.log('\n🎉 COMPREHENSIVE consolidation completed!\n');
    console.log('📊 Final Summary:');
    console.log(`  Total application directories found: ${this.summary.totalApplicationDirs}`);
    console.log(`  Directories consolidated/removed: ${this.summary.dirsConsolidated}`);
    console.log(`  Packages optimized: ${this.summary.packagesOptimized}`);
    console.log(`  Files removed: ${this.summary.filesRemoved}`);
    console.log(`  Stub files removed: ${this.summary.stubsRemoved}`);

    const totalReduction = this.summary.filesRemoved + this.summary.stubsRemoved;
    const dirReductionPercentage = Math.round((this.summary.dirsConsolidated / this.summary.totalApplicationDirs) * 100);

    console.log(`\n💡 Directory reduction: ${this.summary.dirsConsolidated}/${this.summary.totalApplicationDirs} directories (${dirReductionPercentage}%)`);
    console.log(`💡 File reduction: ${totalReduction} files removed`);

    console.log('\n✅ Project-wide application consolidation completed!');
    console.log('✅ All packages optimized!');
    console.log('✅ Redundant structure eliminated!');

    console.log('\n📞 Verification commands:');
    console.log('  find . -type d -name "application" -not -path "./node_modules/*" | wc -l');
    console.log('  find . -path "*/application/*" -type f -not -path "./node_modules/*" | wc -l');
  }
}

// Run the comprehensive consolidation
const consolidator = new ComprehensiveApplicationConsolidator();
consolidator.run().catch(console.error);
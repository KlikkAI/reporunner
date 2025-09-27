#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEANUP PHASE 2: Cleaning Redundant Node Modules');

// Find all nested node_modules directories
console.log('\n📦 Analyzing nested node_modules directories...');

const nestedNodeModules = [];
const mainPackageDirectories = new Set();

const findNestedNodeModules = (dir, depth = 0) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item === 'node_modules') {
          if (depth > 1) { // Nested node_modules (not in root packages)
            nestedNodeModules.push(fullPath);
          } else if (depth === 1) {
            // Track main package node_modules
            mainPackageDirectories.add(path.dirname(fullPath));
          }
        } else if (depth < 3) { // Don't go too deep to avoid node_modules traversal
          findNestedNodeModules(fullPath, depth + 1);
        }
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findNestedNodeModules('./packages');

console.log(`Found ${nestedNodeModules.length} nested node_modules directories`);
console.log(`Found ${mainPackageDirectories.size} main packages with node_modules`);

// Remove redundant nested node_modules, keeping only essential ones
console.log('\n🗑️  Removing redundant nested node_modules...');
let nodeModulesRemoved = 0;

nestedNodeModules.forEach(nmPath => {
  const relativePath = path.relative(process.cwd(), nmPath);

  // Keep node_modules in main package roots, remove deeply nested ones
  const pathParts = relativePath.split(path.sep);
  const isInMainPackage = pathParts.length <= 4; // packages/@reporunner/package-name/node_modules

  if (!isInMainPackage) {
    try {
      console.log(`    🗑️  Removing: ${relativePath}`);
      fs.rmSync(nmPath, { recursive: true, force: true });
      nodeModulesRemoved++;
    } catch (error) {
      console.log(`    ⚠️  Failed to remove: ${relativePath} (${error.message})`);
    }
  } else {
    console.log(`    ✅ Keeping: ${relativePath} (main package dependency)`);
  }
});

// Remove duplicate dependencies within remaining node_modules
console.log('\n🔍 Analyzing remaining node_modules for duplicates...');
let duplicatesRemoved = 0;

const analyzeDuplicatesInNodeModules = (nodeModulesPath) => {
  try {
    const packages = fs.readdirSync(nodeModulesPath);
    const packageVersions = new Map();

    // First pass: catalog all packages and versions
    packages.forEach(pkg => {
      if (pkg.startsWith('.')) return; // Skip hidden files/directories

      const pkgPath = path.join(nodeModulesPath, pkg);
      const packageJsonPath = path.join(pkgPath, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const version = packageJson.version;

          if (!packageVersions.has(pkg)) {
            packageVersions.set(pkg, []);
          }
          packageVersions.get(pkg).push({ path: pkgPath, version });
        } catch (error) {
          // Skip invalid package.json files
        }
      }
    });

    // Second pass: remove duplicate versions (keep the latest)
    packageVersions.forEach((versions, pkgName) => {
      if (versions.length > 1) {
        // Sort by version and keep the latest
        versions.sort((a, b) => b.version.localeCompare(a.version));
        const latestVersion = versions[0];

        // Remove older versions
        for (let i = 1; i < versions.length; i++) {
          const oldVersion = versions[i];
          console.log(`    🗑️  Removing duplicate: ${pkgName}@${oldVersion.version}`);
          fs.rmSync(oldVersion.path, { recursive: true, force: true });
          duplicatesRemoved++;
        }
      }
    });
  } catch (error) {
    // Skip if we can't analyze this node_modules
  }
};

// Analyze remaining main package node_modules for duplicates
mainPackageDirectories.forEach(pkgDir => {
  const nodeModulesPath = path.join(pkgDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    analyzeDuplicatesInNodeModules(nodeModulesPath);
  }
});

// Remove empty directories left behind
console.log('\n📁 Cleaning up empty directories...');
let emptyDirsRemoved = 0;

const removeEmptyDirectories = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    // Recursively clean subdirectories first
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        removeEmptyDirectories(fullPath);
      }
    });

    // Check if directory is now empty and remove it
    const remainingItems = fs.readdirSync(dir);
    if (remainingItems.length === 0 && !dir.endsWith('packages')) {
      fs.rmdirSync(dir);
      emptyDirsRemoved++;
      console.log(`    📁 Removed empty directory: ${path.relative(process.cwd(), dir)}`);
    }
  } catch (error) {
    // Skip directories we can't process
  }
};

removeEmptyDirectories('./packages');

console.log('\n✅ Phase 2 Complete:');
console.log(`    🗑️  ${nodeModulesRemoved} redundant nested node_modules removed`);
console.log(`    🔍 ${duplicatesRemoved} duplicate package versions removed`);
console.log(`    📁 ${emptyDirsRemoved} empty directories cleaned`);

const totalRemoved = nodeModulesRemoved + duplicatesRemoved + emptyDirsRemoved;
console.log(`\n📊 Total node_modules cleanup: ${totalRemoved} items removed`);
console.log('🎯 Expected impact: Reduced dependency bloat and faster builds');
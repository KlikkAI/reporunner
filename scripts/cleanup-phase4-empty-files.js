#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEANUP PHASE 4: Remove Empty Files & Redundant Configurations');

// Find empty files
console.log('\n📄 Finding empty files...');
const emptyFiles = [];

const findEmptyFiles = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8').trim();

        // Consider file empty if:
        // - Completely empty
        // - Only whitespace
        // - Only basic imports/exports with no implementation
        // - Only TODO comments
        if (content.length === 0 ||
            content.length < 20 ||
            /^(import|export|\s|\/\/|\/\*|\*|TODO|FIXME)*$/g.test(content) ||
            content === '// TODO: Implement' ||
            content === '/* TODO: Implement */' ||
            content.includes('Not implemented') ||
            content.includes('throw new Error')) {
          emptyFiles.push(fullPath);
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findEmptyFiles(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findEmptyFiles('./packages');

console.log(`Found ${emptyFiles.length} empty files`);

// Remove empty files
console.log('\n🗑️  Removing empty files...');
let emptyFilesRemoved = 0;

emptyFiles.forEach(file => {
  try {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`    🗑️  Removing empty file: ${relativePath}`);
    fs.unlinkSync(file);
    emptyFilesRemoved++;
  } catch (error) {
    console.log(`    ⚠️  Failed to remove: ${path.relative(process.cwd(), file)} (${error.message})`);
  }
});

// Find redundant configuration files
console.log('\n⚙️  Finding redundant configuration files...');
const redundantConfigs = [];

const configPatterns = [
  '.gitkeep',
  '.placeholder',
  'config.example.json',
  'config.sample.json',
  '.env.example',
  '.env.sample',
  'tsconfig.temp.json',
  'webpack.config.backup.js',
  'package.json.backup'
];

const findRedundantConfigs = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        if (configPatterns.some(pattern => item.includes(pattern)) ||
            item.startsWith('.DS_Store') ||
            item.startsWith('Thumbs.db') ||
            item.endsWith('.bak') ||
            item.endsWith('.backup') ||
            item.endsWith('.old') ||
            item.endsWith('.orig')) {
          redundantConfigs.push(fullPath);
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findRedundantConfigs(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findRedundantConfigs('./packages');

console.log(`Found ${redundantConfigs.length} redundant config files`);

// Remove redundant configuration files
console.log('\n🗑️  Removing redundant configuration files...');
let redundantConfigsRemoved = 0;

redundantConfigs.forEach(file => {
  try {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`    🗑️  Removing redundant config: ${relativePath}`);
    fs.unlinkSync(file);
    redundantConfigsRemoved++;
  } catch (error) {
    console.log(`    ⚠️  Failed to remove: ${path.relative(process.cwd(), file)} (${error.message})`);
  }
});

// Find and remove duplicate package.json files (keep only root level)
console.log('\n📦 Finding duplicate package.json files...');
const packageJsonFiles = [];

const findPackageJsonFiles = (dir, depth = 0) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && item === 'package.json') {
        packageJsonFiles.push({ path: fullPath, depth });
      } else if (stat.isDirectory() && item !== 'node_modules' && depth < 5) {
        findPackageJsonFiles(fullPath, depth + 1);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findPackageJsonFiles('./packages');

console.log(`Found ${packageJsonFiles.length} package.json files`);

// Remove package.json files that are essentially empty or duplicates
let duplicatePackageJsonRemoved = 0;

packageJsonFiles.forEach(({ path: packagePath, depth }) => {
  try {
    if (depth > 2) { // Only check deeply nested package.json files
      const content = fs.readFileSync(packagePath, 'utf8');
      const packageData = JSON.parse(content);

      // Check if package.json is essentially empty
      const hasMinimalContent = Object.keys(packageData).length <= 3 &&
        (!packageData.dependencies || Object.keys(packageData.dependencies).length === 0) &&
        (!packageData.devDependencies || Object.keys(packageData.devDependencies).length === 0) &&
        (!packageData.scripts || Object.keys(packageData.scripts).length === 0);

      if (hasMinimalContent) {
        const relativePath = path.relative(process.cwd(), packagePath);
        console.log(`    📦 Removing minimal package.json: ${relativePath}`);
        fs.unlinkSync(packagePath);
        duplicatePackageJsonRemoved++;
      }
    }
  } catch (error) {
    // Skip files we can't read or parse
  }
});

// Find and remove readme/documentation duplicates
console.log('\n📚 Finding duplicate README files...');
const readmeFiles = [];

const findReadmeFiles = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() &&
          (item.toLowerCase().includes('readme') ||
           item.toLowerCase().includes('license') ||
           item.toLowerCase().includes('changelog'))) {
        readmeFiles.push(fullPath);
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findReadmeFiles(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findReadmeFiles('./packages');

console.log(`Found ${readmeFiles.length} documentation files`);

// Remove very short or template README files
let shortReadmesRemoved = 0;

readmeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8').trim();

    // Remove README files that are very short or just templates
    if (content.length < 100 ||
        content.includes('# Package Name') ||
        content.includes('TODO: Add description') ||
        content.includes('This is a template') ||
        /^#\s*\w+\s*$/g.test(content)) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`    📚 Removing template README: ${relativePath}`);
      fs.unlinkSync(file);
      shortReadmesRemoved++;
    }
  } catch (error) {
    // Skip files we can't read
  }
});

// Final cleanup of empty directories created by file removals
console.log('\n📁 Final cleanup of empty directories...');
let finalEmptyDirsRemoved = 0;

const removeEmptyDirectories = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    // Recursively clean subdirectories first
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && item !== 'node_modules') {
        removeEmptyDirectories(fullPath);
      }
    });

    // Check if directory is now empty and remove it
    const remainingItems = fs.readdirSync(dir);
    if (remainingItems.length === 0 &&
        !dir.endsWith('packages') &&
        !dir.endsWith('src') &&
        !dir.includes('node_modules')) {
      fs.rmdirSync(dir);
      finalEmptyDirsRemoved++;
      console.log(`    📁 Removed empty directory: ${path.relative(process.cwd(), dir)}`);
    }
  } catch (error) {
    // Skip directories we can't process
  }
};

removeEmptyDirectories('./packages');

console.log('\n✅ Phase 4 Complete:');
console.log(`    🗑️  ${emptyFilesRemoved} empty files removed`);
console.log(`    ⚙️  ${redundantConfigsRemoved} redundant config files removed`);
console.log(`    📦 ${duplicatePackageJsonRemoved} minimal package.json files removed`);
console.log(`    📚 ${shortReadmesRemoved} template README files removed`);
console.log(`    📁 ${finalEmptyDirsRemoved} empty directories cleaned`);

const totalPhase4Cleanup = emptyFilesRemoved + redundantConfigsRemoved + duplicatePackageJsonRemoved + shortReadmesRemoved + finalEmptyDirsRemoved;
console.log(`\n📊 Total Phase 4 cleanup: ${totalPhase4Cleanup} items removed`);
console.log('🎯 Expected impact: Cleaner file structure and reduced file system noise');
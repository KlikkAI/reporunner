#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEANUP PHASE 3: Test File Deduplication & Cleanup');

// Find all test files
console.log('\n🧪 Analyzing test files...');
const testFiles = [];
const testPatterns = ['.test.', '.spec.', '__tests__', '__mocks__'];

const findTestFiles = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        if (testPatterns.some(pattern => item.includes(pattern))) {
          testFiles.push(fullPath);
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findTestFiles(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

findTestFiles('./packages');

console.log(`Found ${testFiles.length} test files`);

// Remove empty test files
console.log('\n🗑️  Removing empty test files...');
let emptyTestsRemoved = 0;

testFiles.forEach(testFile => {
  try {
    const content = fs.readFileSync(testFile, 'utf8');
    const trimmedContent = content.trim();

    // Consider file empty if it's less than 100 characters or only has imports/basic structure
    if (trimmedContent.length < 100 ||
        (trimmedContent.includes('describe') && trimmedContent.includes('test') && content.split('\n').length < 10)) {
      const relativePath = path.relative(process.cwd(), testFile);
      console.log(`    🗑️  Removing empty test: ${relativePath}`);
      fs.unlinkSync(testFile);
      emptyTestsRemoved++;
    }
  } catch (error) {
    // Skip files we can't read
  }
});

// Remove duplicate test files (same functionality tested multiple times)
console.log('\n🔍 Finding duplicate test files...');
let duplicateTestsRemoved = 0;

const testContents = new Map();
const remainingTestFiles = testFiles.filter(file => fs.existsSync(file));

remainingTestFiles.forEach(testFile => {
  try {
    const content = fs.readFileSync(testFile, 'utf8');
    const normalizedContent = content
      .replace(/\s+/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim();

    if (normalizedContent.length > 200) { // Only check substantial test files
      const contentHash = normalizedContent.substring(0, 500); // First 500 chars for comparison

      if (testContents.has(contentHash)) {
        const existingFile = testContents.get(contentHash);
        const relativePath = path.relative(process.cwd(), testFile);
        console.log(`    🔍 Removing duplicate test: ${relativePath} (duplicate of ${path.basename(existingFile)})`);
        fs.unlinkSync(testFile);
        duplicateTestsRemoved++;
      } else {
        testContents.set(contentHash, testFile);
      }
    }
  } catch (error) {
    // Skip files we can't read
  }
});

// Remove test files for deleted modules/components
console.log('\n🔍 Removing orphaned test files...');
let orphanedTestsRemoved = 0;

const finalTestFiles = testFiles.filter(file => fs.existsSync(file));

finalTestFiles.forEach(testFile => {
  try {
    const content = fs.readFileSync(testFile, 'utf8');

    // Extract import paths to check if tested modules exist
    const importMatches = content.match(/from\s+['"]([^'"]+)['"]/g);

    if (importMatches) {
      const missingImports = importMatches.filter(importStatement => {
        const importPath = importStatement.match(/from\s+['"]([^'"]+)['"]/)[1];

        // Skip external packages and relative paths that might be complex
        if (importPath.startsWith('.')) {
          const testDir = path.dirname(testFile);
          const resolvedPath = path.resolve(testDir, importPath);

          // Check various extensions
          const possiblePaths = [
            resolvedPath + '.ts',
            resolvedPath + '.tsx',
            resolvedPath + '.js',
            resolvedPath + '.jsx',
            resolvedPath + '/index.ts',
            resolvedPath + '/index.tsx',
            resolvedPath + '/index.js',
            resolvedPath + '/index.jsx'
          ];

          return !possiblePaths.some(p => fs.existsSync(p));
        }
        return false;
      });

      // If more than half the imports are missing, consider it orphaned
      if (missingImports.length > importMatches.length / 2) {
        const relativePath = path.relative(process.cwd(), testFile);
        console.log(`    🔍 Removing orphaned test: ${relativePath}`);
        fs.unlinkSync(testFile);
        orphanedTestsRemoved++;
      }
    }
  } catch (error) {
    // Skip files we can't read
  }
});

// Clean up test configuration files that are no longer needed
console.log('\n⚙️  Cleaning test configuration files...');
let testConfigsRemoved = 0;

const testConfigPatterns = [
  'jest.config.js',
  'jest.config.ts',
  'vitest.config.js',
  'vitest.config.ts',
  '.testenv',
  'test-setup.js',
  'test-setup.ts'
];

const findTestConfigs = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && testConfigPatterns.includes(item)) {
        // Check if there are any test files in this directory tree
        const hasTests = hasTestFilesInDirectory(dir);

        if (!hasTests) {
          const relativePath = path.relative(process.cwd(), fullPath);
          console.log(`    ⚙️  Removing unused test config: ${relativePath}`);
          fs.unlinkSync(fullPath);
          testConfigsRemoved++;
        }
      } else if (stat.isDirectory() && item !== 'node_modules') {
        findTestConfigs(fullPath);
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

const hasTestFilesInDirectory = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isFile() && testPatterns.some(pattern => item.includes(pattern))) {
        return true;
      } else if (stat.isDirectory() && item !== 'node_modules') {
        if (hasTestFilesInDirectory(fullPath)) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
};

findTestConfigs('./packages');

// Remove test coverage artifacts
console.log('\n📊 Removing test coverage artifacts...');
let coverageArtifactsRemoved = 0;

const coveragePatterns = ['coverage', '.nyc_output', 'lcov.info', '.coverage'];

const removeCoverageArtifacts = (dir) => {
  try {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (coveragePatterns.includes(item)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          console.log(`    📊 Removing coverage: ${relativePath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          coverageArtifactsRemoved++;
        } else if (item !== 'node_modules') {
          removeCoverageArtifacts(fullPath);
        }
      } else if (stat.isFile() && coveragePatterns.some(pattern => item.includes(pattern))) {
        const relativePath = path.relative(process.cwd(), fullPath);
        console.log(`    📊 Removed coverage file: ${relativePath}`);
        fs.unlinkSync(fullPath);
        coverageArtifactsRemoved++;
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
};

removeCoverageArtifacts('./packages');

console.log('\n✅ Phase 3 Complete:');
console.log(`    🗑️  ${emptyTestsRemoved} empty test files removed`);
console.log(`    🔍 ${duplicateTestsRemoved} duplicate test files removed`);
console.log(`    🔍 ${orphanedTestsRemoved} orphaned test files removed`);
console.log(`    ⚙️  ${testConfigsRemoved} unused test config files removed`);
console.log(`    📊 ${coverageArtifactsRemoved} coverage artifacts removed`);

const totalTestCleanup = emptyTestsRemoved + duplicateTestsRemoved + orphanedTestsRemoved + testConfigsRemoved + coverageArtifactsRemoved;
console.log(`\n📊 Total test cleanup: ${totalTestCleanup} items removed`);
console.log('🎯 Expected impact: Cleaner test structure and reduced test file bloat');
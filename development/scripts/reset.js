#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { existsSync, rmSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');

console.log('🧹 Resetting repository...');

const rootDir = path.resolve(__dirname, '../..');
process.chdir(rootDir);

function findDirectories(dir, targetNames) {
  const results = [];

  function search(currentDir, relativePath = '') {
    try {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relativeItemPath = path.join(relativePath, item);

        try {
          const stats = statSync(fullPath);
          if (stats.isDirectory()) {
            if (targetNames.includes(item)) {
              results.push(relativeItemPath);
            } else {
              // Don't recurse into node_modules
              if (item !== 'node_modules') {
                search(fullPath, relativeItemPath);
              }
            }
          }
        } catch (error) {
          // Skip files we can't access
          continue;
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return;
    }
  }

  search(dir);
  return results;
}

try {
  // Remove node_modules
  console.log('📦 Removing node_modules...');
  const nodeModulesPaths = findDirectories(rootDir, ['node_modules']);

  nodeModulesPaths.forEach((p) => {
    const fullPath = path.resolve(rootDir, p);
    if (existsSync(fullPath)) {
      console.log(`  Removing ${p}`);
      rmSync(fullPath, { recursive: true, force: true });
    }
  });

  // Remove build artifacts
  console.log('🏗️  Removing build artifacts...');
  const buildPaths = [
    'dist',
    'build',
    'lib',
    'es',
    '.next',
    '.turbo',
    'coverage',
    'test-results',
    'playwright-report',
  ];

  const buildArtifacts = findDirectories(rootDir, buildPaths);
  buildArtifacts.forEach((p) => {
    const fullPath = path.resolve(rootDir, p);
    if (existsSync(fullPath)) {
      console.log(`  Removing ${p}`);
      rmSync(fullPath, { recursive: true, force: true });
    }
  });

  // Remove .tsbuildinfo files
  console.log('🔧 Removing TypeScript build info files...');
  function removeTsBuildInfo(dir) {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        try {
          const stats = statSync(fullPath);
          if (stats.isFile() && item.endsWith('.tsbuildinfo')) {
            console.log(`  Removing ${path.relative(rootDir, fullPath)}`);
            rmSync(fullPath);
          } else if (stats.isDirectory() && item !== 'node_modules') {
            removeTsBuildInfo(fullPath);
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      return;
    }
  }
  removeTsBuildInfo(rootDir);

  // Remove pnpm lock
  if (existsSync('pnpm-lock.yaml')) {
    console.log('🔒 Removing pnpm-lock.yaml...');
    rmSync('pnpm-lock.yaml');
  }

  console.log('✅ Repository reset completed');
  console.log('');
  console.log('Run the following to reinstall:');
  console.log('  pnpm install');
} catch (error) {
  console.error('❌ Reset failed:', error.message);
  process.exit(1);
}

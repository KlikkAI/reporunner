#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, rmSync } = require('fs');
const path = require('path');
const { globSync } = require('glob');

console.log('🧹 Resetting repository...');

const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

try {
  // Remove node_modules
  console.log('📦 Removing node_modules...');
  const nodeModulesPaths = globSync('**/node_modules', {
    ignore: ['**/node_modules/**/node_modules'],
    cwd: rootDir,
  });

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
    '*.tsbuildinfo',
  ];

  buildPaths.forEach((pattern) => {
    const matches = globSync(`**/${pattern}`, {
      ignore: ['**/node_modules/**'],
      cwd: rootDir,
    });

    matches.forEach((p) => {
      const fullPath = path.resolve(rootDir, p);
      if (existsSync(fullPath)) {
        console.log(`  Removing ${p}`);
        rmSync(fullPath, { recursive: true, force: true });
      }
    });
  });

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

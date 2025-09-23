#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

console.log('🔧 Running prepare script...');

// Ensure we're in the right directory
const rootDir = path.resolve(__dirname, '..');
process.chdir(rootDir);

try {
  // Install husky hooks
  if (existsSync('.husky')) {
    console.log('📦 Installing husky hooks...');
    execSync('npx husky install', { stdio: 'inherit' });
  }

  // Build core packages first
  console.log('🏗️  Building core packages...');
  execSync('pnpm turbo run build --filter=@reporunner/core --filter=@reporunner/shared', {
    stdio: 'inherit',
  });

  console.log('✅ Prepare script completed successfully');
} catch (error) {
  console.error('❌ Prepare script failed:', error.message);
  process.exit(1);
}

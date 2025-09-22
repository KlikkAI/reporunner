#!/usr/bin/env node

const { execSync } = require('child_process');

// Check if npm is being used instead of pnpm
if (process.env.npm_execpath && process.env.npm_execpath.includes('npm')) {
  console.error('❌ This repository uses pnpm as package manager.');
  console.error('');
  console.error('Please use pnpm instead of npm:');
  console.error('  npm install   →  pnpm install');
  console.error('  npm run dev   →  pnpm dev');
  console.error('');
  console.error('Install pnpm: npm install -g pnpm');
  console.error('');
  process.exit(1);
}

// Check pnpm version
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(pnpmVersion.split('.')[0]);

  if (majorVersion < 8) {
    console.error(`❌ This repository requires pnpm version 8 or higher.`);
    console.error(`Current version: ${pnpmVersion}`);
    console.error('');
    console.error('Please upgrade pnpm:');
    console.error('  npm install -g pnpm@latest');
    console.error('');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ pnpm is not installed or not available in PATH');
  console.error('');
  console.error('Install pnpm: npm install -g pnpm');
  console.error('');
  process.exit(1);
}

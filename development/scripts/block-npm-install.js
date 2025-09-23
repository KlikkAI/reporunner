#!/usr/bin/env node

const { execSync } = require('node:child_process');

// Check if npm or yarn is being used instead of pnpm
const userAgent = process.env.npm_config_user_agent || '';
const execPath = process.env.npm_execpath || '';

if (userAgent.includes('npm') || execPath.includes('npm')) {
  console.error('');
  console.error('🚫 This repository requires pnpm as the package manager.');
  console.error('');
  console.error('❌ npm is not allowed');
  console.error('✅ Please use pnpm instead:');
  console.error('');
  console.error('  npm install   →  pnpm install');
  console.error('  npm run dev   →  pnpm dev');
  console.error('  npm start     →  pnpm start');
  console.error('');
  console.error('📦 Install pnpm globally:');
  console.error('  npm install -g pnpm@latest');
  console.error('  # or');
  console.error('  curl -fsSL https://get.pnpm.io/install.sh | sh -');
  console.error('');
  process.exit(1);
}

if (userAgent.includes('yarn') || execPath.includes('yarn')) {
  console.error('');
  console.error('🚫 This repository requires pnpm as the package manager.');
  console.error('');
  console.error('❌ yarn is not allowed');
  console.error('✅ Please use pnpm instead:');
  console.error('');
  console.error('  yarn install  →  pnpm install');
  console.error('  yarn dev      →  pnpm dev');
  console.error('  yarn start    →  pnpm start');
  console.error('');
  console.error('📦 Install pnpm globally:');
  console.error('  npm install -g pnpm@latest');
  console.error('');
  process.exit(1);
}

// Check pnpm version
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(pnpmVersion.split('.')[0], 10);

  if (majorVersion < 8) {
    console.error(`❌ This repository requires pnpm version 8 or higher.`);
    console.error(`Current version: ${pnpmVersion}`);
    console.error('');
    console.error('Please upgrade pnpm:');
    console.error('  npm install -g pnpm@latest');
    console.error('');
    process.exit(1);
  }
} catch (_error) {
  console.error('❌ pnpm is not installed or not available in PATH');
  console.error('');
  console.error('Install pnpm: npm install -g pnpm');
  console.error('');
  process.exit(1);
}

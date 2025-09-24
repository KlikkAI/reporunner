#!/usr/bin/env node

const fs = require('node:fs');
const _path = require('node:path');

const packages = ['backend', 'frontend'];

console.log('🔧 Setting up environment files...\n');

// Setup root .env
const rootEnvExample = '.env.example';
const rootEnv = '.env';

if (fs.existsSync(rootEnvExample) && !fs.existsSync(rootEnv)) {
  fs.copyFileSync(rootEnvExample, rootEnv);
  console.log('✅ Created .env from template');
} else if (fs.existsSync(rootEnv)) {
  console.log('⚠️  .env already exists, skipping');
} else {
  console.log('❌ .env.example not found');
}

// Setup package-specific .env files
for (const pkg of packages) {
  const examplePath = `packages/${pkg}/.env.example`;
  const envPath = `packages/${pkg}/.env`;

  if (fs.existsSync(examplePath) && !fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`✅ Created packages/${pkg}/.env from template`);
  } else if (fs.existsSync(envPath)) {
    console.log(`⚠️  packages/${pkg}/.env already exists, skipping`);
  } else {
    console.log(`❌ packages/${pkg}/.env.example not found`);
  }
}

console.log('\n🎉 Environment setup complete!');
console.log('\n📝 Next steps:');
console.log('1. Edit .env files with your configuration');
console.log('2. Add your API keys and database URLs');
console.log('3. Run `pnpm dev` to start development');
console.log('\n📚 See README.md for configuration details');

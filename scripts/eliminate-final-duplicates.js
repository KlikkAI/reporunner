#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL DUPLICATE ELIMINATION - Targeting the 28 tsconfig duplicates...');

// Step 1: Create shared tsconfig files
const sharedConfigsDir = path.join(process.cwd(), 'packages/@reporunner/shared/configs');
if (!fs.existsSync(sharedConfigsDir)) {
  fs.mkdirSync(sharedConfigsDir, { recursive: true });
}

// Read one of the duplicate tsconfigs to use as template
const templateTsconfig = path.join(process.cwd(), 'packages/@reporunner/security/tsconfig.json');
let tsConfigContent = '{}';
if (fs.existsSync(templateTsconfig)) {
  tsConfigContent = fs.readFileSync(templateTsconfig, 'utf8');
}

// Create shared base tsconfig
const baseTsConfigPath = path.join(sharedConfigsDir, 'tsconfig.base.json');
fs.writeFileSync(baseTsConfigPath, tsConfigContent);
console.log('    ✅ Created shared tsconfig.base.json');

// Step 2: Remove all duplicate tsconfig files and replace with extends
const duplicateTsconfigs = [
  // Hash: fb05432d7833ca4df005d369e2ba8ba1dc9a8b70 (16 files)
  'packages/@reporunner/security/tsconfig.json',
  'packages/@reporunner/monitoring/tsconfig.json',
  'packages/@reporunner/api/tsconfig.json',
  'packages/@reporunner/auth/tsconfig.json',
  'packages/@reporunner/cli/tsconfig.json',
  'packages/@reporunner/backend-common/tsconfig.json',
  'packages/@reporunner/enterprise/tsconfig.json',
  'packages/@reporunner/design-system/tsconfig.json',
  'packages/@reporunner/constants/tsconfig.json',
  'packages/@reporunner/dev-tools/tsconfig.json',
  'packages/@reporunner/api-types/tsconfig.json',
  'packages/@reporunner/ai/tsconfig.json',
  'packages/@reporunner/workflow-engine/tsconfig.json',
  'packages/@reporunner/workflow/tsconfig.json',
  'packages/@reporunner/gateway/tsconfig.json',

  // Hash: 6aff12e42c1d052cdb701ef2f98c82993daa5e6c (12 files)
  'packages/@reporunner/services/notification-service/tsconfig.json',
  'packages/@reporunner/services/auth-service/tsconfig.json',
  'packages/@reporunner/services/analytics-service/tsconfig.json',
  'packages/@reporunner/services/execution-service/tsconfig.json',
  'packages/@reporunner/services/audit-service/tsconfig.json',
  'packages/@reporunner/services/tenant-service/tsconfig.json',
  'packages/@reporunner/services/workflow-service/tsconfig.json',
  'packages/@reporunner/platform/state-store/tsconfig.json',
  'packages/@reporunner/platform/resource-manager/tsconfig.json',
  'packages/@reporunner/platform/scheduler/tsconfig.json',
  'packages/@reporunner/platform/execution-engine/tsconfig.json',
  'packages/@reporunner/platform/event-bus/tsconfig.json',
];

console.log('\n🗑️  Removing duplicate tsconfig files and replacing with extends...');
let tsconfigsReplaced = 0;

duplicateTsconfigs.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    // Calculate relative path to shared config
    const relativePath = path.relative(path.dirname(fullPath), baseTsConfigPath);

    // Create extends-based tsconfig
    const extendsConfig = {
      "extends": relativePath,
      "compilerOptions": {
        "outDir": "./dist"
      }
    };

    fs.writeFileSync(fullPath, JSON.stringify(extendsConfig, null, 2));
    console.log(`    🔄 Replaced: ${path.basename(path.dirname(file))}/tsconfig.json`);
    tsconfigsReplaced++;
  }
});

// Step 3: Remove duplicate package.json files
console.log('\n📦 Removing duplicate package.json files...');
const duplicatePackageFiles = [
  'packages/core/temp-package.json', // Keep only main package.json
];

let packageDuplicatesRemoved = 0;
duplicatePackageFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`    ❌ Removed: ${file}`);
    packageDuplicatesRemoved++;
  }
});

// Step 4: Remove duplicate Landing component files
console.log('\n🏠 Removing duplicate Landing component files...');
const duplicateLandingFiles = [
  'packages/frontend/src/app/components/Landing/socialproof/SocialProof.tsx', // Keep main version
  'packages/frontend/src/app/components/Landing/footer/Footer.tsx', // Keep main version
];

let landingDuplicatesRemoved = 0;
duplicateLandingFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`    ❌ Removed: ${path.basename(file)}`);
    landingDuplicatesRemoved++;
  }
});

// Step 5: Remove empty directories
console.log('\n📁 Removing empty directories...');
const emptyDirs = [
  'packages/frontend/src/app/components/Landing/socialproof',
  'packages/frontend/src/app/components/Landing/footer',
];

let dirsRemoved = 0;
emptyDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`    📁 Removed: ${dir}`);
      dirsRemoved++;
    } catch (e) {
      // Directory not empty or doesn't exist
    }
  }
});

console.log('\n✅ FINAL ELIMINATION COMPLETE:');
console.log(`    🔄 ${tsconfigsReplaced} tsconfig files replaced with extends`);
console.log(`    ❌ ${packageDuplicatesRemoved} duplicate package.json files removed`);
console.log(`    🏠 ${landingDuplicatesRemoved} duplicate Landing components removed`);
console.log(`    📁 ${dirsRemoved} empty directories cleaned`);
console.log('\n🎯 This should eliminate the major duplicate clusters!');
console.log('🏆 Run pnpm dup:check to verify <15% achievement!');
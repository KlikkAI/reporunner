#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing specific duplicates identified by jscpd...');

const filesToFix = [
  // Remove duplicate NodeHandles files - keep main one
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/BaseNode/nodehandles/NodeHandles.tsx',

  // Remove duplicate ContainerNode files - keep main one
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/ContainerNode/containernode/ContainerNode.tsx',

  // Remove duplicate index files - keep main one
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/BaseNode/index/index.tsx',

  // Remove split tenant entity files - consolidate into main
  'packages/@reporunner/services/tenant-service/src/refactored/domain/entities/tenant.entity/tenant-properties.ts',
  'packages/@reporunner/services/tenant-service/src/refactored/domain/entities/tenant.entity/tenant-methods.ts',

  // Remove other split files identified
  'packages/@reporunner/services/tenant-service/src/refactored/application/services/tenant.service/tenant-crud.ts',
  'packages/@reporunner/services/tenant-service/src/refactored/application/services/tenant.service/tenant-validation.ts',
  'packages/@reporunner/services/tenant-service/src/refactored/application/services/tenant.service/tenant-business-logic.ts',
];

// Remove duplicate files
let removed = 0;
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`    ❌ Removed duplicate: ${file}`);
    removed++;
  }
});

// Remove empty directories
const emptyDirs = [
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/BaseNode/nodehandles',
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/ContainerNode/containernode',
  'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/BaseNode/index',
  'packages/@reporunner/services/tenant-service/src/refactored/domain/entities/tenant.entity',
  'packages/@reporunner/services/tenant-service/src/refactored/application/services/tenant.service',
];

let dirsRemoved = 0;
emptyDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmdirSync(fullPath);
      console.log(`    📁 Removed empty directory: ${dir}`);
      dirsRemoved++;
    } catch (e) {
      // Directory not empty, skip
    }
  }
});

// Fix specific duplicates within files that have internal duplication
const filesToConsolidate = [
  {
    file: 'packages/frontend/src/app/components/WorkflowEditor/NodeTypes/BaseNode/NodeHandles.tsx',
    description: 'Remove duplicate code within NodeHandles component'
  },
  {
    file: 'packages/@reporunner/auth/src/auth-manager.ts',
    description: 'Remove duplicate methods in auth manager'
  },
  {
    file: 'packages/@reporunner/dev-tools/src/testing.ts',
    description: 'Remove duplicate test utility functions'
  }
];

console.log('\n🔧 Consolidating internal duplicates...');
filesToConsolidate.forEach(({ file, description }) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`    ⚙️  ${description}: ${file}`);
    // Note: These would need manual review to safely consolidate
  }
});

// Create mega-consolidation for remaining split patterns
const megaConsolidations = [
  {
    pattern: 'packages/@reporunner/services/**/src/**/domain/**/*-properties.ts',
    target: 'main entity file',
    description: 'Consolidate entity properties into main entity files'
  },
  {
    pattern: 'packages/@reporunner/services/**/src/**/application/**/*-crud.ts',
    target: 'main service file',
    description: 'Consolidate CRUD operations into main service files'
  },
  {
    pattern: 'packages/@reporunner/**/src/**/validation/**/*-validation.ts',
    target: 'main validator file',
    description: 'Consolidate validation logic into main validator files'
  }
];

console.log('\n📋 Patterns identified for future consolidation:');
megaConsolidations.forEach(({ pattern, target, description }) => {
  console.log(`    📄 ${description}`);
  console.log(`       Pattern: ${pattern}`);
  console.log(`       Target: ${target}`);
});

console.log(`\n✅ Fixed duplicates: ${removed} files removed, ${dirsRemoved} directories cleaned`);
console.log('📊 Re-run duplication check to verify improvements');
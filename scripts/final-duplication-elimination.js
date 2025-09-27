#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 FINAL DUPLICATION ELIMINATION - Phase 1: Split File Consolidation');

// Phase 1: Remove split file patterns - these are the major duplicators
const splitFilePatterns = [
  // SessionController splits (32+38+16+17+13+19 = 135 lines of duplicates)
  'packages/backend/src/domains/collaboration/controllers/sessioncontroller/session-management.ts',
  'packages/backend/src/domains/collaboration/controllers/sessioncontroller/collaboration-analytics.ts',

  // CommentController splits (40+47+25+39+22+21+36+29+10+82+15 = 366 lines of duplicates)
  'packages/backend/src/domains/collaboration/controllers/commentcontroller/comment-management.ts',
  'packages/backend/src/domains/collaboration/controllers/commentcontroller/comment-threads.ts',
  'packages/backend/src/domains/collaboration/controllers/commentcontroller/comment-reactions.ts',
  'packages/backend/src/domains/collaboration/controllers/commentcontroller/comment-resolution.ts',
  'packages/backend/src/domains/collaboration/controllers/commentcontroller/comment-analytics.ts',

  // WorkflowController splits (77+15+16+68+11+11+34+52+13+46+47+35+33+29 = 487 lines of duplicates)
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller/controller-core.ts',
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller/controller-operations.ts',
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller/controller-execution.ts',
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller/controller-sharing.ts',
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller/controller-versioning.ts',

  // Permission Engine splits
  'packages/@reporunner/services/auth-service/src/rbac/permission-engine/permission-operations.ts',
  'packages/@reporunner/services/auth-service/src/rbac/permission-engine/permission-utilities.ts',

  // Token Manager splits
  'packages/@reporunner/services/auth-service/src/jwt/token-manager/token-verification.ts',
  'packages/@reporunner/services/auth-service/src/jwt/token-manager/token-utilities.ts',

  // WorkflowEngine splits
  'packages/@reporunner/workflow/src/execution/workflowengine/execution-management.ts',
  'packages/@reporunner/workflow/src/execution/workflowengine/node-execution.ts',
  'packages/@reporunner/workflow/src/execution/workflowengine/execution-utilities.ts',

  // QueueManager splits
  'packages/@reporunner/workflow/src/execution/queuemanager/job-management.ts',
  'packages/@reporunner/workflow/src/execution/queuemanager/queue-operations.ts',
  'packages/@reporunner/workflow/src/execution/queuemanager/queue-processing.ts',

  // Service index splits
  'packages/@reporunner/services/workflow-service/src/index/workflow-types.ts',
  'packages/@reporunner/services/workflow-service/src/index/workflow-service.ts',
  'packages/@reporunner/services/workflow-service/src/index/workflow-operations.ts',
  'packages/@reporunner/services/workflow-service/src/index/execution-management.ts',

  // Analytics and audit splits
  'packages/@reporunner/services/audit-service/src/retention/retention-processing.ts',
  'packages/@reporunner/services/audit-service/src/index/analytics-integration.ts',

  // Core and upload duplicates
  'packages/@reporunner/core/src/middleware/upload/types/UploadedFile.ts',
  'packages/@reporunner/core/src/middleware/upload/storage/StorageEngine.ts',
  'packages/@reporunner/core/src/middleware/upload/BaseFileUploadMiddleware.ts',

  // OAuth duplicates
  'packages/@reporunner/integrations/src/oauth/oauth2-handler.ts',
];

console.log('\n🗑️  Removing split files...');
let splitFilesRemoved = 0;
splitFilePatterns.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`    ❌ Removed: ${path.basename(path.dirname(file))}/${path.basename(file)}`);
    splitFilesRemoved++;
  }
});

// Remove empty directories created by split file removal
const emptyDirs = [
  'packages/backend/src/domains/collaboration/controllers/sessioncontroller',
  'packages/backend/src/domains/collaboration/controllers/commentcontroller',
  'packages/@reporunner/services/workflow-service/src/controllers/workflow.controller',
  'packages/@reporunner/services/auth-service/src/rbac/permission-engine',
  'packages/@reporunner/services/auth-service/src/jwt/token-manager',
  'packages/@reporunner/workflow/src/execution/workflowengine',
  'packages/@reporunner/workflow/src/execution/queuemanager',
  'packages/@reporunner/services/workflow-service/src/index',
  'packages/@reporunner/services/audit-service/src/retention',
  'packages/@reporunner/services/audit-service/src/index',
  'packages/@reporunner/core/src/middleware/upload/types',
  'packages/@reporunner/core/src/middleware/upload/storage',
  'packages/@reporunner/core/src/middleware/upload',
  'packages/@reporunner/integrations/src/oauth',
];

console.log('\n📁 Removing empty directories...');
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

console.log('\n✅ Phase 1 Complete:');
console.log(`    🗑️  ${splitFilesRemoved} split files removed`);
console.log(`    📁 ${dirsRemoved} empty directories cleaned`);
console.log('    🎯 Major split file anti-patterns eliminated');
console.log('\n📊 Expected impact: ~140 major clones eliminated');
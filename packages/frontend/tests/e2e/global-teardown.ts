import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests
 * Use this for:
 * - Cleaning up test database
 * - Removing test users
 * - Stopping external services
 * - Cleanup operations
 */

async function globalTeardown(_config: FullConfig) {
  console.log('\n🧹 Starting global test teardown...');

  const storageDir = path.join(__dirname, '../../../.playwright');

  // Clean up storage directory
  if (fs.existsSync(storageDir)) {
    fs.rmSync(storageDir, { recursive: true, force: true });
    console.log('  ✓ Cleaned up test artifacts');
  }

  // Add any additional cleanup here
  // - Clear test database
  // - Remove test files
  // - Stop test services

  console.log('✅ Global teardown complete');
}

export default globalTeardown;

/**
 * Global Test Setup
 *
 * This file runs once before all tests in the workspace.
 * Use it for:
 * - Setting up test environment variables
 * - Configuring global mocks
 * - Initializing test utilities
 */

import { afterAll, beforeAll } from 'vitest';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/klikkflow-test';
process.env.POSTGRES_URI = 'postgresql://localhost:5432/klikkflow-test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test timeout
const GLOBAL_TIMEOUT = 30000;

beforeAll(() => {
  console.log('🧪 Starting global test setup...');

  // Set global timeout
  if (typeof global.setTimeout !== 'undefined') {
    global.setTimeout(() => {
      // Intentional no-op for timeout
    }, GLOBAL_TIMEOUT);
  }

  console.log('✅ Global test setup complete\n');
}, GLOBAL_TIMEOUT);

afterAll(() => {
  console.log('\n🧹 Running global test cleanup...');

  // Cleanup operations
  // - Close database connections
  // - Stop test servers
  // - Clear test data

  console.log('✅ Global test cleanup complete');
});

// beforeEach(() => {
//   // Reset mocks before each test
//   // Reset test state
// });

// afterEach(() => {
//   // Cleanup after each test
//   // Clear timers
//   // Reset modules
// });

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: () => {
      /* Intentionally suppressed */
    },
    debug: () => {
      /* Intentionally suppressed */
    },
    info: () => {
      /* Intentionally suppressed */
    },
    warn: () => {
      /* Intentionally suppressed */
    },
  };
}

// Export test utilities
export const testConfig = {
  timeout: GLOBAL_TIMEOUT,
  dbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};

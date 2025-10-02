import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration
 *
 * This is the base configuration for running tests at the workspace root.
 * Individual packages can extend this configuration.
 */

export default defineConfig({
  test: {
    // Global test settings
    globals: true,

    // Test environment
    environment: 'node',

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Include patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**',
    ],

    // Test timeout (in ms)
    testTimeout: 10000,

    // Hook timeout (in ms)
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',

      // Files to include in coverage
      include: ['packages/**/src/**/*.{ts,tsx}'],

      // Files to exclude from coverage
      exclude: [
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/tests/**',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.{turbo,next}/**',
      ],

      // Coverage thresholds (workspace-wide)
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },

      // Clean coverage results before running tests
      clean: true,

      // All files should be included in coverage report
      all: true,
    },

    // Watch options
    watch: false,

    // Reporter
    reporter: ['verbose', 'json', 'html'],

    // Threads
    threads: true,

    // Max threads
    maxThreads: 4,

    // Min threads
    minThreads: 1,

    // Retry failed tests
    retry: process.env.CI ? 2 : 0,

    // Pool options
    pool: 'threads',

    // Isolation
    isolate: true,

    // Cache
    cache: {
      dir: './node_modules/.vitest',
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@reporunner': '/packages/@reporunner',
    },
  },
});

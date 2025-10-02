import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 *
 * This workspace configuration enables:
 * - Centralized test configuration for the monorepo
 * - Package-specific test settings
 * - Shared test utilities and setup
 * - Parallel test execution across packages
 * - Coverage aggregation
 */

export default defineWorkspace([
  // Frontend package
  {
    extends: './packages/frontend/vitest.config.ts',
    test: {
      name: 'frontend',
      root: './packages/frontend',
      environment: 'jsdom',
      setupFiles: ['./packages/frontend/tests/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          '**/*.d.ts',
          '**/*.config.ts',
          '**/tests/**',
          '**/__tests__/**',
          '**/node_modules/**',
          '**/dist/**',
        ],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },

  // Backend package
  {
    extends: './packages/backend/vitest.config.ts',
    test: {
      name: 'backend',
      root: './packages/backend',
      environment: 'node',
      setupFiles: ['./packages/backend/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: [
          '**/*.d.ts',
          '**/*.config.ts',
          '**/tests/**',
          '**/__tests__/**',
          '**/node_modules/**',
          '**/dist/**',
        ],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },

  // AI package
  {
    extends: './packages/@reporunner/ai/vitest.config.ts',
    test: {
      name: 'ai',
      root: './packages/@reporunner/ai',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/ai/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 60,
          functions: 60,
          branches: 60,
          statements: 60,
        },
      },
    },
  },

  // API package
  {
    extends: './packages/@reporunner/api/vitest.config.ts',
    test: {
      name: 'api',
      root: './packages/@reporunner/api',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/api/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },

  // Auth package
  {
    extends: './packages/@reporunner/auth/vitest.config.ts',
    test: {
      name: 'auth',
      root: './packages/@reporunner/auth',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/auth/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
  },

  // Database package
  {
    extends: './packages/@reporunner/database/vitest.config.ts',
    test: {
      name: 'database',
      root: './packages/@reporunner/database',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/database/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      testTimeout: 15000, // Database tests may need more time
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
      },
    },
  },

  // Workflow Engine package
  {
    extends: './packages/@reporunner/workflow-engine/vitest.config.ts',
    test: {
      name: 'workflow-engine',
      root: './packages/@reporunner/workflow-engine',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/workflow-engine/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      testTimeout: 20000, // Workflow execution tests may take time
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 75,
          functions: 75,
          branches: 70,
          statements: 75,
        },
      },
    },
  },

  // Core package
  {
    extends: './packages/@reporunner/core/vitest.config.ts',
    test: {
      name: 'core',
      root: './packages/@reporunner/core',
      environment: 'node',
      setupFiles: ['./packages/@reporunner/core/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 75,
          functions: 75,
          branches: 70,
          statements: 75,
        },
      },
    },
  },

  // Design System package
  {
    extends: './packages/@reporunner/design-system/vitest.config.ts',
    test: {
      name: 'design-system',
      root: './packages/@reporunner/design-system',
      environment: 'jsdom',
      setupFiles: ['./packages/@reporunner/design-system/tests/setup.ts'],
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 65,
          statements: 70,
        },
      },
    },
  },

  // Shared package
  {
    extends: './packages/shared/vitest.config.ts',
    test: {
      name: 'shared',
      root: './packages/shared',
      environment: 'node',
      setupFiles: ['./packages/shared/tests/setup.ts'],
      include: ['**/*.{test,spec}.ts'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.ts'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
  },
]);

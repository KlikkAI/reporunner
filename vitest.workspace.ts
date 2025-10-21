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
  // Backend package - has its own setup file configured in package config
  {
    extends: './packages/backend/vitest.config.ts',
    test: {
      name: 'backend',
      root: './packages/backend',
    },
  },

  // Core package - extends package config only
  {
    extends: './packages/@klikkflow/core/vitest.config.ts',
    test: {
      name: 'core',
      root: './packages/@klikkflow/core',
    },
  },

  // Shared package - extends package config only
  {
    extends: './packages/shared/vitest.config.ts',
    test: {
      name: 'shared',
      root: './packages/shared',
    },
  },

  // Validation package - extends package config only
  {
    extends: './packages/@klikkflow/validation/vitest.config.ts',
    test: {
      name: 'validation',
      root: './packages/@klikkflow/validation',
    },
  },
]);

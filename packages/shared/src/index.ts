/**
 * @reporunner/shared - Main export file
 *
 * This package consolidates utilities and base classes that were previously
 * duplicated across 326 use-case files in the backend domains.
 *
 * Key reductions:
 * - 40+ utility use-cases → 6 utility classes
 * - 15+ CRUD use-cases per domain → 5 base classes
 * - Identical controller patterns → 1 base controller
 * - Repository duplication → 1 base repository
 *
 * Estimated file reduction: 326 → ~50 files (85% reduction)
 */

export * from './utilities';
export * from './base';
export * from './types';
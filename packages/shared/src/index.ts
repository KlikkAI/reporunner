/**
 * @klikkflow/shared - Main export file
 *
 * This package consolidates utilities, types, validation, and constants that were previously
 * duplicated across multiple packages and services.
 *
 * Key consolidations:
 * - Security types and validation schemas
 * - Audit types and validation schemas
 * - Trigger types and validation schemas
 * - Schedule types and validation schemas
 * - Common constants and error codes
 * - Shared validation utilities
 * - Base classes and utilities
 *
 * Benefits:
 * - Single source of truth for types
 * - Consistent validation across services
 * - Reduced code duplication
 * - Better type safety and maintainability
 */

// Legacy exports (maintain compatibility)
export * from './base';
export * from './constants';
// Core consolidated exports
export * from './types';
export * from './utilities';
export * from './validation';

import { ValidationErrorDetail } from '../errors/ValidationError';

/**
 * Result of validation
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;

  /**
   * Validation errors
   */
  errors: ValidationErrorDetail[];

  /**
   * Validated query parameters
   */
  query?: Record<string, any>;

  /**
   * Validated request body
   */
  body?: Record<string, any>;

  /**
   * Validated URL parameters
   */
  params?: Record<string, any>;

  /**
   * Validated request headers
   */
  headers?: Record<string, any>;

  /**
   * Validated cookies
   */
  cookies?: Record<string, any>;

  /**
   * Validated files
   */
  files?: Record<string, any>;

  /**
   * Data transformed during validation
   */
  transformed?: Record<string, any>;

  /**
   * Additional validation metadata
   */
  meta?: {
    /**
     * Time taken for validation (ms)
     */
    duration?: number;

    /**
     * Number of rules executed
     */
    rulesExecuted?: number;

    /**
     * Number of transformations applied
     */
    transformations?: number;

    /**
     * Number of sanitizations applied
     */
    sanitizations?: number;

    /**
     * Cache hits during validation
     */
    cacheHits?: number;

    /**
     * Custom metadata
     */
    [key: string]: any;
  };
}
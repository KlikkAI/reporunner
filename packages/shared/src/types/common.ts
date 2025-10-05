/**
 * Common Types - Shared across all Reporunner packages
 * Single source of truth for base type definitions
 * Consolidated from @reporunner/types
 */

/**
 * Unique identifier type
 */
export type ID = string;

/**
 * ISO 8601 timestamp string
 */
export type Timestamp = string;

/**
 * JSON-serializable value
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * Generic result type for operations
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: SortDirection;
}

/**
 * Filter operator
 */
export type FilterOperator =
  | 'eq' // equals
  | 'ne' // not equals
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'in' // in array
  | 'nin' // not in array
  | 'contains' // string contains
  | 'startsWith' // string starts with
  | 'endsWith'; // string ends with

/**
 * Generic filter
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: JSONValue;
}

/**
 * Query options for list operations
 */
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sort?: SortOptions;
  filters?: Filter[];
}

/**
 * Entity with common audit fields
 */
export interface AuditFields {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: ID;
  updatedBy?: ID;
}

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  deletedAt?: Timestamp;
  deletedBy?: ID;
  isDeleted: boolean;
}

/**
 * Base entity interface
 */
export interface BaseEntity extends AuditFields {
  id: ID;
}

/**
 * Entity with soft delete support
 */
export interface SoftDeletableEntity extends BaseEntity, SoftDeleteFields {}

/**
 * Status type for entities
 */
export type EntityStatus = 'active' | 'inactive' | 'draft' | 'archived';

/**
 * Execution mode
 */
export type ExecutionMode = 'manual' | 'trigger' | 'schedule' | 'webhook' | 'retry';

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * API response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: Timestamp;
    requestId?: string;
    version?: string;
  };
}

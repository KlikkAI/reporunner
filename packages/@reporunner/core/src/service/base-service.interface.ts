import type { Filter, Pagination, Sort } from '../types/repository.types';

/**
 * Generic response type for service operations
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata?: Record<string, any>;
}

/**
 * Base interface for all domain services
 */
export interface IBaseService<T, ID = string> {
  /**
   * Get entity by ID
   */
  getById(id: ID): Promise<ServiceResult<T>>;

  /**
   * Find entities matching criteria
   */
  find(filter?: Filter<T>, sort?: Sort<T>, pagination?: Pagination): Promise<ServiceResult<T[]>>;

  /**
   * Count entities matching criteria
   */
  count(filter?: Filter<T>): Promise<ServiceResult<number>>;

  /**
   * Create new entity
   */
  create(data: Partial<T>): Promise<ServiceResult<T>>;

  /**
   * Update existing entity
   */
  update(id: ID, data: Partial<T>): Promise<ServiceResult<T>>;

  /**
   * Delete entity
   */
  delete(id: ID): Promise<ServiceResult<boolean>>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<ServiceResult<boolean>>;
}

/**
 * Base interface for domain events
 */
export interface IDomainEvent {
  eventType: string;
  payload: any;
  metadata: {
    timestamp: Date;
    correlationId?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Base interface for event handlers
 */
export interface IDomainEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Base interface for validation results
 */
export interface ValidationResult {
  valid: boolean;
  errors: {
    field: string;
    message: string;
    code?: string;
  }[];
}

/**
 * Base interface for validators
 */
export interface IValidator<T> {
  validate(data: Partial<T>): Promise<ValidationResult>;
}

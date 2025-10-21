import type { Filter, Pagination, Sort } from '../types';

/**
 * Base repository interface that defines common operations
 * across all repositories in the system.
 * @typeParam T - The entity type this repository manages
 * @typeParam ID - The type of the entity's ID field
 */
export interface IBaseRepository<T, ID = string> {
  /**
   * Find a single entity by its ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find a single entity matching the provided filter
   */
  findOne(filter: Filter<T>): Promise<T | null>;

  /**
   * Find all entities matching the provided criteria
   */
  find(filter?: Filter<T>, sort?: Sort<T>, pagination?: Pagination): Promise<T[]>;

  /**
   * Count entities matching the provided filter
   */
  count(filter?: Filter<T>): Promise<number>;

  /**
   * Create a new entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Create multiple entities
   */
  createMany(data: Partial<T>[]): Promise<T[]>;

  /**
   * Update an entity by ID
   */
  update(id: ID, data: Partial<T>): Promise<T>;

  /**
   * Update multiple entities matching a filter
   */
  updateMany(filter: Filter<T>, data: Partial<T>): Promise<number>;

  /**
   * Delete an entity by ID
   */
  delete(id: ID): Promise<boolean>;

  /**
   * Delete multiple entities matching a filter
   */
  deleteMany(filter: Filter<T>): Promise<number>;

  /**
   * Check if an entity exists
   */
  exists(filter: Filter<T>): Promise<boolean>;

  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit a transaction
   */
  commitTransaction(): Promise<void>;

  /**
   * Rollback a transaction
   */
  rollbackTransaction(): Promise<void>;
}

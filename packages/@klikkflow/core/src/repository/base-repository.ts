import {
  EntityNotFoundError,
  type Filter,
  type Pagination,
  RepositoryError,
  type Sort,
  TransactionState,
} from '../types/repository.types';
import type { IBaseRepository } from './base-repository.interface';

/**
 * Abstract base repository implementation that provides common functionality
 * and error handling for all concrete repository implementations.
 */
export abstract class BaseRepository<T, ID = string> implements IBaseRepository<T, ID> {
  protected transactionState: TransactionState = TransactionState.NONE;
  protected abstract readonly entityName: string;

  abstract findById(id: ID): Promise<T | null>;
  abstract findOne(filter: Filter<T>): Promise<T | null>;
  abstract find(filter?: Filter<T>, sort?: Sort<T>, pagination?: Pagination): Promise<T[]>;
  abstract count(filter?: Filter<T>): Promise<number>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract createMany(data: Partial<T>[]): Promise<T[]>;
  abstract update(id: ID, data: Partial<T>): Promise<T>;
  abstract updateMany(filter: Filter<T>, data: Partial<T>): Promise<number>;
  abstract delete(id: ID): Promise<boolean>;
  abstract deleteMany(filter: Filter<T>): Promise<number>;

  /**
   * Wraps repository operations in error handling logic
   */
  protected async wrapError<R>(operation: () => Promise<R>): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }
      throw new RepositoryError(
        `Error performing operation on ${this.entityName}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Helper to throw EntityNotFoundError if entity is null
   */
  protected throwIfNotFound(entity: T | null, id: ID): T {
    if (!entity) {
      throw new EntityNotFoundError(this.entityName, id as string | number);
    }
    return entity;
  }

  /**
   * Check if an entity exists
   */
  async exists(filter: Filter<T>): Promise<boolean> {
    return this.wrapError(async () => {
      const count = await this.count(filter);
      return count > 0;
    });
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    if (this.transactionState !== TransactionState.NONE) {
      throw new RepositoryError('Transaction already in progress');
    }

    try {
      await this.beginTransactionImpl();
      this.transactionState = TransactionState.STARTED;
    } catch (error) {
      this.transactionState = TransactionState.NONE;
      throw new RepositoryError(
        'Failed to begin transaction',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(): Promise<void> {
    if (this.transactionState !== TransactionState.STARTED) {
      throw new RepositoryError('No transaction in progress');
    }

    try {
      await this.commitTransactionImpl();
      this.transactionState = TransactionState.COMMITTED;
    } catch (error) {
      throw new RepositoryError(
        'Failed to commit transaction',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (this.transactionState !== TransactionState.STARTED) {
      throw new RepositoryError('No transaction in progress');
    }

    try {
      await this.rollbackTransactionImpl();
      this.transactionState = TransactionState.ROLLED_BACK;
    } catch (error) {
      throw new RepositoryError(
        'Failed to rollback transaction',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Hook for concrete implementations to implement transaction begin
   */
  protected abstract beginTransactionImpl(): Promise<void>;

  /**
   * Hook for concrete implementations to implement transaction commit
   */
  protected abstract commitTransactionImpl(): Promise<void>;

  /**
   * Hook for concrete implementations to implement transaction rollback
   */
  protected abstract rollbackTransactionImpl(): Promise<void>;
}

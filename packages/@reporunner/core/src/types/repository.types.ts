/**
 * Generic type for filtering entities
 */
export type Filter<T> = {
  [P in keyof T]?: T[P] | {
    $eq?: T[P];
    $ne?: T[P];
    $in?: T[P][];
    $nin?: T[P][];
    $lt?: T[P];
    $lte?: T[P];
    $gt?: T[P];
    $gte?: T[P];
    $regex?: string;
    $exists?: boolean;
  };
} & {
  $and?: Filter<T>[];
  $or?: Filter<T>[];
  $nor?: Filter<T>[];
};

/**
 * Generic type for sorting entities
 */
export type Sort<T> = {
  [P in keyof T]?: 'asc' | 'desc' | 1 | -1;
};

/**
 * Pagination parameters
 */
export interface Pagination {
  /**
   * Number of records to skip
   */
  skip: number;
  
  /**
   * Maximum number of records to return
   */
  limit: number;
}

/**
 * Base error class for repository operations
 */
export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends RepositoryError {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

/**
 * Error thrown when a unique constraint is violated
 */
export class UniqueConstraintError extends RepositoryError {
  constructor(entityName: string, field: string, value: any) {
    super(`${entityName} with ${field} = ${value} already exists`);
    this.name = 'UniqueConstraintError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends RepositoryError {
  constructor(
    public readonly errors: Record<string, string[]>
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Transaction state
 */
export enum TransactionState {
  NONE = 'NONE',
  STARTED = 'STARTED',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK'
}
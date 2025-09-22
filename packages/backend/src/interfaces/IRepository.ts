/**
 * Base repository interface for common database operations
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findOne(query: any): Promise<T | null>;
  find(query: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  updateById(id: ID, data: Partial<T>): Promise<T | null>;
  deleteById(id: ID): Promise<boolean>;
  countDocuments(query: any): Promise<number>;
}

/**
 * Repository interface with pagination support
 */
export interface IRepositoryWithPagination<T, ID = string> extends IRepository<T, ID> {
  findWithPagination(query: any, skip: number, limit: number): Promise<T[]>;
}

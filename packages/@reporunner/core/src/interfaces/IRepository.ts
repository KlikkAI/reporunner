export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  save(entity: T): Promise<void>;
  update(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

/**
 * Base use case classes to eliminate CRUD duplication
 * Replaces identical FindById, Create, Update, Delete use-cases across domains
 */
import { injectable } from 'inversify';
import type { IRepository, IUseCase } from './interfaces';

@injectable()
export abstract class BaseGetByIdUseCase<T, K = string> implements IUseCase<K, T | null> {
  constructor(protected repository: IRepository<T, K>) {}

  async execute(id: K): Promise<T | null> {
    return this.repository.findById(id);
  }
}

@injectable()
export abstract class BaseGetAllUseCase<T> implements IUseCase<void, T[]> {
  constructor(protected repository: IRepository<T>) {}

  async execute(): Promise<T[]> {
    return this.repository.findAll();
  }
}

@injectable()
export abstract class BaseCreateUseCase<T, TInput = Partial<T>> implements IUseCase<TInput, T> {
  constructor(protected repository: IRepository<T>) {}

  async execute(input: TInput): Promise<T> {
    return this.repository.create(input as Partial<T>);
  }
}

@injectable()
export abstract class BaseUpdateUseCase<T, K = string>
  implements IUseCase<{ id: K; data: Partial<T> }, T | null>
{
  constructor(protected repository: IRepository<T, K>) {}

  async execute(input: { id: K; data: Partial<T> }): Promise<T | null> {
    return this.repository.update(input.id, input.data);
  }
}

@injectable()
export abstract class BaseDeleteUseCase<T, K = string> implements IUseCase<K, boolean> {
  constructor(protected repository: IRepository<T, K>) {}

  async execute(id: K): Promise<boolean> {
    return this.repository.delete(id);
  }
}

// Specific implementations for common ID types
@injectable()
export abstract class BaseFindByIdUseCase<T> extends BaseGetByIdUseCase<T, string> {}

@injectable()
export abstract class BaseFindByUserIdUseCase<T> implements IUseCase<string, T[]> {
  constructor(protected repository: IRepository<T>) {}

  abstract execute(userId: string): Promise<T[]>;
}

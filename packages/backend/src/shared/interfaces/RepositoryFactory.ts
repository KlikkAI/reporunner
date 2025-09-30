// Repository Factory
// Provides consistent repository creation patterns

import type { IBaseRepository } from './IBaseRepository';

export class RepositoryFactory {
  private static repositories = new Map<string, IBaseRepository>();

  static register<T extends IBaseRepository>(name: string, repository: T): void {
    RepositoryFactory.repositories.set(name, repository);
  }

  static get<T extends IBaseRepository>(name: string): T {
    const repository = RepositoryFactory.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository '${name}' not found`);
    }
    return repository as T;
  }

  static has(name: string): boolean {
    return RepositoryFactory.repositories.has(name);
  }
}

export default RepositoryFactory;

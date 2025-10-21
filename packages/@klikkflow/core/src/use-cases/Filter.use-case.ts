import type { IUseCase } from '../interfaces/IUseCase';

export interface FilterInput<T> {
  items: T[];
  predicate: (item: T, index: number) => boolean | Promise<boolean>;
}

export class FilterUseCase implements IUseCase<FilterInput<any>, any[]> {
  async execute<T>(input: FilterInput<T>): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < input.items.length; i++) {
      const shouldInclude = await input.predicate(input.items[i], i);
      if (shouldInclude) {
        results.push(input.items[i]);
      }
    }

    return results;
  }
}

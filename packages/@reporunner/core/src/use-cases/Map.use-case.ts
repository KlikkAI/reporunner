import type { IUseCase } from '../interfaces/IUseCase';

export interface MapInput<T, R> {
  items: T[];
  mapper: (item: T, index: number) => R | Promise<R>;
}

export class MapUseCase implements IUseCase<MapInput<any, any>, any[]> {
  async execute<T, R>(input: MapInput<T, R>): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < input.items.length; i++) {
      const result = await input.mapper(input.items[i], i);
      results.push(result);
    }
    
    return results;
  }
}

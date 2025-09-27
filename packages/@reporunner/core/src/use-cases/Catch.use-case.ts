import type { IUseCase } from '../interfaces/IUseCase';

export interface CatchInput<T> {
  operation: () => Promise<T>;
  fallback: T | ((error: Error) => T | Promise<T>);
  shouldCatch?: (error: Error) => boolean;
}

export class CatchUseCase implements IUseCase<CatchInput<any>, any> {
  async execute<T>(input: CatchInput<T>): Promise<T> {
    try {
      return await input.operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (input.shouldCatch && !input.shouldCatch(err)) {
        throw err;
      }
      
      if (typeof input.fallback === 'function') {
        return await (input.fallback as (error: Error) => T | Promise<T>)(err);
      }
      
      return input.fallback as T;
    }
  }
}

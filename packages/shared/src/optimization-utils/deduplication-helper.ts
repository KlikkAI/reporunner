import { createHash } from 'crypto';

/**
 * Utility functions for preventing code duplication
 * Generated during optimization process
 */

export class DeduplicationHelper {
  private static contentHashes = new Map<string, any>();

  static registerContent<T>(key: string, factory: () => T): T {
    const hash = this.hashKey(key);

    if (!this.contentHashes.has(hash)) {
      this.contentHashes.set(hash, factory());
    }

    return this.contentHashes.get(hash);
  }

  static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  static clearCache(): void {
    this.contentHashes.clear();
  }
}

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }

    return cache.get(key);
  }) as T;
}

/**
 * Interface for caching implementations
 */
export interface ICache {
  /**
   * Get a value from cache
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in cache with TTL
   */
  setex(key: string, ttl: number, value: string): Promise<void>;

  /**
   * Delete a value from cache
   */
  del(key: string): Promise<void>;

  /**
   * Delete multiple values from cache
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Get multiple values from cache
   */
  mget(keys: string[]): Promise<(string | null)[]>;
}

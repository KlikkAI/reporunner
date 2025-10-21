/**
 * Interface for rate limit storage implementations
 */
export interface Store {
  /**
   * Get number of hits for a key since windowStart
   */
  getHits(key: string, windowStart: number): Promise<number>;

  /**
   * Increment hits for a key
   */
  incrementHits(key: string, timestamp: number, windowMs: number): Promise<void>;

  /**
   * Reset hits for a key
   */
  resetKey(key: string): Promise<void>;

  /**
   * Delete hits older than windowStart
   */
  deleteOldHits(windowStart: number): Promise<void>;
}

import type { Store } from './stores/Store';

export interface RateLimiterConfig {
  /**
   * Storage implementation
   */
  store: Store;

  /**
   * Maximum number of requests allowed within the window
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Number of requests remaining in current window
   */
  remaining: number;

  /**
   * When the current window resets
   */
  reset: number;
}

export class RateLimiter {
  private store: Store;
  private max: number;
  private windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.store = config.store;
    this.max = config.max;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a request is allowed
   */
  public async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get hits for this key
    const hits = await this.store.getHits(key, windowStart);

    // Calculate result
    const remaining = Math.max(0, this.max - hits);
    const reset = now + this.windowMs;
    const allowed = hits < this.max;

    // If allowed, increment hits
    if (allowed) {
      await this.store.incrementHits(key, now, this.windowMs);
    }

    return { allowed, remaining, reset };
  }

  /**
   * Get time until rate limit resets
   */
  public getRetryAfter(): number {
    return this.windowMs / 1000; // Convert to seconds
  }

  /**
   * Reset rate limit for a key
   */
  public async reset(key: string): Promise<void> {
    await this.store.resetKey(key);
  }

  /**
   * Clean up expired entries
   */
  public async cleanup(): Promise<void> {
    const windowStart = Date.now() - this.windowMs;
    await this.store.deleteOldHits(windowStart);
  }
}

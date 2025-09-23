import { EventEmitter } from 'node:events';

export interface RateLimitConfig {
  name: string;
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  strategy?: 'sliding' | 'fixed';
  burstAllowance?: number; // Allow temporary burst above limit
  retryAfterMs?: number; // Time to wait before retry
}

export interface RateLimitEntry {
  count: number;
  firstRequest: Date;
  lastRequest: Date;
  resetAt: Date;
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
  retryAfter?: number;
}

export class RateLimiter extends EventEmitter {
  private configs: Map<string, RateLimitConfig> = new Map();
  private entries: Map<string, RateLimitEntry> = new Map();
  private blocked: Set<string> = new Set();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.startCleanup();
  }

  /**
   * Configure rate limit for an integration
   */
  configure(config: RateLimitConfig): void {
    this.configs.set(config.name, config);

    this.emit('config:set', {
      name: config.name,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
    });
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(name: string, identifier?: string): Promise<RateLimitStatus> {
    const config = this.configs.get(name);
    if (!config) {
      // No rate limit configured
      return {
        remaining: Infinity,
        resetAt: new Date(),
        isLimited: false,
      };
    }

    const key = this.getKey(name, identifier);
    const now = new Date();

    // Check if temporarily blocked
    if (this.blocked.has(key)) {
      const entry = this.entries.get(key);
      if (entry && entry.resetAt > now) {
        const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
        return {
          remaining: 0,
          resetAt: entry.resetAt,
          isLimited: true,
          retryAfter,
        };
      } else {
        this.blocked.delete(key);
      }
    }

    let entry = this.entries.get(key);

    if (!entry || this.shouldReset(entry, config, now)) {
      // Create new entry or reset existing
      entry = this.createEntry(now, config);
      this.entries.set(key, entry);
    }

    // Apply strategy
    if (config.strategy === 'sliding') {
      return this.applySlidingWindow(entry, config, now, key);
    } else {
      return this.applyFixedWindow(entry, config, now, key);
    }
  }

  /**
   * Apply sliding window strategy
   */
  private applySlidingWindow(
    entry: RateLimitEntry,
    config: RateLimitConfig,
    now: Date,
    key: string
  ): RateLimitStatus {
    // Calculate time passed since first request
    const timePassed = now.getTime() - entry.firstRequest.getTime();
    const windowProgress = timePassed / config.windowMs;

    // Calculate allowed requests based on window progress
    const allowedRequests = Math.floor(config.maxRequests * windowProgress);
    const effectiveCount = Math.max(0, entry.count - allowedRequests);

    const remaining = config.maxRequests - effectiveCount;

    if (remaining <= 0) {
      // Check burst allowance
      if (config.burstAllowance && effectiveCount < config.maxRequests + config.burstAllowance) {
        entry.count++;
        entry.lastRequest = now;

        return {
          remaining: config.maxRequests + config.burstAllowance - effectiveCount - 1,
          resetAt: entry.resetAt,
          isLimited: false,
        };
      }

      // Rate limited
      this.handleRateLimit(key, entry, config);

      return {
        remaining: 0,
        resetAt: entry.resetAt,
        isLimited: true,
        retryAfter: Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000),
      };
    }

    // Request allowed
    entry.count++;
    entry.lastRequest = now;

    return {
      remaining: remaining - 1,
      resetAt: entry.resetAt,
      isLimited: false,
    };
  }

  /**
   * Apply fixed window strategy
   */
  private applyFixedWindow(
    entry: RateLimitEntry,
    config: RateLimitConfig,
    now: Date,
    key: string
  ): RateLimitStatus {
    const remaining = config.maxRequests - entry.count;

    if (remaining <= 0) {
      // Check burst allowance
      if (config.burstAllowance && entry.count < config.maxRequests + config.burstAllowance) {
        entry.count++;
        entry.lastRequest = now;

        return {
          remaining: config.maxRequests + config.burstAllowance - entry.count,
          resetAt: entry.resetAt,
          isLimited: false,
        };
      }

      // Rate limited
      this.handleRateLimit(key, entry, config);

      return {
        remaining: 0,
        resetAt: entry.resetAt,
        isLimited: true,
        retryAfter: Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000),
      };
    }

    // Request allowed
    entry.count++;
    entry.lastRequest = now;

    return {
      remaining: remaining - 1,
      resetAt: entry.resetAt,
      isLimited: false,
    };
  }

  /**
   * Record successful request
   */
  recordRequest(name: string, identifier?: string): void {
    const key = this.getKey(name, identifier);
    const entry = this.entries.get(key);

    if (entry) {
      this.emit('request:recorded', {
        name,
        identifier,
        count: entry.count,
        remaining: this.configs.get(name)?.maxRequests
          ? this.configs.get(name)?.maxRequests - entry.count
          : Infinity,
      });
    }
  }

  /**
   * Handle rate limit exceeded
   */
  private handleRateLimit(key: string, entry: RateLimitEntry, config: RateLimitConfig): void {
    this.blocked.add(key);

    // Set retry after time
    if (config.retryAfterMs) {
      entry.resetAt = new Date(Date.now() + config.retryAfterMs);
    }

    this.emit('rate:limited', {
      name: config.name,
      count: entry.count,
      resetAt: entry.resetAt,
      maxRequests: config.maxRequests,
    });
  }

  /**
   * Check if entry should be reset
   */
  private shouldReset(entry: RateLimitEntry, _config: RateLimitConfig, now: Date): boolean {
    return now >= entry.resetAt;
  }

  /**
   * Create new rate limit entry
   */
  private createEntry(now: Date, config: RateLimitConfig): RateLimitEntry {
    return {
      count: 0,
      firstRequest: now,
      lastRequest: now,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  /**
   * Get key for rate limit entry
   */
  private getKey(name: string, identifier?: string): string {
    return identifier ? `${name}:${identifier}` : name;
  }

  /**
   * Reset rate limit for specific integration
   */
  reset(name: string, identifier?: string): void {
    const key = this.getKey(name, identifier);
    this.entries.delete(key);
    this.blocked.delete(key);

    this.emit('rate:reset', { name, identifier });
  }

  /**
   * Get current status for integration
   */
  getStatus(name: string, identifier?: string): RateLimitStatus | null {
    const config = this.configs.get(name);
    if (!config) {
      return null;
    }

    const key = this.getKey(name, identifier);
    const entry = this.entries.get(key);
    const now = new Date();

    if (!entry) {
      return {
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowMs),
        isLimited: false,
      };
    }

    const isLimited = this.blocked.has(key) && entry.resetAt > now;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      remaining,
      resetAt: entry.resetAt,
      isLimited,
      retryAfter: isLimited
        ? Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000)
        : undefined,
    };
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(name: string, updates: Partial<RateLimitConfig>): void {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Rate limit config for ${name} not found`);
    }

    Object.assign(config, updates);

    this.emit('config:updated', { name, config });
  }

  /**
   * Remove rate limit configuration
   */
  removeConfig(name: string): boolean {
    const existed = this.configs.delete(name);

    // Clean up entries for this config
    const keysToDelete: string[] = [];
    for (const key of this.entries.keys()) {
      if (key.startsWith(name)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.entries.delete(key);
      this.blocked.delete(key);
    });

    if (existed) {
      this.emit('config:removed', { name });
    }

    return existed;
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const keysToDelete: string[] = [];

      // Clean up expired entries
      this.entries.forEach((entry, key) => {
        if (entry.resetAt < now) {
          // Entry has expired and can be cleaned up
          const timeSinceReset = now.getTime() - entry.resetAt.getTime();
          if (timeSinceReset > 60000) {
            // Keep for 1 minute after reset
            keysToDelete.push(key);
          }
        }
      });

      keysToDelete.forEach((key) => {
        this.entries.delete(key);
        this.blocked.delete(key);
      });

      if (keysToDelete.length > 0) {
        this.emit('cleanup:completed', { removed: keysToDelete.length });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalConfigs: number;
    totalEntries: number;
    blockedEntries: number;
    configsByName: Record<
      string,
      {
        maxRequests: number;
        windowMs: number;
        currentEntries: number;
      }
    >;
  } {
    const stats: any = {
      totalConfigs: this.configs.size,
      totalEntries: this.entries.size,
      blockedEntries: this.blocked.size,
      configsByName: {},
    };

    this.configs.forEach((config, name) => {
      let currentEntries = 0;
      for (const key of this.entries.keys()) {
        if (key.startsWith(name)) {
          currentEntries++;
        }
      }

      stats.configsByName[name] = {
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        currentEntries,
      };
    });

    return stats;
  }

  /**
   * Clear all
   */
  clearAll(): void {
    this.stopCleanup();
    this.configs.clear();
    this.entries.clear();
    this.blocked.clear();
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.clearAll();
    this.removeAllListeners();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

export default RateLimiter;

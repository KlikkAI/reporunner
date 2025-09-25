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

import { Request, Response } from 'express';
import { SecurityMiddleware, SecurityContext, SecurityConfig } from '../base/SecurityMiddleware';
import { RateLimiter } from './RateLimiter';
import { RedisStore } from './stores/RedisStore';
import { MemoryStore } from './stores/MemoryStore';

export interface RateLimitConfig extends SecurityConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom key generator function
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Skip rate limiting for certain requests
   */
  skip?: (req: Request) => boolean;

  /**
   * Custom rate limit exceeded handler
   */
  handler?: (req: Request, res: Response) => void;

  /**
   * Custom headers
   */
  headers?: {
    remaining?: string;
    reset?: string;
    total?: string;
  };

  /**
   * Storage configuration
   */
  store?: {
    type: 'memory' | 'redis';
    redisConfig?: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    };
  };
}

const DEFAULT_CONFIG: Partial<RateLimitConfig> = {
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  headers: {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Total'
  },
  store: {
    type: 'memory'
  }
};

export class RateLimitMiddleware extends SecurityMiddleware {
  private limiter: RateLimiter;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    super(config);
    this.config = { ...DEFAULT_CONFIG, ...config } as RateLimitConfig;
    this.limiter = this.createLimiter();
  }

  protected async implementation({ req, res }: SecurityContext): Promise<void> {
    // Skip rate limiting if configured
    if (this.config.skip?.(req)) {
      return;
    }

    // Get key for this request
    const key = this.getKey(req);

    // Check rate limit
    const result = await this.limiter.check(key);

    // Set headers
    if (this.config.headers) {
      if (this.config.headers.remaining) {
        res.setHeader(this.config.headers.remaining, result.remaining);
      }
      if (this.config.headers.reset) {
        res.setHeader(this.config.headers.reset, result.reset);
      }
      if (this.config.headers.total) {
        res.setHeader(this.config.headers.total, this.config.max);
      }
    }

    // If limit exceeded, handle it
    if (!result.allowed) {
      if (this.config.handler) {
        this.config.handler(req, res);
      } else {
        this.handleRateLimitExceeded(req, res);
      }
      throw new Error('Rate limit exceeded');
    }
  }

  private createLimiter(): RateLimiter {
    const { store, max, windowMs } = this.config;

    if (store?.type === 'redis') {
      return new RateLimiter({
        store: new RedisStore(store.redisConfig),
        max,
        windowMs
      });
    }

    return new RateLimiter({
      store: new MemoryStore(),
      max,
      windowMs
    });
  }

  private getKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    return req.ip;
  }

  private handleRateLimitExceeded(req: Request, res: Response): void {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: this.limiter.getRetryAfter()
    });
  }
}
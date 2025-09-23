import {
  type IRateLimiterOptions,
  RateLimiterMemory,
  RateLimiterRedis,
  type RateLimiterRes,
} from 'rate-limiter-flexible';
import { createClient, type RedisClientType } from 'redis';
// Removed unused ERROR_CODES import

export interface RateLimiterConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  useMemoryFallback?: boolean;
  enableDDoSProtection?: boolean;
}

export interface LimiterOptions {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds if limit exceeded
  execEvenly?: boolean; // Spread requests evenly
}

export interface DDoSMetrics {
  requestCount: number;
  blockedCount: number;
  suspiciousIPs: Set<string>;
  attackPatterns: Map<string, number>;
}

export class AdvancedRateLimiter {
  private redisClient?: RedisClientType;
  private limiters: Map<string, RateLimiterRedis | RateLimiterMemory> = new Map();
  private memoryLimiters: Map<string, RateLimiterMemory> = new Map();
  private ddosMetrics: DDoSMetrics;
  private config: RateLimiterConfig;
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  constructor(config: RateLimiterConfig = {}) {
    this.config = config;
    this.ddosMetrics = {
      requestCount: 0,
      blockedCount: 0,
      suspiciousIPs: new Set(),
      attackPatterns: new Map(),
    };

    if (config.redis) {
      this.initializeRedis(config.redis);
    }

    this.setupDefaultLimiters();

    if (config.enableDDoSProtection) {
      this.startDDoSMonitoring();
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(redisConfig: NonNullable<RateLimiterConfig['redis']>) {
    this.redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password,
    });

    this.redisClient.on('error', (_err) => {
      // Fallback to memory limiters if Redis fails
      if (this.config.useMemoryFallback) {
        this.switchToMemoryLimiters();
      }
    });

    await this.redisClient.connect();
  }

  /**
   * Setup default rate limiters
   */
  private setupDefaultLimiters() {
    // API rate limiter (general)
    this.createLimiter('api', {
      points: 100, // 100 requests
      duration: 60, // per minute
      blockDuration: 300, // block for 5 minutes
    });

    // Authentication rate limiter (strict)
    this.createLimiter('auth', {
      points: 5,
      duration: 900, // 15 minutes
      blockDuration: 3600, // 1 hour block
    });

    // Login attempts limiter (very strict)
    this.createLimiter('login', {
      points: 3,
      duration: 900,
      blockDuration: 7200, // 2 hour block
    });

    // Password reset limiter
    this.createLimiter('password-reset', {
      points: 2,
      duration: 3600, // 1 hour
      blockDuration: 86400, // 24 hour block
    });

    // Workflow execution limiter
    this.createLimiter('execution', {
      points: 10,
      duration: 60,
      blockDuration: 600,
      execEvenly: true, // Spread executions evenly
    });

    // API key generation limiter
    this.createLimiter('api-key', {
      points: 5,
      duration: 86400, // per day
      blockDuration: 86400,
    });

    // File upload limiter
    this.createLimiter('upload', {
      points: 10,
      duration: 3600, // per hour
      blockDuration: 3600,
    });

    // Webhook limiter
    this.createLimiter('webhook', {
      points: 1000,
      duration: 60,
      blockDuration: 60,
    });

    // Export limiter
    this.createLimiter('export', {
      points: 5,
      duration: 3600,
      blockDuration: 3600,
    });

    // DDoS protection limiter (very aggressive)
    this.createLimiter('ddos', {
      points: 1000,
      duration: 1, // per second
      blockDuration: 86400, // 24 hour block for DDoS
    });
  }

  /**
   * Create a rate limiter
   */
  createLimiter(name: string, options: LimiterOptions): void {
    const limiterOptions: IRateLimiterOptions = {
      keyPrefix: `rl:${name}`,
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration || options.duration * 2,
      execEvenly: options.execEvenly || false,
    };

    if (this.redisClient) {
      this.limiters.set(
        name,
        new RateLimiterRedis({
          storeClient: this.redisClient as any,
          ...limiterOptions,
        })
      );
    } else {
      this.limiters.set(name, new RateLimiterMemory(limiterOptions));
    }

    // Always create memory limiter as fallback
    if (this.config.useMemoryFallback) {
      this.memoryLimiters.set(name, new RateLimiterMemory(limiterOptions));
    }
  }

  /**
   * Check rate limit
   */
  async checkLimit(
    type: string,
    identifier: string,
    points: number = 1
  ): Promise<{
    allowed: boolean;
    remaining?: number;
    retryAfter?: number;
    blocked?: boolean;
  }> {
    // Check whitelist
    if (this.whitelist.has(identifier)) {
      return { allowed: true };
    }

    // Check blacklist
    if (this.blacklist.has(identifier)) {
      return { allowed: false, blocked: true };
    }

    const limiter = this.limiters.get(type);
    if (!limiter) {
      return { allowed: true };
    }

    try {
      const result = await limiter.consume(identifier, points);

      this.ddosMetrics.requestCount++;

      return {
        allowed: true,
        remaining: result.remainingPoints,
        retryAfter: Math.ceil(result.msBeforeNext / 1000),
      };
    } catch (rateLimiterRes) {
      const res = rateLimiterRes as RateLimiterRes;

      this.ddosMetrics.blockedCount++;

      // Log suspicious activity
      if (res.remainingPoints === 0) {
        await this.handleSuspiciousActivity(type, identifier, res);
      }

      // Check for DDoS pattern
      if (this.config.enableDDoSProtection) {
        await this.checkDDoSPattern(identifier, type);
      }

      return {
        allowed: false,
        remaining: res.remainingPoints || 0,
        retryAfter: Math.ceil(res.msBeforeNext / 1000),
        blocked: res.remainingPoints === 0,
      };
    }
  }

  /**
   * Check multiple limits (AND operation)
   */
  async checkMultipleLimits(
    limits: Array<{ type: string; points?: number }>,
    identifier: string
  ): Promise<{ allowed: boolean; failedLimit?: string }> {
    for (const limit of limits) {
      const result = await this.checkLimit(limit.type, identifier, limit.points);
      if (!result.allowed) {
        return { allowed: false, failedLimit: limit.type };
      }
    }
    return { allowed: true };
  }

  /**
   * Reset limit for identifier
   */
  async resetLimit(type: string, identifier: string): Promise<void> {
    const limiter = this.limiters.get(type);
    if (limiter) {
      await limiter.delete(identifier);
    }
  }

  /**
   * Get current consumption for identifier
   */
  async getCurrentConsumption(
    type: string,
    identifier: string
  ): Promise<{ consumed: number; remaining: number } | null> {
    const limiter = this.limiters.get(type);
    if (!limiter) return null;

    try {
      const res = await limiter.get(identifier);
      if (res) {
        return {
          consumed: res.consumedPoints,
          remaining: res.remainingPoints,
        };
      }
    } catch (_error) {}

    return null;
  }

  /**
   * Handle suspicious activity
   */
  private async handleSuspiciousActivity(
    type: string,
    identifier: string,
    rateLimiterRes: RateLimiterRes
  ): Promise<void> {
    // Add to suspicious IPs
    this.ddosMetrics.suspiciousIPs.add(identifier);

    // Track attack patterns
    const pattern = `${type}:${identifier}`;
    const count = (this.ddosMetrics.attackPatterns.get(pattern) || 0) + 1;
    this.ddosMetrics.attackPatterns.set(pattern, count);

    // Auto-blacklist after repeated violations
    if (count >= 5) {
      await this.addToBlacklist(identifier, 86400); // 24 hour ban
    }

    // Log to security monitoring
    await this.logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      identifier,
      limiterType: type,
      timestamp: new Date(),
      metadata: {
        consumedPoints: rateLimiterRes.consumedPoints,
        remainingPoints: rateLimiterRes.remainingPoints,
      },
    });
  }

  /**
   * Check for DDoS patterns
   */
  private async checkDDoSPattern(identifier: string, type: string): Promise<void> {
    const pattern = `${type}:${identifier}`;
    const violations = this.ddosMetrics.attackPatterns.get(pattern) || 0;

    // Check for rapid repeated violations
    if (violations >= 10) {
      // This looks like a DDoS attack
      await this.triggerDDoSProtection(identifier);
    }

    // Check overall request rate
    const requestRate =
      this.ddosMetrics.requestCount /
      (this.ddosMetrics.requestCount + this.ddosMetrics.blockedCount);

    if (requestRate > 0.8 && this.ddosMetrics.blockedCount > 1000) {
      // Possible distributed attack
      await this.triggerDistributedDDoSProtection();
    }
  }

  /**
   * Trigger DDoS protection
   */
  private async triggerDDoSProtection(identifier: string): Promise<void> {
    // Immediately blacklist the attacker
    await this.addToBlacklist(identifier, 86400 * 7); // 7 day ban

    // Apply stricter limits globally
    this.createLimiter('emergency', {
      points: 10,
      duration: 60,
      blockDuration: 3600,
    });

    // Alert administrators
    await this.sendDDoSAlert(identifier);
  }

  /**
   * Trigger distributed DDoS protection
   */
  private async triggerDistributedDDoSProtection(): Promise<void> {
    // Enable CAPTCHA or proof-of-work
    // This would integrate with your authentication system

    // Reduce all limits by 50%
    for (const [name, limiter] of this.limiters) {
      if (name !== 'ddos') {
        const currentPoints = (limiter as any).points;
        this.createLimiter(name, {
          points: Math.floor(currentPoints / 2),
          duration: (limiter as any).duration,
          blockDuration: (limiter as any).blockDuration * 2,
        });
      }
    }
  }

  /**
   * Add identifier to blacklist
   */
  async addToBlacklist(identifier: string, durationSeconds?: number): Promise<void> {
    this.blacklist.add(identifier);

    if (this.redisClient && durationSeconds) {
      await this.redisClient.setEx(`blacklist:${identifier}`, durationSeconds, '1');
    }

    // Schedule removal if duration specified
    if (durationSeconds) {
      setTimeout(() => {
        this.blacklist.delete(identifier);
      }, durationSeconds * 1000);
    }
  }

  /**
   * Add identifier to whitelist
   */
  addToWhitelist(identifier: string): void {
    this.whitelist.add(identifier);
  }

  /**
   * Remove from blacklist
   */
  async removeFromBlacklist(identifier: string): Promise<void> {
    this.blacklist.delete(identifier);

    if (this.redisClient) {
      await this.redisClient.del(`blacklist:${identifier}`);
    }
  }

  /**
   * Switch to memory limiters (fallback)
   */
  private switchToMemoryLimiters(): void {
    this.limiters = new Map(this.memoryLimiters);
  }

  /**
   * Start DDoS monitoring
   */
  private startDDoSMonitoring(): void {
    // Reset metrics every minute
    setInterval(() => {
      const totalRequests = this.ddosMetrics.requestCount + this.ddosMetrics.blockedCount;
      const blockRate =
        totalRequests > 0 ? (this.ddosMetrics.blockedCount / totalRequests) * 100 : 0;

      if (blockRate > 50) {
      }

      // Reset counters but keep suspicious IPs and patterns for longer
      this.ddosMetrics.requestCount = 0;
      this.ddosMetrics.blockedCount = 0;

      // Decay attack patterns
      for (const [pattern, count] of this.ddosMetrics.attackPatterns) {
        const newCount = Math.max(0, count - 1);
        if (newCount === 0) {
          this.ddosMetrics.attackPatterns.delete(pattern);
        } else {
          this.ddosMetrics.attackPatterns.set(pattern, newCount);
        }
      }
    }, 60000); // Every minute

    // Clear suspicious IPs every hour
    setInterval(() => {
      this.ddosMetrics.suspiciousIPs.clear();
    }, 3600000); // Every hour
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(_event: any): Promise<void> {}

  /**
   * Send DDoS alert
   */
  private async sendDDoSAlert(_identifier: string): Promise<void> {}

  /**
   * Get current metrics
   */
  getMetrics(): DDoSMetrics {
    return {
      ...this.ddosMetrics,
      suspiciousIPs: new Set(this.ddosMetrics.suspiciousIPs),
      attackPatterns: new Map(this.ddosMetrics.attackPatterns),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.disconnect();
    }
  }
}

// Export singleton instance
export const rateLimiter = new AdvancedRateLimiter();

export default AdvancedRateLimiter;

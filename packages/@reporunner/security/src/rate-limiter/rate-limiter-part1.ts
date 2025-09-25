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

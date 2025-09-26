})

// Login attempts limiter (very strict)
this.createLimiter('login',
{
  points: 3, duration;
  : 900,
  blockDuration: 7200, // 2 hour block
}
)

// Password reset limiter
this.createLimiter('password-reset',
{
  points: 2, duration;
  : 3600, // 1 hour
  blockDuration: 86400, // 24 hour block
}
)

// Workflow execution limiter
this.createLimiter('execution',
{
  points: 10, duration;
  : 60,
  blockDuration: 600,
  execEvenly: true, // Spread executions evenly
}
)

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
  createLimiter(name: string, options: LimiterOptions): void
{
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
async;
checkLimit(
    type: string,
    identifier: string,
    points: number = 1
  )
: Promise<
{
    allowed: boolean;
    remaining?: number;

*/
  private applySlidingWindow(
    entry: RateLimitEntry,
    config: RateLimitConfig,
    now: Date,
    key: string
  ): RateLimitStatus
{
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
private
applyFixedWindow(
    entry: RateLimitEntry,
    config: RateLimitConfig,
    now: Date,
    key: string
  )
: RateLimitStatus
{
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

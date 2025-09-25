retryAfter?: number;
blocked?: boolean;
}>
{
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
async;
checkMultipleLimits(
    limits: Array<{ type: string;
points?: number
}>,
    identifier: string
  ): Promise<
{
  allowed: boolean;
  failedLimit?: string
}
>
{
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
async;
resetLimit(type: string, identifier: string)
: Promise<void>
{
  const limiter = this.limiters.get(type);
  if (limiter) {
    await limiter.delete(identifier);
  }
}

/**
 * Get current consumption for identifier
 */
async;
getCurrentConsumption(
    type: string,
    identifier: string
  )
: Promise<
{
  consumed: number;
  remaining: number;
}
| null>
{
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

*/
  recordRequest(name: string, identifier?: string): void
{
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
private
handleRateLimit(key: string, entry: RateLimitEntry, config: RateLimitConfig)
: void
{
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
private
shouldReset(entry: RateLimitEntry, _config: RateLimitConfig, now: Date)
: boolean
{
  return now >= entry.resetAt;
}

/**
 * Create new rate limit entry
 */
private
createEntry(now: Date, config: RateLimitConfig)
: RateLimitEntry
{
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
private
getKey(name: string, identifier?: string)
: string
{
  return identifier ? `${name}:${identifier}` : name;
}

/**
 * Reset rate limit for specific integration
 */
reset(name: string, identifier?: string)
: void
{
  const key = this.getKey(name, identifier);
  this.entries.delete(key);
  this.blocked.delete(key);

  this.emit('rate:reset', { name, identifier });
}

/**
 * Get current status for integration
 */
getStatus(name: string, identifier?: string)
: RateLimitStatus | null
{
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

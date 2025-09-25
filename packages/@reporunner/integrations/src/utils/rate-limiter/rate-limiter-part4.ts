isLimited, retryAfter;
: isLimited
        ? Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000)
        : undefined,
    }
}

  /**
   * Update rate limit configuration
   */
  updateConfig(name: string, updates: Partial<RateLimitConfig>): void
{
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
removeConfig(name: string)
: boolean
{
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
private
startCleanup();
: void
{
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
private
stopCleanup();
: void
{
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
    this.cleanupInterval = undefined;
  }
}

/**
 * Get statistics
 */
getStatistics();
:
{
    totalConfigs: number;
    totalEntries: number;
    blockedEntries: number;
    configsByName: Record<
      string,
      {
        maxRequests: number;
        windowMs: number;

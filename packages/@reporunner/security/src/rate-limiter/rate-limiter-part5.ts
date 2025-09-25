async;
addToBlacklist(identifier: string, durationSeconds?: number)
: Promise<void>
{
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
addToWhitelist(identifier: string)
: void
{
  this.whitelist.add(identifier);
}

/**
 * Remove from blacklist
 */
async;
removeFromBlacklist(identifier: string)
: Promise<void>
{
  this.blacklist.delete(identifier);

  if (this.redisClient) {
    await this.redisClient.del(`blacklist:${identifier}`);
  }
}

/**
 * Switch to memory limiters (fallback)
 */
private
switchToMemoryLimiters();
: void
{
  this.limiters = new Map(this.memoryLimiters);
}

/**
 * Start DDoS monitoring
 */
private
startDDoSMonitoring();
: void
{
  // Reset metrics every minute
  setInterval(() => {
    const totalRequests = this.ddosMetrics.requestCount + this.ddosMetrics.blockedCount;
    const blockRate = totalRequests > 0 ? (this.ddosMetrics.blockedCount / totalRequests) * 100 : 0;

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
private
async;
logSecurityEvent(_event: any)
: Promise<void>
{
}

/**
 * Send DDoS alert
 */
private
async;
sendDDoSAlert(_identifier: string)
: Promise<void>
{
}

/**
 * Get current metrics
 */
getMetrics();
: DDoSMetrics
{
  return {
      ...this.ddosMetrics,
      suspiciousIPs: new Set(this.ddosMetrics.suspiciousIPs),
      attackPatterns: new Map(this.ddosMetrics.attackPatterns),
    };
}

/**
 * Cleanup resources
 */
async;
cleanup();
: Promise<void>
{
    if (this.redisClient) {

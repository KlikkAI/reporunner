currentEntries: number;
}
    >
}
{
  const stats: any = {
    totalConfigs: this.configs.size,
    totalEntries: this.entries.size,
    blockedEntries: this.blocked.size,
    configsByName: {},
  };

  this.configs.forEach((config, name) => {
    let currentEntries = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(name)) {
        currentEntries++;
      }
    }

    stats.configsByName[name] = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      currentEntries,
    };
  });

  return stats;
}

/**
 * Clear all
 */
clearAll();
: void
{
  this.stopCleanup();
  this.configs.clear();
  this.entries.clear();
  this.blocked.clear();
}

/**
 * Destroy
 */
destroy();
: void
{
  this.clearAll();
  this.removeAllListeners();
}
}

// Singleton instance
export const rateLimiter = new RateLimiter();

export default RateLimiter;

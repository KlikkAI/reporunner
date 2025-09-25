this.emit('metric:recorded', {
  integrationName,
  type,
  value,
  metrics,
});
}

  /**
   * Start global health check
   */
  private startGlobalHealthCheck(): void
{
  this.globalInterval = setInterval(async () => {
    for (const [integrationName, checks] of this.healthChecks) {
      for (const [_, check] of checks) {
        // Only run checks that don't have their own interval
        if (!check.interval) {
          await this.performSingleCheck(integrationName, check);
        }
      }
    }
  }, 60000); // Every minute
}

/**
 * Get unhealthy integrations
 */
getUnhealthyIntegrations();
: IntegrationHealth[]
{
  return Array.from(this.healthStatuses.values()).filter(
      (health) => health.overallStatus === 'unhealthy'
    );
}

/**
 * Get degraded integrations
 */
getDegradedIntegrations();
: IntegrationHealth[]
{
  return Array.from(this.healthStatuses.values()).filter(
      (health) => health.overallStatus === 'degraded'
    );
}

/**
 * Reset metrics for integration
 */
resetMetrics(integrationName: string)
: void
{
  this.initializeMetrics(integrationName);

  this.emit('metrics:reset', { integrationName });
}

/**
 * Remove health checks for integration
 */
removeHealthChecks(integrationName: string)
: boolean
{
  // Clear intervals
  for (const [key, interval] of this.checkIntervals) {
    if (key.startsWith(integrationName)) {
      clearInterval(interval);
      this.checkIntervals.delete(key);
    }
  }

  // Remove data
  const existed = this.healthChecks.delete(integrationName);
  this.healthStatuses.delete(integrationName);
  this.metrics.delete(integrationName);
  this.startTimes.delete(integrationName);

  if (existed) {
    this.emit('checks:removed', { integrationName });
  }

  return existed;
}

/**
 * Get summary statistics
 */
getSummary();
:
{
  totalIntegrations: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  averageUptime: number;
  overallSuccessRate: number;
}
{
    const healths = Array.from(this.healthStatuses.values());
    const allMetrics = Array.from(this.metrics.values());

    const summary = {
      totalIntegrations: healths.length,
      healthy: healths.filter((h) => h.overallStatus === 'healthy').length,
      degraded: healths.filter((h) => h.overallStatus === 'degraded').length,
      unhealthy: healths.filter((h) => h.overallStatus === 'unhealthy').length,
      averageUptime: 0,
      overallSuccessRate: 0,
    };

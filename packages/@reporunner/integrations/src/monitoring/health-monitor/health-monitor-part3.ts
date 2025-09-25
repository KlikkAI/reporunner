/**
 * Calculate overall status
 */
private
calculateOverallStatus(
    checks: Record<string, HealthStatus>
  )
: 'healthy' | 'degraded' | 'unhealthy'
{
  const statuses = Object.values(checks);

  if (statuses.some((s) => s.status === 'unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.some((s) => s.status === 'degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Perform health check for integration
 */
async;
checkHealth(integrationName: string)
: Promise<IntegrationHealth>
{
  const checks = this.healthChecks.get(integrationName);

  if (!checks) {
    throw new Error(`No health checks registered for ${integrationName}`);
  }

  const checkPromises: Promise<void>[] = [];

  for (const [_, check] of checks) {
    checkPromises.push(this.performSingleCheck(integrationName, check).then(() => {}));
  }

  await Promise.all(checkPromises);

  const health = this.healthStatuses.get(integrationName)!;

  this.emit('health:checked', {
    integrationName,
    status: health.overallStatus,
  });

  return health;
}

/**
 * Get health status
 */
getHealthStatus(integrationName?: string)
: IntegrationHealth | IntegrationHealth[] | null
{
  if (integrationName) {
    return this.healthStatuses.get(integrationName) || null;
  }

  return Array.from(this.healthStatuses.values());
}

/**
 * Record metric
 */
recordMetric(
    integrationName: string,
    type: 'request' | 'error' | 'response_time',
    value?: number
  )
: void
{
    let metrics = this.metrics.get(integrationName);

    if (!metrics) {
      this.initializeMetrics(integrationName);
      metrics = this.metrics.get(integrationName)!;
    }

    switch (type) {
      case 'request':
        metrics.requestCount++;
        break;
      case 'error':
        metrics.errorCount++;
        metrics.lastError = {
          message: `Error at ${new Date().toISOString()}`,
          timestamp: new Date(),
        };
        break;
      case 'response_time':
        if (value !== undefined) {
          // Calculate rolling average
          const currentAvg = metrics.averageResponseTime;
          const count = metrics.requestCount || 1;
          metrics.averageResponseTime = (currentAvg * (count - 1) + value) / count;
        }
        break;
    }

    // Update success rate
    if (metrics.requestCount > 0) {
      metrics.successRate =
        ((metrics.requestCount - metrics.errorCount) / metrics.requestCount) * 100;
    }

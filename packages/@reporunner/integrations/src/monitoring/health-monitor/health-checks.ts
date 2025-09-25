}

const interval = setInterval(async () => {
  await this.performSingleCheck(integrationName, check);
}, check.interval!);

this.checkIntervals.set(intervalKey, interval);
}

  /**
   * Perform single health check
   */
  private async performSingleCheck(
    integrationName: string,
    check: HealthCheck
  ): Promise<HealthStatus>
{
  const startTime = Date.now();
  const timeout = check.timeout || 5000;

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<HealthStatus>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });

    // Race between check and timeout
    const status = await Promise.race([check.check(), timeoutPromise]);

    status.timestamp = new Date();
    status.responseTime = Date.now() - startTime;

    // Update health status
    this.updateHealthStatus(integrationName, check.name, status);

    return status;
  } catch (error: any) {
    const status: HealthStatus = {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
    };

    this.updateHealthStatus(integrationName, check.name, status);

    if (check.critical) {
      this.emit('critical:unhealthy', {
        integrationName,
        checkName: check.name,
        error: error.message,
      });
    }

    return status;
  }
}

/**
 * Update health status
 */
private
updateHealthStatus(
    integrationName: string,
    checkName: string,
    status: HealthStatus
  )
: void
{
  let health = this.healthStatuses.get(integrationName);

  if (!health) {
    health = {
      integrationName,
      overallStatus: 'healthy',
      checks: {},
      lastChecked: new Date(),
      uptime: 0,
    };
    this.healthStatuses.set(integrationName, health);
  }

  health.checks[checkName] = status;
  health.lastChecked = new Date();

  // Calculate uptime
  const startTime = this.startTimes.get(integrationName);
  if (startTime) {
    health.uptime = Date.now() - startTime.getTime();
  }

  // Update overall status
  health.overallStatus = this.calculateOverallStatus(health.checks);

  // Attach metrics
  health.metrics = this.metrics.get(integrationName);

  this.emit('status:updated', {
    integrationName,
    checkName,
    status: status.status,
    overallStatus: health.overallStatus,
  });
}

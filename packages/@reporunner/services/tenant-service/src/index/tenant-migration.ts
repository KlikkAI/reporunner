private
async;
recordUsageMetrics(tenantId: string, usage: Partial<UsageMetrics['metrics']>)
: Promise<void>
{
  try {
    const now = new Date();
    const periods = ['hourly', 'daily'] as const;

    for (const period of periods) {
      const date = this.getperiodDate(now, period);
      const metricId = `${tenantId}_${period}_${date.toISOString()}`;

      let existingMetric = await this.database.findOne(this.USAGE_COLLECTION, {
        id: metricId,
      });

      if (!existingMetric) {
        existingMetric = {
          id: metricId,
          tenantId,
          period,
          date,
          metrics: {
            users: 0,
            active_users: 0,
            workflows: 0,
            workflow_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            execution_time_ms: 0,
            storageGB: 0,
            bandwidth_gb: 0,
            apiCalls: 0,
            api_errors: 0,
            webhook_calls: 0,
            integration_usage: {},
            feature_usage: {},
            error_rate: 0,
            avg_response_time: 0,
            concurrent_executions_peak: 0,
          },
        };
      }

      // Merge the usage data
      existingMetric.metrics = {
        ...existingMetric.metrics,
        ...usage,
      };

      await this.database.upsert(this.USAGE_COLLECTION, { id: metricId }, existingMetric);
    }
  } catch (error) {
    logger.error('Failed to record usage metrics:', error);
  }
}

private
async;
checkAndAlertLimits(tenantId: string)
: Promise<void>
{
  try {
    const limitsCheck = await this.checkLimits(tenantId);

    // Create alerts for violations
    for (const violation of limitsCheck.violations) {
      await this.createAlert(tenantId, {
        type: 'limit_exceeded',
        severity: 'high',
        title: `${violation.limit} limit exceeded`,
        message: `Current usage: ${violation.current}/${violation.max} (${violation.percentage.toFixed(1)}%)`,
        details: violation,
      });
    }

    // Create warnings for approaching limits
    for (const warning of limitsCheck.warnings) {
      await this.createAlert(tenantId, {
        type: 'approaching_limit',
        severity: 'medium',
        title: `${warning.limit} limit warning`,
        message: `Current usage: ${warning.current}/${warning.max} (${warning.percentage.toFixed(1)}%)`,
        details: warning,
      });
    }
  } catch (error) {
    logger.error('Failed to check and alert limits:', error);
  }
}

private
async;
createAlert(
    tenantId: string,
    alertData: Omit<TenantAlert, 'id' | 'tenantId' | 'status' | 'created_at'>
  )
: Promise<string>
{
    try {
      // Check if similar alert already exists and is active
      const _existingAlert = await this.database.findOne(this.ALERTS_COLLECTION, {
        tenantId,
        type: alertData.type,
        title: alertData.title,
        status: 'active',

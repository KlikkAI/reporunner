filter[field] = { $regex: value, $options: 'i' };
break;
case 'greater_than':
        filter[field] =
{
  $gt: value;
}
break;
case 'less_than':
        filter[field] =
{
  $lt: value;
}
break;
}

return filter;
}

  private async cacheRecentEvent(event: AuditEvent): Promise<void>
{
  const key = `audit:recent:${event.organizationId}`;
  await this.redis.lpush(key, JSON.stringify(event));
  await this.redis.ltrim(key, 0, 99); // Keep last 100 events
  await this.redis.expire(key, 3600); // 1 hour TTL
}

private
async;
updateMetricsCache(event: AuditEvent)
: Promise<void>
{
  const today = new Date().toISOString().split('T')[0];
  const metricsKey = `audit:metrics:${event.organizationId}:${today}`;

  await Promise.all([
    this.redis.hincrby(metricsKey, 'total_events', 1),
    this.redis.hincrby(metricsKey, `severity_${event.severity}`, 1),
    this.redis.hincrby(metricsKey, `outcome_${event.outcome}`, 1),
    this.redis.hincrby(metricsKey, `action_${event.action}`, 1),
    this.redis.expire(metricsKey, 86400 * 7), // 7 days TTL
  ]);
}

private
startRetentionScheduler();
: void
{
  // Schedule retention cleanup every 6 hours
  setInterval(
    () => {
      this.auditQueue.add(
        'process-retention',
        {},
        {
          repeat: { every: 6 * 60 * 60 * 1000 }, // 6 hours
        }
      );
    },
    6 * 60 * 60 * 1000
  );
}

private
async;
archiveEvents(filter: any, archiveDate: Date)
: Promise<void>
{
  // Implementation for archiving events to cold storage
  // This could be S3, tape storage, or another database
  logger.info('Archiving events (implementation needed for cold storage)');
}

private
getEventFieldValue(event: AuditEvent, field: string)
: any
{
  const fields = field.split('.');
  let value: any = event;

  for (const f of fields) {
    value = value?.[f];
  }

  return value;
}

private
calculateRuleSeverity(events: AuditEvent[])
: string
{
  const severityLevels = events.map((e) => e.severity);

  if (severityLevels.includes('critical')) return 'critical';
  if (severityLevels.includes('high')) return 'high';
  if (severityLevels.includes('medium')) return 'medium';
  return 'low';
}

private
calculateRiskImpact(rule: ComplianceRule, events: AuditEvent[])
: number
{
  const baseRisk = { low: 10, medium: 25, high: 50, critical: 100 }[rule.severity] || 10;
  const eventCount = events.length;
  const avgRiskScore = events.reduce((sum, e) => sum + (e.risk_score || 0), 0) / events.length;

  return Math.round(baseRisk * (1 + Math.log(eventCount)) * (1 + avgRiskScore / 100));
}

private
async;
calculateViolationTrend(ruleId: string, period: { start: Date;
end: Date;
}): Promise<'increasing' | 'decreasing' | 'stable'>
{
    // Calculate trend by comparing with previous period
    const periodDuration = period.end.getTime() - period.start.getTime();
    const previousPeriod = {
      start: new Date(period.start.getTime() - periodDuration),
      end: period.start,
    };

    const [currentCount, previousCount] = await Promise.all([
      this.database.countDocuments(this.AUDIT_COLLECTION, {
        timestamp: { $gte: period.start, $lte: period.end },
        // Add rule matching logic here
      }),
      this.database.countDocuments(this.AUDIT_COLLECTION, {
        timestamp: { $gte: previousPeriod.start, $lte: previousPeriod.end },
        // Add rule matching logic here
      }),
    ]);

    const changePercent = previousCount === 0 ?
      (currentCount > 0 ? 100 : 0) :
      ((currentCount - previousCount) / previousCount) * 100;

    if (changePercent > 10) return 'increasing';

}

  async getAuditMetrics(
    filter: Omit<AuditFilter, 'limit' | 'offset'>
  ): Promise<AuditMetrics>
{
  try {
    const cacheKey = `audit:metrics:${this.hashFilter(filter)}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const { events } = await this.queryEvents({
      ...filter,
      limit: undefined,
      offset: undefined,
    });

    const metrics: AuditMetrics = {
      total_events: events.length,
      events_by_severity: this.groupBy(events, 'severity'),
      events_by_outcome: this.groupBy(events, 'outcome'),
      top_users: this.getTopItems(events, 'userId', 10),
      top_resources: this.getTopItems(events, 'resource', 10),
      top_actions: this.getTopItems(events, 'action', 10),
      risk_distribution: this.getRiskDistribution(events),
      compliance_scores: await this.getComplianceScores(events),
      anomalies_detected: await this.countAnomalies(events),
      blocked_actions: events.filter((e) => e.outcome === 'failure' && e.severity === 'critical')
        .length,
      period: {
        start: filter.startDate || new Date(Math.min(...events.map((e) => e.timestamp.getTime()))),
        end: filter.endDate || new Date(Math.max(...events.map((e) => e.timestamp.getTime()))),
      },
    };

    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
    return metrics;
  } catch (error) {
    logger.error('Failed to get audit metrics:', error);
    throw new Error(`Failed to get audit metrics: ${error.message}`);
  }
}

async;
addRetentionPolicy(policy: Omit<RetentionPolicy, 'id' | 'created_at' | 'updated_at'>)
: Promise<string>
{
  try {
    const retentionPolicy: RetentionPolicy = {
      ...policy,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.database.create(this.POLICIES_COLLECTION, retentionPolicy);
    await this.redis.del('retention:policies:*');

    logger.info(`Retention policy ${retentionPolicy.id} added successfully`);
    return retentionPolicy.id;
  } catch (error) {
    logger.error('Failed to add retention policy:', error);
    throw new Error(`Failed to add retention policy: ${error.message}`);
  }
}

async;
addAlertRule(rule: Omit<AlertRule, 'id' | 'created_at'>)
: Promise<string>
{
  try {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateId(),
      created_at: new Date(),
    };

    await this.database.create(this.ALERTS_COLLECTION, alertRule);
    await this.redis.del('alert:rules:*');

    logger.info(`Alert rule ${alertRule.id} added successfully`);
    return alertRule.id;
  } catch (error) {
    logger.error('Failed to add alert rule:', error);
    throw new Error(`Failed to add alert rule: ${error.message}`);
  }
}

private
async;
checkComplianceRules(event: AuditEvent)
: Promise<void>
{
    try {
      const rules = await this.getComplianceRules();
      const violations: ComplianceRule[] = [];

      for (const rule of rules) {
        if (this.checkRuleViolation(rule, event)) {
          violations.push(rule);

          // Execute rule actions
          for (const action of rule.actions) {
            if (action.immediate) {
              await this.executeRuleAction(rule, event, action);
            } else {
              await this.auditQueue.add('execute-rule-action', {
                rule,
                event,

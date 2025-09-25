// Update last triggered time
await this.database.updateOne(
  this.ALERTS_COLLECTION,
  { id: rule.id },
  { last_triggered: new Date() }
);

logger.info(`Alert ${rule.id} triggered successfully`);
} catch (error)
{
  logger.error(`Failed to process alert job for rule ${rule.id}:`, error);
  throw error;
}
}

private
async
executeAlertAction(rule: AlertRule, event: AuditEvent, action: any)
: Promise<void>
{
  switch (action.type) {
    case 'email':
      this.eventBus.emit('notification.send', {
        type: 'email',
        target: action.target,
        subject: `Audit Alert: ${rule.name}`,
        template: action.template || 'audit_alert',
        data: { rule, event },
      });
      break;
    case 'slack':
      this.eventBus.emit('notification.send', {
        type: 'slack',
        target: action.target,
        template: action.template || 'audit_alert_slack',
        data: { rule, event },
      });
      break;
    case 'webhook':
      this.eventBus.emit('notification.send', {
        type: 'webhook',
        target: action.target,
        data: { rule, event, alert_type: 'audit' },
      });
      break;
    case 'sms':
      this.eventBus.emit('notification.send', {
        type: 'sms',
        target: action.target,
        message: `Audit Alert: ${rule.name} - ${event.action} on ${event.resource}`,
      });
      break;
  }
}

private
buildMongoFilter(filter: AuditFilter)
: any
{
  const mongoFilter: any = {};

  if (filter.startDate || filter.endDate) {
    mongoFilter.timestamp = {};
    if (filter.startDate) mongoFilter.timestamp.$gte = filter.startDate;
    if (filter.endDate) mongoFilter.timestamp.$lte = filter.endDate;
  }

  if (filter.userId) mongoFilter.userId = filter.userId;
  if (filter.organizationId) mongoFilter.organizationId = filter.organizationId;
  if (filter.action) mongoFilter.action = filter.action;
  if (filter.resource) mongoFilter.resource = filter.resource;
  if (filter.outcome) mongoFilter.outcome = filter.outcome;
  if (filter.severity) mongoFilter.severity = filter.severity;

  if (filter.risk_score_min !== undefined || filter.risk_score_max !== undefined) {
    mongoFilter.risk_score = {};
    if (filter.risk_score_min !== undefined) mongoFilter.risk_score.$gte = filter.risk_score_min;
    if (filter.risk_score_max !== undefined) mongoFilter.risk_score.$lte = filter.risk_score_max;
  }

  if (filter.compliance_tags && filter.compliance_tags.length > 0) {
    mongoFilter.compliance_tags = { $in: filter.compliance_tags };
  }

  if (filter.search_text) {
    mongoFilter.$text = { $search: filter.search_text };
  }

  return mongoFilter;
}

private
buildSortOptions(filter: AuditFilter)
: any
{
  const sortBy = filter.sort_by || 'timestamp';
  const sortOrder = filter.sort_order === 'asc' ? 1 : -1;
  return { [sortBy]: sortOrder };
}

private
buildRetentionFilter(condition: any)
: any
{
    const filter: any = {};
    const field = condition.field;
    const value = condition.value;

    switch (condition.operator) {
      case 'equals':
        filter[field] = value;
        break;
      case 'contains':

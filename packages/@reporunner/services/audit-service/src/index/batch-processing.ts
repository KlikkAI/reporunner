}
      } else
{
  // Simple condition check
  if (!this.checkSimpleCondition(eventValue, condition.operator, condition.value)) {
    return false;
  }
}
}

return true;
}

  private checkSimpleCondition(value: any, operator: string, expected: any): boolean
{
  switch (operator) {
    case 'equals':
      return value === expected;
    case 'not_equals':
      return value !== expected;
    case 'contains':
      return String(value).includes(String(expected));
    case 'greater_than':
      return Number(value) > Number(expected);
    case 'less_than':
      return Number(value) < Number(expected);
    default:
      return false;
  }
}

private
async;
executeRuleAction(rule: ComplianceRule, event: AuditEvent, action: any)
: Promise<void>
{
  try {
    switch (action.type) {
      case 'alert':
        this.eventBus.emit('audit.alert', {
          rule: rule.name,
          event,
          severity: rule.severity,
          message: `Compliance rule violation: ${rule.description}`,
        });
        break;
      case 'block':
        this.eventBus.emit('audit.block', {
          rule: rule.name,
          event,
          target: action.target,
        });
        break;
      case 'quarantine':
        this.eventBus.emit('audit.quarantine', {
          rule: rule.name,
          event,
          target: action.target,
        });
        break;
      case 'notify':
        this.eventBus.emit('audit.notify', {
          rule: rule.name,
          event,
          target: action.target,
        });
        break;
    }
  } catch (error) {
    logger.error('Failed to execute rule action:', error);
  }
}

private
processRetentionJob = async (job: Job): Promise<void> => {
  try {
    const policies = await this.database.findMany(this.POLICIES_COLLECTION, { enabled: true });

    for (const policy of policies) {
      for (const rule of policy.rules) {
        const cutoffDate = new Date(Date.now() - rule.retention_days * 24 * 60 * 60 * 1000);

        const filter = {
          timestamp: { $lt: cutoffDate },
          ...this.buildRetentionFilter(rule.condition),
        };

        if (rule.archive_after_days) {
          const archiveDate = new Date(Date.now() - rule.archive_after_days * 24 * 60 * 60 * 1000);
          // Archive old events
          await this.archiveEvents(filter, archiveDate);
        }

        // Delete expired events
        const deleteResult = await this.database.deleteMany(this.AUDIT_COLLECTION, filter);

        logger.info(
          `Retention policy ${policy.id} processed: deleted ${deleteResult.deletedCount} events`
        );
      }
    }
  } catch (error) {
    logger.error('Failed to process retention job:', error);
    throw error;
  }
};

private
processAlertJob = async (job: Job): Promise<void> => {
    const { rule, event } = job.data;

    try {
      // Execute alert actions
      for (const action of rule.actions) {
        await this.executeAlertAction(rule, event, action);
      }

action,
})
}
          }
        }
      }

if (violations.length > 0) {
  this.eventBus.emit('compliance.violations.detected', {
    event,
    violations,
  });
}
} catch (error)
{
  logger.error('Failed to check compliance rules:', error);
}
}

  private async checkAlertRules(event: AuditEvent): Promise<void>
{
  try {
    const rules = await this.database.findMany(this.ALERTS_COLLECTION, { enabled: true });

    for (const rule of rules) {
      if (await this.shouldTriggerAlert(rule, event)) {
        await this.auditQueue.add(
          'trigger-alert',
          {
            rule,
            event,
          },
          {
            priority: this.getSeverityPriority(rule.severity),
          }
        );
      }
    }
  } catch (error) {
    logger.error('Failed to check alert rules:', error);
  }
}

private
checkRuleViolation(rule: ComplianceRule, event: AuditEvent)
: boolean
{
  return rule.conditions.every((condition) => {
      const eventValue = this.getEventFieldValue(event, condition.field);

      switch (condition.operator) {
        case 'equals':
          return eventValue === condition.value;
        case 'not_equals':
          return eventValue !== condition.value;
        case 'contains': {
          const containsValue = String(eventValue);
          const searchValue = String(condition.value);
          return condition.case_sensitive ?
            containsValue.includes(searchValue) :
            containsValue.toLowerCase().includes(searchValue.toLowerCase());
        }
        case 'not_contains': {
          const notContainsValue = String(eventValue);
          const notSearchValue = String(condition.value);
          return condition.case_sensitive ?
            !notContainsValue.includes(notSearchValue) :
            !notContainsValue.toLowerCase().includes(notSearchValue.toLowerCase());
        }
        case 'greater_than':
          return Number(eventValue) > Number(condition.value);
        case 'less_than':
          return Number(eventValue) < Number(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(eventValue));
        case 'exists':
          return eventValue !== undefined && eventValue !== null;
        case 'not_exists':
          return eventValue === undefined || eventValue === null;
        default:
          return false;
      }
    });
}

private
async;
shouldTriggerAlert(rule: AlertRule, event: AuditEvent)
: boolean
{
    // Check if rule is in cooldown
    if (rule.last_triggered && rule.cooldown_minutes) {
      const cooldownEnd = new Date(rule.last_triggered.getTime() + rule.cooldown_minutes * 60000);
      if (new Date() < cooldownEnd) {
        return false;
      }
    }

    // Check conditions
    for (const condition of rule.conditions) {
      const eventValue = this.getEventFieldValue(event, condition.field);

      if (condition.time_window && condition.threshold) {
        // Time-based threshold check
        const windowStart = new Date(Date.now() - condition.time_window * 60000);
        const recentEvents = await this.database.countDocuments(
          this.AUDIT_COLLECTION,
          {
            timestamp: { $gte: windowStart },
            [condition.field]: condition.value,
          }
        );

        if (recentEvents < condition.threshold) {
          return false;

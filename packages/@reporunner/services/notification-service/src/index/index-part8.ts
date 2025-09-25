const newRule: NotificationRule = {
  ...rule,
  id: uuidv4(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

await this.rules.insertOne(newRule);

logger.info(`Notification rule created: ${newRule.id}`);
return newRule;
} catch (error)
{
  logger.error('Failed to create notification rule', error);
  throw error;
}
}

  async listRules(organizationId: string): Promise<NotificationRule[]>
{
  return await this.rules.find({ organizationId }).sort({ priority: -1 }).toArray();
}

private
async;
processEventForRules(event: any)
: Promise<void>
{
  try {
    const rules = await this.rules
      .find({
        enabled: true,
        eventTypes: event.type,
      })
      .sort({ priority: -1 })
      .toArray();

    for (const rule of rules) {
      try {
        if (await this.evaluateRuleConditions(rule, event)) {
          await this.executeRuleActions(rule, event);
        }
      } catch (error) {
        logger.error(`Failed to process rule: ${rule.id}`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to process event for rules', error);
  }
}

private
async;
evaluateRuleConditions(rule: NotificationRule, event: any)
: Promise<boolean>
{
  if (rule.conditions.length === 0) return true;

  for (const condition of rule.conditions) {
    const eventValue = this.getNestedValue(event, condition.field);

    if (!this.evaluateCondition(eventValue, condition.operator, condition.value)) {
      return false;
    }
  }

  return true;
}

private
async;
executeRuleActions(rule: NotificationRule, event: any)
: Promise<void>
{
  for (const action of rule.actions) {
    try {
      // Build notification request from rule action
      const request: NotificationRequest = {
        channelId: action.channelId,
        templateId: action.templateId,
        recipients: await this.resolveRecipients(action.recipients, event),
        variables: {
          ...action.variables,
          event: event.data,
          eventType: event.type,
          timestamp: event.timestamp,
        },
        priority: action.priority,
        organizationId: rule.organizationId,
        triggeredBy: 'rule',
        correlationId: event.correlationId,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
        },
      };

      await this.sendNotification(request);
    } catch (error) {
      logger.error(`Failed to execute rule action: ${rule.id}`, error);
    }
  }
}

// Utility methods
private
validateTemplate(template: NotificationTemplate)
: void
{
    // Basic template validation
    if (!template.template.trim()) {
      throw new Error('Template content cannot be empty');
    }

    // Check for undefined variables
    const variablePattern = /\{\{(\w+)\}\}/g;
    const matches = [...template.template.matchAll(variablePattern)];
    const usedVariables = matches.map(match => match[1]);
    const definedVariables = template.variables.map(v => v.name);

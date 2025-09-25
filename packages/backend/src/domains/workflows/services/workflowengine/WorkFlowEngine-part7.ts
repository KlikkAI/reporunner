// Process email options from node configuration and inputs
const emailOptions: SendEmailOptions = {
  to: this.processEmailList(nodeConfig.to || inputs.to),
  cc: nodeConfig.cc ? this.processEmailList(nodeConfig.cc) : undefined,
  bcc: nodeConfig.bcc ? this.processEmailList(nodeConfig.bcc) : undefined,
  subject: nodeConfig.subject || inputs.subject || 'No Subject',
  body: nodeConfig.message || inputs.message || '',
  isHtml: nodeConfig.emailType === 'html',
  replyToMessageId: inputs.replyToMessageId,
};

// Send email
const result = await gmailService.sendEmail(emailOptions);

return {
        messageId: result.messageId,
        threadId: result.threadId,
        to: emailOptions.to,
        subject: emailOptions.subject,
        sentAt: new Date().toISOString(),
      };
} catch (error: any)
{
  logger.error(`Gmail send error: ${error.message}`);
  throw new Error(`Gmail send failed: ${error.message}`);
}
}

  /**
   * Execute webhook node
   */
  private async executeWebhook(
    node: IWorkflowNode,
    _context: ExecutionContext,
    inputs: Record<string, any>
  ): Promise<any>
{
  // Webhook execution logic
  return {
      message: 'Webhook executed',
      nodeId: node.id,
      inputs,
    };
}

/**
 * Execute condition node with proper runtime evaluation
 */
private
async;
executeCondition(
    node: IWorkflowNode,
    _context: ExecutionContext,
    inputs: Record<string, any>
  )
: Promise<any>
{
    // Use the new conditionRules format from the frontend
    const conditionRules =
      node.data.configuration?.conditionRules || node.data.conditionRules || [];

    const defaultOutput =
      node.data.configuration?.defaultOutput || node.data.defaultOutput || 'default';

    logger.info(`Executing condition node: ${node.id}`, {
      rulesCount: conditionRules.length,
      defaultOutput,
      availableInputKeys: Object.keys(inputs),
    });

    const results: Array<{
      ruleId: string;
      outputName: string;
      matched: boolean;
      field: string;
      operator: string;
      expectedValue: any;
      actualValue: any;
      error?: string;
    }> = [];

    // Evaluate each condition rule
    for (const rule of conditionRules) {
      if (!rule.enabled) {
        logger.info(`Skipping disabled rule: ${rule.id}`);
        continue;
      }

      try {
        const fieldValue = this.getFieldValue(inputs, rule.field);
        const conditionMet = this.evaluateCondition(fieldValue, rule.operator, rule.value);

        results.push({
          ruleId: rule.id,
          outputName: rule.outputName,
          matched: conditionMet,
          field: rule.field,
          operator: rule.operator,
          expectedValue: rule.value,
          actualValue: fieldValue,
        });

        logger.info(`Rule evaluation: ${rule.id}`, {
          field: rule.field,
          operator: rule.operator,

const undefinedVars = usedVariables.filter((v) => !definedVariables.includes(v));
if (undefinedVars.length > 0) {
  throw new Error(`Undefined variables in template: ${undefinedVars.join(', ')}`);
}
}

  private renderTemplate(template: string, variables: Record<string, any>): string
{
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName]?.toString() || match;
    });
}

private
getPriorityWeight(priority: NotificationRequest['priority'])
: number
{
  const weights = { low: 1, normal: 5, high: 10, urgent: 20 };
  return weights[priority];
}

private
isRetryableError(error: Error)
: boolean
{
  const retryableErrors = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'RATE_LIMITED',
    'SERVER_ERROR',
  ];

  return retryableErrors.some(code =>
      error.message.includes(code) || error.name.includes(code)
    );
}

private
async;
updateResultStatus(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status']
  )
: Promise<void>
{
  const update: any = { status };

  if (status === 'sent') update.sentAt = new Date();
  if (status === 'delivered') update.deliveredAt = new Date();
  if (status === 'failed') update.failedAt = new Date();

  await this.results.updateOne(
    { requestId, recipientId },
    {
      $set: update,
      $inc: { attempts: 1 },
    }
  );
}

private
async;
updateResultWithResponse(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status'],
    response: any
  )
: Promise<void>
{
  await this.results.updateOne(
    { requestId, recipientId },
    {
      $set: {
        status,
        sentAt: new Date(),
        response,
      },
      $inc: { attempts: 1 },
    }
  );
}

private
async;
updateResultWithError(
    requestId: string,
    recipientId: string,
    status: NotificationResult['status'],
    error: NotificationError
  )
: Promise<void>
{
  await this.results.updateOne(
    { requestId, recipientId },
    {
      $set: {
        status,
        failedAt: new Date(),
        error,
      },
      $inc: { attempts: 1 },
    }
  );
}

private
getNestedValue(obj: any, path: string)
: any
{
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

private
evaluateCondition(actual: any, operator: string, expected: any)
: boolean
{
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;

end.setMinutes(0, 0, 0);
break;
case 'day':
        start.setHours(0, 0, 0, 0)
start.setDate(start.getDate() - 1)
end.setHours(0, 0, 0, 0);
break;
case 'week':
        start.setHours(0, 0, 0, 0)
start.setDate(start.getDate() - start.getDay() - 7)
end.setHours(0, 0, 0, 0);
end.setDate(end.getDate() - end.getDay());
break;
case 'month':
        start.setDate(1)
start.setHours(0, 0, 0, 0)
start.setMonth(start.getMonth() - 1);
end.setDate(1);
end.setHours(0, 0, 0, 0);
break;
}

return { start, end };
}

  private calculatePercentile(values: number[], percentile: number): number
{
  if (values.length === 0) return 0;

  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

private
async;
performCleanup();
: Promise<void>
{
  const now = new Date();

  // Clean up old raw events
  const eventCutoff = new Date(
    now.getTime() - this.config.retention.rawEvents * 24 * 60 * 60 * 1000
  );
  await this.events.deleteMany({ timestamp: { $lt: eventCutoff } });

  // Clean up old aggregated data
  const aggregatedCutoff = new Date(
    now.getTime() - this.config.retention.aggregatedData * 24 * 60 * 60 * 1000
  );
  await this.aggregatedMetrics.deleteMany({ timestamp: { $lt: aggregatedCutoff } });

  // Clean up old user sessions
  const sessionCutoff = new Date(
    now.getTime() - this.config.retention.userSessions * 24 * 60 * 60 * 1000
  );
  await this.userSessions.deleteMany({ startedAt: { $lt: sessionCutoff } });

  logger.info('Analytics cleanup completed', {
    eventCutoff,
    aggregatedCutoff,
    sessionCutoff,
  });
}

// Event handlers
private
async;
handleWorkflowEvent(event: any)
: Promise<void>
{
  try {
    await this.trackEvent({
      type: `workflow.${event.type}`,
      organizationId: event.data.organizationId || 'system',
      userId: event.data.userId,
      source: 'workflow_service',
      data: event.data,
      correlationId: event.correlationId,
    });

    // Record metrics
    if (event.type === 'created') {
      await this.incrementCounter(
        'workflow_operations_total',
        { operation: 'create' },
        event.data.organizationId || 'system'
      );
    }
  } catch (error) {
    logger.error('Failed to handle workflow event', error);
  }
}

private
async;
handleExecutionEvent(event: any)
: Promise<void>
{
    try {
      await this.trackEvent({
        type: `execution.${event.type}`,
        organizationId: event.data.organizationId || 'system',
        userId: event.data.triggeredBy,
        source: 'execution_service',
        data: event.data,
        correlationId: event.correlationId
      });

      // Record execution metrics
      if (event.type === 'completed' || event.type === 'failed') {
        await this.incrementCounter(
          'workflow_executions_total',
          {
            workflow_id: event.data.workflowId,
            status: event.data.status,
            trigger_type: event.data.triggerType || 'unknown'
          },

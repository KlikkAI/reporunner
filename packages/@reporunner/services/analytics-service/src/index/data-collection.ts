this.initializeIndexes();
this.setupEventSubscriptions();
this.startAggregationTimer();
this.setupDefaultMetrics();
}

  private async initializeIndexes(): Promise<void>
{
  try {
    // Events indexes
    await this.events.createIndex({ timestamp: -1 });
    await this.events.createIndex({ type: 1, timestamp: -1 });
    await this.events.createIndex({ organizationId: 1, timestamp: -1 });
    await this.events.createIndex({ userId: 1, timestamp: -1 });
    await this.events.createIndex({ sessionId: 1 });
    await this.events.createIndex({ correlationId: 1 });
    await this.events.createIndex({ tags: 1 });

    // Metrics indexes
    await this.metrics.createIndex({ metricId: 1, timestamp: -1 });
    await this.metrics.createIndex({ organizationId: 1, metricId: 1, timestamp: -1 });
    await this.metrics.createIndex({ 'labels.workflow_id': 1, timestamp: -1 });

    // Aggregated metrics indexes
    await this.aggregatedMetrics.createIndex({
      metricId: 1,
      interval: 1,
      timestamp: -1,
    });
    await this.aggregatedMetrics.createIndex({
      organizationId: 1,
      metricId: 1,
      interval: 1,
      timestamp: -1,
    });

    // User sessions indexes
    await this.userSessions.createIndex({ userId: 1, startedAt: -1 });
    await this.userSessions.createIndex({ organizationId: 1, startedAt: -1 });
    await this.userSessions.createIndex({ sessionId: 1 });

    // Dashboards indexes
    await this.dashboards.createIndex({ organizationId: 1, createdAt: -1 });
    await this.dashboards.createIndex({ createdBy: 1 });

    logger.info('Analytics service indexes initialized');
  } catch (error) {
    logger.error('Failed to create analytics indexes', error);
  }
}

private
async;
setupEventSubscriptions();
: Promise<void>
{
  // Subscribe to workflow events
  await this.eventBus.subscribe('workflow.*', async (event) => {
    await this.handleWorkflowEvent(event);
  });

  // Subscribe to execution events
  await this.eventBus.subscribe('execution.*', async (event) => {
    await this.handleExecutionEvent(event);
  });

  // Subscribe to user events
  await this.eventBus.subscribe('user.*', async (event) => {
    await this.handleUserEvent(event);
  });

  // Subscribe to system events
  await this.eventBus.subscribe('system.*', async (event) => {
    await this.handleSystemEvent(event);
  });
}

private
startAggregationTimer();
: void
{
  // Run aggregation every minute
  this.aggregationTimer = setInterval(async () => {
    try {
      await this.performAggregation();
    } catch (error) {
      logger.error('Aggregation failed', error);
    }
  }, 60000);

  // Run cleanup daily at 2 AM
  const now = new Date();
  const nextCleanup = new Date();
  nextCleanup.setHours(2, 0, 0, 0);
  if (nextCleanup <= now) {
    nextCleanup.setDate(nextCleanup.getDate() + 1);
  }

  setTimeout(() => {
    this.performCleanup();
    // Then run cleanup daily
    setInterval(() => this.performCleanup(), 24 * 60 * 60 * 1000);
  }, nextCleanup.getTime() - now.getTime());
}

private
async;
setupDefaultMetrics();
: Promise<void>
{
    const _defaultMetrics: Omit<MetricDefinition, 'id'>[] = [
      {
        name: 'workflow_executions_total',
        description: 'Total number of workflow executions',
        type: 'counter',
        labels: ['workflow_id', 'status', 'trigger_type'],

retention: 90;
},
{
  name: 'workflow_execution_duration', description;
  : 'Duration of workflow executions in milliseconds',
  type: 'histogram', unit;
  : 'ms',
        labels: ['workflow_id', 'status'],
        retention: 90
}
,
{
  name: 'active_users', description;
  : 'Number of active users',
  type: 'gauge', labels;
  : ['time_window'],
        retention: 30
}
,
{
  name: 'api_requests_total', description;
  : 'Total number of API requests',
  type: 'counter', labels;
  : ['method', 'endpoint', 'status_code'],
        retention: 60
}
,
{
  name: 'api_request_duration', description;
  : 'Duration of API requests in milliseconds',
  type: 'histogram', unit;
  : 'ms',
        labels: ['method', 'endpoint'],
        retention: 60
}
,
{
  name: 'node_executions_total', description;
  : 'Total number of node executions',
  type: 'counter', labels;
  : ['node_type', 'status', 'workflow_id'],
        retention: 90
}
,
{
  name: 'errors_total', description;
  : 'Total number of errors',
  type: 'counter', labels;
  : ['error_type', 'component', 'severity'],
        retention: 90
}
,
{
  name: 'system_resources', description;
  : 'System resource usage',
  type: 'gauge', unit;
  : 'percent',
        labels: ['resource_type', 'instance'],
        retention: 30
}
]

for (const metric of defaultMetrics) {
  await this.createMetricDefinition(metric);
}
}

  // Event tracking methods
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string>
{
  try {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
    };

    await this.events.insertOne(analyticsEvent);

    // Update session if sessionId provided
    if (event.sessionId && event.userId) {
      await this.sessionManager.updateSession(event.sessionId, event.userId, {
        lastActivity: analyticsEvent.timestamp,
        eventCount: 1,
      });
    }

    // Emit real-time event
    this.emit('event.tracked', analyticsEvent);

    return analyticsEvent.id;
  } catch (error) {
    logger.error('Failed to track event', error);
    throw error;
  }
}

async;
trackUserAction(
    userId: string,
    organizationId: string,
    action: string,
    data?: Record<string, any>,
    sessionId?: string
  )
: Promise<string>
{
    return this.trackEvent({
      type: 'user_action',
      userId,

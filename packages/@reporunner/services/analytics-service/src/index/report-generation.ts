organizationId, sessionId, source;
: 'user_interface',
      data:
{
  action,
  ...data
}
})
}

  async trackPageView(
    userId: string,
    organizationId: string,
    path: string,
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<string>
{
  const eventId = await this.trackEvent({
    type: 'page_view',
    userId,
    organizationId,
    sessionId,
    source: 'web_app',
    data: {
      path,
      ...metadata,
    },
  });

  // Update session with page info
  await this.sessionManager.addPageView(sessionId, path);

  return eventId;
}

// Metric collection methods
async;
recordMetric(
    metricId: string,
    value: number,
    labels: Record<string, string> = {},
    organizationId: string
  )
: Promise<void>
{
  try {
    const metric: MetricValue = {
      id: uuidv4(),
      metricId,
      timestamp: new Date(),
      value,
      labels,
      organizationId,
    };

    await this.metricCollector.record(metric);

    // Also cache recent values for real-time queries
    const cacheKey = `metric:${metricId}:${JSON.stringify(labels)}`;
    await this.cache.lpush(cacheKey, JSON.stringify(metric));
    await this.cache.ltrim(cacheKey, 0, 99); // Keep last 100 values
    await this.cache.expire(cacheKey, 3600); // Expire in 1 hour
  } catch (error) {
    logger.error('Failed to record metric', error);
    throw error;
  }
}

async;
incrementCounter(
    metricId: string,
    labels: Record<string, string> = {},
    organizationId: string,
    increment: number = 1
  )
: Promise<void>
{
  await this.recordMetric(metricId, increment, labels, organizationId);
}

async;
setGauge(
    metricId: string,
    value: number,
    labels: Record<string, string> = {},
    organizationId: string
  )
: Promise<void>
{
  await this.recordMetric(metricId, value, labels, organizationId);
}

// Query methods
async;
queryEvents(
    organizationId: string,
    options: QueryOptions
  )
: Promise<AnalyticsEvent[]>
{
    try {
      const query: any = {
        organizationId,
        timestamp: {
          $gte: options.startTime,
          $lte: options.endTime
        }
      };

      // Apply filters
      if (options.filters) {
        for (const filter of options.filters) {

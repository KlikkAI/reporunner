private
async;
aggregateMetricsForInterval(
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    now: Date
  )
: Promise<void>
{
  const timeWindow = this.getTimeWindow(interval, now);
  const metricDefinitions = await this.listMetricDefinitions();

  for (const metricDef of metricDefinitions) {
    try {
      await this.aggregateMetric(metricDef, interval, timeWindow);
    } catch (error) {
      logger.error(`Failed to aggregate metric ${metricDef.name}`, error);
    }
  }
}

private
async;
aggregateMetric(
    metricDef: MetricDefinition,
    interval: string,
    timeWindow: { start: Date;
end: Date;
}
  ): Promise<void>
{
  // Check if aggregation already exists
  const existing = await this.aggregatedMetrics.findOne({
    metricId: metricDef.id,
    interval,
    timestamp: timeWindow.start,
  });

  if (existing) return; // Already aggregated

  // Perform aggregation
  const pipeline = [
    {
      $match: {
        metricId: metricDef.id,
        timestamp: {
          $gte: timeWindow.start,
          $lt: timeWindow.end,
        },
      },
    },
    {
      $group: {
        _id: {
          organizationId: '$organizationId',
          labels: '$labels',
        },
        count: { $sum: 1 },
        sum: { $sum: '$value' },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        values: { $push: '$value' },
      },
    },
  ];

  const results = await this.metrics.aggregate(pipeline).toArray();

  for (const result of results) {
    const aggregated: AggregatedMetric = {
      id: uuidv4(),
      metricId: metricDef.id,
      interval: interval as any,
      timestamp: timeWindow.start,
      organizationId: result._id.organizationId,
      labels: result._id.labels,
      aggregations: {
        count: result.count,
        sum: result.sum,
        avg: result.avg,
        min: result.min,
        max: result.max,
        p50: this.calculatePercentile(result.values, 50),
        p95: this.calculatePercentile(result.values, 95),
        p99: this.calculatePercentile(result.values, 99),
      },
    };

    await this.aggregatedMetrics.insertOne(aggregated);
  }
}

private
getTimeWindow(
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month',
    now: Date
  )
:
{
  start: Date;
  end: Date;
}
{
    const start = new Date(now);
    const end = new Date(now);

    switch (interval) {
      case 'minute':
        start.setSeconds(0, 0);
        start.setMinutes(start.getMinutes() - 1);
        end.setSeconds(0, 0);
        break;
      case 'hour':
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - 1);

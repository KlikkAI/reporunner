? (overview.successful / overview.totalExecutions) * 100
          : 0,
        avgDuration: overview.avgDuration || 0,
        errorRate: overview.totalExecutions > 0
          ? ((overview.totalExecutions - overview.successful) / overview.totalExecutions) * 100
          : 0,
        topErrors: data.errors.map((e: any) => (
{
  error: e._id, count;
  : e.count
}
)),
        executionTrend: data.trend
      }
} catch (error)
{
  logger.error('Failed to get workflow insights', error);
  throw error;
}
}

  // Metric definitions
  async createMetricDefinition(
    metric: Omit<MetricDefinition, 'id'>
  ): Promise<MetricDefinition>
{
  try {
    // Check if metric already exists
    const existing = await this.metricDefinitions.findOne({ name: metric.name });
    if (existing) {
      return existing;
    }

    const definition: MetricDefinition = {
      ...metric,
      id: uuidv4(),
    };

    await this.metricDefinitions.insertOne(definition);
    return definition;
  } catch (error) {
    logger.error('Failed to create metric definition', error);
    throw error;
  }
}

async;
getMetricDefinition(name: string)
: Promise<MetricDefinition | null>
{
  return await this.metricDefinitions.findOne({ name });
}

async;
listMetricDefinitions();
: Promise<MetricDefinition[]>
{
  return await this.metricDefinitions.find({}).sort({ name: 1 }).toArray();
}

// Helper methods
private
applyFilter(query: any, filter: QueryFilter)
: void
{
  const { field, operator, value } = filter;

  switch (operator) {
    case 'eq':
      query[field] = value;
      break;
    case 'neq':
      query[field] = { $ne: value };
      break;
    case 'gt':
      query[field] = { $gt: value };
      break;
    case 'gte':
      query[field] = { $gte: value };
      break;
    case 'lt':
      query[field] = { $lt: value };
      break;
    case 'lte':
      query[field] = { $lte: value };
      break;
    case 'in':
      query[field] = { $in: value };
      break;
    case 'nin':
      query[field] = { $nin: value };
      break;
    case 'contains':
      query[field] = { $regex: value, $options: 'i' };
      break;
    case 'exists':
      query[field] = { $exists: value };
      break;
  }
}

private
async;
performAggregation();
: Promise<void>
{
  const now = new Date();
  const intervals = this.config.aggregation.intervals;

  for (const interval of intervals) {
    try {
      await this.aggregateMetricsForInterval(interval, now);
    } catch (error) {
      logger.error(`Failed to aggregate metrics for interval ${interval}`, error);
    }
  }
}

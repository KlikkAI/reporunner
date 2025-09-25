}

return await this.aggregatedMetrics.aggregate(pipeline).toArray();
} catch (error)
{
  logger.error('Failed to query metrics', error);
  throw error;
}
}

  async getRealtimeMetric(
    metricId: string,
    labels: Record<string, string> =
{
}
): Promise<MetricValue[]>
{
  try {
    const cacheKey = `metric:${metricId}:${JSON.stringify(labels)}`;
    const cached = await this.cache.lrange(cacheKey, 0, 9); // Last 10 values

    return cached.map(item => JSON.parse(item));
  } catch (error) {
    logger.error('Failed to get realtime metric', error);
    return [];
  }
}

// Dashboard methods
async;
createDashboard(
    dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>
  )
: Promise<DashboardConfig>
{
  try {
    const newDashboard: DashboardConfig = {
      ...dashboard,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.dashboards.insertOne(newDashboard);
    return newDashboard;
  } catch (error) {
    logger.error('Failed to create dashboard', error);
    throw error;
  }
}

async;
getDashboard(id: string)
: Promise<DashboardConfig | null>
{
  try {
    return await this.dashboards.findOne({ id });
  } catch (error) {
    logger.error('Failed to get dashboard', error);
    throw error;
  }
}

async;
listDashboards(
    organizationId: string,
    userId?: string
  )
: Promise<DashboardConfig[]>
{
  try {
    const query: any = {
      $or: [
        { organizationId, isPublic: true },
        { organizationId, createdBy: userId },
      ],
    };

    return await this.dashboards.find(query).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    logger.error('Failed to list dashboards', error);
    throw error;
  }
}

// Session management
async;
startSession(
    userId: string,
    organizationId: string,
    metadata: Partial<UserSession['metadata']> = {}
  )
: Promise<string>
{
  return await this.sessionManager.startSession(userId, organizationId, metadata);
}

async;
endSession(sessionId: string)
: Promise<void>
{
  await this.sessionManager.endSession(sessionId);
}

async;
getActiveUsers(
    organizationId: string,
    timeWindow: number = 24 // hours
  )
: Promise<number>
{
    try {
      const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

      const count = await this.userSessions.countDocuments({
        organizationId,
        $or: [
          { endedAt: { $gte: since } },
          { endedAt: { $exists: false }, startedAt: { $gte: since } }
        ]
      });

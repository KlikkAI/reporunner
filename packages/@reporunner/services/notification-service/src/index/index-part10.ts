case 'lte':
return actual <= expected;
case 'in':
return Array.isArray(expected) && expected.includes(actual);
case 'nin':
return Array.isArray(expected) && !expected.includes(actual);
case 'contains':
return String(actual).includes(String(expected));
case 'matches':
return new RegExp(String(expected)).test(String(actual));
default:
return false;
}
  }

  private async resolveRecipients(
    recipientIds: string[],
    event: any
  ): Promise<NotificationRecipient[]>
{
  // This would typically resolve user IDs to actual notification recipients
  // For now, return simple recipients
  return recipientIds.map(id => ({
      id,
      type: 'user' as const,
      value: id
    }));
}

// Query methods
async;
getNotificationResults(
    requestId: string
  )
: Promise<NotificationResult[]>
{
  return await this.results.find({ requestId }).toArray();
}

async;
getNotificationHistory(
    organizationId: string,
    filters?: {
      channelId?: string;
status?: NotificationResult['status'];
startDate?: Date;
endDate?: Date;
},
    pagination?:
{
  page: number;
  limit: number;
}
): Promise<
{
  results: NotificationResult[];
  total: number;
}
>
{
  // Build query from request collection to include organizationId
  const requestQuery: any = { organizationId };

  if (filters?.channelId) requestQuery.channelId = filters.channelId;
  if (filters?.startDate || filters?.endDate) {
    requestQuery.createdAt = {};
    if (filters.startDate) requestQuery.createdAt.$gte = filters.startDate;
    if (filters.endDate) requestQuery.createdAt.$lte = filters.endDate;
  }

  // Get matching request IDs
  const requests = await this.requests.find(requestQuery, { projection: { id: 1 } }).toArray();
  const requestIds = requests.map((r) => r.id);

  // Build results query
  const resultsQuery: any = { requestId: { $in: requestIds } };
  if (filters?.status) resultsQuery.status = filters.status;

  // Apply pagination
  const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
  const limit = pagination?.limit || 50;

  const [results, total] = await Promise.all([
    this.results.find(resultsQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    this.results.countDocuments(resultsQuery),
  ]);

  return { results, total };
}

// Event handlers
private
async;
handleNotificationEvent(event: any)
: Promise<void>
{
  logger.debug('Handling notification event', event);
}

async;
healthCheck();
: Promise<
{
  status: 'healthy' | 'unhealthy';
  metrics: {
    queueSize: number;
    processing: number;
    sent24h: number;
    failed24h: number;
  }
}
>
{
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [queueSize, sent24h, failed24h] = await Promise.all([
        this.notificationQueue.count(),
        this.results.countDocuments({ status: 'sent', sentAt: { $gte: last24h } }),
        this.results.countDocuments({ status: 'failed', failedAt: { $gte: last24h } })
      ]);

      return {
        status: 'healthy',

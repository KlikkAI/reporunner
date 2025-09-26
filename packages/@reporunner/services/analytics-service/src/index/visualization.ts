return count;
} catch (error)
{
  logger.error('Failed to get active users count', error);
  return 0;
}
}

  // Analytics insights
  async getWorkflowInsights(
    organizationId: string,
    workflowId?: string,
    timeRange:
{
  from: Date;
  to: Date;
}
=
{
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to;
  : new Date()
}
): Promise<
{
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
  executionTrend: Array<{ date: string; count: number; successRate: number }>;
}
>
{
    try {
      const pipeline = [
        {
          $match: {
            organizationId,
            type: 'execution.completed',
            timestamp: { $gte: timeRange.from, $lte: timeRange.to },
            ...(workflowId && { 'data.workflowId': workflowId })
          }
        },
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalExecutions: { $sum: 1 },
                  successful: {
                    $sum: { $cond: [{ $eq: ['$data.status', 'completed'] }, 1, 0] }
                  },
                  avgDuration: { $avg: '$data.duration' }
                }
              }
            ],
            errors: [
              { $match: { 'data.status': 'failed' } },
              {
                $group: {
                  _id: '$data.error.message',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 5 }
            ],
            trend: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$timestamp'
                    }
                  },
                  count: { $sum: 1 },
                  successful: {
                    $sum: { $cond: [{ $eq: ['$data.status', 'completed'] }, 1, 0] }
                  }
                }
              },
              {
                $project: {
                  date: '$_id',
                  count: 1,
                  successRate: {
                    $multiply: [{ $divide: ['$successful', '$count'] }, 100]
                  }
                }
              },
              { $sort: { date: 1 } }
            ]
          }
        }
      ];

      const result = await this.events.aggregate(pipeline).toArray();
      const data = result[0];

      const overview = data.overview[0] || {
        totalExecutions: 0,
        successful: 0,
        avgDuration: 0
      };

      return {
        totalExecutions: overview.totalExecutions,
        successRate: overview.totalExecutions > 0

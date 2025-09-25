}): Promise<
{
  total: number;
  byStatus: Record<string, number>;
  byTriggerType: Record<string, number>;
  avgDuration: number;
  successRate: number;
}
>
{
  try {
    const query: any = {};
    if (filters?.workflowId) query.workflowId = filters.workflowId;
    if (filters?.organizationId) query['metadata.organizationId'] = filters.organizationId;
    if (filters?.timeRange) {
      query.startedAt = {
        $gte: filters.timeRange.from,
        $lte: filters.timeRange.to,
      };
    }

    const pipeline = [
      { $match: query },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byTriggerType: [{ $group: { _id: '$triggerType', count: { $sum: 1 } } }],
          duration: [
            { $match: { duration: { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$duration' } } },
          ],
          successRate: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                successful: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ];

    const result = await this.executions.aggregate(pipeline).toArray();
    const data = result[0];

    return {
        total: data.total[0]?.count || 0,
        byStatus: Object.fromEntries(
          data.byStatus.map((item: any) => [item._id, item.count])
        ),
        byTriggerType: Object.fromEntries(
          data.byTriggerType.map((item: any) => [item._id, item.count])
        ),
        avgDuration: data.duration[0]?.avg || 0,
        successRate: data.successRate[0]
          ? data.successRate[0].successful / data.successRate[0].total * 100
          : 0
      };
  } catch (error) {
    logger.error('Failed to get execution stats', error);
    throw error;
  }
}

// Helper methods
private
validateExecutionRequest(request: ExecutionRequest)
: void
{
  if (!request.workflowId) {
    throw new Error('Workflow ID is required');
  }
  if (!request.triggeredBy) {
    throw new Error('Triggered by is required');
  }
}

private
getPriorityWeight(priority: string)
: number
{
  const weights = { low: 1, normal: 5, high: 10, critical: 20 };
  return weights[priority as keyof typeof weights] || 5;
}

private
async;
createExecution(
    request: ExecutionRequest,
    workflow: WorkflowDefinition
  )
: Promise<ExecutionResult>
{
    const execution: ExecutionResult = {
      id: uuidv4(),
      workflowId: request.workflowId,
      status: 'pending',
      startedAt: new Date(),
      triggeredBy: request.triggeredBy,
      triggerType: request.triggerType,
      inputData: request.inputData,
      nodeExecutions: [],
      metadata: {
        correlationId: request.correlationId || uuidv4(),
        environment: request.environment || 'production',
        organizationId: workflow.organizationId,
        executionContext: request.metadata || {}
      },

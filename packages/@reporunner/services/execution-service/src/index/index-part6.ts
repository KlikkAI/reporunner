// Get from database
const execution = await this.executions.findOne({ id });

if (execution) {
  // Cache for future requests
  await this.cache.setex(`execution:${id}`, 300, JSON.stringify(execution));
}

return execution;
} catch (error)
{
  logger.error(`Failed to get execution: ${id}`, error);
  throw error;
}
}

  async cancelExecution(id: string, reason?: string): Promise<boolean>
{
  try {
    const execution = await this.getExecution(id);
    if (!execution) {
      return false;
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return false; // Cannot cancel completed executions
    }

    // Update execution status
    await this.updateExecutionStatus(id, 'cancelled');

    // Cancel job in queue if pending
    const job = await this.executionQueue.getJob(id);
    if (job && (await job.isWaiting())) {
      await job.remove();
    }

    // Emit cancellation event
    await this.eventBus.publish('execution.cancelled', {
      executionId: id,
      reason: reason || 'User cancellation',
    });

    logger.info(`Execution cancelled: ${id}`);
    return true;
  } catch (error) {
    logger.error(`Failed to cancel execution: ${id}`, error);
    return false;
  }
}

async;
listExecutions(filters: {
    workflowId?: string;
status?: string;
triggeredBy?: string;
organizationId?: string;
startDate?: Date;
endDate?: Date;
}, pagination:
{
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}
): Promise<
{
  executions: ExecutionResult[];
  total: number;
}
>
{
  try {
    const query: any = {};

    if (filters.workflowId) query.workflowId = filters.workflowId;
    if (filters.status) query.status = filters.status;
    if (filters.triggeredBy) query.triggeredBy = filters.triggeredBy;
    if (filters.organizationId) query['metadata.organizationId'] = filters.organizationId;

    if (filters.startDate || filters.endDate) {
      query.startedAt = {};
      if (filters.startDate) query.startedAt.$gte = filters.startDate;
      if (filters.endDate) query.startedAt.$lte = filters.endDate;
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort = pagination.sort || { startedAt: -1 };

    const [executions, total] = await Promise.all([
      this.executions.find(query).sort(sort).skip(skip).limit(pagination.limit).toArray(),
      this.executions.countDocuments(query),
    ]);

    return { executions, total };
  } catch (error) {
    logger.error('Failed to list executions', error);
    throw error;
  }
}

async;
getExecutionStats(filters?: {
    workflowId?: string;
organizationId?: string;
timeRange?: { from: Date;
to: Date;
}

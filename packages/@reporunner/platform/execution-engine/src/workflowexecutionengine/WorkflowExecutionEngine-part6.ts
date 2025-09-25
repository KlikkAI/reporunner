): void
{
  const condition = result.data?.condition;
  const branchToTake = condition ? 'true' : 'false';

  // Note: conditional edges would be filtered here based on branch
  // Currently handled in the nodesToExecute filter below

  // Remove nodes from other branches
  nodesToExecute.filter((n, index) => {
    const edge = edges.find((e) => e.source === node.id && e.target === n.id);
    if (edge?.data?.branch && edge.data.branch !== branchToTake) {
      nodesToExecute.splice(index, 1);
    }
  });
}

/**
 * Register default node executors
 */
private
registerDefaultExecutors();
: void
{
  // Register basic executors
  // These would be expanded with actual integration executors
}

/**
 * Check execution permission
 */
private
async;
checkExecutionPermission(_userId: string, _workflowId: string)
: Promise<boolean>
{
  // TODO: Implement permission check using PermissionEngine
  return true;
}

/**
 * Update execution status
 */
private
async;
updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    error?: any
  )
: Promise<void>
{
  const update: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === ExecutionStatus.SUCCESS || status === ExecutionStatus.FAILED) {
    update.stoppedAt = new Date();
  }

  if (error) {
    update['data.resultData.error'] = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date(),
    };
  }

  await this.db.mongo.executions.updateOne({ id: executionId }, { $set: update });
}

/**
 * Update execution results
 */
private
async;
updateExecutionResults(
    executionId: string,
    results: any,
    status: ExecutionStatus
  )
: Promise<void>
{
  await this.db.mongo.executions.updateOne(
    { id: executionId },
    {
      $set: {
        status,
        stoppedAt: new Date(),
        'data.resultData.runData': results,
        executionTime: Date.now() - this.activeExecutions.get(executionId)?.startedAt.getTime(),
      },
    }
  );
}

/**
 * Stop execution
 */
async;
stopExecution(executionId: string)
: Promise<void>
{
  const context = this.activeExecutions.get(executionId);
  if (context) {
    // Cancel any pending operations
    this.activeExecutions.delete(executionId);
    await this.updateExecutionStatus(executionId, ExecutionStatus.CANCELLED);
    this.emit(EVENTS.EXECUTION_CANCELLED, { executionId });
  }
}

/**
 * Clean up resources
 */
async;
shutdown();
: Promise<void>
{
    await this.worker?.close();
    await this.executionQueue?.close();

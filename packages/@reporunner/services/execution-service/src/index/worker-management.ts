if (!this.evaluateCondition(edge.condition!, sourceOutput)) {
  return false;
}
}

return true;
}

  private evaluateCondition(condition: EdgeCondition, sourceOutput: any): boolean
{
  switch (condition.type) {
    case 'value':
      return this.compareValues(sourceOutput, condition.value, condition.operator || 'eq');
    case 'expression':
      // Implement expression evaluation (could use a safe eval library)
      return true; // Placeholder
    case 'status':
      return sourceOutput?.status === condition.value;
    default:
      return true;
  }
}

private
compareValues(actual: any, expected: any, operator: string)
: boolean
{
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return actual > expected;
    case 'lt':
      return actual < expected;
    case 'gte':
      return actual >= expected;
    case 'lte':
      return actual <= expected;
    case 'contains':
      return String(actual).includes(String(expected));
    case 'matches':
      return new RegExp(String(expected)).test(String(actual));
    default:
      return true;
  }
}

private
async;
skipNode(executionId: string, nodeId: string, reason: string)
: Promise<void>
{
  await this.updateNodeStatus(executionId, nodeId, 'skipped', null, null, reason);
}

private
async;
failNode(executionId: string, nodeId: string, error: Error)
: Promise<void>
{
  await this.updateNodeStatus(executionId, nodeId, 'failed', null, error);
}

private
async;
updateNodeStatus(
    executionId: string,
    nodeId: string,
    status: NodeExecution['status'],
    result?: any,
    error?: Error,
    skipReason?: string
  )
: Promise<void>
{
  const update: any = {
    'nodeExecutions.$.status': status,
    'nodeExecutions.$.completedAt': new Date(),
  };

  if (result !== undefined) update['nodeExecutions.$.outputData'] = result;
  if (error) {
    update['nodeExecutions.$.error'] = {
      message: error.message,
      stack: error.stack,
      type: 'runtime',
    };
  }
  if (skipReason) update['nodeExecutions.$.skipReason'] = skipReason;

  await this.executions.updateOne(
    { id: executionId, 'nodeExecutions.nodeId': nodeId },
    { $set: update }
  );
}

private
async;
updateExecutionProgress(executionId: string)
: Promise<void>
{
  const execution = await this.getExecution(executionId);
  if (!execution) return;

  const completed = execution.nodeExecutions.filter((ne) => ne.status === 'completed').length;
  const failed = execution.nodeExecutions.filter((ne) => ne.status === 'failed').length;
  const skipped = execution.nodeExecutions.filter((ne) => ne.status === 'skipped').length;
  const running = execution.nodeExecutions.filter((ne) => ne.status === 'running').length;
  const pending = execution.nodeExecutions.filter((ne) => ne.status === 'pending').length;

  const progress: ExecutionProgress = {
    totalNodes: execution.nodeExecutions.length,
    completedNodes: completed,
    failedNodes: failed,
    skippedNodes: skipped,
    runningNodes: running,
    pendingNodes: pending,
    percentage: Math.round(
      ((completed + failed + skipped) / execution.nodeExecutions.length) * 100
    ),
    currentPhase: running > 0 ? 'executing' : pending > 0 ? 'pending' : 'completed',
  };

  await this.executions.updateOne({ id: executionId }, { $set: { progress } });
}

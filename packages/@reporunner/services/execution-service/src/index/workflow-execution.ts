// Add to queue for processing
await this.executionQueue.add(
  'execute-workflow',
  {
    executionId: execution.id,
    workflowId: request.workflowId,
    workflow,
    request,
    attempt: 1,
  },
  {
    priority: this.getPriorityWeight(request.options?.priority || 'normal'),
    delay: 0,
    jobId: execution.id,
  }
);

// Emit execution started event
await this.eventBus.publish('execution.started', {
  executionId: execution.id,
  workflowId: request.workflowId,
  triggeredBy: request.triggeredBy,
});

logger.info(`Execution queued: ${execution.id}`);
return execution;
} catch (error)
{
  logger.error('Failed to start execution', error);
  throw error;
}
}

  private async processExecution(job: Job<ExecutionJobData>): Promise<void>
{
  const { executionId, workflow, request } = job.data;

  try {
    // Update execution status to running
    await this.updateExecutionStatus(executionId, 'running');

    // Get current execution state
    const execution = await this.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    this.activeExecutions.set(executionId, execution);

    // Execute workflow with topological sorting
    const result = await this.executeWorkflowNodes(execution, workflow, request);

    // Update final execution result
    await this.completeExecution(executionId, result);

    this.activeExecutions.delete(executionId);
  } catch (error) {
    logger.error(`Execution processing failed: ${executionId}`, error);
    await this.failExecution(executionId, error as Error);
    this.activeExecutions.delete(executionId);
    throw error;
  }
}

private
async;
executeWorkflowNodes(
    execution: ExecutionResult,
    workflow: WorkflowDefinition,
    request: ExecutionRequest
  )
: Promise<Record<string, any>>
{
    const nodeOutputs = new Map<string, any>();
    const executedNodes = new Set<string>();
    const nodeQueue = this.topologicalSort(workflow.nodes, workflow.edges);

    // Initialize node executions
    for (const node of workflow.nodes) {
      const nodeExecution: NodeExecution = {
        nodeId: node.id,
        nodeName: node.data.name || node.type,
        nodeType: node.type,
        status: 'pending',
        attempts: 0,
        maxAttempts: node.config?.retryPolicy?.maxAttempts || 3,
        retryCount: 0
      };
      execution.nodeExecutions.push(nodeExecution);
    }

    // Process nodes in topological order
    for (const nodeId of nodeQueue) {
      if (execution.status === 'cancelled') {
        break;
      }

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      try {
        // Check if node should be executed based on conditions
        if (!await this.shouldExecuteNode(node, workflow.edges, nodeOutputs, execution)) {
          await this.skipNode(execution.id, nodeId, 'Condition not met');

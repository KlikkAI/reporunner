}

// Execute node
const result = await this.executeNode(execution, node, nodeOutputs, request);
nodeOutputs.set(nodeId, result);
executedNodes.add(nodeId);

await this.updateExecutionProgress(execution.id);

} catch (error)
{
  logger.error(`Node execution failed: ${nodeId}`, error);

  // Handle error based on workflow settings
  if (workflow.settings.errorHandling === 'stop') {
    throw error;
  } else if (workflow.settings.errorHandling === 'continue') {
    await this.failNode(execution.id, nodeId, error as Error);
    continue;
  } else if (workflow.settings.errorHandling === 'rollback') {
    await this.rollbackExecution(execution.id, executedNodes);
    throw error;
  }
}
}

// Return final output
return this.buildWorkflowOutput(nodeOutputs, workflow);
}

  private async executeNode(
    execution: ExecutionResult,
    node: WorkflowNode,
    nodeOutputs: Map<string, any>,
    request: ExecutionRequest
  ): Promise<any>
{
  const nodeExecution = execution.nodeExecutions.find((ne) => ne.nodeId === node.id);
  if (!nodeExecution) {
    throw new Error(`Node execution not found: ${node.id}`);
  }

  // Update node status to running
  await this.updateNodeStatus(execution.id, node.id, 'running');

  try {
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.type}`);
    }

    // Prepare node input data
    const inputData = await this.prepareNodeInput(node, nodeOutputs, request);

    // Execute node with timeout
    const timeout = node.config?.timeout || this.config.executionTimeout;
    const result = await Promise.race([
      executor.execute(node, inputData, {
        executionId: execution.id,
        correlationId: execution.metadata.correlationId,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Node execution timeout')), timeout)
      ),
    ]);

    // Update node status to completed
    await this.updateNodeStatus(execution.id, node.id, 'completed', result);

    // Emit node completed event
    await this.eventBus.publish('node.execution.completed', {
      executionId: execution.id,
      nodeId: node.id,
      nodeType: node.type,
      result,
    });

    return result;
  } catch (error) {
    // Update node status to failed
    await this.updateNodeStatus(execution.id, node.id, 'failed', null, error as Error);

    // Emit node failed event
    await this.eventBus.publish('node.execution.failed', {
      executionId: execution.id,
      nodeId: node.id,
      nodeType: node.type,
      error: (error as Error).message,
    });

    throw error;
  }
}

async;
getExecution(id: string)
: Promise<ExecutionResult | null>
{
    try {
      // Check cache first
      const cached = await this.cache.get(`execution:${id}`);
      if (cached) {
        return JSON.parse(cached);
      }

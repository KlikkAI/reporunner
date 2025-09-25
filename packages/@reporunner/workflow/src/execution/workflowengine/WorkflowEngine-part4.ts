* Handle execution errors
   */
  private handleExecutionError(execution: WorkflowExecution, error: any): void
{
  this.logger.error('Workflow execution failed', {
    executionId: execution.id,
    workflowId: execution.workflowId,
    error: error.message,
  });

  execution.status = 'error';
  execution.finishedAt = new Date();
  execution.error = error.message;

  this.emit('executionFailed', execution);
}

/**
 * Get topological execution order for nodes
 */
private
getExecutionOrder(workflow: WorkflowDefinition)
: string[]
{
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      throw new WorkflowEngineError('Circular dependency detected', 'CIRCULAR_DEPENDENCY');
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);

    // Visit dependencies first
    const dependencies = workflow.connections
      .filter((conn) => conn.destination.nodeId === nodeId)
      .map((conn) => conn.source.nodeId);

    for (const depId of dependencies) {
      visit(depId);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    order.push(nodeId);
  };

  // Visit all nodes
  for (const node of workflow.nodes) {
    visit(node.id);
  }

  return order;
}

/**
 * Get input data for a node from its connections
 */
private
async;
getNodeInputData(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    node: any
  )
: Promise<Record<string, any>>
{
  const inputData: Record<string, any> = {};

  // Get data from connected nodes
  const inputConnections = workflow.connections.filter(
    (conn) => conn.destination.nodeId === node.id
  );

  for (const connection of inputConnections) {
    const sourceExecution = execution.nodeExecutions.get(connection.source.nodeId);
    if (sourceExecution?.outputData) {
      const sourceData =
        sourceExecution.outputData[connection.source.outputIndex || 0] ||
        sourceExecution.outputData;

      inputData[connection.destination.inputIndex || 0] = sourceData;
    }
  }

  // If no connections, use workflow input data
  if (inputConnections.length === 0) {
    return execution.inputData;
  }

  return inputData;
}
}

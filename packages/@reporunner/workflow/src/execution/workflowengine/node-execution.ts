}
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    node: any
  ): Promise<void>
{
  const nodeExecution: NodeExecution = {
    nodeId: node.id,
    nodeName: node.name,
    status: 'running',
    startedAt: new Date(),
    inputData: {},
    outputData: {},
    retryAttempt: 0,
  };

  execution.nodeExecutions.set(node.id, nodeExecution);
  this.emit('nodeExecutionStarted', { execution, nodeExecution });

  try {
    // Get input data from previous nodes
    const inputData = await this.getNodeInputData(workflow, execution, node);
    nodeExecution.inputData = inputData;

    // Execute the node
    const result = await this.nodeExecutor.execute(node, inputData, {
      workflowId: workflow.id,
      executionId: execution.id,
      nodeId: node.id,
    });

    nodeExecution.status = 'success';
    nodeExecution.finishedAt = new Date();
    nodeExecution.outputData = result.data;

    execution.metadata.completedNodes++;

    this.emit('nodeExecutionCompleted', { execution, nodeExecution });
  } catch (error) {
    await this.handleNodeError(workflow, execution, nodeExecution, error);
  }
}

/**
 * Handle node execution errors with retry logic
 */
private
async;
handleNodeError(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    nodeExecution: NodeExecution,
    error: any
  )
: Promise<void>
{
  this.logger.error('Node execution failed', {
    executionId: execution.id,
    nodeId: nodeExecution.nodeId,
    error: error.message,
    attempt: nodeExecution.retryAttempt + 1,
  });

  // Check if we should retry
  if (nodeExecution.retryAttempt < this.options.retryAttempts) {
    nodeExecution.retryAttempt++;
    execution.metadata.retriedNodes++;

    this.emit('nodeExecutionRetry', { execution, nodeExecution });

    // Exponential backoff
    const delay = 2 ** nodeExecution.retryAttempt * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry execution
    const node = workflow.nodes.find((n) => n.id === nodeExecution.nodeId);
    if (node) {
      await this.executeNode(workflow, execution, node);
      return;
    }
  }

  // Mark node as failed
  nodeExecution.status = 'error';
  nodeExecution.finishedAt = new Date();
  nodeExecution.error = error.message;

  execution.metadata.failedNodes++;

  this.emit('nodeExecutionFailed', { execution, nodeExecution });

  // Fail the entire execution
  throw new WorkflowEngineError(
    `Node execution failed: ${nodeExecution.nodeName}`,
    'NODE_EXECUTION_FAILED'
  );
}

/**

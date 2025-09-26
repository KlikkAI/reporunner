private
async;
prepareNodeInput(
    node: WorkflowNode,
    nodeOutputs: Map<string, any>,
    request: ExecutionRequest
  )
: Promise<any>
{
  // Merge node configuration with outputs from previous nodes
  const input = {
    ...node.data,
    ...request.inputData,
  };

  // Add outputs from connected nodes
  const nodeOutput: Record<string, any> = {};
  for (const [nodeId, output] of nodeOutputs) {
    nodeOutput[nodeId] = output;
  }

  return {
      ...input,
      $nodes: nodeOutput,
      $execution: {
        id: request.correlationId,
        triggeredBy: request.triggeredBy
      }
    };
}

private
buildWorkflowOutput(
    nodeOutputs: Map<string, any>,
    workflow: WorkflowDefinition
  )
: Record<string, any>
{
  // Find output nodes (nodes with no outgoing edges)
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  const hasOutgoing = new Set(workflow.edges.map((e) => e.source));
  const outputNodes = Array.from(nodeIds).filter((id) => !hasOutgoing.has(id));

  // Build output from final nodes
  const output: Record<string, any> = {};
  for (const nodeId of outputNodes) {
    const nodeOutput = nodeOutputs.get(nodeId);
    if (nodeOutput !== undefined) {
      output[nodeId] = nodeOutput;
    }
  }

  return Object.keys(output).length > 0 ? output : Object.fromEntries(nodeOutputs);
}

private
async;
rollbackExecution(
    executionId: string,
    executedNodes: Set<string>
  )
: Promise<void>
{
  logger.info(`Rolling back execution: ${executionId}`, {
    executedNodes: Array.from(executedNodes),
  });
  // Implement rollback logic based on node types
  // This would typically involve calling rollback methods on node executors
}

private
async;
completeExecution(
    executionId: string,
    result: Record<string, any>
  )
: Promise<void>
{
  const now = new Date();
  const execution = await this.getExecution(executionId);
  const duration = execution ? now.getTime() - execution.startedAt.getTime() : 0;

  await this.executions.updateOne(
    { id: executionId },
    {
      $set: {
        status: 'completed',
        completedAt: now,
        outputData: result,
        duration,
      },
    }
  );
}

private
async;
failExecution(executionId: string, error: Error)
: Promise<void>
{
  const now = new Date();
  const execution = await this.getExecution(executionId);
  const duration = execution ? now.getTime() - execution.startedAt.getTime() : 0;

  await this.executions.updateOne(
    { id: executionId },
    {
      $set: {
        status: 'failed',
        completedAt: now,
        duration,
        error: {
          message: error.message,
          stack: error.stack,
          type: 'workflow',
        },
      },
    }
  );
}

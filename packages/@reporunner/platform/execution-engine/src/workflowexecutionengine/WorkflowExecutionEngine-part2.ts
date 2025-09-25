if (!(await this.checkExecutionPermission(userId, workflowId))) {
  throw new ExecutionError('Permission denied', ERROR_CODES.AUTH_UNAUTHORIZED);
}

// Create execution record
const executionId = uuidv4();
const execution: IExecution = {
  id: executionId,
  workflowId,
  status: ExecutionStatus.PENDING,
  startedAt: new Date(),
  mode,
  data: {
    nodes: {},
    resultData: {
      runData: {},
    },
  },
};

// Save execution to database
await this.db.mongo.executions.insertOne(execution);

// Queue the execution
await this.executionQueue.add(
  'execute',
  {
    executionId,
    workflowId,
    userId,
    organizationId: (workflow as any).organizationId || '',
    mode,
    triggerData,
  },
  {
    attempts: this.config.maxRetries || 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
);

// Emit event
this.emit(EVENTS.EXECUTION_STARTED, { executionId, workflowId, userId });

return executionId;
} catch (error)
{
  this.logger.error('Failed to start workflow execution', {
    error,
    workflowId,
  });
  throw error;
}
}

  /**
   * Execute specific node chain (for testing/debugging)
   */
  async executeNodeChain(nodeId: string, workflowId: string, userId: string): Promise<any>
{
  const workflow = (await this.db.mongo.workflows.findOne({
    id: workflowId,
  })) as IWorkflow;
  if (!workflow) {
    throw new ExecutionError('Workflow not found', ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  // Find target node
  const targetNode = workflow.nodes.find((n) => n.id === nodeId);
  if (!targetNode) {
    throw new ExecutionError('Node not found', ERROR_CODES.RESOURCE_NOT_FOUND);
  }

  // Build execution plan
  const executionPlan = this.buildExecutionPlan(workflow.nodes, workflow.edges, nodeId);

  // Create execution context
  const context: ExecutionContext = {
    executionId: uuidv4(),
    workflowId,
    userId,
    organizationId: (workflow as any).organizationId || '',
    mode: 'manual',
    startedAt: new Date(),
    variables: new Map(),
    nodeResults: new Map(),
    credentials: new Map(),
  };

  // Execute nodes in order
  for (const node of executionPlan) {
    const inputData = this.getNodeInputData(node, workflow.edges, context.nodeResults);
    const result = await this.executeNode(node, context, inputData);
    context.nodeResults.set(node.id, result);
  }

  return context.nodeResults.get(nodeId);
}

/**

workflowId: string, executionId;
: string,
    triggerData?: Record<string, any>
  ): Promise<void>
{
  const execution = await Execution.findById(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }

  const workflow = await this.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  // Store workflow context for node name resolution
  this.currentWorkflow = workflow;

  try {
    execution.status = 'running';
    await execution.save();

    this.emit('execution:started', { executionId, workflowId });
    io.to(`execution:${executionId}`).emit('execution_event', {
      type: 'execution_started',
      executionId,
      timestamp: new Date().toISOString(),
      data: { workflowId },
    });

    const context: ExecutionContext = {
      workflowId,
      executionId,
      userId: execution.userId,
      triggerData,
      variables: {},
      credentials: await this.loadCredentials(execution.userId),
    };

    // Execute workflow nodes
    await this.executeNodes(workflow, execution, context);

    // Mark execution as completed
    execution.status = 'success';
    execution.endTime = new Date();
    await execution.save();

    this.emit('execution:completed', { executionId, workflowId });
    io.to(`execution:${executionId}`).emit('execution_event', {
      type: 'execution_completed',
      executionId,
      timestamp: new Date().toISOString(),
      data: { workflowId },
    });
  } catch (error) {
    logger.error(`Workflow execution error: ${executionId}`, error);

    execution.status = 'error';
    execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    execution.endTime = new Date();
    await execution.save();

    this.emit('execution:failed', { executionId, workflowId, error });
    io.to(`execution:${executionId}`).emit('execution_event', {
      type: 'execution_failed',
      executionId,
      timestamp: new Date().toISOString(),
      data: {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  } finally {
    // Clear workflow context
    this.currentWorkflow = null;
  }
}

private
async;
executeNodes(
    workflow: IWorkflow,
    execution: IExecution,
    context: ExecutionContext
  )
: Promise<void>
{
    const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));
    const edgeMap = this.buildEdgeMap(workflow.edges);
    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();

    // Find start nodes (nodes with no incoming edges)
    const startNodes = workflow.nodes.filter(
      (node) => !workflow.edges.some((edge) => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }

    // Execute nodes in topological order
    const executeQueue = [...startNodes];

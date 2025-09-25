* Setup BullMQ worker
   */
  private setupWorker(): void
{
  this.worker = new Worker(
    'workflow-execution',
    async (job: Job) => {
      return await this.processExecution(job.data);
    },
    {
      connection: {
        host: this.config.redis.host,
        port: this.config.redis.port,
      },
    }
  );

  this.worker.on('completed', (job) => {
    this.logger.info(`Execution completed: ${job.data.executionId}`);
    this.emit(EVENTS.EXECUTION_COMPLETED, job.data);
  });

  this.worker.on('failed', (job, err) => {
    this.logger.error(`Execution failed: ${job?.data.executionId}`, err);
    this.emit(EVENTS.EXECUTION_FAILED, { ...job?.data, error: err });
  });
}

/**
 * Process workflow execution
 */
private
async;
processExecution(jobData: any)
: Promise<any>
{
  const { executionId, workflowId, userId, organizationId, mode, triggerData } = jobData;

  try {
    // Update execution status to RUNNING
    await this.updateExecutionStatus(executionId, ExecutionStatus.RUNNING);

    // Load workflow
    const workflow = (await this.db.mongo.workflows.findOne({
      id: workflowId,
    })) as IWorkflow;

    // Create execution context
    const context: ExecutionContext = {
      executionId,
      workflowId,
      userId,
      organizationId,
      mode,
      startedAt: new Date(),
      variables: new Map(),
      nodeResults: new Map(),
      credentials: new Map(),
    };

    // Store active execution
    this.activeExecutions.set(executionId, context);

    // Find trigger nodes or start nodes
    const startNodes = this.findStartNodes(workflow.nodes, workflow.edges);

    // Execute workflow
    const results = await this.executeWorkflowNodes(workflow, context, startNodes, triggerData);

    // Update execution with results
    await this.updateExecutionResults(executionId, results, ExecutionStatus.SUCCESS);

    // Clean up
    this.activeExecutions.delete(executionId);

    return results;
  } catch (error) {
    // Update execution status to FAILED
    await this.updateExecutionStatus(executionId, ExecutionStatus.FAILED, error);

    // Clean up
    this.activeExecutions.delete(executionId);

    throw error;
  }
}

/**
 * Execute workflow nodes
 */
private
async;
executeWorkflowNodes(
    workflow: IWorkflow,
    context: ExecutionContext,
    startNodes: INode[],
    triggerData?: any
  )
: Promise<any>
{
    const executedNodes = new Set<string>();
    const nodesToExecute = [...startNodes];
    const results: any = {};

    while (nodesToExecute.length > 0) {
      const node = nodesToExecute.shift()!;

      if (executedNodes.has(node.id)) {
        continue;

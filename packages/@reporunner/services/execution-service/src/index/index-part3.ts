attempts: config.retryAttempts, backoff;
:
{
  type: 'exponential', delay;
  : 2000,
}
,
      },
    })

this.executionWorker = new Worker<ExecutionJobData>(
  'workflow-execution',
  this.processExecution.bind(this),
{
  connection: config.redis, concurrency;
  : config.maxConcurrentExecutions,
    limiter:
    max: config.maxConcurrentExecutions, duration
  : 1000,
  ,
}
)

this.initializeIndexes()
this.setupWorkerEvents()
this.setupEventSubscriptions();
this.registerNodeExecutors();
}

  private async initializeIndexes(): Promise<void>
{
  try {
    await this.executions.createIndex({ workflowId: 1, startedAt: -1 });
    await this.executions.createIndex({ status: 1 });
    await this.executions.createIndex({ triggeredBy: 1 });
    await this.executions.createIndex({ 'metadata.correlationId': 1 });
    await this.executions.createIndex({ 'metadata.organizationId': 1 });
    await this.executions.createIndex({ startedAt: -1 });

    logger.info('Execution service indexes initialized');
  } catch (error) {
    logger.error('Failed to create execution indexes', error);
  }
}

private
setupWorkerEvents();
: void
{
  this.executionWorker.on('completed', async (job: Job<ExecutionJobData>) => {
    logger.info(`Execution completed: ${job.data.executionId}`);
    await this.handleExecutionCompleted(job.data.executionId);
  });

  this.executionWorker.on('failed', async (job: Job<ExecutionJobData>, error: Error) => {
    logger.error(`Execution failed: ${job?.data?.executionId}`, error);
    if (job?.data?.executionId) {
      await this.handleExecutionFailed(job.data.executionId, error);
    }
  });

  this.executionWorker.on('stalled', (job: Job<ExecutionJobData>) => {
    logger.warn(`Execution stalled: ${job.data.executionId}`);
  });
}

private
async;
setupEventSubscriptions();
: Promise<void>
{
  // Subscribe to workflow events
  await this.eventBus.subscribe('workflow.*', async (event) => {
    await this.handleWorkflowEvent(event);
  });

  // Subscribe to node execution events
  await this.eventBus.subscribe('node.execution.*', async (event) => {
    await this.handleNodeExecutionEvent(event);
  });
}

private
registerNodeExecutors();
: void
{
  // Register built-in node executors
  this.nodeExecutors.set('trigger', new TriggerNodeExecutor());
  this.nodeExecutors.set('action', new ActionNodeExecutor());
  this.nodeExecutors.set('condition', new ConditionNodeExecutor());
  this.nodeExecutors.set('transform', new TransformNodeExecutor());
  this.nodeExecutors.set('delay', new DelayNodeExecutor());
  this.nodeExecutors.set('webhook', new WebhookNodeExecutor());
  this.nodeExecutors.set('email', new EmailNodeExecutor());
  this.nodeExecutors.set('database', new DatabaseNodeExecutor());
  this.nodeExecutors.set('ai-agent', new AIAgentNodeExecutor());
  this.nodeExecutors.set('loop', new LoopNodeExecutor());
}

async;
execute(request: ExecutionRequest)
: Promise<ExecutionResult>
{
    try {
      // Validate request
      this.validateExecutionRequest(request);

      // Get workflow definition
      const workflow = await this.getWorkflowDefinition(request.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${request.workflowId}`);
      }

      // Create execution record
      const execution = await this.createExecution(request, workflow);

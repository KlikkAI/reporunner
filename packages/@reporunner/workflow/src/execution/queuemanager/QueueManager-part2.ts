concurrency: this.options.concurrency, removeOnComplete;
: 100,
            removeOnFail: 50,
          } as WorkerOptions
        )

worker.on('completed', (job) =>
{
  this.logger.info('Workflow job completed', {
    jobId: job.id,
    executionId: job.data.executionId,
    workflowId: job.data.workflow.id,
  });
}
)

worker.on('failed', (job, error) =>
{
  this.logger.error('Workflow job failed', {
    jobId: job?.id,
    executionId: job?.data.executionId,
    error: error.message,
  });
}
)

worker.on('stalled', (jobId) =>
{
  this.logger.warn('Workflow job stalled', { jobId });
}
)

this.workers.push(worker);
}

      this.logger.info('Queue workers started',
{
  workerCount, concurrency;
  : this.options.concurrency,
}
)
} catch (error)
{
  this.logger.error('Failed to start workers', { error });
  throw error;
}
}

  /**
   * Add workflow execution job to queue
   */
  async addWorkflowJob(
    workflow: WorkflowDefinition,
    inputData: Record<string, any> =
{
}
,
    options:
{
  executionId?: string;
  priority?: number;
  delay?: number;
  attempts?: number;
}
=
{
}
): Promise<string>
{
  const executionId =
    options.executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const jobData: WorkflowJob = {
    workflow,
    inputData,
    executionId,
    priority: options.priority,
    delay: options.delay,
    attempts: options.attempts,
  };

  const job = await this.workflowQueue.add(`workflow-${workflow.id}`, jobData, {
    priority: options.priority,
    delay: options.delay,
    attempts: options.attempts || this.options.retryAttempts,
    jobId: executionId,
  });

  this.logger.info('Workflow job added to queue', {
    jobId: job.id,
    executionId,
    workflowId: workflow.id,
  });

  return executionId;
}

/**
 * Get job status and details
 */
async;
getJobStatus(executionId: string)
: Promise<
{
  status: string;
  progress?: number;
  result?: any;
  error?: string;
}
| null>
{
    try {
      const job = await this.workflowQueue.getJob(executionId);
      if (!job) return null;

      const state = await job.getState();

      return {
        status: state,
        progress: job.progress as number,
        result: job.returnvalue,
        error: job.failedReason,

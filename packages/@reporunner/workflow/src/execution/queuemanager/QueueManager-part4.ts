/**
 * Process individual workflow job
 */
private
async;
processWorkflowJob(job: Job<WorkflowJob>)
: Promise<WorkflowExecution>
{
  const { workflow, inputData, executionId } = job.data;

  try {
    // Update job progress
    await job.updateProgress(0);

    // Execute workflow
    const execution = await this.workflowEngine.executeWorkflow(workflow, inputData, {
      executionId,
      waitForCompletion: true,
    });

    // Update progress based on execution
    const progress = Math.round(
      (execution.metadata.completedNodes / execution.metadata.totalNodes) * 100
    );
    await job.updateProgress(progress);

    return execution;
  } catch (error) {
    this.logger.error('Workflow execution failed in queue', {
      jobId: job.id,
      executionId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Setup event handlers for monitoring
 */
private
setupEventHandlers();
: void
{
  this.workflowQueue.on('error', (error) => {
    this.logger.error('Queue error', { error });
  });

  this.redis.on('error', (error) => {
    this.logger.error('Redis error', { error });
  });

  this.redis.on('connect', () => {
    this.logger.info('Redis connected');
  });

  this.redis.on('disconnect', () => {
    this.logger.warn('Redis disconnected');
  });
}
}

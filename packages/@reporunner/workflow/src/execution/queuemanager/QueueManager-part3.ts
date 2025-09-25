}
} catch (error)
{
  this.logger.error('Failed to get job status', { executionId, error });
  return null;
}
}

  /**
   * Cancel a job
   */
  async cancelJob(executionId: string): Promise<boolean>
{
  try {
    const job = await this.workflowQueue.getJob(executionId);
    if (!job) return false;

    await job.remove();

    this.logger.info('Job cancelled', { executionId });
    return true;
  } catch (error) {
    this.logger.error('Failed to cancel job', { executionId, error });
    return false;
  }
}

/**
 * Get queue statistics
 */
async;
getQueueStats();
: Promise<
{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}
>
{
  try {
    const [active, waiting, completed, failed, delayed] = await Promise.all([
      this.workflowQueue.getActive(),
      this.workflowQueue.getWaiting(),
      this.workflowQueue.getCompleted(),
      this.workflowQueue.getFailed(),
      this.workflowQueue.getDelayed(),
    ]);

    return {
        active: active.length,
        waiting: waiting.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
  } catch (error) {
    this.logger.error('Failed to get queue stats', { error });
    throw error;
  }
}

/**
 * Clean up completed and failed jobs
 */
async;
cleanQueue(
    options: {
      maxAge?: number; // milliseconds
maxCount?: number;
} =
{
}
): Promise<void>
{
  try {
    const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours
    const maxCount = options.maxCount || 1000;

    await this.workflowQueue.clean(maxAge, maxCount, 'completed');
    await this.workflowQueue.clean(maxAge, maxCount, 'failed');

    this.logger.info('Queue cleaned', { maxAge, maxCount });
  } catch (error) {
    this.logger.error('Failed to clean queue', { error });
    throw error;
  }
}

/**
 * Shutdown workers and close connections
 */
async;
shutdown();
: Promise<void>
{
  try {
    // Close all workers
    await Promise.all(this.workers.map((worker) => worker.close()));

    // Close queue
    await this.workflowQueue.close();

    // Close Redis connection
    await this.redis.quit();

    this.logger.info('Queue manager shutdown complete');
  } catch (error) {
    this.logger.error('Error during shutdown', { error });
    throw error;
  }
}

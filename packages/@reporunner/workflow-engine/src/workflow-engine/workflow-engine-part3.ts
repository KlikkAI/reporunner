await this.emitWorkflowEvent(WorkflowEvent.WORKFLOW_DEACTIVATED, {
  workflowId,
  executionId: '',
});
}

  /**
   * Register a trigger
   */
  async registerTrigger(_trigger: TriggerConfig): Promise<void>
{
  if (!this.isInitialized) {
    throw new Error('Workflow Engine not initialized');
  }
}

/**
 * Unregister a trigger
 */
async;
unregisterTrigger(_triggerId: string)
: Promise<void>
{
  if (!this.isInitialized) {
    throw new Error('Workflow Engine not initialized');
  }
}

/**
 * Get engine statistics
 */
async;
getStats();
: Promise<
{
  executions: {
    total: number;
    running: number;
    queued: number;
    completed: number;
    failed: number;
  }
  workers: {
    total: number;
    active: number;
    idle: number;
  }
  memory: {
    used: number;
    total: number;
  }
}
>
{
  const queueStats = await this.queueManager.getStats();
  const workerStats = await this.workerManager.getStats();

  return {
      executions: {
        total: queueStats.completed + queueStats.failed + queueStats.active + queueStats.waiting,
        running: queueStats.active,
        queued: queueStats.waiting,
        completed: queueStats.completed,
        failed: queueStats.failed,
      },
      workers: {
        total: workerStats.length,
        active: workerStats.filter((w) => w.status === 'busy').length,
        idle: workerStats.filter((w) => w.status === 'idle').length,
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };
}

/**
 * Setup event handlers
 */
private
setupEventHandlers();
: void
{
    // Queue events
    this.queueManager.on('job:completed', (jobId: string, result: any) => {
      this.emit('execution:completed', { jobId, result });
    });

    this.queueManager.on('job:failed', (jobId: string, error: Error) => {
      this.emit('execution:failed', { jobId, error });
    });

    // Execution events
    this.executionEngine.on('execution:started', (executionId: string) => {
      this.emit('execution:started', { executionId });
    });

    this.executionEngine.on('execution:finished', (executionId: string, result: any) => {
      this.emit('execution:finished', { executionId, result });
    });

    this.executionEngine.on('node:started', (executionId: string, nodeId: string) => {
      this.emit('node:started', { executionId, nodeId });
    });

    this.executionEngine.on('node:finished', (executionId: string, nodeId: string, result: any) => {
      this.emit('node:finished', { executionId, nodeId, result });
    });

    // Worker events
    this.workerManager.on('worker:started', (workerId: string) => {

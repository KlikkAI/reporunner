await this.runExecution(workflow, execution, options.timeout);
} else
{
  // Run in background
  this.runExecution(workflow, execution, options.timeout).catch((error) => {
    this.handleExecutionError(execution, error);
  });
}
} catch (error)
{
  this.handleExecutionError(execution, error);
}

return execution;
}

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<boolean>
{
  const execution = this.activeExecutions.get(executionId);
  if (!execution || execution.status !== 'running') {
    return false;
  }

  execution.status = 'cancelled';
  execution.finishedAt = new Date();
  execution.error = 'Execution cancelled by user';

  this.activeExecutions.delete(executionId);
  this.emit('executionCancelled', execution);

  return true;
}

/**
 * Get execution status
 */
getExecution(executionId: string)
: WorkflowExecution | undefined
{
  return this.activeExecutions.get(executionId);
}

/**
 * Get all active executions
 */
getActiveExecutions();
: WorkflowExecution[]
{
  return Array.from(this.activeExecutions.values());
}

/**
 * Main execution logic
 */
private
async;
runExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    timeout?: number
  )
: Promise<void>
{
    const executionTimeout = timeout || this.options.executionTimeout;

    // Set execution timeout
    const timeoutId = setTimeout(() => {
      this.handleExecutionError(
        execution,
        new WorkflowEngineError('Execution timeout', 'EXECUTION_TIMEOUT')
      );
    }, executionTimeout);

    try {
      // Find trigger nodes (nodes with no inputs)
      const triggerNodes = workflow.nodes.filter(
        (node) => !workflow.connections.some((conn) => conn.destination.nodeId === node.id)
      );

      if (triggerNodes.length === 0) {
        throw new WorkflowEngineError('No trigger nodes found', 'NO_TRIGGER_NODES');
      }

      // Execute nodes in topological order
      const executionOrder = this.getExecutionOrder(workflow);

      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Check if execution was cancelled
        if (execution.status === 'cancelled') {
          return;
        }

        await this.executeNode(workflow, execution, node);
      }

      // Mark execution as successful
      execution.status = 'success';
      execution.finishedAt = new Date();

      this.emit('executionCompleted', execution);
    } catch (error) {
      this.handleExecutionError(execution, error);
    } finally {
      clearTimeout(timeoutId);
      this.activeExecutions.delete(execution.id);

if (node.data.configuration) {
  Object.assign(inputs, node.data.configuration);
}

// Add all previous node outputs with their original node names for easier reference
// This enables paths like: gmailTrigger.messages[0].subject or llmAgent.output.result
const workflow = this.getWorkflowFromContext();
if (workflow) {
  for (const [nodeId, output] of nodeOutputs.entries()) {
    const sourceNode = workflow.nodes.find((n) => n.id === nodeId);
    if (sourceNode?.data?.label) {
      const nodeLabel = this.sanitizeNodeName(sourceNode.data.label);
      inputs[nodeLabel] = output;
    }
  }
}

return inputs;
}

  // Helper function to sanitize node names for use as object keys
  private sanitizeNodeName(name: string): string
{
  return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
}

// Store workflow context for node name resolution
private
currentWorkflow: IWorkflow | null = null;
private
getWorkflowFromContext();
: IWorkflow | null
{
  return this.currentWorkflow;
}

private
async;
loadCredentials(userId: string)
: Promise<Record<string, any>>
{
  const credentials = await Credential.find({
    userId,
    isActive: true,
  }).select('+data');
  const credentialMap: Record<string, any> = {};

  for (const credential of credentials) {
    credentialMap[credential.integration] = credential.getDecryptedData();
  }

  return credentialMap;
}

private
async;
getWorkflow(workflowId: string)
: Promise<IWorkflow | null>
{
  const { Workflow } = await import('@/models/Workflow');
  return Workflow.findById(workflowId);
}

async;
stopExecution(executionId: string)
: Promise<void>
{
  if (this.activeExecutions.has(executionId)) {
    const execution = await Execution.findById(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      await execution.save();

      this.activeExecutions.delete(executionId);
      this.emit('execution:cancelled', { executionId });
    }
  }
}

async;
getExecutionStatus(executionId: string)
: Promise<IExecution | null>
{
  return Execution.findById(executionId);
}

async;
getExecutionHistory(
    workflowId: string,
    limit: number = 50,
    offset: number = 0
  )
: Promise<IExecution[]>
{
  return Execution.find({ workflowId }).sort({ startTime: -1 }).limit(limit).skip(offset);
}

/**
 * Execute node based on its type and configuration
 */
private
async;
executeNodeByType(
    node: IWorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, any>
  )
: Promise<any>
{
    const nodeType = node.type;
    const _nodeData = node.data || {};

    logger.info(`Executing node: ${nodeType} (${node.id})`);

    switch (nodeType) {
      case 'gmail-trigger':
        return this.executeGmailTrigger(node, context, inputs);

      case 'gmail-send':
        return this.executeGmailSend(node, context, inputs);

      case 'webhook':

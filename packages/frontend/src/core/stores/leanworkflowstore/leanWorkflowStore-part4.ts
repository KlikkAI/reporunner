// Remove version field for updates too
nodes: nodes.map((node) => ({
  id: node.id,
  type: node.type,
  position: node.position,
  data: {
    label: node.name,
    parameters: node.parameters || {},
    credentials:
      Array.isArray(node.credentials) && node.credentials.length > 0
        ? node.credentials[0].id
        : undefined,
    disabled: node.disabled,
    notes: node.notes,
  },
})),
  edges;
: edges,
          settings:
{
  timeout: 300000, errorHandling;
  : 'stop' as
  const,
            retryPolicy: {
              maxRetries: 3,
              retryDelay: 5000,
            },
}
,
          tags: currentWorkflow.tags || [],
          isActive: currentWorkflow.active || false,
        }

if (!currentWorkflow.id) {
  throw new Error('Cannot update workflow without ID');
}
savedWorkflow = await workflowApiService.updateWorkflow(currentWorkflow.id, updatePayload);
}

// Map the saved workflow to our internal format
// Note: savedWorkflow is already transformed by workflowApiService
const finalWorkflow: WorkflowDefinition = {
  ...savedWorkflow,
  // Override with current editor state
  nodes: nodes,
  connections,
  // Ensure required fields exist
  settings: savedWorkflow.settings || currentWorkflow.settings,
  tags: savedWorkflow.tags || [],
};

set({
  currentWorkflow: finalWorkflow,
  isDirty: false,
});

logger.info('Workflow saved successfully', {
  id: savedWorkflow.id,
  name: savedWorkflow.name,
  nodeCount: nodes.length,
});
} catch (error: unknown)
{
  const logError = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to save workflow', logError);
  logger.info('Workflow save error details', {
    response: (error as any)?.response?.data,
  });

  // Enhanced error logging for debugging
  if ((error as any)?.response?.data) {
    logger.error('Backend Error Response:', (error as any).response.data);
  }

  const errorMessage =
    (error as any)?.response?.data?.message ||
    (error instanceof Error ? error.message : 'Failed to save workflow');
  throw new Error(errorMessage);
}
finally
{
  set({ isLoading: false });
}
},

  loadWorkflow: async (workflowId: string) =>
{
    set({ isLoading: true });

    try {
      // Use workflowApiService for consistent response transformation
      const workflowData = await workflowApiService.getWorkflow(workflowId);

      // Convert backend data to lean format
      const leanNodes: WorkflowNodeInstance[] = (workflowData.nodes || []).map((node: any) => {
        // Handle credentials conversion from string to INodeCredentials[]
        let credentials: INodeCredentials[] | undefined;
        const credentialId = node.data?.credentials || node.credentials;
        if (credentialId && typeof credentialId === 'string') {
          credentials = [{ id: credentialId, name: credentialId }];
        } else if (Array.isArray(credentialId)) {
          credentials = credentialId;
        }

        return {
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },

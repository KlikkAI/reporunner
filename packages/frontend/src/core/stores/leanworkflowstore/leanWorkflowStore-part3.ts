nodes: [], edges;
: [],
      isDirty: false,
    })

try {
  await get().saveWorkflow();
  const savedWorkflow = get().currentWorkflow;
  // Set flag to refresh Dashboard when user returns
  get().setShouldRefreshDashboard(true);
  if (savedWorkflow?.id) {
    navigate(`/workflow/${savedWorkflow.id}`);
  }
} catch (error) {
  logger.error(
    'Failed to save new workflow',
    error instanceof Error ? error : new Error(String(error))
  );
  // Revert state and provide better error message
  set({
    currentWorkflow: null,
    nodes: [],
    edges: [],
    isDirty: false,
  });

  // Create more descriptive error message
  let errorMessage = 'Failed to create workflow';
  if (error instanceof Error) {
    if (error.message.includes('Network')) {
      errorMessage = 'Network error - please check your connection and try again';
    } else if (error.message.includes('400')) {
      errorMessage = 'Invalid workflow data - please check your input';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error - please try again later';
    } else {
      errorMessage = error.message;
    }
  }

  throw new Error(errorMessage);
}
},

  saveWorkflow: async () =>
{
    const { currentWorkflow, nodes, edges } = get();
    if (!currentWorkflow) {
      throw new Error('No workflow to save');
    }

    set({ isLoading: true });

    try {
      // Convert edges to connections format
      const connections = convertEdgesToConnections(edges);

      // Check if this is a new workflow or update
      const isNewWorkflow = !currentWorkflow.id || currentWorkflow.id.startsWith('temp_');

      let savedWorkflow: any;

      if (isNewWorkflow) {
        // Create new workflow - use CreateWorkflowRequest schema
        const createWorkflowPayload: CreateWorkflowRequest = {
          name: currentWorkflow.name,
          description: currentWorkflow.description || '',
          version: 1,
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              label: node.name,
              parameters: node.parameters || {},
              credentials: node.credentials?.[0]?.id || undefined,
              disabled: node.disabled,
              notes: node.notes,
            },
          })),
          edges: edges,
          settings: {
            timeout: 300000,
            errorHandling: 'stop' as const,
            retryPolicy: {
              maxRetries: 3,
              retryDelay: 5000,
            },
          },
          tags: currentWorkflow.tags || [],
          isActive: currentWorkflow.active || false,
        };

        logger.info('Creating new workflow with payload:', createWorkflowPayload);
        savedWorkflow = await workflowApiService.createWorkflow(createWorkflowPayload);
        logger.info('Workflow created successfully:', savedWorkflow);
      } else {
        // Update existing workflow
        const updatePayload = {
          name: currentWorkflow.name,
          description: currentWorkflow.description || '',

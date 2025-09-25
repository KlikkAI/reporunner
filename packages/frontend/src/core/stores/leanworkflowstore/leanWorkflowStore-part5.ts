parameters: node.parameters || node.data?.parameters || {}, credentials, disabled;
: node.disabled,
          notes: node.notes,
          name: node.name,
          continueOnFail: node.continueOnFail,
          executeOnce: node.executeOnce,
        }
})

const workflow: WorkflowDefinition = {
  ...workflowData,
  nodes: leanNodes,
  // Ensure connections exist
  connections: (workflowData as any).connections || {},
  // Transform settings to match WorkflowDefinition schema
  settings: workflowData.settings
    ? {
        executionTimeout: workflowData.settings.timeout || 300,
        saveDataErrorExecution: 'all' as const,
        saveDataSuccessExecution: 'all' as const,
      }
    : undefined,
};

// Convert connections to edges
const edges = convertConnectionsToEdges(workflow.connections);

set({
  currentWorkflow: workflow,
  nodes: leanNodes,
  edges,
  isDirty: false,
});
} catch (error: unknown)
{
  const logError = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to load workflow', logError);
  logger.info('Load workflow error details', { workflowId });
  const errorMessage = (error as any)?.response?.data?.message || 'Failed to load workflow';
  throw new Error(errorMessage);
}
finally
{
  set({ isLoading: false });
}
},

  deleteWorkflow: async (workflowId: string) =>
{
  try {
    await workflowApiService.deleteWorkflow(workflowId);

    set((state) => {
      if (state.currentWorkflow?.id === workflowId) {
        return {
          currentWorkflow: null,
          nodes: [],
          edges: [],
          isDirty: false,
        };
      }
      return state;
    });
  } catch (error: unknown) {
    const logError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to delete workflow', logError);
    logger.info('Delete workflow error details', { workflowId });
    const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete workflow';
    throw new Error(errorMessage);
  }
}
,

  // Utility methods
  getNodeById: (nodeId) =>
{
  return get().nodes.find((node) => node.id === nodeId);
}
,

  getNodeWithDefinition: (nodeId) =>
{
  const node = get().nodes.find((n) => n.id === nodeId);
  if (!node) return undefined;

  const typeDefinition = nodeRegistry.getNodeTypeDescription(node.type);
  return { ...node, typeDefinition };
}
,

  exportWorkflow: () =>
{
  const { currentWorkflow, nodes, edges } = get();
  const connections = convertEdgesToConnections(edges);

  return {
      ...currentWorkflow,
      nodes,
      connections,
    } as WorkflowDefinition;
}
,

  importWorkflow: (workflow) =>
{
    const edges = convertConnectionsToEdges(workflow.connections || {});

    set({
      currentWorkflow: workflow,
      nodes: workflow.nodes,
      edges,

return {
        nodes: newNodes,
        isDirty: true,
      };
})
},

  updateNode: (nodeId, updates) =>
{
  set((state) => ({
    nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
    isDirty: true,
  }));
}
,

  updateNodeParameters: (nodeId, parameters) =>
{
  set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId ? { ...node, parameters: { ...node.parameters, ...parameters } } : node
    ),
    isDirty: true,
  }));
}
,

  addNode: (node) =>
{
  set((state) => ({
    nodes: [...state.nodes, node],
    isDirty: true,
  }));
}
,

  removeNode: (nodeId) =>
{
  set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    selectedNodeIds: state.selectedNodeIds.filter((id) => id !== nodeId),
    isDirty: true,
  }));
}
,

  // Edge operations
  updateEdges: (edges) =>
{
  set({ edges, isDirty: true });
}
,

  addEdge: (edge) =>
{
  set((state) => ({
    edges: [...state.edges, edge],
    isDirty: true,
  }));
}
,

  removeEdge: (edgeId) =>
{
  set((state) => ({
    edges: state.edges.filter((e) => e.id !== edgeId),
    isDirty: true,
  }));
}
,

  // Selection
  setSelectedNodes: (nodeIds) =>
{
  set({ selectedNodeIds: nodeIds });
}
,

  clearSelection: () =>
{
  set({ selectedNodeIds: [] });
}
,

  // Dashboard refresh management
  setShouldRefreshDashboard: (should: boolean) =>
{
  set({ shouldRefreshDashboard: should });
}
,

  // Workflow operations
  createNewWorkflow: async (
    name: string,
    navigate: (path: string) => void,
    description?: string
  ) =>
{
    const newWorkflow: WorkflowDefinition = {
      id: `temp_${Date.now()}`,
      name,
      description: description || '',
      active: false,
      // status: 'inactive', // Not part of WorkflowDefinition schema
      nodes: [],
      connections: {},
      settings: {
        errorWorkflow: undefined,
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        executionTimeout: 300,
        maxExecutionTimeout: undefined,
        callerPolicy: undefined,
      },
      tags: [],
    };

    set({
      currentWorkflow: newWorkflow,

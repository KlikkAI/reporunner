isDirty: false,
})
},
}))

// Helper function to convert n8n connections format to React Flow edges
function convertConnectionsToEdges(connections: WorkflowDefinition['connections']): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];

  Object.entries(connections).forEach(([sourceNodeId, outputs]) => {
    Object.entries(outputs).forEach(([outputIndex, targets]) => {
      targets.forEach((target, _idx) => {
        edges.push({
          id: `${sourceNodeId}-${outputIndex}-${target.node}-${target.index}`,
          source: sourceNodeId,
          target: target.node,
          sourceHandle: `output_${outputIndex}`,
          targetHandle: `input_${target.index}`,
          type: target.type || 'default',
        });
      });
    });
  });

  return edges;
}

// Helper function to convert React Flow edges to n8n connections format
function convertEdgesToConnections(edges: WorkflowEdge[]): WorkflowDefinition['connections'] {
  const connections: WorkflowDefinition['connections'] = {};

  edges.forEach((edge) => {
    const outputIndex = edge.sourceHandle?.replace('output_', '') || 'main';
    const inputIndex = edge.targetHandle?.replace('input_', '') || '0';

    if (!connections[edge.source]) {
      connections[edge.source] = {};
    }

    if (!connections[edge.source]?.[outputIndex]) {
      connections[edge.source]![outputIndex] = [];
    }

    connections[edge.source]?.[outputIndex]?.push({
      node: edge.target,
      type: edge.type || 'main',
      index: parseInt(inputIndex, 10) || 0,
    });
  });

  return connections;
}

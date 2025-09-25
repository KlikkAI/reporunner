promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
])
}

  /**
   * Build execution plan using topological sort
   */
  private buildExecutionPlan(nodes: INode[], edges: IEdge[], targetNodeId: string): INode[]
{
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const plan: INode[] = [];

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Visit dependencies first
    const dependencies = edges.filter((e) => e.target === nodeId);
    for (const edge of dependencies) {
      visit(edge.source);
    }

    // Add current node
    const node = nodeMap.get(nodeId);
    if (node) {
      plan.push(node);
    }
  };

  visit(targetNodeId);
  return plan;
}

/**
 * Find start nodes (triggers or nodes with no incoming edges)
 */
private
findStartNodes(nodes: INode[], edges: IEdge[])
: INode[]
{
  const nodesWithIncomingEdges = new Set(edges.map((e) => e.target));
  return nodes.filter(
      (node) => node.type === NodeType.TRIGGER || !nodesWithIncomingEdges.has(node.id)
    );
}

/**
 * Get node dependencies
 */
private
getNodeDependencies(nodeId: string, edges: IEdge[])
: string[]
{
  return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

/**
 * Get downstream nodes
 */
private
getDownstreamNodes(nodeId: string, nodes: INode[], edges: IEdge[])
: INode[]
{
  const downstreamEdges = edges.filter((e) => e.source === nodeId);
  const downstreamNodeIds = downstreamEdges.map((e) => e.target);
  return nodes.filter((n) => downstreamNodeIds.includes(n.id));
}

/**
 * Get input data for node
 */
private
getNodeInputData(
    node: INode,
    edges: IEdge[],
    nodeResults: Map<string, INodeExecutionData>
  )
: any
{
  const inputEdges = edges.filter((e) => e.target === node.id);

  if (inputEdges.length === 0) {
    return null;
  }

  if (inputEdges.length === 1) {
    const result = nodeResults.get(inputEdges[0].source);
    return result?.data;
  }

  // Multiple inputs
  const combinedInput: any = {};
  inputEdges.forEach((edge) => {
    const result = nodeResults.get(edge.source);
    const key = edge.sourceHandle || 'input';
    combinedInput[key] = result?.data;
  });

  return combinedInput;
}

/**
 * Handle conditional branching
 */
private
handleConditionalBranching(
    node: INode,
    result: INodeExecutionData,
    edges: IEdge[],
    nodesToExecute: INode[]

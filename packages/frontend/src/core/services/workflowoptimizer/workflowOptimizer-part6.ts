// Helper methods
private
calculateBranchingFactor(nodes: WorkflowNodeInstance[], _edges: WorkflowEdge[])
: number
{
  const branchNodes = nodes.filter((node) => node.type === 'condition');
  return branchNodes.length / Math.max(nodes.length, 1);
}

private
determineComplexity(
    nodes: number,
    edges: number,
    branching: number
  )
: 'simple' | 'moderate' | 'complex' | 'very_complex'
{
  const score = nodes + edges * 0.5 + branching * 10;
  if (score < 10) return 'simple';
  if (score < 25) return 'moderate';
  if (score < 50) return 'complex';
  return 'very_complex';
}

private
estimateExecutionTime(nodes: WorkflowNodeInstance[], edges: WorkflowEdge[])
: number
{
  // Simplified estimation: 1 second per node + overhead
  return nodes.length * 1000 + edges.length * 100;
}

private
findParallelizationOpportunities(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: number
{
  return this.findIndependentNodeGroups(nodes, edges).filter((group) => group.length > 1).length;
}

private
findIndependentNodeGroups(
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: WorkflowNodeInstance[][]
{
  // Find groups of nodes with no dependencies between them
  const groups: WorkflowNodeInstance[][] = [];
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    const independentNodes = this.findConnectedIndependentNodes(node, nodes, edges, visited);
    if (independentNodes.length > 0) {
      groups.push(independentNodes);
      independentNodes.forEach((n) => visited.add(n.id));
    }
  }

  return groups;
}

private
findConnectedIndependentNodes(
    startNode: WorkflowNodeInstance,
    _allNodes: WorkflowNodeInstance[],
    _edges: WorkflowEdge[],
    _visited: Set<string>
  )
: WorkflowNodeInstance[]
{
  // Simplified implementation - in reality this would be more sophisticated
  return [startNode];
}

private
hasErrorHandlingDownstream(
    node: WorkflowNodeInstance,
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: boolean
{
  // Check if there are error handling nodes connected downstream
  const downstreamNodes = this.getDownstreamNodes(node, nodes, edges);
  return downstreamNodes.some((n) => n.type.includes('error') || n.type.includes('catch'));
}

private
getDownstreamNodes(
    node: WorkflowNodeInstance,
    nodes: WorkflowNodeInstance[],
    edges: WorkflowEdge[]
  )
: WorkflowNodeInstance[]
{
  const downstreamIds = edges.filter((edge) => edge.source === node.id).map((edge) => edge.target);

  return nodes.filter((n) => downstreamIds.includes(n.id));
}

private
findDuplicateOperations(nodes: WorkflowNodeInstance[])
: WorkflowNodeInstance[][]
{
    const groups: WorkflowNodeInstance[][] = [];
    const nodesByType = new Map<string, WorkflowNodeInstance[]>();

    // Group nodes by type
    nodes.forEach((node) => {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, []);
      }
      nodesByType.get(node.type)?.push(node);
    });

    // Find potential duplicates within each type
    nodesByType.forEach((nodesOfType) => {
      if (nodesOfType.length > 1) {
// More sophisticated duplicate detection could be implemented here

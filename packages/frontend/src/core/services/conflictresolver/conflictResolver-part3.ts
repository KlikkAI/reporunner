}

  private initializeOperationalTransforms(): void
{
  // Node Move Transform
  this.operationalTransforms.push({
    isApplicable: (op1, op2) =>
      op1.type === 'node_move' && op2.type === 'node_move' && op1.data?.nodeId === op2.data?.nodeId,
    transform: (op1, op2) => {
      // For concurrent node moves, use the average position
      const pos1 = op1.data.position;
      const pos2 = op2.data.position;
      return {
        ...op1,
        data: {
          ...op1.data,
          position: {
            x: (pos1.x + pos2.x) / 2,
            y: (pos1.y + pos2.y) / 2,
          },
        },
      };
    },
  });

  // Node Property Update Transform
  this.operationalTransforms.push({
    isApplicable: (op1, op2) =>
      op1.type === 'node_update' &&
      op2.type === 'node_update' &&
      op1.data?.nodeId === op2.data?.nodeId,
    transform: (op1, op2) => {
      // Merge property updates where possible
      const updates1 = op1.data.updates || {};
      const updates2 = op2.data.updates || {};

      return {
        ...op1,
        data: {
          ...op1.data,
          updates: {
            ...updates2,
            ...updates1, // op1 takes precedence for conflicts
          },
        },
      };
    },
  });

  // Edge Creation Transform
  this.operationalTransforms.push({
    isApplicable: (op1, op2) =>
      op1.type === 'edge_add' &&
      op2.type === 'edge_add' &&
      this.edgesAreConflicting(op1.data, op2.data),
    transform: (op1, op2) => {
      // For conflicting edges, keep the one with earlier timestamp
      return new Date(op1.timestamp) < new Date(op2.timestamp) ? op1 : op2;
    },
  });
}

private
analyzeOperationConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  )
: CollaborationConflict | null
{
  const affectedNodes = this.getAffectedNodes(op1, op2);
  if (affectedNodes.length === 0) return null;

  const conflictType = this.determineConflictType(op1, op2);
  if (!conflictType) return null;

  return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operations: [op1, op2],
      type: conflictType,
      affectedNodes,
      timestamp: new Date().toISOString(),
    };
}

private
getAffectedNodes(op1: CollaborationOperation, op2: CollaborationOperation)
: string[]
{
    const nodes = new Set<string>();

    // Extract node IDs from operations
    if (op1.data?.nodeId) nodes.add(op1.data.nodeId);
    if (op2.data?.nodeId) nodes.add(op2.data.nodeId);

    // For edge operations, include source and target nodes
    if (op1.type.includes('edge') && op1.data) {
      if (op1.data.source) nodes.add(op1.data.source);
      if (op1.data.target) nodes.add(op1.data.target);
    }

    if (op2.type.includes('edge') && op2.data) {
      if (op2.data.source) nodes.add(op2.data.source);
      if (op2.data.target) nodes.add(op2.data.target);
    }

return Array.from(nodes).filter(Boolean);
}

  private determineConflictType(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): CollaborationConflict['type'] | null
{
  // Same node, different operations
  if (op1.data?.nodeId === op2.data?.nodeId) {
    if (op1.type !== op2.type) {
      return 'concurrent_edit';
    }

    if (op1.type === 'node_remove' || op2.type === 'node_remove') {
      return 'deletion_conflict';
    }
  }

  // Edge dependency conflicts
  if (this.hasEdgeDependencyConflict(op1, op2)) {
    return 'dependency_conflict';
  }

  // Concurrent edits on related elements
  if (this.hasConcurrentEditConflict(op1, op2)) {
    return 'concurrent_edit';
  }

  return null;
}

private
hasEdgeDependencyConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  )
: boolean
{
  // Check if one operation removes a node that another operation creates an edge to/from
  if (op1.type === 'node_remove' && op2.type === 'edge_add') {
    return op2.data?.source === op1.data?.nodeId || op2.data?.target === op1.data?.nodeId;
  }

  if (op2.type === 'node_remove' && op1.type === 'edge_add') {
    return op1.data?.source === op2.data?.nodeId || op1.data?.target === op2.data?.nodeId;
  }

  return false;
}

private
hasConcurrentEditConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  )
: boolean
{
  // Check for concurrent edits on the same node
  return op1.data?.nodeId === op2.data?.nodeId && op1.type === op2.type;
}

private
edgesAreConflicting(edge1: any, edge2: any)
: boolean
{
  // Edges conflict if they have the same source and target
  return edge1.source === edge2.source && edge1.target === edge2.target;
}

// Resolution Strategy Implementations

private
async;
lastWriteWinsStrategy(
    conflict: CollaborationConflict
  )
: Promise<ConflictResolution>
{
  const operations = conflict.operations.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const winningOperation = operations[0];

  return {
      success: true,
      resolvedOperation: winningOperation,
      requiresManualReview: false,
      explanation: `Applied most recent change from ${winningOperation.userId}`,
      changesPreview: {
        before: conflict.operations,
        after: [winningOperation],
        affected: conflict.affectedNodes,
      },
    };
}

private
async;
firstWriteWinsStrategy(
    conflict: CollaborationConflict
  )
: Promise<ConflictResolution>
{
    const operations = conflict.operations.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const winningOperation = operations[0];

    return {
      success: true,
      resolvedOperation: winningOperation,
      requiresManualReview: false,
      explanation: `Applied earliest change from ${winningOperation.userId}`,
      changesPreview: {
        before: conflict.operations,

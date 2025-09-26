}
    }

return { operation1: op1, operation2: op2, conflict: false };
}

  /**
   * Transform NODE_DELETE operations
   */
  private transformNodeDelete(op1: Operation, op2: Operation): TransformResult
{
  // Both deleting same node - one becomes no-op
  if (op1.path[0] === op2.path[0]) {
    if (op1.timestamp < op2.timestamp) {
      return {
          operation1: op1,
          operation2: { ...op2, type: OperationType.NODE_ADD },
          conflict: false,
        };
    } else {
      return {
          operation1: { ...op1, type: OperationType.NODE_ADD },
          operation2: op2,
          conflict: false,
        };
    }
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform NODE_MOVE operations
 */
private
transformNodeMove(op1: Operation, op2: Operation)
: TransformResult
{
  // Moving same node
  if (op1.path[0] === op2.path[0]) {
    // Last move wins
    if (op1.timestamp > op2.timestamp) {
      return {
          operation1: op1,
          operation2: { ...op2, data: null },
          conflict: true,
        };
    } else {
      return {
          operation1: { ...op1, data: null },
          operation2: op2,
          conflict: true,
        };
    }
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform TEXT_INSERT operations
 */
private
transformTextInsert(op1: Operation, op2: Operation)
: TransformResult
{
  if (op1.path.join('.') !== op2.path.join('.')) {
    return { operation1: op1, operation2: op2, conflict: false };
  }

  const pos1 = op1.position || 0;
  const pos2 = op2.position || 0;
  const len1 = op1.data?.text?.length || 0;
  const len2 = op2.data?.text?.length || 0;

  if (pos1 < pos2) {
    // op1 is before op2, shift op2's position
    op2.position = pos2 + len1;
  } else if (pos1 > pos2) {
    // op2 is before op1, shift op1's position
    op1.position = pos1 + len2;
  } else {
    // Same position - tie break by user ID
    if (op1.userId < op2.userId) {
      op2.position = pos2 + len1;
    } else {
      op1.position = pos1 + len2;
    }
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform TEXT_DELETE operations
 */
private
transformTextDelete(op1: Operation, op2: Operation)
: TransformResult
{
    if (op1.path.join('.') !== op2.path.join('.')) {
      return { operation1: op1, operation2: op2, conflict: false };
    }

    const start1 = op1.position || 0;
    const end1 = start1 + (op1.length || 0);
    const start2 = op2.position || 0;
    const end2 = start2 + (op2.length || 0);

// No overlap

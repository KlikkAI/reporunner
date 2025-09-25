if (end1 <= start2) {
  // op1 is before op2
  op2.position = start2 - (end1 - start1);
} else if (end2 <= start1) {
  // op2 is before op1
  op1.position = start1 - (end2 - start2);
} else {
  // Overlapping deletes
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapLength = overlapEnd - overlapStart;

  if (start1 < start2) {
    op1.length = (op1.length || 0) - overlapLength;
    op2.position = start1;
    op2.length = (op2.length || 0) - overlapLength;
  } else {
    op2.length = (op2.length || 0) - overlapLength;
    op1.position = start2;
    op1.length = (op1.length || 0) - overlapLength;
  }
}

return { operation1: op1, operation2: op2, conflict: false };
}

  /**
   * Transform ARRAY_INSERT operations
   */
  private transformArrayInsert(op1: Operation, op2: Operation): TransformResult
{
  if (op1.path.join('.') !== op2.path.join('.')) {
    return { operation1: op1, operation2: op2, conflict: false };
  }

  const index1 = op1.position || 0;
  const index2 = op2.position || 0;

  if (index1 < index2) {
    op2.position = index2 + 1;
  } else if (index1 > index2) {
    op1.position = index1 + 1;
  } else {
    // Same index - tie break by user ID
    if (op1.userId < op2.userId) {
      op2.position = index2 + 1;
    } else {
      op1.position = index1 + 1;
    }
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform ARRAY_DELETE operations
 */
private
transformArrayDelete(op1: Operation, op2: Operation)
: TransformResult
{
  if (op1.path.join('.') !== op2.path.join('.')) {
    return { operation1: op1, operation2: op2, conflict: false };
  }

  const index1 = op1.position || 0;
  const index2 = op2.position || 0;

  if (index1 < index2) {
    op2.position = index2 - 1;
  } else if (index1 > index2) {
    op1.position = index1 - 1;
  } else {
    // Same index - one becomes no-op
    if (op1.timestamp < op2.timestamp) {
      return {
          operation1: op1,
          operation2: { ...op2, type: OperationType.ARRAY_INSERT },
          conflict: false,
        };
    } else {
      return {
          operation1: { ...op1, type: OperationType.ARRAY_INSERT },
          operation2: op2,
          conflict: false,
        };
    }
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform operation against pending operations
 */
private
transformAgainstPending(operation: Operation)
: Operation
{
    const userPending = this.pendingOperations.get(operation.userId) || [];
    let transformedOp = operation;

    for (const pendingOp of userPending) {
      const result = this.transform(transformedOp, pendingOp);
      transformedOp = result.operation1;

      if (result.conflict) {

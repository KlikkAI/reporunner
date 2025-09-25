}

// Different type transformations
return this.transformDifferentTypes(op1, op2);
}

  /**
   * Transform operations of the same type
   */
  private transformSameType(op1: Operation, op2: Operation): TransformResult
{
  switch (op1.type) {
    case OperationType.NODE_ADD:
      return this.transformNodeAdd(op1, op2);

    case OperationType.NODE_UPDATE:
      return this.transformNodeUpdate(op1, op2);

    case OperationType.NODE_DELETE:
      return this.transformNodeDelete(op1, op2);

    case OperationType.NODE_MOVE:
      return this.transformNodeMove(op1, op2);

    case OperationType.TEXT_INSERT:
      return this.transformTextInsert(op1, op2);

    case OperationType.TEXT_DELETE:
      return this.transformTextDelete(op1, op2);

    case OperationType.ARRAY_INSERT:
      return this.transformArrayInsert(op1, op2);

    case OperationType.ARRAY_DELETE:
      return this.transformArrayDelete(op1, op2);

    default:
      return { operation1: op1, operation2: op2, conflict: false };
  }
}

/**
 * Transform operations of different types
 */
private
transformDifferentTypes(op1: Operation, op2: Operation)
: TransformResult
{
  // Node delete vs any other operation on that node
  if (op1.type === OperationType.NODE_DELETE) {
    if (this.isOperationOnNode(op2, op1.path[0])) {
      // op1 deletes the node, so op2 becomes a no-op
      return {
          operation1: op1,
          operation2: { ...op2, type: OperationType.NODE_ADD }, // Transform to no-op
          conflict: true,
        };
    }
  }

  // Default: operations don't interfere
  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform NODE_ADD operations
 */
private
transformNodeAdd(op1: Operation, op2: Operation)
: TransformResult
{
  // Two users adding nodes with same ID - conflict
  if (op1.data?.id === op2.data?.id) {
    // Give priority to earlier timestamp
    if (op1.timestamp < op2.timestamp) {
      // op2 needs new ID
      op2.data.id = `${op2.data.id}_${op2.userId}`;
    } else {
      op1.data.id = `${op1.data.id}_${op1.userId}`;
    }
    return { operation1: op1, operation2: op2, conflict: true };
  }

  return { operation1: op1, operation2: op2, conflict: false };
}

/**
 * Transform NODE_UPDATE operations
 */
private
transformNodeUpdate(op1: Operation, op2: Operation)
: TransformResult
{
    // Same node being updated
    if (op1.path[0] === op2.path[0]) {
      // Same property - last write wins based on timestamp
      if (op1.path.join('.') === op2.path.join('.')) {
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

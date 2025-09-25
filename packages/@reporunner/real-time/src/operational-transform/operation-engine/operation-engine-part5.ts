this.emit('conflict:detected', {
  operation1: transformedOp,
  operation2: pendingOp,
  userId: operation.userId,
});
}
    }

return transformedOp;
}

  /**
   * Create inverse operation for undo
   */
  private createInverseOperation(operation: Operation): Operation
{
  const inverse: Operation = {
    ...operation,
    id: `inverse_${operation.id}`,
    timestamp: Date.now(),
  };

  switch (operation.type) {
    case OperationType.NODE_ADD:
      inverse.type = OperationType.NODE_DELETE;
      break;

    case OperationType.NODE_DELETE:
      inverse.type = OperationType.NODE_ADD;
      break;

    case OperationType.TEXT_INSERT:
      inverse.type = OperationType.TEXT_DELETE;
      inverse.length = operation.data?.text?.length || 0;
      break;

    case OperationType.TEXT_DELETE:
      inverse.type = OperationType.TEXT_INSERT;
      break;

    case OperationType.ARRAY_INSERT:
      inverse.type = OperationType.ARRAY_DELETE;
      break;

    case OperationType.ARRAY_DELETE:
      inverse.type = OperationType.ARRAY_INSERT;
      break;

    case OperationType.NODE_MOVE:
      // Swap from and to positions
      inverse.from = operation.to;
      inverse.to = operation.from;
      break;

    case OperationType.PROPERTY_SET:
      // Store old value if available
      inverse.data = operation.data?.oldValue;
      break;
  }

  return inverse;
}

/**
 * Add operation to history
 */
private
addToHistory(operation: Operation, inverseOperation: Operation)
: void
{
  this.operationHistory.push({
    operation,
    inverseOperation,
    timestamp: operation.timestamp,
    userId: operation.userId,
  });

  // Trim history if needed
  if (this.operationHistory.length > this.maxHistorySize) {
    this.operationHistory.shift();
  }
}

/**
 * Validate operation
 */
private
validateOperation(operation: Operation)
: void
{
    if (!operation.id) {
      throw new Error('Operation must have an ID');
    }

    if (!operation.type) {
      throw new Error('Operation must have a type');
    }

    if (!operation.userId) {
      throw new Error('Operation must have a user ID');
    }

    if (!operation.timestamp) {
      operation.timestamp = Date.now();
    }

    if (operation.version === undefined) {

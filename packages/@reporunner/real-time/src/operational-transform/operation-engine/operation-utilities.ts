operation.version = this.currentVersion;
}
  }

  /**
   * Check if operation affects a specific node
   */
  private isOperationOnNode(operation: Operation, nodeId: string): boolean
{
  return operation.path[0] === nodeId;
}

/**
 * Undo last operation by user
 */
undo(userId: string)
: Operation | null
{
  // Find last operation by user
  const lastOpIndex = this.operationHistory.findLastIndex((entry) => entry.userId === userId);

  if (lastOpIndex === -1) {
    return null;
  }

  const entry = this.operationHistory[lastOpIndex];

  // Apply inverse operation
  const undoOp = this.applyOperation(entry.inverseOperation);

  // Remove from history
  this.operationHistory.splice(lastOpIndex, 1);

  return undoOp;
}

/**
 * Get operation history
 */
getHistory(limit?: number)
: OperationHistoryEntry[]
{
  if (limit) {
    return this.operationHistory.slice(-limit);
  }
  return this.operationHistory;
}

/**
 * Clear operation history
 */
clearHistory();
: void
{
  this.operationHistory = [];
  this.pendingOperations.clear();
  this.currentVersion = 0;
}

/**
 * Get current version
 */
getCurrentVersion();
: number
{
  return this.currentVersion;
}

/**
 * Set pending operations for a user
 */
setPendingOperations(userId: string, operations: Operation[])
: void
{
  this.pendingOperations.set(userId, operations);
}

/**
 * Clear pending operations for a user
 */
clearPendingOperations(userId: string)
: void
{
  this.pendingOperations.delete(userId);
}
}

export default OperationalTransform;

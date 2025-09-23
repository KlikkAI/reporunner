import { EventEmitter } from 'node:events';

/**
 * Operation types for workflow transformations
 */
export enum OperationType {
  // Node operations
  NODE_ADD = 'node:add',
  NODE_UPDATE = 'node:update',
  NODE_DELETE = 'node:delete',
  NODE_MOVE = 'node:move',

  // Edge operations
  EDGE_ADD = 'edge:add',
  EDGE_UPDATE = 'edge:update',
  EDGE_DELETE = 'edge:delete',

  // Property operations
  PROPERTY_SET = 'property:set',
  PROPERTY_DELETE = 'property:delete',

  // Array operations
  ARRAY_INSERT = 'array:insert',
  ARRAY_DELETE = 'array:delete',
  ARRAY_MOVE = 'array:move',

  // Text operations
  TEXT_INSERT = 'text:insert',
  TEXT_DELETE = 'text:delete',

  // Workflow metadata
  WORKFLOW_UPDATE = 'workflow:update',
}

export interface Operation {
  id: string;
  type: OperationType;
  path: string[];
  userId: string;
  timestamp: number;
  version: number;
  data?: any;
  position?: number;
  length?: number;
  from?: number;
  to?: number;
}

export interface TransformResult {
  operation1: Operation;
  operation2: Operation;
  conflict: boolean;
}

export interface OperationHistoryEntry {
  operation: Operation;
  inverseOperation: Operation;
  timestamp: number;
  userId: string;
}

export class OperationalTransform extends EventEmitter {
  private operationHistory: OperationHistoryEntry[] = [];
  private pendingOperations: Map<string, Operation[]> = new Map();
  private currentVersion: number = 0;
  private maxHistorySize: number = 1000;

  /**
   * Apply an operation to the workflow
   */
  applyOperation(operation: Operation): Operation {
    // Validate operation
    this.validateOperation(operation);

    // Transform against pending operations if needed
    const transformedOp = this.transformAgainstPending(operation);

    // Create inverse operation for undo
    const inverseOp = this.createInverseOperation(transformedOp);

    // Add to history
    this.addToHistory(transformedOp, inverseOp);

    // Update version
    this.currentVersion++;
    transformedOp.version = this.currentVersion;

    // Emit operation for synchronization
    this.emit('operation:applied', transformedOp);

    return transformedOp;
  }

  /**
   * Transform two concurrent operations
   */
  transform(op1: Operation, op2: Operation): TransformResult {
    // Same type transformations
    if (op1.type === op2.type) {
      return this.transformSameType(op1, op2);
    }

    // Different type transformations
    return this.transformDifferentTypes(op1, op2);
  }

  /**
   * Transform operations of the same type
   */
  private transformSameType(op1: Operation, op2: Operation): TransformResult {
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
  private transformDifferentTypes(op1: Operation, op2: Operation): TransformResult {
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
  private transformNodeAdd(op1: Operation, op2: Operation): TransformResult {
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
  private transformNodeUpdate(op1: Operation, op2: Operation): TransformResult {
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
      }
    }

    return { operation1: op1, operation2: op2, conflict: false };
  }

  /**
   * Transform NODE_DELETE operations
   */
  private transformNodeDelete(op1: Operation, op2: Operation): TransformResult {
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
  private transformNodeMove(op1: Operation, op2: Operation): TransformResult {
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
  private transformTextInsert(op1: Operation, op2: Operation): TransformResult {
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
  private transformTextDelete(op1: Operation, op2: Operation): TransformResult {
    if (op1.path.join('.') !== op2.path.join('.')) {
      return { operation1: op1, operation2: op2, conflict: false };
    }

    const start1 = op1.position || 0;
    const end1 = start1 + (op1.length || 0);
    const start2 = op2.position || 0;
    const end2 = start2 + (op2.length || 0);

    // No overlap
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
  private transformArrayInsert(op1: Operation, op2: Operation): TransformResult {
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
  private transformArrayDelete(op1: Operation, op2: Operation): TransformResult {
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
  private transformAgainstPending(operation: Operation): Operation {
    const userPending = this.pendingOperations.get(operation.userId) || [];
    let transformedOp = operation;

    for (const pendingOp of userPending) {
      const result = this.transform(transformedOp, pendingOp);
      transformedOp = result.operation1;

      if (result.conflict) {
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
  private createInverseOperation(operation: Operation): Operation {
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
  private addToHistory(operation: Operation, inverseOperation: Operation): void {
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
  private validateOperation(operation: Operation): void {
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
      operation.version = this.currentVersion;
    }
  }

  /**
   * Check if operation affects a specific node
   */
  private isOperationOnNode(operation: Operation, nodeId: string): boolean {
    return operation.path[0] === nodeId;
  }

  /**
   * Undo last operation by user
   */
  undo(userId: string): Operation | null {
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
  getHistory(limit?: number): OperationHistoryEntry[] {
    if (limit) {
      return this.operationHistory.slice(-limit);
    }
    return this.operationHistory;
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operationHistory = [];
    this.pendingOperations.clear();
    this.currentVersion = 0;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Set pending operations for a user
   */
  setPendingOperations(userId: string, operations: Operation[]): void {
    this.pendingOperations.set(userId, operations);
  }

  /**
   * Clear pending operations for a user
   */
  clearPendingOperations(userId: string): void {
    this.pendingOperations.delete(userId);
  }
}

export default OperationalTransform;

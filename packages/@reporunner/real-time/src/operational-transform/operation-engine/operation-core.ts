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

/**
 * Conflict Resolution Service
 *
 * Advanced operational transform and conflict resolution system
 * for real-time collaborative editing, inspired by Google Docs
 * and Git's merge resolution strategies.
 */

// Removed unused imports
import type { CollaborationConflict, CollaborationOperation } from './collaborationService';

export interface ConflictResolutionStrategy {
  name: string;
  description: string;
  automatic: boolean;
  handler: (conflict: CollaborationConflict) => Promise<ConflictResolution>;
}

export interface ConflictResolution {
  success: boolean;
  resolvedOperation?: CollaborationOperation;
  mergedOperations?: CollaborationOperation[];
  requiresManualReview: boolean;
  explanation: string;
  changesPreview: {
    before: any;
    after: any;
    affected: string[];
  };
}

export interface OperationalTransform {
  transform: (
    operation: CollaborationOperation,
    conflictingOperation: CollaborationOperation
  ) => CollaborationOperation;
  isApplicable: (
    operation: CollaborationOperation,
    conflictingOperation: CollaborationOperation
  ) => boolean;
}

export class ConflictResolver {
  private strategies = new Map<string, ConflictResolutionStrategy>();
  private operationalTransforms: OperationalTransform[] = [];

  constructor() {
    this.initializeStrategies();
    this.initializeOperationalTransforms();
  }

  /**
   * Detect conflicts between operations
   */
  detectConflicts(
    newOperation: CollaborationOperation,
    existingOperations: CollaborationOperation[]
  ): CollaborationConflict[] {
    const conflicts: CollaborationConflict[] = [];
    const conflictWindow = 30000; // 30 seconds

    for (const existing of existingOperations) {
      // Skip operations that are too old
      const timeDiff =
        new Date(newOperation.timestamp).getTime() - new Date(existing.timestamp).getTime();
      if (Math.abs(timeDiff) > conflictWindow) continue;

      // Skip operations from the same user
      if (existing.userId === newOperation.userId) continue;

      const conflict = this.analyzeOperationConflict(newOperation, existing);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  async resolveConflict(
    conflict: CollaborationConflict,
    strategyName: string = 'smart_merge',
    manualResolution?: any
  ): Promise<ConflictResolution> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${strategyName}`);
    }

    try {
      const resolution = await strategy.handler(conflict);

      // Apply manual resolution if provided
      if (manualResolution && !strategy.automatic) {
        return this.applyManualResolution(conflict, manualResolution);
      }

      return resolution;
    } catch (error) {
      return {
        success: false,
        requiresManualReview: true,
        explanation: `Failed to resolve conflict: ${error instanceof Error ? error.message : String(error)}`,
        changesPreview: {
          before: conflict.operations,
          after: conflict.operations,
          affected: conflict.affectedNodes,
        },
      };
    }
  }

  /**
   * Apply operational transform to resolve conflicts
   */
  applyOperationalTransform(
    operation: CollaborationOperation,
    conflictingOperations: CollaborationOperation[]
  ): CollaborationOperation {
    let transformedOperation = operation;

    for (const conflicting of conflictingOperations) {
      for (const transform of this.operationalTransforms) {
        if (transform.isApplicable(transformedOperation, conflicting)) {
          transformedOperation = transform.transform(transformedOperation, conflicting);
          break;
        }
      }
    }

    return transformedOperation;
  }

  /**
   * Get available resolution strategies
   */
  getAvailableStrategies(): ConflictResolutionStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Preview conflict resolution without applying changes
   */
  async previewResolution(
    conflict: CollaborationConflict,
    strategyName: string
  ): Promise<ConflictResolution> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${strategyName}`);
    }

    return strategy.handler(conflict);
  }

  // Private methods

  private initializeStrategies(): void {
    // Last Write Wins Strategy
    this.strategies.set('last_write_wins', {
      name: 'Last Write Wins',
      description: 'Keep the most recent changes and discard older ones',
      automatic: true,
      handler: async (conflict) => this.lastWriteWinsStrategy(conflict),
    });

    // Smart Merge Strategy
    this.strategies.set('smart_merge', {
      name: 'Smart Merge',
      description: 'Automatically merge compatible changes',
      automatic: true,
      handler: async (conflict) => this.smartMergeStrategy(conflict),
    });

    // First Write Wins Strategy
    this.strategies.set('first_write_wins', {
      name: 'First Write Wins',
      description: 'Keep the earliest changes and reject newer conflicting ones',
      automatic: true,
      handler: async (conflict) => this.firstWriteWinsStrategy(conflict),
    });

    // Manual Resolution Strategy
    this.strategies.set('manual', {
      name: 'Manual Resolution',
      description: 'Review each change individually and decide manually',
      automatic: false,
      handler: async (conflict) => this.manualResolutionStrategy(conflict),
    });

    // Three-Way Merge Strategy
    this.strategies.set('three_way_merge', {
      name: 'Three-Way Merge',
      description: 'Merge changes using a common ancestor as reference',
      automatic: true,
      handler: async (conflict) => this.threeWayMergeStrategy(conflict),
    });
  }

  private initializeOperationalTransforms(): void {
    // Node Move Transform
    this.operationalTransforms.push({
      isApplicable: (op1, op2) =>
        op1.type === 'node_move' &&
        op2.type === 'node_move' &&
        op1.data?.nodeId === op2.data?.nodeId,
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

  private analyzeOperationConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): CollaborationConflict | null {
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

  private getAffectedNodes(op1: CollaborationOperation, op2: CollaborationOperation): string[] {
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

    return Array.from(nodes).filter(Boolean);
  }

  private determineConflictType(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): CollaborationConflict['type'] | null {
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

  private hasEdgeDependencyConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): boolean {
    // Check if one operation removes a node that another operation creates an edge to/from
    if (op1.type === 'node_remove' && op2.type === 'edge_add') {
      return op2.data?.source === op1.data?.nodeId || op2.data?.target === op1.data?.nodeId;
    }

    if (op2.type === 'node_remove' && op1.type === 'edge_add') {
      return op1.data?.source === op2.data?.nodeId || op1.data?.target === op2.data?.nodeId;
    }

    return false;
  }

  private hasConcurrentEditConflict(
    op1: CollaborationOperation,
    op2: CollaborationOperation
  ): boolean {
    // Check for concurrent edits on the same node
    return op1.data?.nodeId === op2.data?.nodeId && op1.type === op2.type;
  }

  private edgesAreConflicting(edge1: any, edge2: any): boolean {
    // Edges conflict if they have the same source and target
    return edge1.source === edge2.source && edge1.target === edge2.target;
  }

  // Resolution Strategy Implementations

  private async lastWriteWinsStrategy(
    conflict: CollaborationConflict
  ): Promise<ConflictResolution> {
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

  private async firstWriteWinsStrategy(
    conflict: CollaborationConflict
  ): Promise<ConflictResolution> {
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
        after: [winningOperation],
        affected: conflict.affectedNodes,
      },
    };
  }

  private async smartMergeStrategy(conflict: CollaborationConflict): Promise<ConflictResolution> {
    try {
      const mergedOperations = [];

      for (const operation of conflict.operations) {
        const otherOps = conflict.operations.filter((op) => op.id !== operation.id);
        const transformedOp = this.applyOperationalTransform(operation, otherOps);
        mergedOperations.push(transformedOp);
      }

      return {
        success: true,
        mergedOperations,
        requiresManualReview: false,
        explanation: 'Successfully merged all changes using operational transforms',
        changesPreview: {
          before: conflict.operations,
          after: mergedOperations,
          affected: conflict.affectedNodes,
        },
      };
    } catch (error) {
      return {
        success: false,
        requiresManualReview: true,
        explanation: `Smart merge failed: ${error instanceof Error ? error.message : String(error)}`,
        changesPreview: {
          before: conflict.operations,
          after: conflict.operations,
          affected: conflict.affectedNodes,
        },
      };
    }
  }

  private async threeWayMergeStrategy(
    conflict: CollaborationConflict
  ): Promise<ConflictResolution> {
    // Simplified three-way merge - in production, would need access to history
    // to find common ancestor state
    return {
      success: false,
      requiresManualReview: true,
      explanation: 'Three-way merge requires historical state information',
      changesPreview: {
        before: conflict.operations,
        after: conflict.operations,
        affected: conflict.affectedNodes,
      },
    };
  }

  private async manualResolutionStrategy(
    conflict: CollaborationConflict
  ): Promise<ConflictResolution> {
    return {
      success: false,
      requiresManualReview: true,
      explanation: 'This conflict requires manual review and resolution',
      changesPreview: {
        before: conflict.operations,
        after: conflict.operations,
        affected: conflict.affectedNodes,
      },
    };
  }

  private async applyManualResolution(
    conflict: CollaborationConflict,
    manualResolution: any
  ): Promise<ConflictResolution> {
    // Apply user's manual resolution choices
    const resolvedOperation = conflict.operations.find(
      (op) => op.id === manualResolution.chosenOperationId
    );

    if (!resolvedOperation) {
      throw new Error('Invalid manual resolution: operation not found');
    }

    return {
      success: true,
      resolvedOperation,
      requiresManualReview: false,
      explanation: 'Applied manual resolution choice',
      changesPreview: {
        before: conflict.operations,
        after: [resolvedOperation],
        affected: conflict.affectedNodes,
      },
    };
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolver();

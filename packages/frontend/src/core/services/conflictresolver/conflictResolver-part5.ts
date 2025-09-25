after: [winningOperation], affected;
: conflict.affectedNodes,
      },
    }
}

  private async smartMergeStrategy(conflict: CollaborationConflict): Promise<ConflictResolution>
{
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

private
async;
threeWayMergeStrategy(
    conflict: CollaborationConflict
  )
: Promise<ConflictResolution>
{
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

private
async;
manualResolutionStrategy(
    conflict: CollaborationConflict
  )
: Promise<ConflictResolution>
{
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

private
async;
applyManualResolution(
    conflict: CollaborationConflict,
    manualResolution: any
  )
: Promise<ConflictResolution>
{
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

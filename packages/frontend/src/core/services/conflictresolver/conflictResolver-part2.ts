return resolution;
} catch (error)
{
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
  ): CollaborationOperation
{
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
getAvailableStrategies();
: ConflictResolutionStrategy[]
{
  return Array.from(this.strategies.values());
}

/**
 * Preview conflict resolution without applying changes
 */
async;
previewResolution(
    conflict: CollaborationConflict,
    strategyName: string
  )
: Promise<ConflictResolution>
{
  const strategy = this.strategies.get(strategyName);
  if (!strategy) {
    throw new Error(`Unknown conflict resolution strategy: ${strategyName}`);
  }

  return strategy.handler(conflict);
}

// Private methods

private
initializeStrategies();
: void
{
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

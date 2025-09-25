switch (containerType) {
  case 'loop':
    return this.validateLoopContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle
        );

  case 'parallel':
    return this.validateParallelContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle
        );

  case 'conditional':
    return this.validateConditionalContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle
        );

  case 'subflow':
    return this.validateSubflowContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle
        );

  default:
    return { isValid: true, severity: 'info' };
}
}

  /**
   * Validate connections across different containers
   */
  private validateCrossContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string
  ): ConnectionValidationResult
{
  // Check if this is a valid container boundary crossing
  const relationship = this.getContainerRelationship(sourceContext, targetContext);

  switch (relationship.type) {
    case 'parent_to_child':
      return this.validateParentToChildConnection(sourceContext, targetContext, relationship);

    case 'child_to_parent':
      return this.validateChildToParentConnection(sourceContext, targetContext, relationship);

    case 'sibling':
      return this.validateSiblingConnection(sourceContext, targetContext, relationship);

    case 'distant':
      return this.validateDistantConnection(sourceContext, targetContext, relationship);

    default:
      return {
          isValid: false,
          reason: 'Invalid container relationship',
          severity: 'error',
        };
  }
}

/**
 * Validate loop container connections
 */
private
validateLoopContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string
  )
: ConnectionValidationResult
{
    // In loop containers, nodes should generally connect sequentially
    // Backward connections might create infinite loops

    const sourceNode = this.nodes.find((n) => n.id === sourceContext.nodeId);
    const targetNode = this.nodes.find((n) => n.id === targetContext.nodeId);

    if (!sourceNode || !targetNode) {
      return { isValid: false, reason: 'Nodes not found', severity: 'error' };
    }

    // Check for potential infinite loops
    if (this.wouldCreateLoop(sourceContext.nodeId, targetContext.nodeId)) {
      return {
        isValid: false,
        reason: 'Connection would create an infinite loop',
        severity: 'error',
        suggestion: 'Consider using a condition node to control the loop',
      };

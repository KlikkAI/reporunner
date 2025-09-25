}

return { isValid: true, severity: 'info' };
}

  /**
   * Validate parallel container connections
   */
  private validateParallelContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string
  ): ConnectionValidationResult
{
  // In parallel containers, nodes should not depend on each other
  // Direct connections between parallel nodes are usually invalid

  return {
      isValid: false,
      reason: 'Nodes in parallel containers should not connect directly',
      severity: 'warning',
      suggestion: 'Use container outputs to synchronize parallel execution',
      autoFix: {
        action: 'redirect',
        details: {
          redirectTo: 'container_output',
          reason: 'Maintain parallel execution independence',
        },
      },
    };
}

/**
 * Validate conditional container connections
 */
private
validateConditionalContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string
  )
: ConnectionValidationResult
{
  // In conditional containers, connections should respect branching logic
  return { isValid: true, severity: 'info' };
}

/**
 * Validate subflow container connections
 */
private
validateSubflowContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string
  )
: ConnectionValidationResult
{
  // Subflows are most flexible - most connections are valid
  return { isValid: true, severity: 'info' };
}

/**
 * Validate parent-to-child container connections
 */
private
validateParentToChildConnection(
    _sourceContext: ContainerContext,
    targetContext: ContainerContext,
    relationship: any
  )
: ConnectionValidationResult
{
  // Parent nodes can connect to container inputs
  if (relationship.targetIsContainerInput) {
    return { isValid: true, severity: 'info' };
  }

  return {
      isValid: false,
      reason: 'Cannot connect directly to nodes inside child containers',
      severity: 'error',
      suggestion: 'Connect to the container input instead',
      autoFix: {
        action: 'redirect',
        details: {
          redirectTo: targetContext.containerId,
          handle: 'input',
        },
      },
    };
}

/**
 * Validate child-to-parent container connections
 */
private
validateChildToParentConnection(
    sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    relationship: any
  )
: ConnectionValidationResult
{
    // Child nodes should connect through container outputs
    if (relationship.sourceIsContainerOutput) {
      return { isValid: true, severity: 'info' };
    }

    return {

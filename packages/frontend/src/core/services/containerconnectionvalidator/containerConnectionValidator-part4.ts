isValid: false, reason;
: 'Nodes inside containers should connect through container outputs',
      severity: 'warning',
      suggestion: 'Use container output handles for external connections',
      autoFix:
{
  action: 'create_bridge', details;
  :
  {
    bridgeType: 'container_output', sourceContainer;
    : sourceContext.containerId,
  }
  ,
}
,
    }
}

  /**
   * Validate sibling container connections
   */
  private validateSiblingConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _relationship: any
  ): ConnectionValidationResult
{
  // Sibling containers should connect through their parent
  return {
      isValid: false,
      reason: 'Sibling containers should not connect directly',
      severity: 'warning',
      suggestion: 'Connect through parent container or use shared variables',
      autoFix: {
        action: 'create_bridge',
        details: {
          bridgeType: 'parent_mediated',
          parentContainer: this.getCommonParent(_sourceContext, _targetContext),
        },
      },
    };
}

/**
 * Validate distant container connections
 */
private
validateDistantConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _relationship: any
  )
: ConnectionValidationResult
{
  return {
      isValid: false,
      reason: 'Connections across distant containers are not recommended',
      severity: 'warning',
      suggestion: 'Consider restructuring workflow or using shared variables',
    };
}

/**
 * Build container graph for efficient lookups
 */
private
buildContainerGraph();
: Map<string, ContainerContext>
{
  const graph = new Map<string, ContainerContext>();

  const processNode = (node: Node, parentPath: string[] = []): void => {
    const containerId = node.data?.parentContainer;
    const containerType = containerId
      ? this.nodes.find((n) => n.id === containerId)?.data?.containerType
      : undefined;

    const context: ContainerContext = {
      nodeId: node.id,
      containerId,
      containerType,
      containerDepth: parentPath.length,
      containerPath: [...parentPath, ...(containerId ? [containerId] : [])],
    };

    graph.set(node.id, context);

    // Process child nodes if this is a container
    if (node.data?.children) {
      const childPath = [...parentPath, node.id];
      node.data.children.forEach((child: Node) => {
        processNode(child, childPath);
      });
    }
  };

  this.nodes.forEach((node) => processNode(node));
  return graph;
}

/**
 * Determine relationship between two container contexts
 */
private
getContainerRelationship(
    sourceContext: ContainerContext,
    targetContext: ContainerContext
  )
{
    const sourcePath = sourceContext.containerPath;
    const targetPath = targetContext.containerPath;

// Find common ancestor

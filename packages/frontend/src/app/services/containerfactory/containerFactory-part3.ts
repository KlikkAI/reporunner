return ContainerFactory.createContainer('subflow', position, {
      subflowId: subflowConfig.subflowId,
      passthrough: subflowConfig.passthrough || false,
    });
}

  /**
   * Convert existing nodes into a container
   */
  static wrapNodesInContainer(
    nodes: Node[],
    containerType: ContainerType,
    containerPosition?:
{
  x: number;
  y: number;
}
):
{
  container: Node;
  updatedNodes: Node[]
}
{
  if (nodes.length === 0) {
    throw new Error('Cannot create container with no nodes');
  }

  // Calculate bounding box of selected nodes
  const bounds = ContainerFactory.calculateNodesBounds(nodes);

  // Position container to encompass all nodes
  const position = containerPosition || {
    x: bounds.minX - 50,
    y: bounds.minY - 100, // Leave space for header
  };

  // Create container with appropriate size
  const container = ContainerFactory.createContainer(containerType, position);

  // Update container dimensions to fit all nodes
  const containerWidth = Math.max(
    bounds.maxX - bounds.minX + 100, // Add padding
    CONTAINER_TEMPLATES[containerType].defaultDimensions.minWidth
  );
  const containerHeight = Math.max(
    bounds.maxY - bounds.minY + 150, // Add padding + header space
    CONTAINER_TEMPLATES[containerType].defaultDimensions.minHeight
  );

  container.data.dimensions.width = containerWidth;
  container.data.dimensions.height = containerHeight;
  container.style = {
    width: containerWidth,
    height: containerHeight,
  };

  // Update nodes to be children of the container
  const updatedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      parentContainer: container.id,
      containerPosition: {
        x: node.position.x - position.x,
        y: node.position.y - position.y,
      },
    },
    position: {
      x: node.position.x - position.x,
      y: node.position.y - position.y,
    },
  }));

  // Add children to container
  container.data.children = updatedNodes;

  return { container, updatedNodes };
}

/**
 * Unwrap nodes from a container
 */
static
unwrapContainer(container: Node, containerPosition: { x: number;
y: number;
}): Node[]
{
  const children = container.data?.children || [];

  return children.map((child: Node) => {
      const { parentContainer, containerPosition: childPos, ...cleanData } = child.data || {};

      return {
        ...child,
        data: cleanData,
        position: {
          x: containerPosition.x + (childPos?.x || child.position.x),
          y: containerPosition.y + (childPos?.y || child.position.y),
        },
      };
    });
}

/**
 * Calculate bounding box of multiple nodes
 */
private
static
calculateNodesBounds(nodes: Node[])
{
    const positions = nodes.map((node) => ({
      x: node.position.x,
      y: node.position.y,
      width: node.style?.width || node.data?.width || 150,
      height: node.style?.height || node.data?.height || 80,
    }));

// Calculate bounding box of all children
const childPositions = children.map((child: Node) => ({
  x: child.position.x,
  y: child.position.y,
  width: child.data?.width || 150,
  height: child.data?.height || 80,
}));

const minX = Math.min(...childPositions.map((p: any) => p.x));
const minY = Math.min(...childPositions.map((p: any) => p.y));
const maxX = Math.max(...childPositions.map((p: any) => p.x + p.width));
const maxY = Math.max(...childPositions.map((p: any) => p.y + p.height));

const padding = containerNode.data.padding || 20;
const newWidth = Math.max(
  maxX - minX + padding * 2,
  containerNode.data.dimensions?.minWidth || 300
);
const newHeight = Math.max(
  maxY - minY + padding * 2,
  containerNode.data.dimensions?.minHeight || 200
);

// Update container dimensions
setNodes((currentNodes) =>
  currentNodes.map((node) => {
    if (node.id === containerId) {
      return {
        ...node,
        data: {
          ...node.data,
          dimensions: {
            ...node.data.dimensions,
            width: newWidth,
            height: newHeight,
          },
        },
      };
    }
    return node;
  })
);
},
    [getNodes, setNodes]
  )

return {
    // Registration functions
    registerContainer,
    unregisterContainer,

    // Intersection detection
    findIntersectingContainers,
    validateDrop,

    // Drag and drop handlers
    handleDragStart,
    handleDragOver,
    handleDrop,
    removeFromContainer,

    // Container management
    autoResizeContainer,

    // State
    draggedNode,
    hoveredContainer,
  };
}

// Helper functions
function getContainerDepth(containerId: string, nodes: Node[]): number {
  const containerNode = nodes.find((n) => n.id === containerId);
  if (!containerNode) return 0;

  const parentContainer = containerNode.data?.parentContainer;
  if (!parentContainer) return 0;

  return 1 + getContainerDepth(parentContainer, nodes);
}

function calculateContainerScore(position: XYPosition, bounds: DOMRect, depth: number): number {
  // Calculate how centered the position is within the container
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  const distanceFromCenter = Math.sqrt((position.x - centerX) ** 2 + (position.y - centerY) ** 2);

  const maxDistance = Math.sqrt((bounds.width / 2) ** 2 + (bounds.height / 2) ** 2);

  const centerScore = 1 - distanceFromCenter / maxDistance;
  const depthScore = depth * 0.1; // Prefer deeper containers slightly

  return centerScore + depthScore;
}

function checkForCycles(_targetContainerId: string, _nodes: Node[]): boolean {
// TODO: Implement cycle detection
// This would check if adding a container to targetContainerId would create a circular dependency

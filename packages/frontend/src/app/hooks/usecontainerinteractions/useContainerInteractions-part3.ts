const containerElement = containerRefs.current.get(containerId);
if (!containerElement) return;

const containerRect = containerElement.getBoundingClientRect();
const relativePosition = {
  x: event.clientX - containerRect.left,
  y: event.clientY - containerRect.top,
};

// Update the dragged node to be inside the container
setNodes((currentNodes) =>
  currentNodes.map((node) => {
    if (node.id === draggedNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          parentContainer: containerId,
          containerPosition: relativePosition,
        },
      };
    }
    return node;
  })
);

// Update container to include this child
setNodes((currentNodes) =>
  currentNodes.map((node) => {
    if (node.id === containerId) {
      const existingChildren = node.data?.children || [];
      return {
        ...node,
        data: {
          ...node.data,
          children: [...existingChildren, draggedNode],
        },
      };
    }
    return node;
  })
);

setDraggedNode(null);
},
    [draggedNode, getNodes, setNodes, validateDrop]
  )

/**
 * Handle node removal from container
 */
const removeFromContainer = useCallback(
  (nodeId: string, containerId: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === containerId) {
          const updatedChildren = (node.data?.children || []).filter(
            (child: Node) => child.id !== nodeId
          );
          return {
            ...node,
            data: {
              ...node.data,
              children: updatedChildren,
            },
          };
        }
        return node;
      })
    );

    // Remove parent container reference from node
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId) {
          const { parentContainer, containerPosition, ...cleanData } = node.data || {};
          return {
            ...node,
            data: cleanData,
          };
        }
        return node;
      })
    );
  },
  [setNodes]
);

/**
 * Auto-resize container based on children
 */
const autoResizeContainer = useCallback(
    (containerId: string) => {
      const nodes = getNodes();
      const containerNode = nodes.find((n) => n.id === containerId);

      if (!containerNode || !containerNode.data?.autoResize) return;

      const children = containerNode.data.children || [];
      if (children.length === 0) return;

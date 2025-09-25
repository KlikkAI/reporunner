const validateDrop = useCallback(
  (nodeType: string, targetContainerId: string, nodes: Node[]): DropValidation => {
    const targetContainer = nodes.find((n) => n.id === targetContainerId);
    if (!targetContainer) {
      return { isValid: false, reason: 'Container not found' };
    }

    const containerType = targetContainer.data?.containerType;

    // Prevent dropping containers into themselves or their children
    if (nodeType === 'container') {
      const wouldCreateCycle = checkForCycles(targetContainerId, nodes);
      if (wouldCreateCycle) {
        return { isValid: false, reason: 'Would create circular dependency' };
      }
    }

    // Container-specific validation
    switch (containerType) {
      case 'loop':
        // Loop containers can contain most node types
        if (nodeType === 'trigger') {
          return {
            isValid: false,
            reason: 'Trigger nodes cannot be inside loops',
          };
        }
        break;

      case 'parallel':
        // Parallel containers should have nodes that can run independently
        if (nodeType === 'condition') {
          return {
            isValid: false,
            reason: 'Condition nodes may not work as expected in parallel',
          };
        }
        break;

      case 'conditional':
        // Conditional containers need specific handling
        break;

      case 'subflow':
        // Subflows can contain any node type
        break;
    }

    return { isValid: true };
  },
  []
);

/**
 * Handle node drag start
 */
const handleDragStart = useCallback((node: Node) => {
  setDraggedNode(node);
}, []);

/**
 * Handle node drag over container
 */
const handleDragOver = useCallback(
  (event: React.DragEvent, containerId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (!draggedNode) return;

    const nodes = getNodes();
    const validation = validateDrop(draggedNode.type!, containerId, nodes);

    if (validation.isValid) {
      setHoveredContainer(containerId);
    } else {
      setHoveredContainer(null);
    }
  },
  [draggedNode, getNodes, validateDrop]
);

/**
 * Handle node drop into container
 */
const handleDrop = useCallback(
    (event: React.DragEvent, containerId: string) => {
      event.preventDefault();
      setHoveredContainer(null);

      if (!draggedNode) return;

      const nodes = getNodes();
      const validation = validateDrop(draggedNode.type!, containerId, nodes);

      if (!validation.isValid) {
        return;
      }

// Calculate position within container

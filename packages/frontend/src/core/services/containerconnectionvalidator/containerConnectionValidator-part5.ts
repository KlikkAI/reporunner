let commonAncestorIndex = 0;
while (
  commonAncestorIndex < sourcePath.length &&
  commonAncestorIndex < targetPath.length &&
  sourcePath[commonAncestorIndex] === targetPath[commonAncestorIndex]
) {
  commonAncestorIndex++;
}

const sourceDepthFromCommon = sourcePath.length - commonAncestorIndex;
const targetDepthFromCommon = targetPath.length - commonAncestorIndex;

if (sourceDepthFromCommon === 0 && targetDepthFromCommon === 1) {
  return { type: 'parent_to_child', targetIsContainerInput: true };
}

if (sourceDepthFromCommon === 1 && targetDepthFromCommon === 0) {
  return { type: 'child_to_parent', sourceIsContainerOutput: true };
}

if (sourceDepthFromCommon === 1 && targetDepthFromCommon === 1) {
  return { type: 'sibling' };
}

return { type: 'distant' };
}

  /**
   * Check if connection would create a loop
   */
  private wouldCreateLoop(sourceId: string, targetId: string): boolean
{
  // Simple cycle detection - can be enhanced
  const visited = new Set<string>();
  const stack = [targetId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    if (visited.has(currentId)) continue;
    if (currentId === sourceId) return true;

    visited.add(currentId);

    // Find outgoing edges from current node
    const outgoingEdges = this.edges.filter((edge) => edge.source === currentId);
    outgoingEdges.forEach((edge) => {
      if (!visited.has(edge.target)) {
        stack.push(edge.target);
      }
    });
  }

  return false;
}

/**
 * Find common parent container
 */
private
getCommonParent(
    sourceContext: ContainerContext,
    targetContext: ContainerContext
  )
: string | undefined
{
  const sourcePath = sourceContext.containerPath;
  const targetPath = targetContext.containerPath;

  for (let i = Math.min(sourcePath.length, targetPath.length) - 1; i >= 0; i--) {
    if (sourcePath[i] === targetPath[i]) {
      return sourcePath[i];
    }
  }

  return undefined;
}
}

/**
 * Hook for using container connection validation in React components
 */
export function useContainerConnectionValidator(nodes: Node[], edges: Edge[]) {
  const validator = new ContainerConnectionValidator(nodes, edges);

  const validateConnection = (
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandle?: string,
    targetHandle?: string
  ) => {
    return validator.validateConnection(sourceNodeId, targetNodeId, sourceHandle, targetHandle);
  };

  return { validateConnection };
}

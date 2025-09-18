/**
 * Container Connection Validator
 *
 * Provides sophisticated validation for connections between nodes
 * within and across container boundaries, preventing invalid
 * workflow structures and ensuring execution consistency.
 */

import type { Node, Edge } from "reactflow";
// Removed invalid import - ContainerType interface should be defined locally or imported from correct path
type ContainerType =
  | "loop"
  | "parallel"
  | "conditional"
  | "try_catch"
  | "custom";

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
  autoFix?: {
    action: "redirect" | "create_bridge" | "add_container";
    details: Record<string, any>;
  };
}

export interface ContainerContext {
  nodeId: string;
  containerId?: string;
  containerType?: ContainerType;
  containerDepth: number;
  containerPath: string[]; // Path from root to current container
}

export class ContainerConnectionValidator {
  private nodes: Node[];
  private edges: Edge[];
  private containerGraph: Map<string, ContainerContext>;

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.containerGraph = this.buildContainerGraph();
  }

  /**
   * Validate a potential connection between two nodes
   */
  validateConnection(
    sourceNodeId: string,
    targetNodeId: string,
    sourceHandle?: string,
    targetHandle?: string,
  ): ConnectionValidationResult {
    const sourceContext = this.containerGraph.get(sourceNodeId);
    const targetContext = this.containerGraph.get(targetNodeId);

    if (!sourceContext || !targetContext) {
      return {
        isValid: false,
        reason: "Node context not found",
        severity: "error",
      };
    }

    // Check for same container connections
    if (sourceContext.containerId === targetContext.containerId) {
      return this.validateSameContainerConnection(
        sourceContext,
        targetContext,
        sourceHandle,
        targetHandle,
      );
    }

    // Check for cross-container connections
    return this.validateCrossContainerConnection(
      sourceContext,
      targetContext,
      sourceHandle,
      targetHandle,
    );
  }

  /**
   * Validate connections within the same container
   */
  private validateSameContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    sourceHandle?: string,
    targetHandle?: string,
  ): ConnectionValidationResult {
    const containerId = sourceContext.containerId;

    if (!containerId) {
      // Both nodes are in the root workflow
      return { isValid: true, severity: "info" };
    }

    const container = this.nodes.find((n) => n.id === containerId);
    const containerType = container?.data?.containerType;

    switch (containerType) {
      case "loop":
        return this.validateLoopContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle,
        );

      case "parallel":
        return this.validateParallelContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle,
        );

      case "conditional":
        return this.validateConditionalContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle,
        );

      case "subflow":
        return this.validateSubflowContainerConnection(
          sourceContext,
          targetContext,
          sourceHandle,
          targetHandle,
        );

      default:
        return { isValid: true, severity: "info" };
    }
  }

  /**
   * Validate connections across different containers
   */
  private validateCrossContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string,
  ): ConnectionValidationResult {
    // Check if this is a valid container boundary crossing
    const relationship = this.getContainerRelationship(
      sourceContext,
      targetContext,
    );

    switch (relationship.type) {
      case "parent_to_child":
        return this.validateParentToChildConnection(
          sourceContext,
          targetContext,
          relationship,
        );

      case "child_to_parent":
        return this.validateChildToParentConnection(
          sourceContext,
          targetContext,
          relationship,
        );

      case "sibling":
        return this.validateSiblingConnection(
          sourceContext,
          targetContext,
          relationship,
        );

      case "distant":
        return this.validateDistantConnection(
          sourceContext,
          targetContext,
          relationship,
        );

      default:
        return {
          isValid: false,
          reason: "Invalid container relationship",
          severity: "error",
        };
    }
  }

  /**
   * Validate loop container connections
   */
  private validateLoopContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string,
  ): ConnectionValidationResult {
    // In loop containers, nodes should generally connect sequentially
    // Backward connections might create infinite loops

    const sourceNode = this.nodes.find((n) => n.id === sourceContext.nodeId);
    const targetNode = this.nodes.find((n) => n.id === targetContext.nodeId);

    if (!sourceNode || !targetNode) {
      return { isValid: false, reason: "Nodes not found", severity: "error" };
    }

    // Check for potential infinite loops
    if (this.wouldCreateLoop(sourceContext.nodeId, targetContext.nodeId)) {
      return {
        isValid: false,
        reason: "Connection would create an infinite loop",
        severity: "error",
        suggestion: "Consider using a condition node to control the loop",
      };
    }

    return { isValid: true, severity: "info" };
  }

  /**
   * Validate parallel container connections
   */
  private validateParallelContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string,
  ): ConnectionValidationResult {
    // In parallel containers, nodes should not depend on each other
    // Direct connections between parallel nodes are usually invalid

    return {
      isValid: false,
      reason: "Nodes in parallel containers should not connect directly",
      severity: "warning",
      suggestion: "Use container outputs to synchronize parallel execution",
      autoFix: {
        action: "redirect",
        details: {
          redirectTo: "container_output",
          reason: "Maintain parallel execution independence",
        },
      },
    };
  }

  /**
   * Validate conditional container connections
   */
  private validateConditionalContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string,
  ): ConnectionValidationResult {
    // In conditional containers, connections should respect branching logic
    return { isValid: true, severity: "info" };
  }

  /**
   * Validate subflow container connections
   */
  private validateSubflowContainerConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _sourceHandle?: string,
    _targetHandle?: string,
  ): ConnectionValidationResult {
    // Subflows are most flexible - most connections are valid
    return { isValid: true, severity: "info" };
  }

  /**
   * Validate parent-to-child container connections
   */
  private validateParentToChildConnection(
    _sourceContext: ContainerContext,
    targetContext: ContainerContext,
    relationship: any,
  ): ConnectionValidationResult {
    // Parent nodes can connect to container inputs
    if (relationship.targetIsContainerInput) {
      return { isValid: true, severity: "info" };
    }

    return {
      isValid: false,
      reason: "Cannot connect directly to nodes inside child containers",
      severity: "error",
      suggestion: "Connect to the container input instead",
      autoFix: {
        action: "redirect",
        details: {
          redirectTo: targetContext.containerId,
          handle: "input",
        },
      },
    };
  }

  /**
   * Validate child-to-parent container connections
   */
  private validateChildToParentConnection(
    sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    relationship: any,
  ): ConnectionValidationResult {
    // Child nodes should connect through container outputs
    if (relationship.sourceIsContainerOutput) {
      return { isValid: true, severity: "info" };
    }

    return {
      isValid: false,
      reason:
        "Nodes inside containers should connect through container outputs",
      severity: "warning",
      suggestion: "Use container output handles for external connections",
      autoFix: {
        action: "create_bridge",
        details: {
          bridgeType: "container_output",
          sourceContainer: sourceContext.containerId,
        },
      },
    };
  }

  /**
   * Validate sibling container connections
   */
  private validateSiblingConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _relationship: any,
  ): ConnectionValidationResult {
    // Sibling containers should connect through their parent
    return {
      isValid: false,
      reason: "Sibling containers should not connect directly",
      severity: "warning",
      suggestion: "Connect through parent container or use shared variables",
      autoFix: {
        action: "create_bridge",
        details: {
          bridgeType: "parent_mediated",
          parentContainer: this.getCommonParent(_sourceContext, _targetContext),
        },
      },
    };
  }

  /**
   * Validate distant container connections
   */
  private validateDistantConnection(
    _sourceContext: ContainerContext,
    _targetContext: ContainerContext,
    _relationship: any,
  ): ConnectionValidationResult {
    return {
      isValid: false,
      reason: "Connections across distant containers are not recommended",
      severity: "warning",
      suggestion: "Consider restructuring workflow or using shared variables",
    };
  }

  /**
   * Build container graph for efficient lookups
   */
  private buildContainerGraph(): Map<string, ContainerContext> {
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
  private getContainerRelationship(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
  ) {
    const sourcePath = sourceContext.containerPath;
    const targetPath = targetContext.containerPath;

    // Find common ancestor
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
      return { type: "parent_to_child", targetIsContainerInput: true };
    }

    if (sourceDepthFromCommon === 1 && targetDepthFromCommon === 0) {
      return { type: "child_to_parent", sourceIsContainerOutput: true };
    }

    if (sourceDepthFromCommon === 1 && targetDepthFromCommon === 1) {
      return { type: "sibling" };
    }

    return { type: "distant" };
  }

  /**
   * Check if connection would create a loop
   */
  private wouldCreateLoop(sourceId: string, targetId: string): boolean {
    // Simple cycle detection - can be enhanced
    const visited = new Set<string>();
    const stack = [targetId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (visited.has(currentId)) continue;
      if (currentId === sourceId) return true;

      visited.add(currentId);

      // Find outgoing edges from current node
      const outgoingEdges = this.edges.filter(
        (edge) => edge.source === currentId,
      );
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
  private getCommonParent(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
  ): string | undefined {
    const sourcePath = sourceContext.containerPath;
    const targetPath = targetContext.containerPath;

    for (
      let i = Math.min(sourcePath.length, targetPath.length) - 1;
      i >= 0;
      i--
    ) {
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
    targetHandle?: string,
  ) => {
    return validator.validateConnection(
      sourceNodeId,
      targetNodeId,
      sourceHandle,
      targetHandle,
    );
  };

  return { validateConnection };
}

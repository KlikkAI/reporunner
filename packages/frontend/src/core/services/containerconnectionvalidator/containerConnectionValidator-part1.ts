/**
 * Container Connection Validator
 *
 * Provides sophisticated validation for connections between nodes
 * within and across container boundaries, preventing invalid
 * workflow structures and ensuring execution consistency.
 */

import type { Edge, Node } from 'reactflow';

// Removed invalid import - ContainerType interface should be defined locally or imported from correct path
type ContainerType = 'loop' | 'parallel' | 'conditional' | 'try_catch' | 'custom';

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  autoFix?: {
    action: 'redirect' | 'create_bridge' | 'add_container';
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
    targetHandle?: string
  ): ConnectionValidationResult {
    const sourceContext = this.containerGraph.get(sourceNodeId);
    const targetContext = this.containerGraph.get(targetNodeId);

    if (!sourceContext || !targetContext) {
      return {
        isValid: false,
        reason: 'Node context not found',
        severity: 'error',
      };
    }

    // Check for same container connections
    if (sourceContext.containerId === targetContext.containerId) {
      return this.validateSameContainerConnection(
        sourceContext,
        targetContext,
        sourceHandle,
        targetHandle
      );
    }

    // Check for cross-container connections
    return this.validateCrossContainerConnection(
      sourceContext,
      targetContext,
      sourceHandle,
      targetHandle
    );
  }

  /**
   * Validate connections within the same container
   */
  private validateSameContainerConnection(
    sourceContext: ContainerContext,
    targetContext: ContainerContext,
    sourceHandle?: string,
    targetHandle?: string
  ): ConnectionValidationResult {
    const containerId = sourceContext.containerId;

    if (!containerId) {
      // Both nodes are in the root workflow
      return { isValid: true, severity: 'info' };
    }

    const container = this.nodes.find((n) => n.id === containerId);
    const containerType = container?.data?.containerType;

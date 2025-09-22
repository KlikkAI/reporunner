/**
 * Intelligent Auto-Connect System
 *
 * Inspired by SIM's sophisticated auto-connection algorithm, this service
 * provides distance-based scoring with container awareness and connection
 * type validation for optimal workflow building.
 */

import type { Edge, Node, XYPosition } from 'reactflow';
import { nodeRegistry } from '@/core/nodes';

export interface ConnectionSuggestion {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
  score: number;
  reason: string;
  distance: number;
}

export interface ConnectionScore {
  score: number;
  isValid: boolean;
  suggestion: ConnectionSuggestion;
}

export interface AutoConnectOptions {
  maxDistance?: number;
  preferredDirection?: 'horizontal' | 'vertical';
  considerContainers?: boolean;
  validateNodeTypes?: boolean;
}

export class IntelligentAutoConnectService {
  private readonly defaultOptions: Required<AutoConnectOptions> = {
    maxDistance: 300,
    preferredDirection: 'horizontal',
    considerContainers: true,
    validateNodeTypes: true,
  };

  /**
   * Find the optimal connection for a newly dropped node
   */
  findOptimalConnection(
    dropPosition: XYPosition,
    existingNodes: Node[],
    existingEdges: Edge[],
    options: AutoConnectOptions = {}
  ): ConnectionSuggestion | null {
    const opts = { ...this.defaultOptions, ...options };

    // Get nodes that could be connected to
    const candidateNodes = this.getCandidateNodes(dropPosition, existingNodes, existingEdges, opts);

    if (candidateNodes.length === 0) {
      return null;
    }

    // Score each potential connection
    const scoredConnections = candidateNodes
      .map((node) => this.scoreConnection(dropPosition, node, existingEdges, opts))
      .filter((score) => score.isValid)
      .sort((a, b) => b.score - a.score);

    return scoredConnections.length > 0 ? scoredConnections[0].suggestion : null;
  }

  /**
   * Find the best node to auto-connect to (rightmost without outgoing connections)
   */
  findLastNode(nodes: Node[], edges: Edge[]): Node | null {
    if (nodes.length === 0) return null;

    // Find nodes with no outgoing connections
    const nodesWithOutgoing = new Set(edges.map((edge) => edge.source));
    const candidateNodes = nodes.filter((node) => !nodesWithOutgoing.has(node.id));

    if (candidateNodes.length === 0) {
      // If all nodes have outgoing connections, use the rightmost positioned node
      return nodes.reduce((rightmost, current) =>
        current.position.x > rightmost.position.x ? current : rightmost
      );
    }

    // Among candidates with no outgoing connections, pick the rightmost
    return candidateNodes.reduce((rightmost, current) =>
      current.position.x > rightmost.position.x ? current : rightmost
    );
  }

  /**
   * Find the optimal position for a new node based on existing workflow
   */
  findOptimalDropPosition(
    currentPosition: XYPosition,
    existingNodes: Node[],
    targetConnection?: Node
  ): XYPosition {
    if (!targetConnection || existingNodes.length === 0) {
      return currentPosition;
    }

    // Calculate optimal position relative to target connection
    const optimalX = targetConnection.position.x + 250; // Standard spacing
    const optimalY = targetConnection.position.y;

    // Check for conflicts with existing nodes
    const hasConflict = existingNodes.some((node) => {
      const distance = Math.sqrt(
        (node.position.x - optimalX) ** 2 + (node.position.y - optimalY) ** 2
      );
      return distance < 100; // Minimum spacing
    });

    if (!hasConflict) {
      return { x: optimalX, y: optimalY };
    }

    // Find alternative position if there's a conflict
    return this.findAlternativePosition({ x: optimalX, y: optimalY }, existingNodes);
  }

  /**
   * Check if two node types are compatible for connection
   */
  validateConnectionTypes(
    sourceNodeType: string,
    targetNodeType: string,
    sourceHandle?: string,
    targetHandle?: string
  ): boolean {
    try {
      const sourceDefinition = nodeRegistry.getNodeTypeDescription(sourceNodeType);
      const targetDefinition = nodeRegistry.getNodeTypeDescription(targetNodeType);

      if (!sourceDefinition || !targetDefinition) {
        return false;
      }

      // Basic validation: ensure source has outputs and target has inputs
      const sourceOutputs = sourceDefinition.outputs || [];
      const targetInputs = targetDefinition.inputs || [];

      if (sourceOutputs.length === 0 || targetInputs.length === 0) {
        return false;
      }

      // Handle AI-specific connections
      if (sourceHandle?.startsWith('ai_') || targetHandle?.startsWith('ai_')) {
        return this.validateAIConnection(sourceHandle, targetHandle);
      }

      // For regular connections, allow if both nodes support standard connection types
      return true;
    } catch (error) {
      console.warn('Connection validation failed:', error);
      return true; // Allow connection on validation error
    }
  }

  private getCandidateNodes(
    dropPosition: XYPosition,
    existingNodes: Node[],
    _existingEdges: Edge[],
    options: Required<AutoConnectOptions>
  ): Node[] {
    return existingNodes.filter((node) => {
      // Calculate distance
      const distance = this.calculateDistance(dropPosition, node.position);

      if (distance > options.maxDistance) {
        return false;
      }

      // Container awareness
      if (options.considerContainers) {
        // TODO: Implement container context checking
        // For now, allow all nodes
      }

      return true;
    });
  }

  private scoreConnection(
    dropPosition: XYPosition,
    targetNode: Node,
    existingEdges: Edge[],
    options: Required<AutoConnectOptions>
  ): ConnectionScore {
    const distance = this.calculateDistance(dropPosition, targetNode.position);
    const maxDistance = options.maxDistance;

    // Distance score (closer is better)
    const distanceScore = Math.max(0, (maxDistance - distance) / maxDistance);

    // Direction preference score
    const directionScore = this.calculateDirectionScore(
      dropPosition,
      targetNode.position,
      options.preferredDirection
    );

    // Connection availability score (prefer nodes without outgoing connections)
    const availabilityScore = this.calculateAvailabilityScore(targetNode.id, existingEdges);

    // Type compatibility score
    let typeScore = 1.0;
    if (options.validateNodeTypes) {
      // TODO: Implement type validation when we have more node type info
      typeScore = 1.0;
    }

    // Calculate final score (weighted average)
    const finalScore =
      distanceScore * 0.4 + directionScore * 0.2 + availabilityScore * 0.3 + typeScore * 0.1;

    const suggestion: ConnectionSuggestion = {
      sourceNodeId: targetNode.id,
      targetNodeId: '', // Will be filled by caller
      score: finalScore,
      reason: this.generateConnectionReason(finalScore, distance),
      distance,
    };

    return {
      score: finalScore,
      isValid: finalScore > 0.3, // Minimum threshold
      suggestion,
    };
  }

  private calculateDistance(pos1: XYPosition, pos2: XYPosition): number {
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
  }

  private calculateDirectionScore(
    dropPos: XYPosition,
    nodePos: XYPosition,
    preferredDirection: 'horizontal' | 'vertical'
  ): number {
    const deltaX = Math.abs(dropPos.x - nodePos.x);
    const deltaY = Math.abs(dropPos.y - nodePos.y);

    if (preferredDirection === 'horizontal') {
      // Prefer left-to-right flow
      if (dropPos.x > nodePos.x) {
        return Math.max(0, 1 - deltaY / (deltaX + deltaY + 1));
      }
      return 0.3; // Penalty for right-to-left
    } else {
      // Prefer top-to-bottom flow
      if (dropPos.y > nodePos.y) {
        return Math.max(0, 1 - deltaX / (deltaX + deltaY + 1));
      }
      return 0.3; // Penalty for bottom-to-top
    }
  }

  private calculateAvailabilityScore(nodeId: string, existingEdges: Edge[]): number {
    const outgoingConnections = existingEdges.filter((edge) => edge.source === nodeId);

    // Prefer nodes with no outgoing connections
    if (outgoingConnections.length === 0) {
      return 1.0;
    }

    // Penalize nodes with many outgoing connections
    return Math.max(0.2, 1.0 - outgoingConnections.length * 0.2);
  }

  private generateConnectionReason(score: number, distance: number): string {
    if (score > 0.8) {
      return `Excellent connection (${Math.round(distance)}px away)`;
    } else if (score > 0.6) {
      return `Good connection (${Math.round(distance)}px away)`;
    } else if (score > 0.4) {
      return `Acceptable connection (${Math.round(distance)}px away)`;
    } else {
      return `Poor connection (${Math.round(distance)}px away)`;
    }
  }

  private validateAIConnection(sourceHandle?: string, targetHandle?: string): boolean {
    const aiConnectionTypes = ['ai_languageModel', 'ai_embedding', 'ai_vectorStore', 'ai_tool'];

    if (!sourceHandle || !targetHandle) {
      return false;
    }

    // AI connections must match types
    return aiConnectionTypes.some(
      (type) => sourceHandle.includes(type) && targetHandle.includes(type)
    );
  }

  private findAlternativePosition(idealPosition: XYPosition, existingNodes: Node[]): XYPosition {
    const spacing = 150;
    const maxAttempts = 8;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = (attempt * Math.PI * 2) / maxAttempts;
      const radius = spacing * (1 + attempt * 0.5);

      const candidatePos = {
        x: idealPosition.x + Math.cos(angle) * radius,
        y: idealPosition.y + Math.sin(angle) * radius,
      };

      // Check if this position conflicts with existing nodes
      const hasConflict = existingNodes.some((node) => {
        const distance = this.calculateDistance(candidatePos, node.position);
        return distance < 100;
      });

      if (!hasConflict) {
        return candidatePos;
      }
    }

    // Fallback: return original position
    return idealPosition;
  }
}

// Export singleton instance
export const intelligentAutoConnect = new IntelligentAutoConnectService();

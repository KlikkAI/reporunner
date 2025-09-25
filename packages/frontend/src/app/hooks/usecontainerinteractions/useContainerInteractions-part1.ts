/**
 * Container Interactions Hook
 *
 * Provides sophisticated drag-and-drop interactions for container nodes,
 * including conflict detection, auto-resizing, and validation.
 */

import { useCallback, useRef, useState } from 'react';
import { type Node, useReactFlow, type XYPosition } from 'reactflow';
import type { ContainerType } from '../components/WorkflowEditor/NodeTypes/ContainerNode/ContainerNode';

export interface ContainerIntersection {
  containerId: string;
  containerType: ContainerType;
  depth: number;
  bounds: DOMRect;
  isValid: boolean;
  score: number;
}

export interface DropValidation {
  isValid: boolean;
  reason?: string;
  targetContainer?: string;
  suggestedPosition?: XYPosition;
}

export const useContainerInteractions = () => {
  const { getNodes, setNodes } = useReactFlow();

  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);
  const containerRefs = useRef<Map<string, HTMLElement>>(new Map());

  /**
   * Register a container element for intersection detection
   */
  const registerContainer = useCallback((containerId: string, element: HTMLElement) => {
    containerRefs.current.set(containerId, element);
  }, []);

  /**
   * Unregister a container element
   */
  const unregisterContainer = useCallback((containerId: string) => {
    containerRefs.current.delete(containerId);
  }, []);

  /**
   * Find all containers that intersect with a given position
   */
  const findIntersectingContainers = useCallback(
    (position: XYPosition): ContainerIntersection[] => {
      const containers: ContainerIntersection[] = [];
      const nodes = getNodes();

      // Find all container nodes
      const containerNodes = nodes.filter(
        (node) => node.type === 'container' || node.data?.containerType
      );

      containerNodes.forEach((containerNode) => {
        const element = containerRefs.current.get(containerNode.id);
        if (!element) return;

        const bounds = element.getBoundingClientRect();

        // Check if position is within container bounds
        if (
          position.x >= bounds.left &&
          position.x <= bounds.right &&
          position.y >= bounds.top &&
          position.y <= bounds.bottom
        ) {
          const depth = getContainerDepth(containerNode.id, nodes);
          const score = calculateContainerScore(position, bounds, depth);

          containers.push({
            containerId: containerNode.id,
            containerType: containerNode.data?.containerType || 'subflow',
            depth,
            bounds,
            isValid: true, // Will be validated separately
            score,
          });
        }
      });

      // Sort by depth (deepest first) and score
      return containers.sort((a, b) => {
        if (a.depth !== b.depth) return b.depth - a.depth;
        return b.score - a.score;
      });
    },
    [getNodes]
  );

/**
 * Validate if a node can be dropped into a container
 */

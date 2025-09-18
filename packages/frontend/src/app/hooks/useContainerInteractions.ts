/**
 * Container Interactions Hook
 *
 * Provides sophisticated drag-and-drop interactions for container nodes,
 * including conflict detection, auto-resizing, and validation.
 */

import { useCallback, useRef, useState } from "react";
import { useReactFlow, type Node, type XYPosition } from "reactflow";
import type { ContainerType } from "../components/WorkflowEditor/NodeTypes/ContainerNode/ContainerNode";

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
  const registerContainer = useCallback(
    (containerId: string, element: HTMLElement) => {
      containerRefs.current.set(containerId, element);
    },
    [],
  );

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
        (node) => node.type === "container" || node.data?.containerType,
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
            containerType: containerNode.data?.containerType || "subflow",
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
    [getNodes],
  );

  /**
   * Validate if a node can be dropped into a container
   */
  const validateDrop = useCallback(
    (
      nodeType: string,
      targetContainerId: string,
      nodes: Node[],
    ): DropValidation => {
      const targetContainer = nodes.find((n) => n.id === targetContainerId);
      if (!targetContainer) {
        return { isValid: false, reason: "Container not found" };
      }

      const containerType = targetContainer.data?.containerType;

      // Prevent dropping containers into themselves or their children
      if (nodeType === "container") {
        const wouldCreateCycle = checkForCycles(targetContainerId, nodes);
        if (wouldCreateCycle) {
          return { isValid: false, reason: "Would create circular dependency" };
        }
      }

      // Container-specific validation
      switch (containerType) {
        case "loop":
          // Loop containers can contain most node types
          if (nodeType === "trigger") {
            return {
              isValid: false,
              reason: "Trigger nodes cannot be inside loops",
            };
          }
          break;

        case "parallel":
          // Parallel containers should have nodes that can run independently
          if (nodeType === "condition") {
            return {
              isValid: false,
              reason: "Condition nodes may not work as expected in parallel",
            };
          }
          break;

        case "conditional":
          // Conditional containers need specific handling
          break;

        case "subflow":
          // Subflows can contain any node type
          break;
      }

      return { isValid: true };
    },
    [],
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
      event.dataTransfer.dropEffect = "move";

      if (!draggedNode) return;

      const nodes = getNodes();
      const validation = validateDrop(draggedNode.type!, containerId, nodes);

      if (validation.isValid) {
        setHoveredContainer(containerId);
      } else {
        setHoveredContainer(null);
      }
    },
    [draggedNode, getNodes, validateDrop],
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
        console.warn("Drop validation failed:", validation.reason);
        return;
      }

      // Calculate position within container
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
        }),
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
        }),
      );

      setDraggedNode(null);
    },
    [draggedNode, getNodes, setNodes, validateDrop],
  );

  /**
   * Handle node removal from container
   */
  const removeFromContainer = useCallback(
    (nodeId: string, containerId: string) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === containerId) {
            const updatedChildren = (node.data?.children || []).filter(
              (child: Node) => child.id !== nodeId,
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
        }),
      );

      // Remove parent container reference from node
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id === nodeId) {
            const { parentContainer, containerPosition, ...cleanData } =
              node.data || {};
            return {
              ...node,
              data: cleanData,
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
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
        containerNode.data.dimensions?.minWidth || 300,
      );
      const newHeight = Math.max(
        maxY - minY + padding * 2,
        containerNode.data.dimensions?.minHeight || 200,
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
        }),
      );
    },
    [getNodes, setNodes],
  );

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
};

// Helper functions
function getContainerDepth(containerId: string, nodes: Node[]): number {
  const containerNode = nodes.find((n) => n.id === containerId);
  if (!containerNode) return 0;

  const parentContainer = containerNode.data?.parentContainer;
  if (!parentContainer) return 0;

  return 1 + getContainerDepth(parentContainer, nodes);
}

function calculateContainerScore(
  position: XYPosition,
  bounds: DOMRect,
  depth: number,
): number {
  // Calculate how centered the position is within the container
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  const distanceFromCenter = Math.sqrt(
    Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2),
  );

  const maxDistance = Math.sqrt(
    Math.pow(bounds.width / 2, 2) + Math.pow(bounds.height / 2, 2),
  );

  const centerScore = 1 - distanceFromCenter / maxDistance;
  const depthScore = depth * 0.1; // Prefer deeper containers slightly

  return centerScore + depthScore;
}

function checkForCycles(_targetContainerId: string, _nodes: Node[]): boolean {
  // TODO: Implement cycle detection
  // This would check if adding a container to targetContainerId would create a circular dependency
  return false;
}

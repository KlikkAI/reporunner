/**
 * Container Factory Service
 *
 * Creates and configures different types of container nodes
 * with appropriate default settings and configurations.
 */

import type { Node } from 'reactflow';
import type {
  ContainerNodeData,
  ContainerType,
} from '../components/WorkflowEditor/NodeTypes/ContainerNode/ContainerNode';

export interface ContainerTemplate {
  type: ContainerType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: ContainerNodeData['config'];
  defaultDimensions: ContainerNodeData['dimensions'];
  category: string;
}

export const CONTAINER_TEMPLATES: Record<ContainerType, ContainerTemplate> = {
  loop: {
    type: 'loop',
    label: 'Loop Container',
    description: 'Execute nodes repeatedly based on conditions or iterations',
    icon: '🔄',
    defaultConfig: {
      loopMode: 'forEach',
      loopVariable: 'item',
      loopCount: 10,
    },
    defaultDimensions: {
      width: 400,
      height: 300,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Control Flow',
  },

  parallel: {
    type: 'parallel',
    label: 'Parallel Container',
    description: 'Execute multiple nodes concurrently',
    icon: '⚡',
    defaultConfig: {
      parallelMode: 'all',
      maxConcurrency: 5,
    },
    defaultDimensions: {
      width: 450,
      height: 350,
      minWidth: 350,
      minHeight: 250,
    },
    category: 'Control Flow',
  },

  conditional: {
    type: 'conditional',
    label: 'Conditional Container',
    description: 'Execute different branches based on conditions',
    icon: '🔀',
    defaultConfig: {
      conditions: [
        { id: 'true', condition: 'true', label: 'True' },
        { id: 'false', condition: 'false', label: 'False' },
      ],
    },
    defaultDimensions: {
      width: 400,
      height: 300,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Control Flow',
  },

  subflow: {
    type: 'subflow',
    label: 'Subflow Container',
    description: 'Group related nodes into a reusable subflow',
    icon: '📦',
    defaultConfig: {
      passthrough: false,
    },
    defaultDimensions: {
      width: 500,
      height: 400,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Organization',
  },
};

export class ContainerFactory {
  /**
   * Create a new container node
   */
  static createContainer(
    type: ContainerType,
    position: { x: number; y: number },
    customConfig?: Partial<ContainerNodeData['config']>,
    customLabel?: string
  ): Node {
    const template = CONTAINER_TEMPLATES[type];
    const nodeId = `container-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const containerData: ContainerNodeData = {
      label: customLabel || template.label,
      containerType: type,
      children: [],
      config: {
        ...template.defaultConfig,
        ...customConfig,
      },
      dimensions: { ...template.defaultDimensions },
      autoResize: true,
      padding: 20,
      isExpanded: true,
      isCollapsed: false,
    };

    return {
      id: nodeId,
      type: 'container',
      position,
      data: containerData,
      style: {
        width: template.defaultDimensions.width,
        height: template.defaultDimensions.height,
      },
    };
  }

  /**
   * Create a loop container with specific configuration
   */
  static createLoopContainer(
    position: { x: number; y: number },
    loopConfig: {
      mode?: 'forEach' | 'while' | 'count';
      condition?: string;
      count?: number;
      variable?: string;
    } = {}
  ): Node {
    return ContainerFactory.createContainer('loop', position, {
      loopMode: loopConfig.mode || 'forEach',
      loopCondition: loopConfig.condition,
      loopCount: loopConfig.count || 10,
      loopVariable: loopConfig.variable || 'item',
    });
  }

  /**
   * Create a parallel container with specific configuration
   */
  static createParallelContainer(
    position: { x: number; y: number },
    parallelConfig: {
      mode?: 'all' | 'first' | 'race';
      maxConcurrency?: number;
    } = {}
  ): Node {
    return ContainerFactory.createContainer('parallel', position, {
      parallelMode: parallelConfig.mode || 'all',
      maxConcurrency: parallelConfig.maxConcurrency || 5,
    });
  }

  /**
   * Create a conditional container with custom conditions
   */
  static createConditionalContainer(
    position: { x: number; y: number },
    conditions: Array<{ id: string; condition: string; label: string }> = [
      { id: 'true', condition: 'true', label: 'True' },
      { id: 'false', condition: 'false', label: 'False' },
    ]
  ): Node {
    return ContainerFactory.createContainer('conditional', position, {
      conditions,
    });
  }

  /**
   * Create a subflow container
   */
  static createSubflowContainer(
    position: { x: number; y: number },
    subflowConfig: {
      subflowId?: string;
      passthrough?: boolean;
    } = {}
  ): Node {
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
    containerPosition?: { x: number; y: number }
  ): { container: Node; updatedNodes: Node[] } {
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
  static unwrapContainer(container: Node, containerPosition: { x: number; y: number }): Node[] {
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
  private static calculateNodesBounds(nodes: Node[]) {
    const positions = nodes.map((node) => ({
      x: node.position.x,
      y: node.position.y,
      width: node.style?.width || node.data?.width || 150,
      height: node.style?.height || node.data?.height || 80,
    }));

    return {
      minX: Math.min(...positions.map((p) => p.x)),
      minY: Math.min(...positions.map((p) => p.y)),
      maxX: Math.max(...positions.map((p) => p.x + (p.width as number))),
      maxY: Math.max(...positions.map((p) => p.y + (p.height as number))),
    };
  }

  /**
   * Get all available container templates
   */
  static getTemplates(): ContainerTemplate[] {
    return Object.values(CONTAINER_TEMPLATES);
  }

  /**
   * Get template for specific container type
   */
  static getTemplate(type: ContainerType): ContainerTemplate {
    return CONTAINER_TEMPLATES[type];
  }

  /**
   * Validate container configuration
   */
  static validateConfig(type: ContainerType, config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case 'loop':
        if (config.loopMode === 'count' && (!config.loopCount || config.loopCount < 1)) {
          errors.push('Loop count must be greater than 0');
        }
        if (config.loopMode === 'while' && !config.loopCondition) {
          errors.push('While loop must have a condition');
        }
        break;

      case 'parallel':
        if (config.maxConcurrency && config.maxConcurrency < 1) {
          errors.push('Max concurrency must be greater than 0');
        }
        break;

      case 'conditional':
        if (!config.conditions || config.conditions.length === 0) {
          errors.push('Conditional container must have at least one condition');
        }
        break;

      case 'subflow':
        // Subflow validation can be added here
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Node registry reusing patterns from workflow-engine

import type { NodeDefinition } from '../types/node-types';
import { type BaseNode, EndNode, StartNode, TransformNode } from './BaseNode';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private nodeTypes = new Map<string, typeof BaseNode>();
  private nodeDefinitions = new Map<string, NodeDefinition>();

  private constructor() {
    this.registerBuiltInNodes();
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  registerNode(nodeType: string, nodeClass: typeof BaseNode, definition?: NodeDefinition): void {
    this.nodeTypes.set(nodeType, nodeClass);

    if (definition) {
      this.nodeDefinitions.set(nodeType, definition);
    }
  }

  getNodeClass(nodeType: string): typeof BaseNode | undefined {
    return this.nodeTypes.get(nodeType);
  }

  getNodeDefinition(nodeType: string): NodeDefinition | undefined {
    return this.nodeDefinitions.get(nodeType);
  }

  getAllNodeTypes(): string[] {
    return Array.from(this.nodeTypes.keys());
  }

  getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  createNode(nodeType: string, options: any): BaseNode {
    const NodeClass = this.nodeTypes.get(nodeType);

    if (!NodeClass) {
      throw new Error(`Unknown node type: ${nodeType}`);
    }

    // Create instance of the concrete class (not BaseNode directly)
    return new (NodeClass as any)(options);
  }

  private registerBuiltInNodes(): void {
    // Register built-in node types
    this.registerNode('start', StartNode, {
      id: 'start',
      type: 'start',
      name: 'Start',
      description: 'Workflow start node',
      category: 'core',
      inputs: [],
      outputs: [{ name: 'output', type: 'any', description: 'Start output' }],
      parameters: [],
    });

    this.registerNode('end', EndNode, {
      id: 'end',
      type: 'end',
      name: 'End',
      description: 'Workflow end node',
      category: 'core',
      inputs: [{ name: 'input', type: 'any', required: true, description: 'End input' }],
      outputs: [],
      parameters: [],
    });

    this.registerNode('transform', TransformNode, {
      id: 'transform',
      type: 'transform',
      name: 'Transform',
      description: 'Data transformation node',
      category: 'data',
      inputs: [{ name: 'input', type: 'any', required: true, description: 'Data to transform' }],
      outputs: [{ name: 'output', type: 'any', description: 'Transformed data' }],
      parameters: [
        {
          name: 'transformation',
          type: 'object',
          required: false,
          description: 'Transformation rules',
          default: {},
        },
      ],
    });
  }
}

// Export singleton instance
export const nodeRegistry = NodeRegistry.getInstance();

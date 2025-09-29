/**
 * Node Generator
 * 
 * Utilities for generating workflow nodes dynamically
 */

import type { Node } from 'reactflow';
import type { WorkflowNodeData } from '../types/workflow';
import { nodeRegistry } from '../nodes/registry';

export interface NodeGenerationConfig {
  type: string;
  position?: { x: number; y: number };
  name?: string;
  properties?: Record<string, any>;
  integration?: string;
}

export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  icon?: string;
  defaultProperties: Record<string, any>;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
}

class NodeGenerator {
  private nodeIdCounter = 0;

  /**
   * Generate a unique node ID
   */
  generateNodeId(type: string): string {
    return `${type}-${++this.nodeIdCounter}-${Date.now()}`;
  }

  /**
   * Create a new workflow node
   */
  createNode(config: NodeGenerationConfig): Node<WorkflowNodeData> {
    const nodeId = this.generateNodeId(config.type);
    const nodeType = nodeRegistry.getNodeType(config.type);
    
    if (!nodeType) {
      throw new Error(`Unknown node type: ${config.type}`);
    }

    const nodeData: WorkflowNodeData = {
      id: nodeId,
      type: config.type,
      name: config.name || nodeType.displayName || config.type,
      description: nodeType.description,
      properties: {
        ...nodeType.defaults,
        ...config.properties,
      },
      integrationData: config.integration ? {
        id: config.integration,
        name: config.integration,
        version: '1.0.0',
      } : undefined,
      version: 1,
      inputs: nodeType.inputs || [],
      outputs: nodeType.outputs || [],
    };

    return {
      id: nodeId,
      type: config.type,
      position: config.position || { x: 0, y: 0 },
      data: nodeData,
    };
  }

  /**
   * Create multiple nodes from configs
   */
  createNodes(configs: NodeGenerationConfig[]): Node<WorkflowNodeData>[] {
    return configs.map(config => this.createNode(config));
  }

  /**
   * Create a node from template
   */
  createNodeFromTemplate(templateId: string, position?: { x: number; y: number }): Node<WorkflowNodeData> {
    const template = this.getNodeTemplate(templateId);
    
    if (!template) {
      throw new Error(`Unknown node template: ${templateId}`);
    }

    return this.createNode({
      type: template.type,
      position,
      name: template.name,
      properties: template.defaultProperties,
    });
  }

  /**
   * Clone an existing node
   */
  cloneNode(node: Node<WorkflowNodeData>, offset?: { x: number; y: number }): Node<WorkflowNodeData> {
    const clonedNode = {
      ...node,
      id: this.generateNodeId(node.data?.type || 'unknown'),
      position: {
        x: node.position.x + (offset?.x || 50),
        y: node.position.y + (offset?.y || 50),
      },
      data: node.data ? {
        ...node.data,
        id: this.generateNodeId(node.data.type),
        name: `${node.data.name} (Copy)`,
      } : undefined,
      selected: false,
      dragging: false,
    };

    return clonedNode;
  }

  /**
   * Generate a workflow from template
   */
  generateWorkflowFromTemplate(
    templateNodes: Array<{
      type: string;
      name?: string;
      position: { x: number; y: number };
      properties?: Record<string, any>;
    }>
  ): Node<WorkflowNodeData>[] {
    return templateNodes.map(nodeConfig => 
      this.createNode(nodeConfig)
    );
  }

  /**
   * Get available node templates
   */
  getAvailableTemplates(): NodeTemplate[] {
    // Mock templates - in real implementation, these would come from a registry
    return [
      {
        id: 'basic-api-call',
        name: 'Basic API Call',
        description: 'Make a simple HTTP request',
        type: 'http',
        category: 'Integration',
        icon: '🌐',
        defaultProperties: {
          method: 'GET',
          url: '',
          headers: {},
        },
        inputs: [{ name: 'trigger', type: 'main', required: false }],
        outputs: [{ name: 'success', type: 'main' }, { name: 'error', type: 'main' }],
      },
      {
        id: 'data-transformer',
        name: 'Data Transformer',
        description: 'Transform data between different formats',
        type: 'transform',
        category: 'Data',
        icon: '🔄',
        defaultProperties: {
          operation: 'map',
          mapping: {},
        },
        inputs: [{ name: 'input', type: 'main', required: true }],
        outputs: [{ name: 'output', type: 'main' }],
      },
      {
        id: 'conditional-branch',
        name: 'Conditional Branch',
        description: 'Branch workflow based on conditions',
        type: 'condition',
        category: 'Logic',
        icon: '🔀',
        defaultProperties: {
          condition: 'true',
        },
        inputs: [{ name: 'input', type: 'main', required: true }],
        outputs: [{ name: 'true', type: 'main' }, { name: 'false', type: 'main' }],
      },
    ];
  }

  /**
   * Get node template by ID
   */
  getNodeTemplate(templateId: string): NodeTemplate | undefined {
    return this.getAvailableTemplates().find(template => template.id === templateId);
  }

  /**
   * Generate nodes for common workflow patterns
   */
  generateCommonPattern(pattern: 'api-to-database' | 'email-automation' | 'data-processing'): Node<WorkflowNodeData>[] {
    switch (pattern) {
      case 'api-to-database':
        return this.createNodes([
          { type: 'webhook', position: { x: 100, y: 100 }, name: 'API Trigger' },
          { type: 'transform', position: { x: 300, y: 100 }, name: 'Transform Data' },
          { type: 'database', position: { x: 500, y: 100 }, name: 'Save to Database' },
        ]);

      case 'email-automation':
        return this.createNodes([
          { type: 'email-trigger', position: { x: 100, y: 100 }, name: 'Email Received' },
          { type: 'condition', position: { x: 300, y: 100 }, name: 'Check Criteria' },
          { type: 'email-send', position: { x: 500, y: 100 }, name: 'Send Response' },
        ]);

      case 'data-processing':
        return this.createNodes([
          { type: 'trigger', position: { x: 100, y: 100 }, name: 'Data Trigger' },
          { type: 'transform', position: { x: 300, y: 100 }, name: 'Clean Data' },
          { type: 'transform', position: { x: 500, y: 100 }, name: 'Enrich Data' },
          { type: 'action', position: { x: 700, y: 100 }, name: 'Process Result' },
        ]);

      default:
        return [];
    }
  }

  /**
   * Validate node configuration
   */
  validateNodeConfig(config: NodeGenerationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Node type is required');
    }

    const nodeType = nodeRegistry.getNodeType(config.type);
    if (!nodeType) {
      errors.push(`Unknown node type: ${config.type}`);
    }

    if (config.position) {
      if (typeof config.position.x !== 'number' || typeof config.position.y !== 'number') {
        errors.push('Position must contain numeric x and y coordinates');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get suggested node placements
   */
  getSuggestedPosition(
    existingNodes: Node<WorkflowNodeData>[],
    nodeType: string
  ): { x: number; y: number } {
    if (existingNodes.length === 0) {
      return { x: 100, y: 100 };
    }

    // Find the rightmost node and place new node to its right
    const rightmostNode = existingNodes.reduce((rightmost, node) => 
      node.position.x > rightmost.position.x ? node : rightmost
    );

    return {
      x: rightmostNode.position.x + 200,
      y: rightmostNode.position.y,
    };
  }
}

export const nodeGenerator = new NodeGenerator();
export { NodeGenerator };
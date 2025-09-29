/**
 * Container Factory Service - Reusing existing implementations
 * 
 * This service reuses the existing ComponentFactory to provide
 * container creation and management capabilities.
 */

import type { Node } from 'reactflow';
import { ComponentFactory } from '../node-extensions/ComponentFactory';
import type { WorkflowNodeData } from '@/core/types/workflow';

// Container templates for different use cases
export const CONTAINER_TEMPLATES = {
  dataProcessing: {
    id: 'data-processing',
    name: 'Data Processing Pipeline',
    description: 'Container for data transformation and processing workflows',
    defaultNodes: ['trigger', 'transform', 'condition', 'action'],
    category: 'Data',
    icon: '⚙️',
  },
  apiIntegration: {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Container for API-based workflow integrations',
    defaultNodes: ['webhook', 'http', 'transform', 'condition'],
    category: 'Integration',
    icon: '🔌',
  },
  emailAutomation: {
    id: 'email-automation',
    name: 'Email Automation',
    description: 'Container for email-based workflows',
    defaultNodes: ['email-trigger', 'condition', 'email-send'],
    category: 'Communication',
    icon: '📧',
  },
  aiWorkflow: {
    id: 'ai-workflow',
    name: 'AI/ML Workflow',
    description: 'Container for AI and machine learning workflows',
    defaultNodes: ['trigger', 'ai-agent', 'transform', 'condition'],
    category: 'AI/ML',
    icon: '🤖',
  },
} as const;

export type ContainerTemplate = typeof CONTAINER_TEMPLATES[keyof typeof CONTAINER_TEMPLATES];

interface ContainerFactoryConfig {
  templateId: string;
  customNodes?: string[];
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

class ContainerFactoryService {
  private componentFactory: ComponentFactory;
  private containerIdCounter = 0;

  constructor() {
    this.componentFactory = new ComponentFactory();
  }

  /**
   * Create a container from a template
   */
  createContainer(config: ContainerFactoryConfig): Node<WorkflowNodeData> {
    const template = CONTAINER_TEMPLATES[config.templateId as keyof typeof CONTAINER_TEMPLATES];
    
    if (!template) {
      throw new Error(`Container template '${config.templateId}' not found`);
    }

    const containerId = `container-${++this.containerIdCounter}`;
    const nodes = config.customNodes || template.defaultNodes;

    const containerNode: Node<WorkflowNodeData> = {
      id: containerId,
      type: 'container',
      position: config.position || { x: 100, y: 100 },
      data: {
        id: containerId,
        type: 'container',
        name: template.name,
        description: template.description,
        properties: {
          template: template.id,
          containedNodes: nodes,
          category: template.category,
          icon: template.icon,
          metadata: config.metadata || {},
        },
        integrationData: {
          id: 'container',
          name: 'Container',
          version: '1.0.0',
        },
        version: 1,
        inputs: [],
        outputs: [],
      },
    };

    return containerNode;
  }

  /**
   * Create multiple containers from templates
   */
  createContainersFromTemplates(configs: ContainerFactoryConfig[]): Node<WorkflowNodeData>[] {
    return configs.map(config => this.createContainer(config));
  }

  /**
   * Get available container templates
   */
  getAvailableTemplates(): ContainerTemplate[] {
    return Object.values(CONTAINER_TEMPLATES);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ContainerTemplate | undefined {
    return CONTAINER_TEMPLATES[templateId as keyof typeof CONTAINER_TEMPLATES];
  }

  /**
   * Register a custom container component
   */
  registerContainerComponent(name: string, component: any): void {
    this.componentFactory.registerBodyComponent(name, component);
  }

  /**
   * Create a container with custom properties
   */
  createCustomContainer(
    name: string,
    description: string,
    nodes: string[],
    position?: { x: number; y: number }
  ): Node<WorkflowNodeData> {
    const containerId = `custom-container-${++this.containerIdCounter}`;

    const containerNode: Node<WorkflowNodeData> = {
      id: containerId,
      type: 'container',
      position: position || { x: 100, y: 100 },
      data: {
        id: containerId,
        type: 'container',
        name,
        description,
        properties: {
          template: 'custom',
          containedNodes: nodes,
          category: 'Custom',
          icon: '📦',
          metadata: {},
        },
        integrationData: {
          id: 'container',
          name: 'Container',
          version: '1.0.0',
        },
        version: 1,
        inputs: [],
        outputs: [],
      },
    };

    return containerNode;
  }

  /**
   * Validate container configuration
   */
  validateContainer(node: Node<WorkflowNodeData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!node.data) {
      errors.push('Container node missing data');
    }

    if (!node.data?.properties?.containedNodes || !Array.isArray(node.data.properties.containedNodes)) {
      errors.push('Container must have contained nodes array');
    }

    if (!node.data?.name) {
      errors.push('Container must have a name');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get container statistics
   */
  getContainerStats(node: Node<WorkflowNodeData>): {
    nodeCount: number;
    categories: string[];
    hasErrors: boolean;
  } {
    if (!this.validateContainer(node).valid) {
      return {
        nodeCount: 0,
        categories: [],
        hasErrors: true,
      };
    }

    const containedNodes = node.data?.properties?.containedNodes || [];
    const categories = node.data?.properties?.category ? [node.data.properties.category] : [];

    return {
      nodeCount: containedNodes.length,
      categories,
      hasErrors: false,
    };
  }
}

// Create singleton instance
export const ContainerFactory = new ContainerFactoryService();
export { ContainerFactoryService };
/**
 * Workflow Exporter
 *
 * Utilities for exporting workflows to different formats
 */

import type { Edge, Node } from 'reactflow';
import type { WorkflowNodeData } from '../types/workflow';

export interface WorkflowExportData {
  id: string;
  name: string;
  description?: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  variables?: Record<string, any>;
  settings?: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class WorkflowExporter {
  /**
   * Export workflow to JSON format
   */
  exportToJson(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    metadata?: Partial<WorkflowExportData>
  ): string {
    const exportData: WorkflowExportData = {
      id: metadata?.id || `workflow-${Date.now()}`,
      name: metadata?.name || 'Untitled Workflow',
      description: metadata?.description,
      nodes,
      edges,
      variables: metadata?.variables || {},
      settings: metadata?.settings || {},
      version: metadata?.version || 1,
      createdAt: metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export workflow data for backend API
   */
  exportWorkflowToBackend(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    metadata?: Partial<WorkflowExportData>
  ): WorkflowExportData {
    return {
      id: metadata?.id || `workflow-${Date.now()}`,
      name: metadata?.name || 'Untitled Workflow',
      description: metadata?.description,
      nodes: this.sanitizeNodesForBackend(nodes),
      edges: this.sanitizeEdgesForBackend(edges),
      variables: metadata?.variables || {},
      settings: metadata?.settings || {},
      version: metadata?.version || 1,
      createdAt: metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate workflow for export
   */
  validateWorkflowForExport(nodes: Node<WorkflowNodeData>[], edges: Edge[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required elements
    if (nodes.length === 0) {
      errors.push('Workflow must contain at least one node');
    }

    // Check for trigger node
    const triggerNodes = nodes.filter(
      (node) => node.data?.type === 'trigger' || node.type === 'trigger'
    );

    if (triggerNodes.length === 0) {
      warnings.push('Workflow should have at least one trigger node');
    }

    // Check for orphaned nodes (nodes without connections)
    const connectedNodeIds = new Set([
      ...edges.map((edge) => edge.source),
      ...edges.map((edge) => edge.target),
    ]);

    const orphanedNodes = nodes.filter(
      (node) => !connectedNodeIds.has(node.id) && node.data?.type !== 'trigger'
    );

    if (orphanedNodes.length > 0) {
      warnings.push(`${orphanedNodes.length} node(s) are not connected to the workflow`);
    }

    // Validate node configurations
    for (const node of nodes) {
      if (!node.data) {
        errors.push(`Node ${node.id} is missing data configuration`);
        continue;
      }

      if (!node.data.type) {
        errors.push(`Node ${node.id} is missing type information`);
      }

      if (!node.data.name) {
        warnings.push(`Node ${node.id} is missing a name`);
      }

      // Check for required properties based on node type
      if (node.data.type === 'condition' && !node.data.properties?.condition) {
        errors.push(`Condition node ${node.id} is missing condition logic`);
      }

      if (node.data.type === 'action' && !node.data.properties?.action) {
        warnings.push(`Action node ${node.id} may be missing action configuration`);
      }
    }

    // Validate edges
    for (const edge of edges) {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);

      if (!sourceNode) {
        errors.push(`Edge ${edge.id} references non-existent source node ${edge.source}`);
      }

      if (!targetNode) {
        errors.push(`Edge ${edge.id} references non-existent target node ${edge.target}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sanitize nodes for backend consumption
   */
  private sanitizeNodesForBackend(nodes: Node<WorkflowNodeData>[]): Node<WorkflowNodeData>[] {
    return nodes
      .map((node) => ({
        ...node,
        // Remove UI-specific properties that backend doesn't need
        selected: undefined,
        dragging: undefined,
        // Keep essential data
        data: node.data
          ? {
              ...node.data,
              // Remove any temporary UI state
              __ui: undefined,
            }
          : undefined,
      }))
      .filter((node) => node.data !== undefined) as Node<WorkflowNodeData>[]; // Type guard: Remove nodes without data
  }

  /**
   * Sanitize edges for backend consumption
   */
  private sanitizeEdgesForBackend(edges: Edge[]): Edge[] {
    return edges.map((edge) => ({
      ...edge,
      // Remove UI-specific properties
      selected: undefined,
      animated: undefined,
    }));
  }

  /**
   * Create a workflow template from current workflow
   */
  createTemplate(
    nodes: Node<WorkflowNodeData>[],
    edges: Edge[],
    templateMetadata: {
      name: string;
      description: string;
      category: string;
      tags?: string[];
    }
  ): object {
    return {
      ...templateMetadata,
      id: `template-${Date.now()}`,
      nodes: this.sanitizeNodesForTemplate(nodes),
      edges,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Sanitize nodes for template (remove instance-specific data)
   */
  private sanitizeNodesForTemplate(nodes: Node<WorkflowNodeData>[]): Node<WorkflowNodeData>[] {
    return nodes.map((node) => ({
      ...node,
      id: `{{node_${node.data?.type || 'unknown'}_${Math.random().toString(36).substr(2, 5)}}}`,
      data: node.data
        ? {
            ...node.data,
            id: undefined, // Will be regenerated
            // Remove instance-specific configurations
            credentials: undefined,
            // Keep structure and property templates
            properties: node.data.properties,
          }
        : undefined,
    })) as Node<WorkflowNodeData>[];
  }
}

// Export singleton instance and functions
export const workflowExporter = new WorkflowExporter();
export const exportWorkflowToBackend =
  workflowExporter.exportWorkflowToBackend.bind(workflowExporter);
export const validateWorkflowForExport =
  workflowExporter.validateWorkflowForExport.bind(workflowExporter);
export { WorkflowExporter };

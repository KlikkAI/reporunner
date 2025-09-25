// Workflow Exporter - Convert Visual Workflow to Backend-Ready JSON
import type { Edge, Node } from 'reactflow';

export interface BackendWorkflowNode {
  parameters: Record<string, any>;
  type: string;
  typeVersion: number;
  position: [number, number];
  id: string;
  name: string;
  notesInFlow?: boolean;
  credentials?: Record<string, any>;
  notes?: string;
  disabled?: boolean;
  webhookId?: string;
  alwaysOutputData?: boolean;
}

export interface BackendWorkflowEdge {
  node: string;
  type: string;
  index: number;
}

export interface BackendWorkflow {
  nodes: BackendWorkflowNode[];
  connections: Record<string, { main: BackendWorkflowEdge[][] }>;
  pinData: Record<string, any>;
  meta: {
    instanceId: string;
    templateId?: string;
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Export visual workflow to backend-ready JSON format
 * Compatible with n8n-style workflow structure for Golang backend
 */
export function exportWorkflowToBackend(
  nodes: Node[],
  edges: Edge[],
  workflowMeta?: {
    templateId?: string;
    version?: string;
  }
): BackendWorkflow {
  // Convert React Flow nodes to backend format
  const backendNodes: BackendWorkflowNode[] = nodes.map((node) => {
    const nodeData = node.data;

    return {
      parameters: convertToBackendParameters(nodeData),
      type: mapNodeTypeToBackend(node.type, nodeData),
      typeVersion: getNodeTypeVersion(node.type),
      position: [node.position.x, node.position.y],
      id: node.id,
      name: nodeData.name || node.id,
      notesInFlow: Boolean(nodeData.notes),
      credentials: nodeData.credentials ? mapCredentialsToBackend(nodeData.credentials) : undefined,
      notes: nodeData.notes || '',
      disabled: nodeData.disabled || false,
      webhookId: nodeData.webhookId,
      alwaysOutputData: nodeData.alwaysOutputData || false,
    };
  });

  // Convert React Flow edges to backend connections
  const connections: Record<string, { main: BackendWorkflowEdge[][] }> = {};

  nodes.forEach((node) => {
    const nodeEdges = edges.filter((edge) => edge.source === node.id);

    if (nodeEdges.length > 0) {
      connections[node.data.name || node.id] = {
        main: [
          nodeEdges.map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            return {
              node: targetNode?.data.name || edge.target,
              type: 'main',
              index: 0,
            };
          }),
        ],
      };
    }
  });

  return {
    nodes: backendNodes,
    connections,
    pinData: {},
    meta: {
      instanceId: generateInstanceId(),
      templateId: workflowMeta?.templateId,
      version: workflowMeta?.version || '1.0.0',
      createdAt: new Date().toISOString(),

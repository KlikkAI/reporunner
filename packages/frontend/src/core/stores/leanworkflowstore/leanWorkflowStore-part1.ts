import { create } from 'zustand';
import { workflowApiService } from '../api/WorkflowApiService';
import { nodeRegistry } from '../nodes';
import type { INodeCredentials, WorkflowDefinition, WorkflowNodeInstance } from '../nodes/types';
import type { CreateWorkflowRequest } from '../schemas/WorkflowSchemas';
import { logger } from '../services/LoggingService';

// Define edge structure matching React Flow
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  data?: any;
}

interface LeanWorkflowState {
  // Core state - LEAN data only
  currentWorkflow: WorkflowDefinition | null;
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];

  // UI state (not saved)
  selectedNodeIds: string[];
  isLoading: boolean;
  isDirty: boolean;
  shouldRefreshDashboard: boolean;

  // Actions
  setCurrentWorkflow: (workflow: WorkflowDefinition | null) => void;
  updateNodes: (
    nodes: WorkflowNodeInstance[] | ((nodes: WorkflowNodeInstance[]) => WorkflowNodeInstance[])
  ) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNodeInstance>) => void;
  updateNodeParameters: (nodeId: string, parameters: Record<string, any>) => void;
  addNode: (node: WorkflowNodeInstance) => void;
  removeNode: (nodeId: string) => void;

  updateEdges: (edges: WorkflowEdge[]) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;

  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // Dashboard refresh management
  setShouldRefreshDashboard: (should: boolean) => void;

  // Workflow operations
  createNewWorkflow: (
    name: string,
    navigate: (path: string) => void,
    description?: string
  ) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;

  // Utility methods
  getNodeById: (nodeId: string) => WorkflowNodeInstance | undefined;
  getNodeWithDefinition: (
    nodeId: string
  ) => (WorkflowNodeInstance & { typeDefinition?: any }) | undefined;
  exportWorkflow: () => WorkflowDefinition;
  importWorkflow: (workflow: WorkflowDefinition) => void;
}

export const useLeanWorkflowStore = create<LeanWorkflowState>((set, get) => ({
  // Initial state
  currentWorkflow: null,
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  isLoading: false,
  isDirty: false,
  shouldRefreshDashboard: false,

  // Workflow management
  setCurrentWorkflow: (workflow) => {
    set({
      currentWorkflow: workflow,
      nodes: workflow?.nodes || [],
      edges: [], // Edges will be converted from connections
      isDirty: false,
    });

    // Convert connections to edges if workflow exists
    if (workflow?.connections) {
      const edges = convertConnectionsToEdges(workflow.connections);
      set({ edges });
    }
  },

  // Node operations
  updateNodes: (nodesOrUpdater) => {
    set((state) => {
      const newNodes =
        typeof nodesOrUpdater === 'function' ? nodesOrUpdater(state.nodes) : nodesOrUpdater;

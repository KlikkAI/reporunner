import { Logger } from '@reporunner/core';
import type { Workflow, WorkflowEdge, WorkflowExecution, WorkflowNode } from '@reporunner/types';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface WorkflowState {
  // Workflow Management
  workflows: Record<string, Workflow>;
  activeWorkflowId: string | null;
  isLoading: boolean;
  error: string | null;

  // Execution Management
  executions: Record<string, WorkflowExecution>;
  activeExecutions: string[];
  executionHistory: WorkflowExecution[];

  // Real-time Features
  socket: Socket | null;
  isConnected: boolean;
  collaborators: Record<
    string,
    {
      id: string;
      name: string;
      cursor?: { x: number; y: number };
      selection?: string[];
      lastSeen: Date;
    }
  >;

  // UI State
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: { x: number; y: number; zoom: number };
  panels: {
    properties: boolean;
    execution: boolean;
    debug: boolean;
    ai: boolean;
  };
}

export interface WorkflowActions {
  // Workflow Actions
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: (workflow?: Partial<Workflow>) => Promise<void>;
  createWorkflow: (template?: Partial<Workflow>) => Promise<string>;
  deleteWorkflow: (id: string) => Promise<void>;
  duplicateWorkflow: (id: string) => Promise<string>;

  // Node Actions
  addNode: (node: Omit<WorkflowNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;

  // Edge Actions
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => void;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (id: string) => void;

  // Execution Actions
  executeWorkflow: (workflowId?: string, inputData?: any) => Promise<string>;
  stopExecution: (executionId: string) => Promise<void>;
  getExecutionStatus: (executionId: string) => WorkflowExecution | null;

  // Real-time Actions
  connectSocket: () => void;
  disconnectSocket: () => void;
  joinWorkflow: (workflowId: string) => void;
  leaveWorkflow: (workflowId: string) => void;
  updatePresence: (presence: { cursor?: { x: number; y: number }; selection?: string[] }) => void;

  // UI Actions
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  updateViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  togglePanel: (panel: keyof WorkflowState['panels']) => void;

  // Utility Actions
  clearError: () => void;
  reset: () => void;
}

type WorkflowStore = WorkflowState & WorkflowActions;

const logger = new Logger('WorkflowStore');

const initialState: WorkflowState = {
  workflows: {},
  activeWorkflowId: null,
  isLoading: false,
  error: null,
  executions: {},
  activeExecutions: [],
  executionHistory: [],
  socket: null,
  isConnected: false,
  collaborators: {},
  selectedNodes: [],
  selectedEdges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  panels: {
    properties: false,
    execution: false,
    debug: false,
    ai: false,
  },
};

export const useEnhancedWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Workflow Actions
    loadWorkflow: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/workflows/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load workflow');
        }

        const workflow = await response.json();
        set((state) => ({
          workflows: { ...state.workflows, [id]: workflow },
          activeWorkflowId: id,
          isLoading: false,
        }));

        // Join real-time collaboration
        const { socket } = get();
        if (socket?.connected) {
          socket.emit('join_workflow', id);
        }

        logger.info('Workflow loaded', { workflowId: id });
      } catch (error) {
        logger.error('Failed to load workflow', { error, workflowId: id });
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    saveWorkflow: async (updates?: Partial<Workflow>) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const currentWorkflow = workflows[activeWorkflowId];
        const workflowToSave = { ...currentWorkflow, ...updates };

        const response = await fetch(`/api/workflows/${activeWorkflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflowToSave),
        });

        if (!response.ok) {
          throw new Error('Failed to save workflow');
        }

        const savedWorkflow = await response.json();
        set((state) => ({
          workflows: { ...state.workflows, [activeWorkflowId]: savedWorkflow },
          isLoading: false,
        }));

        logger.info('Workflow saved', { workflowId: activeWorkflowId });
      } catch (error) {
        logger.error('Failed to save workflow', { error, workflowId: activeWorkflowId });
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    createWorkflow: async (template?: Partial<Workflow>) => {
      set({ isLoading: true, error: null });
      try {
        const newWorkflow = {
          name: 'New Workflow',
          description: '',
          nodes: [],
          edges: [],
          isActive: false,
          ...template,
        };

        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWorkflow),
        });

        if (!response.ok) {
          throw new Error('Failed to create workflow');
        }

        const createdWorkflow = await response.json();
        set((state) => ({
          workflows: { ...state.workflows, [createdWorkflow.id]: createdWorkflow },
          activeWorkflowId: createdWorkflow.id,
          isLoading: false,
        }));

        logger.info('Workflow created', { workflowId: createdWorkflow.id });
        return createdWorkflow.id;
      } catch (error) {
        logger.error('Failed to create workflow', { error });
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
        throw error;
      }
    },

    deleteWorkflow: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete workflow');
        }

        set((state) => {
          const { [id]: deleted, ...remainingWorkflows } = state.workflows;
          return {
            workflows: remainingWorkflows,
            activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
            isLoading: false,
          };
        });

        logger.info('Workflow deleted', { workflowId: id });
      } catch (error) {
        logger.error('Failed to delete workflow', { error, workflowId: id });
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      }
    },

    duplicateWorkflow: async (id: string) => {
      const { workflows } = get();
      const originalWorkflow = workflows[id];
      if (!originalWorkflow) {
        throw new Error('Workflow not found');
      }

      const duplicatedWorkflow = {
        ...originalWorkflow,
        name: `${originalWorkflow.name} (Copy)`,
        nodes: originalWorkflow.nodes.map((node) => ({
          ...node,
          id: `${node.id}_copy_${Date.now()}`,
        })),
        edges: originalWorkflow.edges.map((edge) => ({
          ...edge,
          id: `${edge.id}_copy_${Date.now()}`,
          source: `${edge.source}_copy_${Date.now()}`,
          target: `${edge.target}_copy_${Date.now()}`,
        })),
      };

      return await get().createWorkflow(duplicatedWorkflow);
    },

    // Node Actions
    addNode: (node: Omit<WorkflowNode, 'id'>) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      const newNode: WorkflowNode = {
        ...node,
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            nodes: [...state.workflows[activeWorkflowId].nodes, newNode],
          },
        },
      }));

      // Broadcast change to collaborators
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('node_added', { workflowId: activeWorkflowId, node: newNode });
      }
    },

    updateNode: (id: string, updates: Partial<WorkflowNode>) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            nodes: state.workflows[activeWorkflowId].nodes.map((node) =>
              node.id === id ? { ...node, ...updates } : node
            ),
          },
        },
      }));

      // Broadcast change to collaborators
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('node_updated', { workflowId: activeWorkflowId, nodeId: id, updates });
      }
    },

    removeNode: (id: string) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            nodes: state.workflows[activeWorkflowId].nodes.filter((node) => node.id !== id),
            edges: state.workflows[activeWorkflowId].edges.filter(
              (edge) => edge.source !== id && edge.target !== id
            ),
          },
        },
        selectedNodes: state.selectedNodes.filter((nodeId) => nodeId !== id),
      }));

      // Broadcast change to collaborators
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('node_removed', { workflowId: activeWorkflowId, nodeId: id });
      }
    },

    moveNode: (id: string, position: { x: number; y: number }) => {
      get().updateNode(id, { position });
    },

    // Edge Actions
    addEdge: (edge: Omit<WorkflowEdge, 'id'>) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      const newEdge: WorkflowEdge = {
        ...edge,
        id: `edge_${edge.source}_${edge.target}_${Date.now()}`,
      };

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            edges: [...state.workflows[activeWorkflowId].edges, newEdge],
          },
        },
      }));

      // Broadcast change to collaborators
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('edge_added', { workflowId: activeWorkflowId, edge: newEdge });
      }
    },

    updateEdge: (id: string, updates: Partial<WorkflowEdge>) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            edges: state.workflows[activeWorkflowId].edges.map((edge) =>
              edge.id === id ? { ...edge, ...updates } : edge
            ),
          },
        },
      }));
    },

    removeEdge: (id: string) => {
      const { activeWorkflowId, workflows } = get();
      if (!activeWorkflowId) {
        return;
      }

      set((state) => ({
        workflows: {
          ...state.workflows,
          [activeWorkflowId]: {
            ...state.workflows[activeWorkflowId],
            edges: state.workflows[activeWorkflowId].edges.filter((edge) => edge.id !== id),
          },
        },
        selectedEdges: state.selectedEdges.filter((edgeId) => edgeId !== id),
      }));
    },

    // Execution Actions
    executeWorkflow: async (workflowId?: string, inputData?: any) => {
      const { activeWorkflowId, workflows } = get();
      const targetWorkflowId = workflowId || activeWorkflowId;
      if (!targetWorkflowId) {
        throw new Error('No workflow selected');
      }

      set({ isLoading: true, error: null });
      try {
        const response = await fetch('/api/executions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: targetWorkflowId,
            inputData: inputData || {},
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start execution');
        }

        const execution = await response.json();
        set((state) => ({
          executions: { ...state.executions, [execution.id]: execution },
          activeExecutions: [...state.activeExecutions, execution.id],
          isLoading: false,
        }));

        logger.info('Workflow execution started', {
          workflowId: targetWorkflowId,
          executionId: execution.id,
        });

        return execution.id;
      } catch (error) {
        logger.error('Failed to execute workflow', { error, workflowId: targetWorkflowId });
        set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
        throw error;
      }
    },

    stopExecution: async (executionId: string) => {
      try {
        const response = await fetch(`/api/executions/${executionId}/stop`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to stop execution');
        }

        set((state) => ({
          activeExecutions: state.activeExecutions.filter((id) => id !== executionId),
        }));

        logger.info('Execution stopped', { executionId });
      } catch (error) {
        logger.error('Failed to stop execution', { error, executionId });
        throw error;
      }
    },

    getExecutionStatus: (executionId: string) => {
      return get().executions[executionId] || null;
    },

    // Real-time Actions
    connectSocket: () => {
      const socket = io('/workflow', {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        set({ socket, isConnected: true });
        logger.info('Socket connected');
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
        logger.info('Socket disconnected');
      });

      // Handle real-time workflow updates
      socket.on('node_added', ({ workflowId, node }) => {
        const { activeWorkflowId } = get();
        if (workflowId === activeWorkflowId) {
          set((state) => ({
            workflows: {
              ...state.workflows,
              [workflowId]: {
                ...state.workflows[workflowId],
                nodes: [...state.workflows[workflowId].nodes, node],
              },
            },
          }));
        }
      });

      socket.on('node_updated', ({ workflowId, nodeId, updates }) => {
        const { activeWorkflowId } = get();
        if (workflowId === activeWorkflowId) {
          get().updateNode(nodeId, updates);
        }
      });

      socket.on('collaborator_joined', (collaborator) => {
        set((state) => ({
          collaborators: {
            ...state.collaborators,
            [collaborator.id]: collaborator,
          },
        }));
      });

      socket.on('collaborator_left', (collaboratorId) => {
        set((state) => {
          const { [collaboratorId]: removed, ...remaining } = state.collaborators;
          return { collaborators: remaining };
        });
      });

      socket.on('presence_updated', ({ collaboratorId, presence }) => {
        set((state) => ({
          collaborators: {
            ...state.collaborators,
            [collaboratorId]: {
              ...state.collaborators[collaboratorId],
              ...presence,
              lastSeen: new Date(),
            },
          },
        }));
      });

      set({ socket });
    },

    disconnectSocket: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null, isConnected: false, collaborators: {} });
      }
    },

    joinWorkflow: (workflowId: string) => {
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('join_workflow', workflowId);
      }
    },

    leaveWorkflow: (workflowId: string) => {
      const { socket } = get();
      if (socket?.connected) {
        socket.emit('leave_workflow', workflowId);
      }
    },

    updatePresence: (presence) => {
      const { socket, activeWorkflowId } = get();
      if (socket?.connected && activeWorkflowId) {
        socket.emit('update_presence', {
          workflowId: activeWorkflowId,
          presence,
        });
      }
    },

    // UI Actions
    setSelectedNodes: (nodeIds: string[]) => {
      set({ selectedNodes: nodeIds });
      get().updatePresence({ selection: nodeIds });
    },

    setSelectedEdges: (edgeIds: string[]) => {
      set({ selectedEdges: edgeIds });
    },

    updateViewport: (viewport) => {
      set({ viewport });
    },

    togglePanel: (panel) => {
      set((state) => ({
        panels: {
          ...state.panels,
          [panel]: !state.panels[panel],
        },
      }));
    },

    // Utility Actions
    clearError: () => set({ error: null }),

    reset: () => set(initialState),
  }))
);

// Auto-connect socket when store is created
useEnhancedWorkflowStore.getState().connectSocket();

export default useEnhancedWorkflowStore;

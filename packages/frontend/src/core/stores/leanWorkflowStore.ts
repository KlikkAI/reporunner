import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkflowApiService } from '@/core/api/WorkflowApiService';
import type { WorkflowDefinition, WorkflowExecution } from '@/core/schemas';

const workflowApiService = new WorkflowApiService();

interface LeanWorkflowState {
  workflows: WorkflowDefinition[];
  executions: WorkflowExecution[];
  activeWorkflow: WorkflowDefinition | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  fetchExecutions: () => Promise<void>;
  createWorkflow: (
    workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  setActiveWorkflow: (workflow: WorkflowDefinition | null) => void;
  executeWorkflow: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useLeanWorkflowStore = create<LeanWorkflowState>()(
  persist(
    (set, get) => ({
      workflows: [],
      executions: [],
      activeWorkflow: null,
      isLoading: false,
      error: null,

      fetchWorkflows: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await workflowApiService.getWorkflows();
          set({ workflows: response.data, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
          set({ error: message, isLoading: false });
        }
      },

      fetchExecutions: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await workflowApiService.getExecutions();
          set({ executions: response.data, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch executions';
          set({ error: message, isLoading: false });
        }
      },

      createWorkflow: async (workflow) => {
        try {
          set({ isLoading: true, error: null });
          const response = await workflowApiService.createWorkflow(workflow);
          const { workflows } = get();
          set({
            workflows: [...workflows, response.data],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create workflow';
          set({ error: message, isLoading: false });
        }
      },

      updateWorkflow: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          const response = await workflowApiService.updateWorkflow(id, updates);
          const { workflows } = get();
          set({
            workflows: workflows.map((workflow) => (workflow.id === id ? response.data : workflow)),
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update workflow';
          set({ error: message, isLoading: false });
        }
      },

      deleteWorkflow: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await workflowApiService.deleteWorkflow(id);
          const { workflows } = get();
          set({
            workflows: workflows.filter((workflow) => workflow.id !== id),
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete workflow';
          set({ error: message, isLoading: false });
        }
      },

      setActiveWorkflow: (workflow) => {
        set({ activeWorkflow: workflow });
      },

      executeWorkflow: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await workflowApiService.executeWorkflow(id);
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to execute workflow';
          set({ error: message, isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'lean-workflow-store',
      partialize: (state) => ({
        workflows: state.workflows,
        activeWorkflow: state.activeWorkflow,
      }),
    }
  )
);

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
  createNewWorkflow: (name: string, navigate?: any) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  setActiveWorkflow: (workflow: WorkflowDefinition | null) => void;
  executeWorkflow: (id: string) => Promise<void>;
  importWorkflow: (workflowData: any) => Promise<void>;
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
          set({ workflows: response.items, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
          set({ error: message, isLoading: false });
        }
      },

      fetchExecutions: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await workflowApiService.getExecutions();
          set({ executions: response.items, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch executions';
          set({ error: message, isLoading: false });
        }
      },

      createWorkflow: async (workflow) => {
        try {
          set({ isLoading: true, error: null });
          const createdWorkflow = await workflowApiService.createWorkflow(workflow);
          const { workflows } = get();
          set({
            workflows: [...workflows, createdWorkflow],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create workflow';
          set({ error: message, isLoading: false });
        }
      },

      createNewWorkflow: async (name, navigate) => {
        const newWorkflow = {
          name,
          description: '',
          nodes: [],
          edges: [],
          active: false,
          isActive: false,
          tags: [],
          version: 1,
        };

        try {
          set({ isLoading: true, error: null });
          const createdWorkflow = await workflowApiService.createWorkflow(newWorkflow);
          const { workflows } = get();
          set({
            workflows: [...workflows, createdWorkflow],
            activeWorkflow: createdWorkflow,
            isLoading: false,
          });

          // Navigate to the workflow editor if navigate function is provided
          if (navigate && createdWorkflow.id) {
            navigate(`/workflows/${createdWorkflow.id}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create workflow';
          set({ error: message, isLoading: false });
          throw error; // Re-throw so components can handle it
        }
      },

      updateWorkflow: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          const updatedWorkflow = await workflowApiService.updateWorkflow(id, updates);
          const { workflows } = get();
          set({
            workflows: workflows.map((workflow) => (workflow.id === id ? updatedWorkflow : workflow)),
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
          await workflowApiService.executeWorkflow({ workflowId: id, triggerData: {} });
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to execute workflow';
          set({ error: message, isLoading: false });
        }
      },

      importWorkflow: async (workflowData) => {
        try {
          set({ isLoading: true, error: null });
          const importedWorkflow = await workflowApiService.createWorkflow(workflowData);
          const { workflows } = get();
          set({
            workflows: [...workflows, importedWorkflow],
            activeWorkflow: importedWorkflow,
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to import workflow';
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

import { create } from 'zustand'
import type { WorkflowNodeInstance, WorkflowDefinition } from '../nodes/types'
import type { INodeParameters, INodeCredentials } from '../nodes/types'
import { nodeRegistry } from '../nodes'
import { logger } from '../services/LoggingService'
import { apiClient } from '../api/ApiClient'
import { workflowApiService } from '../api/WorkflowApiService'
import type { CreateWorkflowRequest } from '../schemas/WorkflowSchemas'

// Define edge structure matching React Flow
interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  data?: any
}

interface LeanWorkflowState {
  // Core state - LEAN data only
  currentWorkflow: WorkflowDefinition | null
  nodes: WorkflowNodeInstance[]
  edges: WorkflowEdge[]

  // UI state (not saved)
  selectedNodeIds: string[]
  isLoading: boolean
  isDirty: boolean
  shouldRefreshDashboard: boolean

  // Actions
  setCurrentWorkflow: (workflow: WorkflowDefinition | null) => void
  updateNodes: (
    nodes:
      | WorkflowNodeInstance[]
      | ((nodes: WorkflowNodeInstance[]) => WorkflowNodeInstance[])
  ) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNodeInstance>) => void
  updateNodeParameters: (
    nodeId: string,
    parameters: Record<string, any>
  ) => void
  addNode: (node: WorkflowNodeInstance) => void
  removeNode: (nodeId: string) => void

  updateEdges: (edges: WorkflowEdge[]) => void
  addEdge: (edge: WorkflowEdge) => void
  removeEdge: (edgeId: string) => void

  setSelectedNodes: (nodeIds: string[]) => void
  clearSelection: () => void
  
  // Dashboard refresh management
  setShouldRefreshDashboard: (should: boolean) => void

  // Workflow operations
  createNewWorkflow: (
    name: string,
    navigate: (path: string) => void,
    description?: string
  ) => Promise<void>
  saveWorkflow: () => Promise<void>
  loadWorkflow: (workflowId: string) => Promise<void>
  deleteWorkflow: (workflowId: string) => Promise<void>

  // Utility methods
  getNodeById: (nodeId: string) => WorkflowNodeInstance | undefined
  getNodeWithDefinition: (
    nodeId: string
  ) => (WorkflowNodeInstance & { typeDefinition?: any }) | undefined
  exportWorkflow: () => WorkflowDefinition
  importWorkflow: (workflow: WorkflowDefinition) => void
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
  setCurrentWorkflow: workflow => {
    set({
      currentWorkflow: workflow,
      nodes: workflow?.nodes || [],
      edges: [], // Edges will be converted from connections
      isDirty: false,
    })

    // Convert connections to edges if workflow exists
    if (workflow?.connections) {
      const edges = convertConnectionsToEdges(workflow.connections)
      set({ edges })
    }
  },

  // Node operations
  updateNodes: nodesOrUpdater => {
    set(state => {
      const newNodes =
        typeof nodesOrUpdater === 'function'
          ? nodesOrUpdater(state.nodes)
          : nodesOrUpdater

      return {
        nodes: newNodes,
        isDirty: true,
      }
    })
  },

  updateNode: (nodeId, updates) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      isDirty: true,
    }))
  },

  updateNodeParameters: (nodeId, parameters) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? { ...node, parameters: { ...node.parameters, ...parameters } }
          : node
      ),
      isDirty: true,
    }))
  },

  addNode: node => {
    set(state => ({
      nodes: [...state.nodes, node],
      isDirty: true,
    }))
  },

  removeNode: nodeId => {
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== nodeId),
      edges: state.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeIds: state.selectedNodeIds.filter(id => id !== nodeId),
      isDirty: true,
    }))
  },

  // Edge operations
  updateEdges: edges => {
    set({ edges, isDirty: true })
  },

  addEdge: edge => {
    set(state => ({
      edges: [...state.edges, edge],
      isDirty: true,
    }))
  },

  removeEdge: edgeId => {
    set(state => ({
      edges: state.edges.filter(e => e.id !== edgeId),
      isDirty: true,
    }))
  },

  // Selection
  setSelectedNodes: nodeIds => {
    set({ selectedNodeIds: nodeIds })
  },

  clearSelection: () => {
    set({ selectedNodeIds: [] })
  },

  // Dashboard refresh management
  setShouldRefreshDashboard: (should: boolean) => {
    set({ shouldRefreshDashboard: should })
  },

  // Workflow operations
  createNewWorkflow: async (
    name: string,
    navigate: (path: string) => void,
    description?: string
  ) => {
    const newWorkflow: WorkflowDefinition = {
      id: 'temp_' + Date.now(),
      name,
      description: description || '',
      active: false,
      // status: 'inactive', // Not part of WorkflowDefinition schema
      nodes: [],
      connections: {},
      settings: {
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        executionTimeout: 300,
      },
      tags: [],
      // Remove version - let backend handle it
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRun: null,
    }

    set({
      currentWorkflow: newWorkflow,
      nodes: [],
      edges: [],
      isDirty: false,
    })

    try {
      await get().saveWorkflow()
      const savedWorkflow = get().currentWorkflow
      // Set flag to refresh Dashboard when user returns
      get().setShouldRefreshDashboard(true)
      if (savedWorkflow && savedWorkflow.id) {
        navigate(`/workflow/${savedWorkflow.id}`)
      }
    } catch (error) {
      logger.error('Failed to save new workflow', {
        error: error instanceof Error ? error.message : String(error),
      })
      // Revert state and provide better error message
      set({
        currentWorkflow: null,
        nodes: [],
        edges: [],
        isDirty: false,
      })
      
      // Create more descriptive error message
      let errorMessage = 'Failed to create workflow'
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error - please check your connection and try again'
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid workflow data - please check your input'
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error - please try again later'
        } else {
          errorMessage = error.message
        }
      }
      
      throw new Error(errorMessage)
    }
  },

  saveWorkflow: async () => {
    const { currentWorkflow, nodes, edges } = get()
    if (!currentWorkflow) {
      throw new Error('No workflow to save')
    }

    set({ isLoading: true })

    try {
      // Convert edges to connections format
      const connections = convertEdgesToConnections(edges)

      // Check if this is a new workflow or update
      const isNewWorkflow = !currentWorkflow.id || currentWorkflow.id.startsWith('temp_')
      
      let savedWorkflow: any

      if (isNewWorkflow) {
        // Create new workflow - use CreateWorkflowRequest schema
        const createWorkflowPayload: CreateWorkflowRequest = {
          name: currentWorkflow.name,
          description: currentWorkflow.description || '',
          // Remove version field - let backend set default or use number if required
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              label: node.name,
              parameters: node.parameters || {},
              credentials: node.credentials?.[0]?.id || undefined,
              disabled: node.disabled,
              notes: node.notes,
            },
          })),
          edges: edges,
          settings: currentWorkflow.settings,
          tags: currentWorkflow.tags || [],
          isActive: currentWorkflow.active || false,
        }

        logger.info('Creating new workflow with payload:', createWorkflowPayload)
        savedWorkflow = await workflowApiService.createWorkflow(createWorkflowPayload)
        logger.info('Workflow created successfully:', savedWorkflow)
      } else {
        // Update existing workflow
        const updatePayload = {
          name: currentWorkflow.name,
          description: currentWorkflow.description || '',
          // Remove version field for updates too
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              label: node.name,
              parameters: node.parameters || {},
              credentials: node.credentials,
              disabled: node.disabled,
              notes: node.notes,
            },
          })),
          edges: edges,
          settings: currentWorkflow.settings,
          tags: currentWorkflow.tags || [],
          isActive: currentWorkflow.active || false,
        }

        savedWorkflow = await workflowApiService.updateWorkflow(currentWorkflow.id, updatePayload)
      }

      // Map the saved workflow to our internal format
      // Note: savedWorkflow is already transformed by workflowApiService
      const finalWorkflow: WorkflowDefinition = {
        ...savedWorkflow,
        // Override with current editor state
        nodes: nodes,
        connections,
        edges: edges,
        // Ensure required fields exist
        version: savedWorkflow.version || '1.0.0',
        settings: savedWorkflow.settings || currentWorkflow.settings,
        tags: savedWorkflow.tags || [],
        createdAt: savedWorkflow.createdAt || new Date().toISOString(),
        updatedAt: savedWorkflow.updatedAt || new Date().toISOString(),
        lastRun: savedWorkflow.lastRun || null,
      }

      set({
        currentWorkflow: finalWorkflow,
        isDirty: false,
      })

      logger.info('Workflow saved successfully', {
        id: savedWorkflow.id,
        name: savedWorkflow.name,
        nodeCount: nodes.length,
      })
    } catch (error: unknown) {
      logger.error('Failed to save workflow', {
        error: error instanceof Error ? error.message : String(error),
        response: (error as any)?.response?.data,
      })
      
      // Enhanced error logging for debugging
      if ((error as any)?.response?.data) {
        logger.error('Backend Error Response:', (error as any).response.data)
      }
      
      const errorMessage =
        (error as any)?.response?.data?.message || 
        (error instanceof Error ? error.message : 'Failed to save workflow')
      throw new Error(errorMessage)
    } finally {
      set({ isLoading: false })
    }
  },

  loadWorkflow: async (workflowId: string) => {
    set({ isLoading: true })

    try {
      // Use workflowApiService for consistent response transformation
      const workflowData = await workflowApiService.getWorkflow(workflowId)

      // Convert backend data to lean format
      const leanNodes: WorkflowNodeInstance[] = (workflowData.nodes || []).map(
        (node: any) => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          parameters: node.parameters || node.data?.parameters || {},
          credentials: node.credentials || node.data?.credentials,
          disabled: node.disabled,
          notes: node.notes,
          name: node.name,
          continueOnFail: node.continueOnFail,
          executeOnce: node.executeOnce,
        })
      )

      const workflow: WorkflowDefinition = {
        ...workflowData,
        nodes: leanNodes,
        // Ensure connections exist
        connections: workflowData.connections || {},
      }

      // Convert connections to edges
      const edges = convertConnectionsToEdges(workflow.connections)

      set({
        currentWorkflow: workflow,
        nodes: leanNodes,
        edges,
        isDirty: false,
      })
    } catch (error: unknown) {
      logger.error('Failed to load workflow', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      })
      const errorMessage =
        (error as any)?.response?.data?.message || 'Failed to load workflow'
      throw new Error(errorMessage)
    } finally {
      set({ isLoading: false })
    }
  },

  deleteWorkflow: async (workflowId: string) => {
    try {
      await apiClient.raw({
        method: 'DELETE',
        url: `/workflows/${workflowId}`,
      })

      set(state => {
        if (state.currentWorkflow?.id === workflowId) {
          return {
            currentWorkflow: null,
            nodes: [],
            edges: [],
            isDirty: false,
          }
        }
        return state
      })
    } catch (error: unknown) {
      logger.error('Failed to delete workflow', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      })
      const errorMessage =
        (error as any)?.response?.data?.message || 'Failed to delete workflow'
      throw new Error(errorMessage)
    }
  },

  // Utility methods
  getNodeById: nodeId => {
    return get().nodes.find(node => node.id === nodeId)
  },

  getNodeWithDefinition: nodeId => {
    const node = get().nodes.find(n => n.id === nodeId)
    if (!node) return undefined

    const typeDefinition = nodeRegistry.getNodeTypeDescription(node.type)
    return { ...node, typeDefinition }
  },

  exportWorkflow: () => {
    const { currentWorkflow, nodes, edges } = get()
    const connections = convertEdgesToConnections(edges)

    return {
      ...currentWorkflow,
      nodes,
      connections,
    } as WorkflowDefinition
  },

  importWorkflow: workflow => {
    const edges = convertConnectionsToEdges(workflow.connections || {})

    set({
      currentWorkflow: workflow,
      nodes: workflow.nodes,
      edges,
      isDirty: false,
    })
  },
}))

// Helper function to convert n8n connections format to React Flow edges
function convertConnectionsToEdges(
  connections: WorkflowDefinition['connections']
): WorkflowEdge[] {
  const edges: WorkflowEdge[] = []

  Object.entries(connections).forEach(([sourceNodeId, outputs]) => {
    Object.entries(outputs).forEach(([outputIndex, targets]) => {
      targets.forEach((target, idx) => {
        edges.push({
          id: `${sourceNodeId}-${outputIndex}-${target.node}-${target.index}`,
          source: sourceNodeId,
          target: target.node,
          sourceHandle: `output_${outputIndex}`,
          targetHandle: `input_${target.index}`,
          type: target.type || 'default',
        })
      })
    })
  })

  return edges
}

// Helper function to convert React Flow edges to n8n connections format
function convertEdgesToConnections(
  edges: WorkflowEdge[]
): WorkflowDefinition['connections'] {
  const connections: WorkflowDefinition['connections'] = {}

  edges.forEach(edge => {
    const outputIndex = edge.sourceHandle?.replace('output_', '') || 'main'
    const inputIndex = edge.targetHandle?.replace('input_', '') || '0'

    if (!connections[edge.source]) {
      connections[edge.source] = {}
    }

    if (!connections[edge.source]![outputIndex]) {
      connections[edge.source]![outputIndex] = []
    }

    connections[edge.source]![outputIndex]!.push({
      node: edge.target,
      type: edge.type || 'main',
      index: parseInt(inputIndex, 10) || 0,
    })
  })

  return connections
}

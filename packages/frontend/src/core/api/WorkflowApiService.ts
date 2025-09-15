import { apiClient, ApiClientError } from './ApiClient'
import {
  WorkflowResponseSchema,
  WorkflowListResponseSchema,
  ExecutionResponseSchema,
  ExecutionListResponseSchema,
  ExecutionStatsResponseSchema,
  ApiResponseSchema,
} from '../schemas'
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionStats,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowFilter,
  ExecutionFilter,
  PaginationParams,
  PaginatedResponse,
} from '../schemas'
import { z } from 'zod'

/**
 * Type-safe Workflow API Service
 *
 * All methods are fully type-safe with runtime validation
 * Handles all workflow and execution operations
 */
export class WorkflowApiService {
  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  // ==========================================
  // WORKFLOW MANAGEMENT OPERATIONS
  // ==========================================

  /**
   * Get all workflows with optional filtering and pagination
   */
  async getWorkflows(
    filter?: WorkflowFilter & PaginationParams
  ): Promise<PaginatedResponse<Workflow>> {
    try {
      // Use raw API call since backend response structure differs from expected pagination format
      const response = await apiClient.raw({
        method: 'GET',
        url: '/workflows',
        params: filter
      })

      // Backend returns: data.workflows[] and data.pagination
      // Frontend expects: items[] and pagination fields
      const workflows = response.data.data?.workflows || []
      const pagination = response.data.data?.pagination || { total: 0, page: 1, limit: 20, pages: 1 }

      // Workflows are already in the correct format
      const transformedWorkflows = workflows

      // Return in expected PaginatedResponse format
      return {
        items: transformedWorkflows,
        total: pagination.total,
        limit: pagination.limit,
        offset: ((pagination.page - 1) * pagination.limit),
        hasMore: pagination.page < pagination.pages,
      }
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch workflows',
        0,
        'WORKFLOW_FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow> {
    try {
      const response = await apiClient.get(
        `/workflows/${workflowId}`,
        WorkflowResponseSchema
      )
      
      return response.workflow
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch workflow ${workflowId}`,
        0,
        'WORKFLOW_FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: CreateWorkflowRequest): Promise<Workflow> {
    try {
      // WorkflowResponseSchema now handles nested structure extraction
      const response = await apiClient.post(
        '/workflows',
        workflow,
        WorkflowResponseSchema
      )
      
      // Response is already in the correct format
      return response.workflow
    } catch (error) {
      throw new ApiClientError(
        'Failed to create workflow',
        0,
        'WORKFLOW_CREATE_ERROR',
        error
      )
    }
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Omit<UpdateWorkflowRequest, 'id'>
  ): Promise<Workflow> {
    try {
      // WorkflowResponseSchema now handles nested structure extraction
      const response = await apiClient.put(
        `/workflows/${workflowId}`,
        updates,
        WorkflowResponseSchema
      )
      
      // Response is already in the correct format
      return response.workflow
    } catch (error) {
      throw new ApiClientError(
        `Failed to update workflow ${workflowId}`,
        0,
        'WORKFLOW_UPDATE_ERROR',
        error
      )
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete(
        `/workflows/${workflowId}`,
        ApiResponseSchema(z.object({ message: z.string() }))
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to delete workflow ${workflowId}`,
        0,
        'WORKFLOW_DELETE_ERROR',
        error
      )
    }
  }

  /**
   * Toggle workflow active status
   */
  async toggleWorkflow(
    workflowId: string,
    isActive: boolean
  ): Promise<Workflow> {
    try {
      return await apiClient.patch(
        `/workflows/${workflowId}`,
        { isActive },
        WorkflowResponseSchema
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to toggle workflow ${workflowId}`,
        0,
        'WORKFLOW_TOGGLE_ERROR',
        error
      )
    }
  }

  /**
   * Duplicate a workflow
   */
  async duplicateWorkflow(
    workflowId: string,
    newName?: string
  ): Promise<Workflow> {
    try {
      return await apiClient.post(
        `/workflows/${workflowId}/duplicate`,
        { name: newName },
        WorkflowResponseSchema
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to duplicate workflow ${workflowId}`,
        0,
        'WORKFLOW_DUPLICATE_ERROR',
        error
      )
    }
  }

  // ==========================================
  // WORKFLOW EXECUTION OPERATIONS
  // ==========================================

  /**
   * Execute a workflow (either by ID or direct definition)
   */
  async executeWorkflow(
    request: ExecuteWorkflowRequest
  ): Promise<WorkflowExecution> {
    try {
      if (request.workflowId) {
        // Execute saved workflow
        return await apiClient.post(
          `/workflows/${request.workflowId}/execute`,
          {
            triggerData: request.triggerData,
            options: request.options,
          },
          ExecutionResponseSchema
        )
      } else if (request.workflow) {
        // Execute workflow definition directly
        return await apiClient.post(
          '/workflows/execute',
          {
            workflow: request.workflow,
            triggerData: request.triggerData,
            options: request.options,
          },
          ExecutionResponseSchema
        )
      } else {
        throw new ApiClientError(
          'Either workflowId or workflow definition must be provided',
          400,
          'INVALID_REQUEST'
        )
      }
    } catch (error) {
      throw new ApiClientError(
        'Failed to execute workflow',
        0,
        'WORKFLOW_EXECUTION_ERROR',
        error
      )
    }
  }

  /**
   * Test a workflow (dry run without actual execution)
   */
  async testWorkflow(workflow: WorkflowDefinition): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    estimatedDuration?: number | undefined
  }> {
    try {
      return await apiClient.post(
        '/workflows/test',
        { workflow, options: { dryRun: true } },
        ApiResponseSchema(
          z.object({
            isValid: z.boolean(),
            errors: z.array(z.string()),
            warnings: z.array(z.string()),
            estimatedDuration: z.number().optional(),
          })
        )
      )
    } catch (error) {
      throw new ApiClientError(
        'Failed to test workflow',
        0,
        'WORKFLOW_TEST_ERROR',
        error
      )
    }
  }

  /**
   * Stop a running workflow execution
   */
  async stopExecution(executionId: string): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        `/workflows/executions/${executionId}/stop`,
        {},
        ApiResponseSchema(z.object({ message: z.string() }))
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to stop execution ${executionId}`,
        0,
        'EXECUTION_STOP_ERROR',
        error
      )
    }
  }

  /**
   * Get execution details
   */
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      return await apiClient.get(
        `/workflows/executions/${executionId}`,
        ExecutionResponseSchema
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch execution ${executionId}`,
        0,
        'EXECUTION_FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Get executions with filtering and pagination
   */
  async getExecutions(
    filter?: ExecutionFilter & PaginationParams
  ): Promise<PaginatedResponse<WorkflowExecution>> {
    try {
      return await apiClient.getPaginated(
        '/workflows/executions',
        ExecutionListResponseSchema,
        filter
      )
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch executions',
        0,
        'EXECUTIONS_FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(workflowId?: string): Promise<ExecutionStats> {
    try {
      return await apiClient.get(
        '/workflows/executions/stats',
        ExecutionStatsResponseSchema,
        { params: workflowId ? { workflowId } : undefined }
      )
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch execution statistics',
        0,
        'EXECUTION_STATS_ERROR',
        error
      )
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(
    executionId: string,
    nodeId?: string
  ): Promise<
    Array<{
      timestamp: string
      level: 'info' | 'warn' | 'error' | 'debug'
      message: string
      nodeId?: string | undefined
      nodeName?: string | undefined
      data?: unknown
    }>
  > {
    try {
      return await apiClient.get(
        `/workflows/executions/${executionId}/logs`,
        ApiResponseSchema(
          z.array(
            z.object({
              timestamp: z.string(),
              level: z.enum(['info', 'warn', 'error', 'debug']),
              message: z.string(),
              nodeId: z.string().optional(),
              nodeName: z.string().optional(),
              data: z.unknown().optional(),
            })
          )
        ),
        { params: nodeId ? { nodeId } : undefined }
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch execution logs for ${executionId}`,
        0,
        'EXECUTION_LOGS_ERROR',
        error
      )
    }
  }

  // ==========================================
  // WORKFLOW TEMPLATES AND UTILITIES
  // ==========================================

  /**
   * Get available workflow templates
   */
  async getTemplates(): Promise<
    Array<{
      id: string
      name: string
      description: string
      category: string
      tags: string[]
      definition: WorkflowDefinition
    }>
  > {
    try {
      return await apiClient.get(
        '/workflows/templates',
        ApiResponseSchema(
          z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              category: z.string(),
              tags: z.array(z.string()),
              definition: z.any(), // WorkflowDefinitionSchema would cause circular ref
            })
          )
        )
      )
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch workflow templates',
        0,
        'TEMPLATES_FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Export workflow as JSON
   */
  async exportWorkflow(
    workflowId: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<{
    data: string
    filename: string
    contentType: string
  }> {
    try {
      return await apiClient.get(
        `/workflows/${workflowId}/export`,
        ApiResponseSchema(
          z.object({
            data: z.string(),
            filename: z.string(),
            contentType: z.string(),
          })
        ),
        { params: { format } }
      )
    } catch (error) {
      throw new ApiClientError(
        `Failed to export workflow ${workflowId}`,
        0,
        'WORKFLOW_EXPORT_ERROR',
        error
      )
    }
  }

  /**
   * Import workflow from JSON/YAML
   */
  async importWorkflow(
    data: string,
    format: 'json' | 'yaml' = 'json'
  ): Promise<Workflow> {
    try {
      return await apiClient.post(
        '/workflows/import',
        { data, format },
        WorkflowResponseSchema
      )
    } catch (error) {
      throw new ApiClientError(
        'Failed to import workflow',
        0,
        'WORKFLOW_IMPORT_ERROR',
        error
      )
    }
  }
}

// Export singleton instance
export const workflowApiService = new WorkflowApiService()

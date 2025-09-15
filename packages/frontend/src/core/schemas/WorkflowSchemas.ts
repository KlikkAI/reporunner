import { z } from 'zod'
import {
  IdSchema,
  OptionalIdSchema,
  TimestampSchema,
  StatusSchema,
  ExecutionStatusSchema,
  NodeParametersSchema,
  MetadataSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
} from './BaseSchemas'

// Node schemas
export const WorkflowNodeSchema = z.object({
  id: IdSchema,
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().optional(),
    parameters: NodeParametersSchema.optional(),
    credentials: z.string().optional(), // credential ID
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    // Enhanced node data
    integrationData: z
      .object({
        id: z.string(),
        version: z.string().optional(),
        displayName: z.string().optional(),
      })
      .optional(),
    enhancedNodeType: z.string().optional(),
  }),
  metadata: MetadataSchema.optional(),
})

// Edge/Connection schemas
export const WorkflowEdgeSchema = z.object({
  id: IdSchema,
  source: IdSchema,
  target: IdSchema,
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  label: z.string().optional(),
})

// Core workflow definition
export const WorkflowDefinitionSchema = z.object({
  id: OptionalIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  version: z.union([z.string(), z.number()]).default('1.0.0'),
  nodes: z.array(WorkflowNodeSchema).default([]), // Make optional with default
  edges: z.array(WorkflowEdgeSchema).default([]), // Make optional with default
  settings: z
    .object({
      timeout: z.number().int().min(1000).max(3600000).default(300000), // 5 minutes default
      retryPolicy: z
        .object({
          maxRetries: z.number().int().min(0).max(5).default(3),
          retryDelay: z.number().int().min(1000).max(60000).default(5000),
        })
        .optional(),
      errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop'),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
  createdBy: z.string().optional(),
})

// Workflow with metadata (from API)
export const WorkflowSchema = WorkflowDefinitionSchema.and(
  z.object({
    id: IdSchema, // Required for saved workflows
    _id: IdSchema.optional(), // MongoDB ObjectId
    userId: IdSchema.optional(), // Owner of the workflow
    isPublic: z.boolean().optional(), // Whether workflow is public
    status: StatusSchema.optional(), // Made optional, computed from isActive
    successRate: z.number().min(0).max(100).optional(), // Success rate percentage
    lastExecution: z
      .object({
        id: IdSchema,
        status: ExecutionStatusSchema,
        startTime: TimestampSchema,
        endTime: TimestampSchema.optional(),
        duration: z.number().int().min(0).optional(),
      })
      .optional(),
    executionStats: z
      .object({
        totalExecutions: z.number().int().min(0),
        successfulExecutions: z.number().int().min(0),
        failedExecutions: z.number().int().min(0),
        avgDuration: z.number().min(0).optional(),
        successRate: z.number().min(0).max(100).optional(),
      })
      .optional(),
    statistics: z
      .object({
        totalExecutions: z.number().int().min(0),
        successfulExecutions: z.number().int().min(0),
        failedExecutions: z.number().int().min(0),
        avgDuration: z.number().min(0).optional(),
        successRate: z.number().min(0).max(100).optional(),
      })
      .optional(), // Backend returns "statistics" instead of "executionStats"
    version: z.union([z.string(), z.number()]).optional(), // Handle both string and number versions
    __v: z.number().optional(), // MongoDB version field
  })
)

// Node execution details
export const NodeExecutionSchema = z.object({
  nodeId: IdSchema,
  nodeName: z.string(),
  status: ExecutionStatusSchema,
  startTime: TimestampSchema,
  endTime: TimestampSchema.optional(),
  duration: z.number().int().min(0).optional(),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  logs: z
    .array(
      z.object({
        timestamp: TimestampSchema,
        level: z.enum(['debug', 'info', 'warn', 'error']),
        message: z.string(),
        data: z.record(z.unknown()).optional(),
      })
    )
    .default([]),
})

// Workflow execution
export const WorkflowExecutionSchema = z.object({
  id: IdSchema,
  workflowId: IdSchema,
  workflowName: z.string(),
  status: ExecutionStatusSchema,
  startTime: TimestampSchema,
  endTime: TimestampSchema.optional(),
  duration: z.number().int().min(0).optional(),
  triggerType: z.enum(['manual', 'webhook', 'schedule', 'event']),
  triggerData: z.record(z.unknown()).optional(),
  nodeExecutions: z.array(NodeExecutionSchema).default([]),
  results: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  logs: z
    .array(
      z.object({
        timestamp: TimestampSchema,
        level: z.enum(['debug', 'info', 'warn', 'error']),
        message: z.string(),
        nodeId: z.string().optional(),
        data: z.record(z.unknown()).optional(),
      })
    )
    .default([]),
})

// Execution statistics - resilient to backend implementation gaps
export const ExecutionStatsSchema = z.object({
  total: z.number().int().min(0).default(0),
  running: z.number().int().min(0).default(0),
  completed: z.number().int().min(0).optional(),
  success: z.number().int().min(0).optional(), 
  failed: z.number().int().min(0).optional(),
  error: z.number().int().min(0).optional(),
  cancelled: z.number().int().min(0).default(0),
  avgDuration: z.number().min(0).default(0),
  successRate: z.number().min(0).max(100).default(0),
  totalExecutions: z.number().int().min(0).default(0),
  successfulExecutions: z.number().int().min(0).default(0),
  failedExecutions: z.number().int().min(0).default(0),
  recentExecutions: z.array(WorkflowExecutionSchema).optional().default([]),
}).transform((data) => {
  // Provide computed values when backend fields are missing
  const completed = data.completed ?? data.success ?? 0
  const failed = data.failed ?? data.error ?? 0
  
  return {
    ...data,
    completed,
    failed,
    // Ensure total reflects actual counts if not provided
    total: data.total || (data.running + completed + failed + data.cancelled),
    // Calculate success rate if not provided  
    successRate: data.successRate || (
      data.totalExecutions > 0 ? (data.successfulExecutions / data.totalExecutions) * 100 : 0
    )
  }
})

// API request/response schemas
export const CreateWorkflowRequestSchema = WorkflowDefinitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateWorkflowRequestSchema =
  WorkflowDefinitionSchema.partial().and(
    z.object({
      id: IdSchema,
    })
  )

export const ExecuteWorkflowRequestSchema = z.object({
  workflowId: OptionalIdSchema,
  workflow: WorkflowDefinitionSchema.optional(), // For direct execution
  triggerData: z.record(z.unknown()).default({}),
  options: z
    .object({
      timeout: z.number().int().min(1000).max(3600000).optional(),
      dryRun: z.boolean().optional(),
    })
    .optional(),
})

export const WorkflowFilterSchema = z.object({
  status: StatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(), // Search in name/description
})

export const ExecutionFilterSchema = z.object({
  workflowId: IdSchema.optional(),
  status: ExecutionStatusSchema.optional(),
  triggerType: z.enum(['manual', 'webhook', 'schedule', 'event']).optional(),
  startDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
})

// API Response types
export const WorkflowResponseSchema = ApiResponseSchema(
  z.object({
    workflow: WorkflowSchema
  })
)
export const WorkflowListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowSchema)
)
export const ExecutionResponseSchema = ApiResponseSchema(
  WorkflowExecutionSchema
)
export const ExecutionListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowExecutionSchema)
)
export const ExecutionStatsResponseSchema =
  ApiResponseSchema(ExecutionStatsSchema)

// Type exports for TypeScript
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>
export type Workflow = z.infer<typeof WorkflowSchema>
export type NodeExecution = z.infer<typeof NodeExecutionSchema>
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>
export type ExecutionStats = z.infer<typeof ExecutionStatsSchema>
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>
export type ExecuteWorkflowRequest = z.infer<
  typeof ExecuteWorkflowRequestSchema
>
export type WorkflowFilter = z.infer<typeof WorkflowFilterSchema>
export type ExecutionFilter = z.infer<typeof ExecutionFilterSchema>
export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>
export type ExecutionListResponse = z.infer<typeof ExecutionListResponseSchema>
export type ExecutionStatsResponse = z.infer<
  typeof ExecutionStatsResponseSchema
>

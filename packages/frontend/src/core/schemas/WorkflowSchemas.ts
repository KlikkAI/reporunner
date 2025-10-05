import {
  EdgeSchema as ApiEdgeSchema,
  NodeSchema as ApiNodeSchema,
  WorkflowSchema as ApiWorkflowSchema,
  ExecutionStatus,
} from '@reporunner/shared';
import { z } from 'zod';
import {
  ApiResponseSchema,
  IdSchema,
  MetadataSchema,
  NodeParametersSchema,
  OptionalIdSchema,
  PaginatedResponseSchema,
  TimestampSchema,
} from './BaseSchemas';

// Define WorkflowStatus locally (not exported from api-types)
export const WorkflowStatus = z.enum(['active', 'inactive', 'draft']);

// Node schemas
export const WorkflowNodeSchema = ApiNodeSchema.extend({
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
});

// Edge/Connection schemas
export const WorkflowEdgeSchema = ApiEdgeSchema.extend({
  data: z.record(z.string(), z.unknown()).optional(),
  label: z.string().optional(),
});

// Core workflow definition
export const WorkflowDefinitionSchema = ApiWorkflowSchema.extend({
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
});

// Workflow with metadata (from API)
export const WorkflowSchema = WorkflowDefinitionSchema.and(
  z.object({
    id: IdSchema, // Required for saved workflows
    _id: IdSchema.optional(), // MongoDB ObjectId
    userId: IdSchema.optional(), // Owner of the workflow
    isPublic: z.boolean().optional(), // Whether workflow is public
    status: WorkflowStatus.optional(), // Made optional, computed from isActive
    successRate: z.number().min(0).max(100).optional(), // Success rate percentage
    lastExecution: z
      .object({
        id: IdSchema,
        status: z.nativeEnum(ExecutionStatus),
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
);

// Node execution details
export const NodeExecutionSchema = z.object({
  nodeId: IdSchema,
  nodeName: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
  output: z.unknown().optional(),
  error: z.string().optional(),
  executedAt: TimestampSchema,
  duration: z.number().int().min(0),
});

// Workflow execution
export const WorkflowExecutionSchema = z.object({
  id: IdSchema,
  workflowId: IdSchema,
  workflowName: z.string(),
  status: z.nativeEnum(ExecutionStatus),
  startTime: TimestampSchema,
  endTime: TimestampSchema.optional(),
  duration: z.number().int().min(0).optional(),
  triggerType: z.enum(['manual', 'webhook', 'schedule', 'event']),
  triggerData: z.record(z.string(), z.unknown()).optional(),
  results: z
    .union([
      z.array(NodeExecutionSchema), // Array format for frontend
      z.record(z.string(), z.unknown()), // Object format from backend
    ])
    .optional(),
  progress: z
    .object({
      totalNodes: z.number().int().min(0).optional(),
      completedNodes: z.array(z.string()).optional(),
      currentNode: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
  nodeExecutions: z.array(NodeExecutionSchema).optional(),
  logs: z
    .array(
      z.object({
        timestamp: TimestampSchema,
        level: z.enum(['debug', 'info', 'warn', 'error']),
        message: z.string(),
        nodeId: z.string().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
});

// Execution statistics - resilient to backend implementation gaps
export const ExecutionStatsSchema = z
  .object({
    total: z.number().int().min(0).default(0),
    running: z.number().int().min(0).default(0),
    completed: z.number().int().min(0).optional(),
    success: z.number().int().min(0).optional(),
    failed: z.number().int().min(0).optional(),
    error: z.number().int().min(0).optional(),
    cancelled: z.number().int().min(0).default(0),
    avgDuration: z.number().min(0).default(0),
    averageDuration: z.number().min(0).default(0), // Backend field name
    successRate: z.number().min(0).max(100).default(0),
    totalExecutions: z.number().int().min(0).default(0),
    successfulExecutions: z.number().int().min(0).default(0),
    failedExecutions: z.number().int().min(0).default(0),
    recentExecutions: z.array(WorkflowExecutionSchema).optional().default([]),
  })
  .transform((data) => {
    // Provide computed values when backend fields are missing
    const completed = data.completed ?? data.success ?? 0;
    const failed = data.failed ?? data.error ?? 0;

    return {
      ...data,
      completed,
      failed,
      // Normalize duration field (backend uses averageDuration, we prefer avgDuration)
      avgDuration: data.avgDuration || data.averageDuration || 0,
      // Ensure total reflects actual counts if not provided
      total: data.total || data.running + completed + failed + data.cancelled,
      // Calculate success rate if not provided
      successRate:
        data.successRate ||
        (data.totalExecutions > 0 ? (data.successfulExecutions / data.totalExecutions) * 100 : 0),
    };
  });

// API request/response schemas
export const CreateWorkflowRequestSchema = WorkflowDefinitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  version: z.number().int().min(1).default(1),
});

export const UpdateWorkflowRequestSchema = WorkflowDefinitionSchema.partial().and(
  z.object({
    id: IdSchema,
  })
);

// Backend workflow format for execution (n8n-style)
export const BackendWorkflowNodeSchema = z.object({
  parameters: z.record(z.string(), z.unknown()),
  type: z.string(),
  typeVersion: z.number(),
  position: z.tuple([z.number(), z.number()]),
  id: z.string(),
  name: z.string(),
  notesInFlow: z.boolean().optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
  disabled: z.boolean().optional(),
  webhookId: z.string().optional(),
  alwaysOutputData: z.boolean().optional(),
});

export const BackendWorkflowEdgeSchema = z.object({
  node: z.string(),
  type: z.string(),
  index: z.number(),
});

export const BackendWorkflowSchema = z.object({
  nodes: z.array(BackendWorkflowNodeSchema),
  connections: z.record(
    z.string(),
    z.object({
      main: z.array(z.array(BackendWorkflowEdgeSchema)),
    })
  ),
  pinData: z.record(z.string(), z.unknown()),
  meta: z.object({
    instanceId: z.string(),
    templateId: z.string().optional(),
    version: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  name: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ExecuteWorkflowRequestSchema = z.object({
  workflowId: OptionalIdSchema,
  workflow: z.union([WorkflowDefinitionSchema, BackendWorkflowSchema]).optional(), // Support both formats
  triggerData: z.record(z.string(), z.unknown()).default({}),
  options: z
    .object({
      timeout: z.number().int().min(1000).max(3600000).optional(),
      dryRun: z.boolean().optional(),
    })
    .optional(),
});

export const WorkflowFilterSchema = z.object({
  status: WorkflowStatus.optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(), // Search in name/description
});

export const ExecutionFilterSchema = z.object({
  workflowId: IdSchema.optional(),
  status: z.nativeEnum(ExecutionStatus).optional(),
  triggerType: z.enum(['manual', 'webhook', 'schedule', 'event']).optional(),
  startDate: TimestampSchema.optional(),
  endDate: TimestampSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  page: z.number().int().min(1).optional(),
});

// API Response types
export const WorkflowResponseSchema = ApiResponseSchema(
  z.object({
    workflow: WorkflowSchema,
  })
);
export const WorkflowListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowSchema)
);
export const ExecutionResponseSchema = ApiResponseSchema(WorkflowExecutionSchema);
export const ExecutionListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowExecutionSchema)
);
export const ExecutionStatsResponseSchema = ApiResponseSchema(ExecutionStatsSchema);

// Type exports for TypeScript
export type WorkflowStatusType = z.infer<typeof WorkflowStatus>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type BackendWorkflowNode = z.infer<typeof BackendWorkflowNodeSchema>;
export type BackendWorkflowEdge = z.infer<typeof BackendWorkflowEdgeSchema>;
export type BackendWorkflow = z.infer<typeof BackendWorkflowSchema>;
export type NodeExecution = z.infer<typeof NodeExecutionSchema>;
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
export type ExecutionStats = z.infer<typeof ExecutionStatsSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type ExecuteWorkflowRequest = z.infer<typeof ExecuteWorkflowRequestSchema>;
export type WorkflowFilter = z.infer<typeof WorkflowFilterSchema>;
export type ExecutionFilter = z.infer<typeof ExecutionFilterSchema>;
export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;
export type WorkflowListResponse = z.infer<typeof WorkflowListResponseSchema>;
export type ExecutionResponse = z.infer<typeof ExecutionResponseSchema>;
export type ExecutionListResponse = z.infer<typeof ExecutionListResponseSchema>;
export type ExecutionStatsResponse = z.infer<typeof ExecutionStatsResponseSchema>;

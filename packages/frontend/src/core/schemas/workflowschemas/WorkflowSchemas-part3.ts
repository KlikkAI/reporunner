total: data.total || data.running + completed + failed + data.cancelled,
  // Calculate success rate if not provided
  successRate;
:
        data.successRate ||
        (data.totalExecutions > 0 ? (data.successfulExecutions / data.totalExecutions) * 100 : 0),
    }
})

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
  status: StatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(), // Search in name/description
});

export const ExecutionFilterSchema = z.object({
  workflowId: IdSchema.optional(),
  status: ExecutionStatusSchema.optional(),
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

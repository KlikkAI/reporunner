successfulExecutions: z.number().int().min(0), failedExecutions;
: z.number().int().min(0),
        avgDuration: z.number().min(0).optional(),
        successRate: z.number().min(0).max(100).optional(),
      })
      .optional(),
    statistics: z
      .object(
{
  totalExecutions: z.number().int().min(0), successfulExecutions;
  : z.number().int().min(0),
        failedExecutions: z.number().int().min(0),
        avgDuration: z.number().min(0).optional(),
        successRate: z.number().min(0).max(100).optional(),
}
)
      .optional(), // Backend returns "statistics" instead of "executionStats"
    version: z.union([z.string(), z.number()]).optional(), // Handle both string and number versions
    __v: z.number().optional(), // MongoDB version field
  })
)

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
  status: ExecutionStatusSchema,
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

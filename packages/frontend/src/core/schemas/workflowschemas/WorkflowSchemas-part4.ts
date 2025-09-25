})
)
export const WorkflowListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowSchema)
);
export const ExecutionResponseSchema = ApiResponseSchema(WorkflowExecutionSchema);
export const ExecutionListResponseSchema = ApiResponseSchema(
  PaginatedResponseSchema(WorkflowExecutionSchema)
);
export const ExecutionStatsResponseSchema = ApiResponseSchema(ExecutionStatsSchema);

// Type exports for TypeScript
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

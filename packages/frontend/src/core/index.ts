/**
 * Core Module Public API
 *
 * Exports all business logic and core functionality following
 * the CLAUDE.md architecture with API layer separation.
 */

// API Layer (NEW - Following CLAUDE.md structure)
export * from "./api";

// Node Registry System
export { nodeRegistry } from "./nodes/registry";
export type {
  INodeTypeDescription,
  INodeProperty,
  INodeParameters,
  INodeType,
  INodeExecutionData,
  WorkflowNodeInstance,
  RuntimeNode,
  NodeActionResult,
  // Skip NodeProperty to avoid conflict - use DynamicNodeProperty below
} from "./nodes/types";
// nodeRegistry already exported from ./nodes/registry above

// Stores (State Management)
export { useLeanWorkflowStore } from "./stores/leanWorkflowStore";
export { useAuthStore } from "./stores/authStore";
export { useCredentialStore } from "./stores/credentialStore";
export { useIntegrationStore } from "./stores/integrationStore";

// Core Business Logic Services (but not configService - avoid circular dependency)
export { logger, performanceService, type PerformanceMetric } from "./services";

// Types - export specific ones to avoid conflicts
export type {
  WorkflowConnection,
  WorkflowNodeData,
  WorkflowNode,
  WorkflowEdge,
  Workflow,
  WorkflowData,
} from "./types/workflow";
export * from "./types/execution";
export * from "./types/edge";
export * from "./types/node";
export * from "./types/nodeTypes";
export type {
  Credential,
  CredentialTestResult as TestResult,
  CredentialType,
  CredentialTypeApiResponse,
} from "./types/credentials";
export type {
  Integration,
  IntegrationNodeType,
  PropertyFormState,
  CredentialRequirement,
  NodeExecutionContext,
  NodeExecutionResult,
  // NodeProperty already exported from nodeTypes, skip re-export
} from "./types/integration";

// Dynamic Properties
export type {
  PropertyValue,
  PropertyEvaluationContext,
  EnhancedIntegrationNodeType,
  NodeProperty as DynamicNodeProperty,
} from "./types/dynamicProperties";

// Utils
// export * from './utils/nodeGenerator' // Node.js only - not for browser
export * from "./utils/propertyEvaluator";
export * from "./utils/reverseTypeAdapters";
export * from "./utils/workflowExporter";

// Config (but not configService since it's already exported from services)
export { config, type Config } from "./config/environment";

// Schemas - export selectively to avoid conflicts
export {
  // Base schemas
  ApiResponseSchema,
  ApiErrorSchema,
  PaginationParamsSchema,
  PaginatedResponseSchema,
  NodeParameterValueSchema,
  NodeParametersSchema,
  MetadataSchema,
  // Credential schemas (avoid conflicts with types)
  CredentialSchema,
  CredentialConfigSchema,
  CredentialTestResultSchema,
  CredentialTypeSchema,
  // Workflow schemas (avoid conflicts with types)
  WorkflowSchema,
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
  WorkflowDefinitionSchema,
  WorkflowExecutionSchema,
  ExecutionStatsSchema,
  // Type exports from schemas (use different names to avoid conflicts)
  type ApiResponse,
  type ApiError,
  type PaginationParams,
  type PaginatedResponse,
  type NodeParameterValue,
  type NodeParameters,
  type Metadata,
  type Credential as SchemaCredential,
  type CredentialConfig,
  type CredentialTestResult,
  type CredentialType as SchemaCredentialType,
  type Workflow as SchemaWorkflow,
  type WorkflowNode as SchemaWorkflowNode,
  type WorkflowEdge as SchemaWorkflowEdge,
  type WorkflowDefinition,
  type WorkflowExecution,
  type ExecutionStats,
} from "./schemas";

// Key types already exported above

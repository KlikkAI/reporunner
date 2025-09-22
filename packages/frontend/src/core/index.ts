/**
 * Core Module Public API
 *
 * Exports all business logic and core functionality following
 * the CLAUDE.md architecture with API layer separation.
 */

// API Layer (NEW - Following CLAUDE.md structure)
export * from './api';

// Node Registry System
export { nodeRegistry } from './nodes/registry';
export type {
  INodeExecutionData,
  INodeParameters,
  INodeProperty,
  INodeType,
  INodeTypeDescription,
  NodeActionResult,
  RuntimeNode,
  WorkflowNodeInstance,
  // Skip NodeProperty to avoid conflict - use DynamicNodeProperty below
} from './nodes/types';

// nodeRegistry already exported from ./nodes/registry above

// Config (but not configService since it's already exported from services)
export { type Config, config } from './config/environment';
// Schemas - export selectively to avoid conflicts
export {
  type ApiError,
  ApiErrorSchema,
  // Type exports from schemas (use different names to avoid conflicts)
  type ApiResponse,
  // Base schemas
  ApiResponseSchema,
  type Credential as SchemaCredential,
  type CredentialConfig,
  CredentialConfigSchema,
  // Credential schemas (avoid conflicts with types)
  CredentialSchema,
  type CredentialTestResult,
  CredentialTestResultSchema,
  type CredentialType as SchemaCredentialType,
  CredentialTypeSchema,
  type ExecutionStats,
  ExecutionStatsSchema,
  type Metadata,
  MetadataSchema,
  type NodeParameters,
  NodeParametersSchema,
  type NodeParameterValue,
  NodeParameterValueSchema,
  type PaginatedResponse,
  PaginatedResponseSchema,
  type PaginationParams,
  PaginationParamsSchema,
  type Workflow as SchemaWorkflow,
  type WorkflowDefinition,
  WorkflowDefinitionSchema,
  type WorkflowEdge as SchemaWorkflowEdge,
  WorkflowEdgeSchema,
  type WorkflowExecution,
  WorkflowExecutionSchema,
  type WorkflowNode as SchemaWorkflowNode,
  WorkflowNodeSchema,
  // Workflow schemas (avoid conflicts with types)
  WorkflowSchema,
} from './schemas';
// Core Business Logic Services (but not configService - avoid circular dependency)
export { logger, type PerformanceMetric, performanceService } from './services';
export { useAuthStore } from './stores/authStore';
export { useCredentialStore } from './stores/credentialStore';
export { useIntegrationStore } from './stores/integrationStore';
// Stores (State Management)
export { useLeanWorkflowStore } from './stores/leanWorkflowStore';
export type {
  Credential,
  CredentialTestResult as TestResult,
  CredentialType,
  CredentialTypeApiResponse,
} from './types/credentials';
// Dynamic Properties
export type {
  EnhancedIntegrationNodeType,
  NodeProperty as DynamicNodeProperty,
  PropertyEvaluationContext,
  PropertyValue,
} from './types/dynamicProperties';
export * from './types/edge';
export * from './types/execution';
export type {
  CredentialRequirement,
  Integration,
  IntegrationNodeType,
  NodeExecutionContext,
  NodeExecutionResult,
  PropertyFormState,
  // NodeProperty already exported from nodeTypes, skip re-export
} from './types/integration';
export * from './types/node';
export * from './types/nodeTypes';
// Types - export specific ones to avoid conflicts
export type {
  Workflow,
  WorkflowConnection,
  WorkflowData,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from './types/workflow';
// Utils
// export * from './utils/nodeGenerator' // Node.js only - not for browser
export * from './utils/propertyEvaluator';
export * from './utils/reverseTypeAdapters';
export * from './utils/workflowExporter';

// Key types already exported above

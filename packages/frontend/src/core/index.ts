// Core module exports
// Main exports for the core business logic layer

// API services
export * from './api';
// Constants
export * from './constants';
// Nodes - export types from nodes (source of truth for NodeProperty, ValidationRule)
export type { NodeProperty, ValidationRule } from './nodes';
// Schemas - exclude WorkflowEdge (from stores)
export type {
  ApiResponse,
  CreateWorkflowRequest,
  ExecutionFilter,
  ExecutionStats,
  PaginatedResponse,
  UpdateWorkflowRequest,
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowFilter,
} from './schemas';

// Services - exclude AIAssistantConfig (use the one from stores instead)
export {
  AIAssistantService,
  analyticsService,
  configService,
  logger,
  performanceService,
} from './services';

// Stores - source of truth for AIAssistantConfig, WorkflowEdge
export * from './stores';

// Types - exclude NodeProperty (from nodes), WorkflowEdge (from stores)
export type {
  PropertyFormState,
  PropertyValue,
  WorkflowNodeData,
} from './types';

// Utils - exclude ApiError (from api), ValidationRule (from nodes), cn (from design-system)
export {
  ApiErrorHandler,
  convertNodePropertiesToINodeProperties,
  convertNodePropertyToINodeProperty,
  EnhancedPropertyEvaluator,
  enhancedPropertyEvaluator,
  expressionEvaluator,
  handleApiErrors,
  NodeGenerator,
  nodeGenerator,
  nodeRegistry,
  propertyEvaluator,
  typeValidation,
  useEnhancedPropertyEvaluator,
  workflowExporter,
} from './utils';

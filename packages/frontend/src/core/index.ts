// Core module exports
// Main exports for the core business logic layer

// API services
export * from './api';
// Constants
export * from './constants';
// Configuration
export * from './config';
// Schemas
export * from './schemas';

// Nodes - export types from nodes (source of truth for NodeProperty, ValidationRule)
export * from './nodes';

// Services - exclude AIAssistantConfig (use the one from stores instead)
export {
  AIAssistantService,
  analyticsService,
  configService,
  credentialService,
  integrationService,
  loggingService,
  performanceService,
  workflowExporterService,
} from './services';

// Stores - source of truth for AIAssistantConfig, WorkflowEdge
export * from './stores';

// Types - exclude NodeProperty (from nodes), WorkflowEdge (from stores)
export type {
  AppConfig,
  FeatureFlags,
  FrontendUser,
  WorkflowNodeData,
} from './types';

// Utils - exclude ApiError (from api), ValidationRule (from nodes)
export {
  apiErrorHandler,
  cn,
  enhancedPropertyEvaluator,
  expressionEvaluator,
  nodeGenerator,
  nodeRegistry,
  propertyEvaluator,
  reverseTypeAdapters,
  typeValidation,
  workflowExporter,
} from './utils';

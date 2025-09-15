/**
 * Core Module Public API
 * 
 * Exports all business logic and core functionality following
 * the CLAUDE.md architecture with API layer separation.
 */

// API Layer (NEW - Following CLAUDE.md structure)
export * from './api';

// Node Registry System
export { nodeRegistry } from './nodes/registry'
export * from './nodes/types'
export * from './nodes/index'

// Stores (State Management)
export { useLeanWorkflowStore } from './stores/leanWorkflowStore'
export { useAuthStore } from './stores/authStore'
export { useCredentialStore } from './stores/credentialStore'
export { useIntegrationStore } from './stores/integrationStore'

// Core Business Logic Services
export * from './services'

// Types
export * from './types/workflow'
export * from './types/execution'
export * from './types/edge'
export * from './types/node'
export * from './types/nodeTypes'
export * from './types/credentials'
export * from './types/integration'
export * from './types/dynamicProperties'

// Utils
export * from './utils/helpers'
export * from './utils/constants'
// export * from './utils/nodeGenerator' // Node.js only - not for browser
export * from './utils/propertyEvaluator'
export * from './utils/reverseTypeAdapters'
export * from './utils/workflowExporter'

// Config
export * from './config/environment'

// Schemas
export * from './schemas'

// Re-export key types for convenience
export type {
  INodeTypeDescription,
  INodeProperty,
  INodeParameters,
  INodeType,
  INodeExecutionData,
  WorkflowNodeInstance,
  WorkflowDefinition,
  RuntimeNode,
} from './nodes/types'

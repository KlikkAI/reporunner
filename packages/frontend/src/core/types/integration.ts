// Integration Types for the Pure Registry System

import type {
  EnhancedIntegrationNodeType,
  NodeProperty,
  PropertyFormState,
} from './dynamicProperties';

// Re-export NodeProperty for backward compatibility
export type { NodeProperty, PropertyFormState } from './dynamicProperties';

/**
 * Integration interface used in the Pure Registry System
 */
export interface Integration {
  id: string;
  name: string;
  displayName?: string;
  icon?: string;
  category?: string;
  description?: string;
  version?: number | number[];
  enhancedNodeTypes?: EnhancedIntegrationNodeType[];

  // Node type definitions
  nodeTypes?: IntegrationNodeType[];
  authType?: 'oauth' | 'api_key' | 'basic' | 'none';
  configuration?: NodeProperty[];

  // Additional fields found in usage
  isConnected?: boolean;
  connectionConfig?: Record<string, unknown>;
  credentials?: CredentialRequirement[];
  actions?: Record<string, any>;
}

/**
 * Legacy node type definition
 */
export interface IntegrationNodeType {
  id: string;
  name: string;
  displayName?: string; // Made optional to match actual usage
  type:
    | 'trigger'
    | 'action'
    | 'condition'
    | 'delay'
    | 'loop'
    | 'transform'
    | 'webhook'
    | 'database'
    | 'email'
    | 'file'
    | 'ai-agent';
  icon?: string;
  description?: string;
  inputs?: Array<{
    name: string;
    type: string;
    displayName?: string;
    required?: boolean;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    displayName?: string;
  }>;
  parameters?: NodeProperty[];
}

/**
 * Node execution context - provides data and credentials to node actions
 */
export interface NodeExecutionContext {
  parameters: PropertyFormState;
  credentials: Record<string, any>;
  inputData?: any[];
  workflow?: {
    id: string;
    name: string;
  };
  node?: {
    id: string;
    name: string;
    type: string;
  };
  helpers?: {
    httpRequest?: (options: any) => Promise<any>;
    executeWorkflow?: (workflowId: string, data?: any) => Promise<any>;
  };
}

/**
 * Node execution result - returned by node actions
 */
export interface NodeExecutionResult {
  success: boolean;
  data?: any[];
  error?:
    | string
    | {
        message: string;
        code?: string;
        details?: any;
      };
  metadata?: Record<string, any>;
}

/**
 * Credential requirement definition
 */
export interface CredentialRequirement {
  name: string;
  displayName?: string;
  required: boolean;
  type?: string;
  description?: string;
  properties?: NodeProperty[];
  documentationUrl?: string;
}

/**
 * Node definition for registration
 */
export interface NodeDefinition {
  id?: string;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  category?: string;
  version?: string | number | number[];
  type?: string;
  properties?: NodeProperty[];
  credentials?: CredentialRequirement[];
  inputs?: Array<{
    name: string;
    type: string;
    displayName?: string;
    required?: boolean;
    main?: boolean;
    description?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    displayName?: string;
    main?: boolean;
    description?: string;
  }>;
}

// LegacyNodeType removed - unused interface

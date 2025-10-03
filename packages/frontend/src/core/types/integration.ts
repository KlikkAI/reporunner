/**
 * Integration Types
 * Types for integration system, node execution, and workflow integrations
 */

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  version: number;
  status: 'available' | 'connected' | 'error';
  isConnected?: boolean;
  connectionConfig?: Record<string, unknown>;
  nodeTypes: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
}

export interface NodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version: number;
  defaults?: Record<string, any>;
  properties?: any[];
  inputs?: string[];
  outputs?: string[];
}

export interface NodeExecutionContext {
  workflowId?: string;
  executionId?: string;
  nodeId: string;
  inputData?: any;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime?: number;
    [key: string]: any;
  };
}

/**
 * Credential requirement for nodes
 */
export interface CredentialRequirement {
  name: string;
  required: boolean;
  displayName?: string;
  testedBy?: string;
}

/**
 * Integration node type definition
 */
export interface IntegrationNodeType {
  id: string;
  name: string;
  description: string;
  type: 'trigger' | 'action' | 'condition' | 'ai-agent';
  group?: string[];
  version?: number;
  defaults?: Record<string, any>;
  properties?: any[];
  credentials?: CredentialRequirement[];
  inputs?: string[];
  outputs?: string[];
}

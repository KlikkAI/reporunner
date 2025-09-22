// Workflow types
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  integrationData?: {
    id: string;
    category: string;
    subcategory?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Execution types
export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  nodeResults: Record<string, NodeExecutionResult>;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  data?: any;
  error?: string;
  executedAt: Date;
}

// Integration types
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  icon?: string;
  nodeTypes: NodeType[];
  credentials?: CredentialType[];
}

export interface NodeType {
  id: string;
  name: string;
  description: string;
  type: 'trigger' | 'action' | 'condition' | 'ai-agent';
  icon?: string;
  inputs: number;
  outputs: number;
  properties: NodeProperty[];
}

export interface NodeProperty {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'credentials';
  required?: boolean;
  default?: any;
  options?: Array<{ name: string; value: any }>;
  description?: string;
}

// Credential types
export interface CredentialType {
  id: string;
  name: string;
  displayName: string;
  properties: CredentialProperty[];
  authenticate?: {
    type: 'oauth2' | 'api-key' | 'basic-auth';
    oauth2?: OAuth2Config;
  };
}

export interface CredentialProperty {
  name: string;
  displayName: string;
  type: 'string' | 'password' | 'hidden';
  required?: boolean;
  description?: string;
}

export interface OAuth2Config {
  authUrl: string;
  accessTokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

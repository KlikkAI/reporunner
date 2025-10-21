// Node types reusing patterns from workflow-engine
export interface NodeDefinition {
  id: string;
  type: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  parameters: NodeParameter[];
  credentials?: CredentialRequirement[];
  webhook?: WebhookConfig;
  polling?: PollingConfig;
}

export interface NodeInput {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
}

export interface NodeOutput {
  name: string;
  type: string;
  description?: string;
}

export interface NodeParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
  options?: any[];
  validation?: Record<string, any>;
}

export interface CredentialRequirement {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface WebhookConfig {
  path: string;
  method: string;
  responseMode: 'sync' | 'async';
}

export interface PollingConfig {
  interval: number;
  enabled: boolean;
}

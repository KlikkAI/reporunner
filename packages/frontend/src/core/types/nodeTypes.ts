export interface NodeProperty {
  displayName: string;
  name: string;
  type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'options'
    | 'collection'
    | 'multiOptions'
    | 'json'
    | 'dateTime'
    | 'credentialsSelect';
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  description?: string;
  options?: Array<{
    name: string;
    value: string | number;
    description?: string;
  }>;
  displayOptions?: {
    show?: Record<string, string[]>;
    hide?: Record<string, string[]>;
  };
  typeOptions?: {
    minValue?: number;
    maxValue?: number;
    multipleValues?: boolean;
    multipleValueButtonText?: string;
  };
  routing?: {
    request?: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
    };
    output?: {
      postReceive?: Array<{
        type: string;
        properties: Record<string, unknown>;
      }>;
    };
  };
}

export interface NodeTypeDescription {
  displayName: string;
  name: string;
  icon: string;
  group: string[];
  version: number;
  description: string;
  defaults: {
    name: string;
    color: string;
  };
  inputs: string[];
  outputs: string[];
  credentials?: Array<{
    name: string;
    required?: boolean;
    displayOptions?: {
      show?: Record<string, string[]>;
      hide?: Record<string, string[]>;
    };
  }>;
  properties: NodeProperty[];
  requestDefaults?: {
    baseURL?: string;
    headers?: Record<string, string>;
  };
}

// Advanced node type descriptions - populated by components that need them
export const nodeTypeDescriptions: NodeTypeDescription[] = [];

displayName: string;
type: PropertyType;
description?: string;
placeholder?: string;
default?: unknown
required?: boolean
noDataExpression?: boolean

// Options for select/multiSelect types
options?: PropertyOption[]

// For credential selection
credentialTypes?: string[];

// Conditional display logic
displayOptions?: DisplayOptions;

// Type-specific options
typeOptions?: TypeOptions;

// For collection/fixedCollection types
values?: CollectionValue[];

// For resource locator
modes?: Array<{
    displayName: string;
    name: string;
    type: 'list' | 'id' | 'url';
  }>;

// Validation rules
validation?: ValidationRule[];

// For text areas
rows?: number;

// For numbers
min?: number;
max?: number;
step?: number;

// For expressions
expressionSupport?: 'full' | 'partial' | 'none';

// Custom routing for dynamic options
routing?: {
    request: {
      method: string;
url: string;
headers?: Record<string, string>;
body?: Record<string, any>;
}
output:
{
  postReceive: Array<{
    type: string;
    properties: Record<string, string>;
  }>;
}
}
}

export interface NodePropertyGroup {
  name: string;
  displayName: string;
  properties: NodeProperty[];
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface DynamicNodeConfiguration {
  properties: NodeProperty[];
  groups?: NodePropertyGroup[];
  webhooks?: Array<{
    name: string;
    httpMethod: string;
    responseMode: 'onReceived' | 'lastNode';
    path: string;
  }>;
  credentials?: Array<{
    name: string;
    required: boolean;
    displayOptions?: DisplayOptions;
  }>;
  polling?: {
    enabled: boolean;
    defaultInterval: number;
    minInterval?: number;
    maxInterval?: number;
  };
}

// Enhanced Integration Node Type with dynamic properties
export interface EnhancedIntegrationNodeType {
  id: string;
  name: string;
  displayName?: string;
  type:
    | 'trigger'
    | 'action'
    | 'condition'

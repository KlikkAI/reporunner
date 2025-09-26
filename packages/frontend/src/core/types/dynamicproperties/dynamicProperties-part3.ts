| 'delay'
    | 'loop'
    | 'transform'
    | 'webhook'
    | 'database'
    | 'email'
    | 'file'
    | 'ai-agent'
icon?: string
description: string
version?: number | number[]
category?: string;
subcategory?: string;

// Input/Output connection definitions
inputs: Array<{
  name: string;
  type: string;
  displayName?: string;
  description?: string;
  required?: boolean;
  maxConnections?: number;
}>;

outputs: Array<{
  name: string;
  type: string;
  displayName?: string;
  description?: string;
  maxConnections?: number;
}>;

// Dynamic property configuration
configuration: DynamicNodeConfiguration;

// Execution settings
continueOnFail?: boolean;
retryOnFail?: boolean;
maxTries?: number;
waitBetweenTries?: number;

// UI settings
codex?: {
    categories: string[];
subcategories?: Record<string, string[]>;
}

// Custom styling
styling?:
{
  backgroundColor?: string;
  borderColor?: string;
  fontColor?: string;
}
}

// Property value types for form state management
export type PropertyValue =
  | string
  | number
  | boolean
  | unknown[]
  | Record<string, unknown>
  | null
  | undefined;

export interface PropertyFormState {
  [propertyName: string]: PropertyValue;
}

// Utility types for property evaluation
export interface PropertyEvaluationContext {
  formState: PropertyFormState;
  nodeData?: Record<string, unknown>;
  credentials?: Array<Record<string, unknown>>; // Array of available credentials
  credentialTypes?: Array<Record<string, unknown>>; // Available credential type definitions
  workflow?: {
    id: string;
    nodes: Array<Record<string, unknown>>;
    connections: Array<Record<string, unknown>>;
  };
  // Callback functions for credential management
  onCredentialSelect?: (credential: Record<string, unknown>) => void;
  onCreateCredential?: (credentialType: string) => void;
  onEditCredential?: (credential: Record<string, unknown>) => void;
  onDeleteCredential?: (credential: Record<string, unknown>) => void;
  onCredentialChange?: (credentialId: string) => void;
}

export interface ConditionalPropertyResult {
  visible: boolean;
  disabled: boolean;
  required: boolean;
  options?: PropertyOption[];
}

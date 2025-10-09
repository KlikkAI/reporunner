/**
 * Dynamic Properties Type Definitions
 * Shared types for property rendering and evaluation system
 */

/**
 * Property value types
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, any>
  | any[]
  | null
  | undefined;

/**
 * Form state for node properties
 */
export interface PropertyFormState {
  [key: string]: PropertyValue;
}

/**
 * Node property definition (aliased for backward compatibility)
 */
export interface NodeProperty {
  name: string;
  displayName: string;
  type: string;
  default?: PropertyValue;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: Array<{ name: string; value: string | number }>;
  displayOptions?: Record<string, any>;
  [key: string]: any;
}

/**
 * Property evaluation context
 */
export interface PropertyEvaluationContext {
  formState?: PropertyFormState;
  nodeData?: Record<string, any>;
  credentials?: Array<Record<string, unknown>>;
  credentialTypes?: Array<Record<string, unknown>>;
  onCreateCredential?: (type: string) => void;
  onCredentialSelect?: (credential: any) => void;
  onCredentialChange?: (credentialId: string) => void;
  [key: string]: any;
}

/**
 * Property validation result
 */
export interface PropertyValidationResult {
  isValid: boolean;
  errors: Map<string, string>;
}

/**
 * Property type enumeration
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'json'
  | 'expression'
  | 'credentialsSelect'
  | 'collection'
  | 'fixedCollection'
  | 'dateTime'
  | 'color'
  | 'file'
  | 'resourceLocator'
  | 'resourceMapper';

/**
 * Property option for select/multiSelect types
 */
export interface PropertyOption {
  name: string;
  value: string | number | boolean;
  description?: string;
}

/**
 * Display options for conditional property visibility
 */
export interface DisplayOptions {
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

/**
 * Type-specific options for properties
 */
export interface TypeOptions {
  minValue?: number;
  maxValue?: number;
  multipleValues?: boolean;
  multipleValueButtonText?: string;
  rows?: number;
  editor?: 'code' | 'json';
  loadOptionsMethod?: string;
  [key: string]: any;
}

/**
 * Validation rule for properties
 */
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

/**
 * Collection value for collection type properties
 */
export interface CollectionValue {
  [key: string]: PropertyValue;
}

/**
 * Conditional property evaluation result
 */
export interface ConditionalPropertyResult {
  visible: boolean;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Node property group
 */
export interface NodePropertyGroup {
  name: string;
  displayName: string;
  properties: NodeProperty[];
}

/**
 * Dynamic node configuration
 */
export interface DynamicNodeConfiguration {
  properties: NodeProperty[];
  credentials?: any[];
  polling?: any;
  webhooks?: any[];
}

/**
 * Enhanced integration node type
 */
export interface EnhancedIntegrationNodeType {
  id: string;
  type: string;
  name: string;
  displayName?: string; // User-friendly display name
  icon?: string; // Icon identifier (e.g., 'fa:envelope', 'lucide:mail')
  description?: string;
  configuration: DynamicNodeConfiguration;
  inputs?: any[];
  outputs?: any[];
  codex?: {
    categories: string[];
    subcategories?: Record<string, string[]>;
  };
}

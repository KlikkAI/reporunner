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

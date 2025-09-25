/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Core node type system based on n8n's declarative model
 * This defines the strict contract for all nodes and their configuration properties
 */

export interface INodeCredentials {
  id: string;
  name: string;
}

export interface INodePropertyOptions {
  name: string;
  displayName?: string;
  value?: string | number | boolean;
  type?: string;
  default?: any;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: INodePropertyOptions[];
  displayOptions?: IDisplayOptions;
  typeOptions?: INodePropertyTypeOptions;
  icon?: string;
  action?: string;
}

// Enhanced Display Condition Types
export type DisplayCondition =
  | { _cnd: { eq: NodeParameterValue } }
  | { _cnd: { not: NodeParameterValue } }
  | { _cnd: { gt: number } }
  | { _cnd: { gte: number } }
  | { _cnd: { lt: number } }
  | { _cnd: { lte: number } }
  | { _cnd: { between: { from: number; to: number } } }
  | { _cnd: { startsWith: string } }
  | { _cnd: { endsWith: string } }
  | { _cnd: { includes: string } }
  | { _cnd: { regex: string } }
  | { _cnd: { exists: true } };

export type NodeParameterValue = string | number | boolean | object | null | undefined;

export interface IDisplayOptions {
  show?: {
    '@version'?: Array<number | DisplayCondition>;
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined;
  };
  hide?: {
    '@version'?: Array<number | DisplayCondition>;
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined;
  };
}

export type NodePropertyType =
  // Basic Input Types
  | 'string'
  | 'number'
  | 'boolean'
  | 'dateTime'
  | 'color'
  | 'file'
  | 'hidden'

  // Selection Types
  | 'options'
  | 'multiOptions'
  | 'select'
  | 'multiSelect'

  // Text Types
  | 'text'
  | 'json'
  | 'expression'

  // Advanced Input Types
  | 'assignmentCollection' // Key n8n EditFields feature
  | 'resourceLocator'
  | 'resourceMapper'
  | 'filter'
  | 'curlImport'
  | 'workflowSelector'

  // Collection Types
  | 'collection'
  | 'fixedCollection'

  // Display Types
  | 'notice'
  | 'callout'
  | 'button'

  // Authentication Types
  | 'credentials'
  | 'credentialsSelect'

  // Legacy/Compatibility
  | 'authentication';

/**
 * Node Types - Node definitions and integrations
 */

import type { ID } from '../common';

/**
 * Node type category
 */
export type NodeCategory =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'transform'
  | 'database'
  | 'ai'
  | 'communication'
  | 'utility';

/**
 * Property type for dynamic forms
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'json'
  | 'dateTime'
  | 'color'
  | 'file'
  | 'credentialsSelect'
  | 'expression'
  | 'collection'
  | 'fixedCollection'
  | 'resourceLocator'
  | 'resourceMapper';

/**
 * Node property definition
 */
export interface INodeProperty {
  name: string;
  displayName: string;
  type: PropertyType;
  default?: any;
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: Array<{ name: string; value: any; description?: string }>;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  validation?: {
    type?: string;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/**
 * Credential requirement
 */
export interface ICredentialRequirement {
  name: string;
  required?: boolean;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

/**
 * Connection definition
 */
export interface IConnectionDefinition {
  type: string;
  displayName?: string;
  maxConnections?: number;
  required?: boolean;
}

/**
 * Node type definition
 */
export interface INodeType {
  id: ID;
  name: string;
  displayName: string;
  description: string;
  category: NodeCategory;
  icon?: string;
  color?: string;
  version: number;
  properties?: INodeProperty[];
  credentials?: ICredentialRequirement[];
  inputs?: IConnectionDefinition[];
  outputs?: IConnectionDefinition[];
  polling?: {
    active: boolean;
    interval?: number;
  };
  webhooks?: Array<{
    name: string;
    httpMethod: string;
    path: string;
  }>;
}

/**
 * Integration definition
 * @deprecated Use IIntegration from '../integration' instead
 * This is kept for backward compatibility but will be removed in next major version
 */
export interface INodeIntegration {
  id: ID;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  category: string;
  nodeTypes: INodeType[];
  credentials?: Array<{
    name: string;
    displayName: string;
  }>;
  documentation?: {
    url?: string;
    description?: string;
  };
}
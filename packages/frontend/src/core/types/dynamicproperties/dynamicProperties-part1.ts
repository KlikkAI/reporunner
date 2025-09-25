// Dynamic Property System Types - Inspired by n8n's flexible property configuration
// This system allows for conditional rendering, dynamic options, and flexible form configurations

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'multiOptions'
  | 'text'
  | 'json'
  | 'dateTime'
  | 'collection'
  | 'fixedCollection'
  | 'color'
  | 'file'
  | 'resourceLocator'
  | 'resourceMapper'
  | 'expression'
  | 'credentialsSelect';

export interface PropertyOption {
  name: string;
  displayName?: string;
  value?: string | number | boolean;
  description?: string;
  action?: string;
  type?: string;
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  options?: PropertyOption[];
  values?: unknown;
  typeOptions?: TypeOptions;
  displayOptions?: DisplayOptions;
}

export interface DisplayOptions {
  show?: Record<string, Array<string | number | boolean>>;
  hide?: Record<string, Array<string | number | boolean>>;
}

export interface TypeOptions {
  multipleValues?: boolean;
  multipleValueButtonText?: string;
  minValue?: number;
  maxValue?: number;
  numberStepSize?: number;
  numberPrecision?: number;
  alwaysOpenEditWindow?: boolean;
  showAlpha?: boolean;
  password?: boolean;
  multiline?: boolean;
  loadOptionsMethod?: string;
  loadOptions?: {
    routing: {
      request: {
        method: string;
        url: string;
      };
      output: {
        postReceive: {
          type: string;
          properties: {
            value: string;
            name: string;
          };
        }[];
      };
    };
  };
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

export interface CollectionValue {
  name: string;
  displayName: string;
  type: PropertyType;
  description?: string;
  placeholder?: string;
  default?: unknown;
  options?: PropertyOption[];
  values?: CollectionValue[];
  required?: boolean;
  displayOptions?: DisplayOptions;
  typeOptions?: TypeOptions;
  validation?: ValidationRule[];
  rows?: number;
  min?: number;
  max?: number;
}

export interface NodeProperty {
  name: string;

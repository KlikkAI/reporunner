/**
 * Schema for request validation
 */
export interface ValidationSchema {
  /**
   * Schema for query parameters
   */
  query?: Record<string, SchemaDefinition>;

  /**
   * Schema for request body
   */
  body?: Record<string, SchemaDefinition>;

  /**
   * Schema for URL parameters
   */
  params?: Record<string, SchemaDefinition>;

  /**
   * Schema for request headers
   */
  headers?: Record<string, SchemaDefinition>;

  /**
   * Schema for cookies
   */
  cookies?: Record<string, SchemaDefinition>;

  /**
   * Schema for uploaded files
   */
  files?: Record<string, SchemaDefinition>;
}

/**
 * Definition of a schema field
 */
export interface SchemaDefinition {
  /**
   * Field type
   */
  type: SchemaType | SchemaType[];

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Default value if field is missing
   */
  default?: any;

  /**
   * Field description
   */
  description?: string;

  /**
   * Custom validation function
   */
  validate?: (value: any) => boolean | Promise<boolean>;

  /**
   * Custom transformation function
   */
  transform?: (value: any) => any | Promise<any>;

  /**
   * Custom error message
   */
  message?: string;

  /**
   * Minimum value (for numbers)
   */
  min?: number;

  /**
   * Maximum value (for numbers)
   */
  max?: number;

  /**
   * Minimum length (for strings and arrays)
   */
  minLength?: number;

  /**
   * Maximum length (for strings and arrays)
   */
  maxLength?: number;

  /**
   * Regular expression pattern (for strings)
   */
  pattern?: RegExp;

  /**
   * Allowed values (enum)
   */
  enum?: any[];

  /**
   * Custom format (e.g., 'email', 'uuid', 'date')
   */
  format?: string;

  /**
   * Schema for array items
   */
  items?: SchemaDefinition;

  /**
   * Schema for object properties
   */
  properties?: Record<string, SchemaDefinition>;

  /**
   * Whether to allow additional properties in objects
   */
  additionalProperties?: boolean;

  /**
   * Dependencies between fields
   */
  dependencies?: Record<string, string[]>;

  /**
   * Whether field can be null
   */
  nullable?: boolean;

  /**
   * Sanitization options
   */
  sanitize?: {
    /**
     * Whether to trim strings
     */
    trim?: boolean;

    /**
     * Whether to convert to lowercase
     */
    lowercase?: boolean;

    /**
     * Whether to convert to uppercase
     */
    uppercase?: boolean;

    /**
     * Whether to escape HTML
     */
    escape?: boolean;

    /**
     * Whether to remove invalid characters
     */
    stripInvalid?: boolean;

    /**
     * Custom sanitization function
     */
    custom?: (value: any) => any | Promise<any>;
  };
}

/**
 * Available schema types
 */
export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'any'
  | 'integer'
  | 'float'
  | 'date'
  | 'file';
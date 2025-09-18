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
  | 'credentialsSelect'

export interface PropertyOption {
  name: string
  displayName?: string
  value: string | number | boolean
  description?: string
  action?: string
  type?: string
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: PropertyOption[]
  values?: unknown
  typeOptions?: TypeOptions
}

export interface DisplayOptions {
  show?: Record<string, Array<string | number | boolean>>
  hide?: Record<string, Array<string | number | boolean>>
}

export interface TypeOptions {
  multipleValues?: boolean
  multipleValueButtonText?: string
  minValue?: number
  maxValue?: number
  numberStepSize?: number
  numberPrecision?: number
  alwaysOpenEditWindow?: boolean
  showAlpha?: boolean
  password?: boolean
  multiline?: boolean
  loadOptionsMethod?: string
  loadOptions?: {
    routing: {
      request: {
        method: string
        url: string
      }
      output: {
        postReceive: {
          type: string
          properties: {
            value: string
            name: string
          }
        }[]
      }
    }
  }
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number
  message: string
}

export interface CollectionValue {
  name: string
  displayName: string
  type: PropertyType
  description?: string
  placeholder?: string
  default?: unknown
  options?: PropertyOption[]
  values?: CollectionValue[]
  required?: boolean
  displayOptions?: DisplayOptions
  typeOptions?: TypeOptions
  validation?: ValidationRule[]
  rows?: number
  min?: number
  max?: number
}

export interface NodeProperty {
  name: string
  displayName: string
  type: PropertyType
  description?: string
  placeholder?: string
  default?: unknown
  required?: boolean
  noDataExpression?: boolean

  // Options for select/multiSelect types
  options?: PropertyOption[]

  // For credential selection
  credentialTypes?: string[]

  // Conditional display logic
  displayOptions?: DisplayOptions

  // Type-specific options
  typeOptions?: TypeOptions

  // For collection/fixedCollection types
  values?: CollectionValue[]

  // For resource locator
  modes?: Array<{
    displayName: string
    name: string
    type: 'list' | 'id' | 'url'
  }>

  // Validation rules
  validation?: ValidationRule[]

  // For text areas
  rows?: number

  // For numbers
  min?: number
  max?: number
  step?: number

  // For expressions
  expressionSupport?: 'full' | 'partial' | 'none'

  // Custom routing for dynamic options
  routing?: {
    request: {
      method: string
      url: string
      headers?: Record<string, string>
      body?: Record<string, any>
    }
    output: {
      postReceive: Array<{
        type: string
        properties: Record<string, string>
      }>
    }
  }
}

export interface NodePropertyGroup {
  name: string
  displayName: string
  properties: NodeProperty[]
  collapsible?: boolean
  collapsed?: boolean
}

export interface DynamicNodeConfiguration {
  properties: NodeProperty[]
  groups?: NodePropertyGroup[]
  webhooks?: Array<{
    name: string
    httpMethod: string
    responseMode: 'onReceived' | 'lastNode'
    path: string
  }>
  credentials?: Array<{
    name: string
    required: boolean
    displayOptions?: DisplayOptions
  }>
  polling?: {
    enabled: boolean
    defaultInterval: number
    minInterval?: number
    maxInterval?: number
  }
}

// Enhanced Integration Node Type with dynamic properties
export interface EnhancedIntegrationNodeType {
  id: string
  name: string
  displayName: string
  type:
    | 'trigger'
    | 'action'
    | 'condition'
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
  version: number | number[]

  // Input/Output connection definitions
  inputs: Array<{
    name: string
    type: string
    displayName?: string
    description?: string
    required?: boolean
    maxConnections?: number
  }>

  outputs: Array<{
    name: string
    type: string
    displayName?: string
    description?: string
    maxConnections?: number
  }>

  // Dynamic property configuration
  configuration: DynamicNodeConfiguration

  // Execution settings
  continueOnFail?: boolean
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTries?: number

  // UI settings
  codex?: {
    categories: string[]
    subcategories?: Record<string, string[]>
  }

  // Custom styling
  styling?: {
    backgroundColor?: string
    borderColor?: string
    fontColor?: string
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
  | undefined

export interface PropertyFormState {
  [propertyName: string]: PropertyValue
}

// Utility types for property evaluation
export interface PropertyEvaluationContext {
  formState: PropertyFormState
  nodeData?: Record<string, unknown>
  credentials?: Array<Record<string, unknown>> // Array of available credentials
  credentialTypes?: Array<Record<string, unknown>> // Available credential type definitions
  workflow?: {
    id: string
    nodes: Array<Record<string, unknown>>
    connections: Array<Record<string, unknown>>
  }
  // Callback functions for credential management
  onCredentialSelect?: (credential: Record<string, unknown>) => void
  onCreateCredential?: (credentialType: string) => void
  onEditCredential?: (credential: Record<string, unknown>) => void
  onDeleteCredential?: (credential: Record<string, unknown>) => void
  onCredentialChange?: (credentialId: string) => void
}

export interface ConditionalPropertyResult {
  visible: boolean
  disabled: boolean
  required: boolean
  options?: PropertyOption[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Core node type system based on n8n's declarative model
 * This defines the strict contract for all nodes and their configuration properties
 */

export interface INodeCredentials {
  id: string
  name: string
}

export interface INodePropertyOptions {
  name: string
  displayName?: string
  value?: string | number | boolean
  type?: string
  default?: any
  description?: string
  placeholder?: string
  required?: boolean
  options?: INodePropertyOptions[]
  displayOptions?: IDisplayOptions
  typeOptions?: INodePropertyTypeOptions
  icon?: string
  action?: string
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
  | { _cnd: { exists: true } }

export type NodeParameterValue = string | number | boolean | object | null | undefined

export interface IDisplayOptions {
  show?: {
    '@version'?: Array<number | DisplayCondition>
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined
  }
  hide?: {
    '@version'?: Array<number | DisplayCondition>
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined
  }
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
  | 'assignmentCollection'  // Key n8n EditFields feature
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
  | 'authentication'

export interface INodePropertyCollection {
  displayName: string
  name: string
  values: INodeProperty[]
}

export interface INodePropertyTypeOptions {
  // Basic Options
  alwaysOpenEditWindow?: boolean
  password?: boolean
  rows?: number
  showAlpha?: boolean
  
  // Editor Options
  codeAutocomplete?: string
  editor?: 'json' | 'javascript' | 'html' | 'css' | 'sql' | 'expression'
  
  // Number Options
  maxValue?: number
  minValue?: number
  numberPrecision?: number
  numberStepSize?: number
  
  // Collection Options
  multipleValues?: boolean
  multipleValueButtonText?: string
  sortable?: boolean
  
  // Assignment Collection Specific
  assignmentCollection?: {
    autoDetectTypes?: boolean
    allowedTypes?: string[]
    showTypeSelector?: boolean
    enableBulkOperations?: boolean
    enableDragDrop?: boolean
  }
  
  // Resource Options
  loadOptions?: {
    routing?: {
      operations?: {
        [key: string]: string
      }
    }
  }
  loadOptionsMethod?: string
  
  // Display Options
  displaySize?: 'small' | 'medium' | 'large'
  placeholder?: string
  
  // Validation Options
  validateType?: string
  validation?: {
    pattern?: string
    message?: string
  }
  
  // Advanced Options
  acceptFileTypes?: string
  fileExtensions?: string[]
  maxFileSize?: number
  
  // Expression Options
  expressionSupport?: boolean
  resolveExpression?: boolean
  
  // Resource Mapper Options
  resourceMapper?: {
    mode: 'add' | 'upsert' | 'update'
    fieldDependencies: string[]
    resourceMapperField: {
      resource: string
    }
  }
  
  // Date Time Options
  dateTimePickerOptions?: {
    format?: string
    showTimeSelect?: boolean
    timeIntervals?: number
  }
  
  // Color Options
  colorOptions?: {
    format?: 'hex' | 'rgb' | 'hsl'
    presets?: string[]
  }
}

export interface INodeProperty {
  displayName: string
  name: string
  type: NodePropertyType
  default?: any
  description?: string
  hint?: string
  displayOptions?: IDisplayOptions
  options?: INodePropertyOptions[]
  values?: INodeProperty[]
  placeholder?: string
  required?: boolean
  credentialTypes?: string[]
  noDataExpression?: boolean
  typeOptions?: INodePropertyTypeOptions
  collection?: INodePropertyCollection[]
  min?: number
  max?: number
  step?: number
  rows?: number
  routing?: {
    request?: {
      method?: string
      url?: string
      body?: any
      headers?: any
      qs?: any
    }
    output?: {
      postReceive?: Array<{
        type: string
        properties?: any
      }>
    }
  }
}

export interface INodeTypeDescription {
  displayName: string
  name: string
  icon?: string
  iconUrl?: string
  group: string[]
  version: number
  subtitle?: string
  description: string
  defaults: {
    name: string
    color?: string
  }
  inputs: string[] | Array<'main' | 'trigger'>
  outputs: string[] | Array<'main'>
  credentials?: Array<{
    name: string
    required?: boolean
    displayOptions?: IDisplayOptions
  }>
  properties: INodeProperty[]
  documentationUrl?: string
  categories?: string[]
  eventTriggerDescription?: string
  activationMessage?: string
  maxNodes?: number
  polling?: boolean
  supportsCORS?: boolean
  webhooks?: Array<{
    name: string
    httpMethod: string
    responseMode: string | 'onReceived'
    path: string
    restartWebhook?: boolean
  }>
  trigger?: () => Promise<any>
  // Pluggable UI System
  customBodyComponent?: string
  customPropertiesPanelComponent?: string
}

export interface INodeExecutionData {
  [key: string]: any
  json: {
    [key: string]: any
  }
  binary?: {
    [key: string]: any
  }
  error?: Error
  pairedItem?:
    | {
        item: number
        input?: number
      }
    | number
}

export interface INodeParameters {
  [key: string]: any
}

export interface INodeType {
  description: INodeTypeDescription
  execute?(this: any): Promise<INodeExecutionData[][]>
  trigger?(this: any): Promise<void>
  webhook?(this: any): Promise<any>
  poll?(this: any): Promise<INodeExecutionData[][] | null>
  test?(this: any): Promise<{ success: boolean; message: string; data?: any }>
}

export interface ICredentialType {
  name: string
  displayName: string
  documentationUrl?: string
  properties: INodeProperty[]
  authenticate?: {
    type: string
    properties: {
      [key: string]: string
    }
  }
  test?: {
    request: {
      baseURL?: string
      url?: string
      headers?: {
        [key: string]: string
      }
      method?: string
    }
  }
}

// Enhanced Assignment Value Interface for EditFields
export interface IAssignmentValue {
  id: string  // UUID for tracking
  name: string  // Field name with dot-notation support
  value: NodeParameterValue  // Field value (can be expression)
  type: string  // Inferred or selected type
}

// Lean instance data - this is what gets saved
export interface WorkflowNodeInstance {
  id: string
  type: string // References the node type name from INodeTypeDescription
  position: {
    x: number
    y: number
  }
  parameters: INodeParameters
  credentials?: INodeCredentials[]
  disabled?: boolean
  notes?: string
  name?: string // Custom display name for this instance
  notesInFlow?: boolean
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTries?: number
  continueOnFail?: boolean
  executeOnce?: boolean
  
  // Enhanced versioning support
  version?: number
  typeVersion?: number
}

// Workflow definition - lean and efficient
export interface WorkflowDefinition {
  id?: string
  name: string
  description?: string
  active?: boolean
  nodes: WorkflowNodeInstance[]
  connections: {
    [sourceNodeId: string]: {
      [outputIndex: string]: Array<{
        node: string
        type: 'main' | string
        index: number
      }>
    }
  }
  settings?: {
    errorWorkflow?: string
    saveDataErrorExecution?: 'all' | 'none'
    saveDataSuccessExecution?: 'all' | 'none'
    executionTimeout?: number
    maxExecutionTimeout?: number
    callerPolicy?:
      | 'any'
      | 'none'
      | 'workflowsFromAList'
      | 'workflowsFromSameOwner'
  }
  staticData?: {
    [key: string]: any
  }
  tags?: string[]
  pinData?: {
    [nodeName: string]: INodeExecutionData[]
  }
  versionId?: string
}

// Extended node data for runtime (includes static definition)
export interface RuntimeNode extends WorkflowNodeInstance {
  typeDefinition: INodeTypeDescription
}

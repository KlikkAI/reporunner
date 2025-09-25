}
staticData?:
{
  [key: string]
  : any
}
tags?: string[];
pinData?: {
    [nodeName: string]: INodeExecutionData[];
}
versionId?: string
}

// Extended node data for runtime (includes static definition)
export interface RuntimeNode extends WorkflowNodeInstance {
  typeDefinition: INodeTypeDescription;
}

// Re-export types from dynamic properties and integration modules
export type {
  CollectionValue,
  ConditionalPropertyResult,
  DisplayOptions,
  DynamicNodeConfiguration,
  EnhancedIntegrationNodeType,
  NodeProperty,
  NodePropertyGroup,
  PropertyEvaluationContext,
  PropertyFormState,
  PropertyOption,
  PropertyType,
  PropertyValue,
  TypeOptions,
  ValidationRule,
} from '../types/dynamicProperties';

export type {
  CredentialRequirement,
  Integration,
  IntegrationNodeType,
  NodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../types/integration';

// Node action result interface
export interface NodeActionResult {
  success: boolean;
  data?: any[];
  error?: string | { message: string; code?: string; details?: any };
  metadata?: Record<string, any>;
}

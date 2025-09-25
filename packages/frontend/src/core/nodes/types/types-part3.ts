format?: 'hex' | 'rgb' | 'hsl';
presets?: string[];
}
}

export interface INodeProperty {
  displayName: string;
  name: string;
  type: NodePropertyType;
  default?: any;
  description?: string;
  hint?: string;
  displayOptions?: IDisplayOptions;
  options?: INodePropertyOptions[];
  values?: INodeProperty[];
  placeholder?: string;
  required?: boolean;
  credentialTypes?: string[];
  noDataExpression?: boolean;
  typeOptions?: INodePropertyTypeOptions;
  collection?: INodePropertyCollection[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  routing?: {
    request?: {
      method?: string;
      url?: string;
      body?: any;
      headers?: any;
      qs?: any;
    };
    output?: {
      postReceive?: Array<{
        type: string;
        properties?: any;
      }>;
    };
  };

  // Additional properties used in enhanced property renderer
  collectionSchema?: any;
  label?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  expressionSupport?: 'none' | 'full' | 'partial';
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  iconUrl?: string;
  group: string[];
  version: number;
  subtitle?: string;
  description: string;
  defaults: {
    name: string;
    color?: string;
  };
  inputs: string[] | Array<'main' | 'trigger'>;
  outputs: string[] | Array<'main'>;
  credentials?: Array<{
    name: string;
    required?: boolean;
    displayOptions?: IDisplayOptions;
  }>;
  properties: INodeProperty[];
  documentationUrl?: string;
  categories?: string[];
  eventTriggerDescription?: string;
  activationMessage?: string;
  maxNodes?: number;
  polling?: boolean;
  supportsCORS?: boolean;
  webhooks?: Array<{
    name: string;
    httpMethod: string;
    responseMode: string | 'onReceived';
    path: string;
    restartWebhook?: boolean;
  }>;
  trigger?: () => Promise<any>;
  // Pluggable UI System
  customBodyComponent?: string;
  customPropertiesPanelComponent?: string;
}

export interface INodeExecutionData {
  [key: string]: any;
  json: {
    [key: string]: any;
  };
  binary?: {
    [key: string]: any;
  };
  error?: Error;

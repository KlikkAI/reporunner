import type { INodeType, INodeTypeDescription } from './types';

export interface BaseNodeConfig {
  name: string;
  displayName: string;
  description: string;
  group: string[];
  version: number | number[];
  defaults?: {
    name: string;
    color?: string;
  };
  inputs?: string[];
  outputs?: string[];
  credentials?: Array<{
    name: string;
    required?: boolean;
  }>;
  polling?: boolean;
  webhooks?: Array<{
    name: string;
    httpMethod: string | string[];
    responseMode?: string;
    path: string;
  }>;
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: string;
  required?: boolean;
  default?: any;
  options?: Array<{ name: string; value: any }>;
  placeholder?: string;
  description?: string;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
  typeOptions?: Record<string, any>;
}

/**
 * Base node definition class that eliminates duplication across node definitions.
 * Provides common structure and utilities for creating consistent node types.
 */
export abstract class BaseNodeDefinition implements INodeType {
  description: INodeTypeDescription;

  constructor(config: BaseNodeConfig) {
    this.description = this.createDescription(config);
  }

  /**
   * Create the node description from configuration
   */
  private createDescription(config: BaseNodeConfig): INodeTypeDescription {
    return {
      displayName: config.displayName,
      name: config.name,
      icon: this.getNodeIcon(),
      group: config.group,
      version: Array.isArray(config.version) ? config.version[config.version.length - 1] : config.version,
      description: config.description,
      defaults: {
        name: config.defaults?.name || config.displayName,
        color: config.defaults?.color || this.getDefaultColor(),
      },
      inputs: config.inputs || ['main'],
      outputs: config.outputs || ['main'],
      credentials: config.credentials || [],
      properties: this.getProperties() as any,
      polling: config.polling,
      webhooks: config.webhooks?.map((webhook) => ({
        ...webhook,
        httpMethod: Array.isArray(webhook.httpMethod) ? webhook.httpMethod[0] : webhook.httpMethod,
        responseMode: webhook.responseMode || 'onReceived',
      })),
    };
  }

  /**
   * Get the node icon - override in subclasses
   */
  protected getNodeIcon(): string {
    return 'fa:cog';
  }

  /**
   * Get the default node color - override in subclasses
   */
  protected getDefaultColor(): string {
    return '#1f77b4';
  }

  /**
   * Get node properties - must be implemented by subclasses
   */
  protected abstract getProperties(): NodeProperty[];

  /**
   * Helper method to create common property types
   */
  protected createStringProperty(
    displayName: string,
    name: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'string',
      default: '',
      placeholder: `Enter ${displayName.toLowerCase()}`,
      ...options,
    };
  }

  protected createNumberProperty(
    displayName: string,
    name: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'number',
      default: 0,
      typeOptions: {
        minValue: 0,
      },
      ...options,
    };
  }

  protected createBooleanProperty(
    displayName: string,
    name: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'boolean',
      default: false,
      ...options,
    };
  }

  protected createSelectProperty(
    displayName: string,
    name: string,
    selectOptions: Array<{ name: string; value: any }>,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'options',
      options: selectOptions,
      default: selectOptions[0]?.value,
      ...options,
    };
  }

  protected createTextAreaProperty(
    displayName: string,
    name: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'string',
      typeOptions: {
        rows: 4,
      },
      default: '',
      placeholder: `Enter ${displayName.toLowerCase()}`,
      ...options,
    };
  }

  protected createJsonProperty(
    displayName: string,
    name: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'json',
      default: '{}',
      ...options,
    };
  }

  protected createCredentialProperty(
    _credentialType: string,
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName: 'Credential',
      name: 'credential',
      type: 'credentialsSelect',
      default: '',
      required: true,
      ...options,
    };
  }

  protected createCollectionProperty(
    displayName: string,
    name: string,
    _properties: NodeProperty[],
    options: Partial<NodeProperty> = {}
  ): NodeProperty {
    return {
      displayName,
      name,
      type: 'collection',
      placeholder: 'Add Item',
      default: [],
      typeOptions: {
        multipleValues: true,
      },
      ...options,
    };
  }

  /**
   * Helper to create conditional display options
   */
  protected showWhen(field: string, values: any[]): { show: Record<string, any[]> } {
    return {
      show: {
        [field]: values,
      },
    };
  }

  protected hideWhen(field: string, values: any[]): { hide: Record<string, any[]> } {
    return {
      hide: {
        [field]: values,
      },
    };
  }

  /**
   * Common authentication properties
   */
  protected getApiKeyProperties(): NodeProperty[] {
    return [
      this.createCredentialProperty('apiKey', {
        displayName: 'API Key',
        description: 'API key for authentication',
      }),
    ];
  }

  protected getOAuthProperties(): NodeProperty[] {
    return [
      this.createCredentialProperty('oAuth2', {
        displayName: 'OAuth2 Credential',
        description: 'OAuth2 credential for authentication',
      }),
    ];
  }

  /**
   * Common HTTP request properties
   */
  protected getHttpProperties(): NodeProperty[] {
    return [
      this.createStringProperty('URL', 'url', {
        required: true,
        placeholder: 'https://api.example.com/endpoint',
        description: 'The URL to make the request to',
      }),
      this.createSelectProperty(
        'Method',
        'method',
        [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
        {
          default: 'GET',
          description: 'The HTTP method to use',
        }
      ),
      this.createJsonProperty('Headers', 'headers', {
        description: 'Headers to send with the request',
        default: '{\n  "Content-Type": "application/json"\n}',
      }),
    ];
  }

  /**
   * Common pagination properties
   */
  protected getPaginationProperties(): NodeProperty[] {
    return [
      this.createNumberProperty('Page', 'page', {
        default: 1,
        description: 'Page number to retrieve',
        typeOptions: {
          minValue: 1,
        },
      }),
      this.createNumberProperty('Limit', 'limit', {
        default: 10,
        description: 'Number of items per page',
        typeOptions: {
          minValue: 1,
          maxValue: 100,
        },
      }),
    ];
  }

  /**
   * Common filter properties
   */
  protected getFilterProperties(): NodeProperty[] {
    return [
      this.createStringProperty('Search', 'search', {
        placeholder: 'Search term',
        description: 'Search filter',
      }),
      this.createSelectProperty(
        'Sort By',
        'sortBy',
        [
          { name: 'Created Date', value: 'createdAt' },
          { name: 'Updated Date', value: 'updatedAt' },
          { name: 'Name', value: 'name' },
        ],
        {
          description: 'Field to sort by',
        }
      ),
      this.createSelectProperty(
        'Sort Order',
        'sortOrder',
        [
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' },
        ],
        {
          default: 'desc',
          description: 'Sort order',
        }
      ),
    ];
  }

  /**
   * Common date range properties
   */
  protected getDateRangeProperties(): NodeProperty[] {
    return [
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        placeholder: 'Select start date',
        description: 'Start date for the range',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        placeholder: 'Select end date',
        description: 'End date for the range',
      },
    ];
  }

  /**
   * Execute method - must be implemented by subclasses
   */
  abstract execute(): Promise<any>;
}

export default BaseNodeDefinition;

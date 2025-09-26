level: 'error' | 'warn' | 'info' | 'debug';
database: boolean;
console: boolean;
// Ensure file has a valid TS shape
export interface NodeContext {}
}

// Context Types
export interface IExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  userId?: string;
  organizationId?: string;
  mode: 'manual' | 'trigger' | 'webhook' | 'retry' | 'cli';
  startTime: Date;
  timezone: string;
  workflow: Workflow;
  inputData: NodeExecutionData[];
  getNodeParameter: (parameterName: string, index?: number) => unknown;
  getCredentials: (credentialType: string) => Promise<Record<string, unknown>>;
  helpers: {
    request: (options: any) => Promise<any>;
  };
}

export interface INodeType {
  description: {
    displayName: string;
    name: string;
    group: string[];
    version: number;
    description: string;
    defaults: {
      name: string;
      color?: string;
    };
    inputs: string[];
    outputs: string[];
    properties: NodeProperty[];
    credentials?: CredentialTest[];
    webhooks?: WebhookDescription[];
    polling?: boolean;
  };
  execute: (context: IExecutionContext) => Promise<NodeExecutionData[][]>;
  webhook?: (context: IExecutionContext) => Promise<any>;
  poll?: (context: IExecutionContext) => Promise<NodeExecutionData[][]>;
}

export interface NodeProperty {
  displayName: string;
  name: string;
  type: string;
  default: unknown;
  required?: boolean;
  description?: string;
  options?: Array<{
    name: string;
    value: string | number | boolean;
    description?: string;
  }>;
  displayOptions?: {
    show?: Record<string, unknown[]>;
    hide?: Record<string, unknown[]>;
  };
}

export interface CredentialTest {
  name: string;
  required?: boolean;
}

export interface WebhookDescription {
  name: string;
  httpMethod: string;
  path: string;
  responseMode?: string;
}

pairedItem?:
    | {
        item: number;
input?: number;
}
    | number
}

export interface INodeParameters {
  [key: string]: any;
}

export interface INodeType {
  description: INodeTypeDescription;
  execute?(this: any): Promise<INodeExecutionData[][]>;
  trigger?(this: any): Promise<void>;
  webhook?(this: any): Promise<any>;
  poll?(this: any): Promise<INodeExecutionData[][] | null>;
  test?(this: any): Promise<{ success: boolean; message: string; data?: any }>;
}

export interface ICredentialType {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: INodeProperty[];
  authenticate?: {
    type: string;
    properties: {
      [key: string]: string;
    };
  };
  test?: {
    request: {
      baseURL?: string;
      url?: string;
      headers?: {
        [key: string]: string;
      };
      method?: string;
    };
  };
}

// Enhanced Assignment Value Interface for EditFields
export interface IAssignmentValue {
  id: string; // UUID for tracking
  name: string; // Field name with dot-notation support
  value: NodeParameterValue; // Field value (can be expression)
  type: string; // Inferred or selected type
}

// Lean instance data - this is what gets saved
export interface WorkflowNodeInstance {
  id: string;
  type: string; // References the node type name from INodeTypeDescription
  position: {
    x: number;
    y: number;
  };
  parameters: INodeParameters;
  credentials?: INodeCredentials[];
  disabled?: boolean;
  notes?: string;
  name?: string; // Custom display name for this instance
  notesInFlow?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
  executeOnce?: boolean;

  // Enhanced versioning support
  version?: number;
  typeVersion?: number;
}

// Workflow definition - lean and efficient
export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  active?: boolean;
  nodes: WorkflowNodeInstance[];
  connections: {
    [sourceNodeId: string]: {
      [outputIndex: string]: Array<{
        node: string;
        type: 'main' | string;
        index: number;
      }>;
    };
  };
  settings?: {
    errorWorkflow?: string;
    saveDataErrorExecution?: 'all' | 'none';
    saveDataSuccessExecution?: 'all' | 'none';
    executionTimeout?: number;
    maxExecutionTimeout?: number;
    callerPolicy?: 'any' | 'none' | 'workflowsFromAList' | 'workflowsFromSameOwner';

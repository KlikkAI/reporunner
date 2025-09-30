// Node context types reusing patterns from execution types
export interface NodeContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  userId?: string;
  inputData?: Record<string, any>;
  nodeConfig: Record<string, any>;
  previousNodeResults?: Record<string, any>;
  workflowData?: Record<string, any>;
  credentials?: Record<string, any>;
  logger: {
    level: 'error' | 'warn' | 'info' | 'debug';
    database: boolean;
    console: boolean;
  };
}

// Context Types
export interface IExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  startTime: Date;
  environment: string;
  variables: Record<string, any>;
  settings: {
    timeout: number;
    retryAttempts: number;
    saveExecutionData: boolean;
  };
}

export interface INodeContext extends NodeContext {
  execution: IExecutionContext;
  workflow: {
    id: string;
    name: string;
    version: number;
    nodes: any[];
    connections: any[];
  };
  node: {
    id: string;
    type: string;
    name: string;
    parameters: Record<string, any>;
  };
}

// Helper types for node execution
export interface NodeExecutionContext {
  context: INodeContext;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface WorkflowRuntimeContext {
  executionId: string;
  workflowDefinition: any;
  currentNodeId?: string;
  nodeResults: Map<string, any>;
  globalVariables: Record<string, any>;
  startTime: Date;
  timeout: number;
}

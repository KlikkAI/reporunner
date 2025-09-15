import type { Node } from "reactflow";

export interface WorkflowConnection {
  id: string;
  integrationId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowNodeData {
  label: string;
  integration?: string;
  nodeType?: string;
  configuration?: Record<string, any>; // Node parameters/config
  credentials?: string[]; // Array of credential IDs
  // Frontend-specific properties
  onDelete?: (nodeId: string) => void;
  onConnect?: (sourceNodeId: string) => void;
  onOpenProperties?: (nodeId: string) => void;
  hasOutgoingConnection?: boolean;
  isSelected?: boolean;
  // Properties for registry system integration
  nodeTypeData?: any;
  integrationData?: any;
  config?: Record<string, any>;
  parameters?: Record<string, any>;
  // Additional properties from usage
  name?: string;
  icon?: string;
  enhancedNodeType?: any;
  outputData?: any;
  conditionRules?: any[];
  defaultOutput?: string;
  outputs?: any[];
  provider?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: string;
  query?: string;
  maxResults?: number;
  filters?: any;
  options?: any;
  transformConfig?: any;
  outputFields?: any;
  testResults?: any;
  result?: any;
  notes?: string;
  disabled?: boolean;
}

export interface WorkflowNode extends Node {
  data: WorkflowNodeData;
  name?: string;
  connectionId?: string; // Reference to workflow-specific connection
  credentials?: { id: string; type: string };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: {
    connectionType?: string;
    onDelete?: (edgeId: string) => void;
    [key: string]: any;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  connections: WorkflowConnection[]; // Workflow-specific integration connections
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  status: "active" | "inactive" | "error" | "draft";
  tags?: string[];
  version?: string | number;
  settings?: {
    errorHandling?: "stop" | "continue";
    timeout?: number;
    retryAttempts?: number;
    concurrent?: boolean;
  };
}

export interface WorkflowTemplate
  extends Omit<
    Workflow,
    "id" | "isActive" | "createdAt" | "updatedAt" | "lastRun" | "status"
  > {
  id: string;
  category: string;
  version: string;
  requiredCredentials?: Array<{
    type: string;
    name: string;
    description: string;
  }>;
  features?: string[];
  setupInstructions?: string[];
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Additional types for workflow data compatibility
export interface WorkflowData {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive?: boolean;
  settings?: {
    errorHandling?: "stop" | "continue";
    timeout?: number;
    retryAttempts?: number;
  };
}

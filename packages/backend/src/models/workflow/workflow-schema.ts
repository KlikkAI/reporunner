import mongoose, { type Document, Schema } from 'mongoose';

export interface IWorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    integration?: string;
    nodeType?: string;
    configuration?: Record<string, any>;
    credentials?: string[];
    // Additional fields for frontend compatibility and enhanced functionality
    config?: Record<string, any>;
    parameters?: Record<string, any>;
    icon?: string;
    enhancedNodeType?: Record<string, any>;
    // Legacy fields for backward compatibility
    nodeTypeData?: Record<string, any>;
    integrationData?: Record<string, any>;
    // Condition node specific fields
    conditionRules?: Array<{
      id: string;
      field: string;
      operator: string;
      value: any;
      valueType: 'fixed' | 'expression';
      outputName: string;
      enabled: boolean;
    }>;
    defaultOutput?: string;
    outputs?: Array<{
      id: string;
      label: string;
    }>;
  };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface IWorkflow extends Document {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  isActive: boolean;
  isPublic: boolean;
  tags: string[];
  version: number;
  settings: {
    errorHandling: 'stop' | 'continue';
    timeout: number;
    retryAttempts: number;
    concurrent: boolean;
  };
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecuted?: Date;
    averageExecutionTime?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const workflowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: {
      label: { type: String, required: true },
      integration: { type: String },
      nodeType: { type: String },
      configuration: { type: Schema.Types.Mixed, default: {} },
      credentials: [{ type: String }],
      // Additional fields for frontend compatibility and enhanced functionality
      config: { type: Schema.Types.Mixed, default: {} },
      parameters: { type: Schema.Types.Mixed, default: {} },
      icon: { type: String },
      enhancedNodeType: { type: Schema.Types.Mixed },
      // Legacy fields for backward compatibility
      nodeTypeData: { type: Schema.Types.Mixed },
      integrationData: { type: Schema.Types.Mixed },
      // Condition node specific fields
      conditionRules: [
        {

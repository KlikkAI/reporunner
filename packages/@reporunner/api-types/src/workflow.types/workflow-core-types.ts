import { z } from 'zod';

// Workflow Status
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

// Execution Status
export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  WAITING = 'WAITING',
  PAUSED = 'PAUSED',
}

// Node Types
export enum NodeType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  CONDITIONAL = 'CONDITIONAL',
  LOOP = 'LOOP',
  WEBHOOK = 'WEBHOOK',
  SCHEDULE = 'SCHEDULE',
  HTTP_REQUEST = 'HTTP_REQUEST',
  FUNCTION = 'FUNCTION',
  AI_AGENT = 'AI_AGENT',
  DATA_TRANSFORM = 'DATA_TRANSFORM',
  INTEGRATION = 'INTEGRATION',
}

// Base Node Interface
export interface INode {
  id: string;
  type: NodeType;
  name: string;
  position: {
    x: number;
    y: number;
  };
  properties: Record<string, any>;
  credentials?: string[];
  disabled?: boolean;
  notes?: string;
  continueOnError?: boolean;
  executeOnce?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

// Edge Interface
export interface IEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  type?: 'default' | 'conditional' | 'error';
  label?: string;
  data?: Record<string, any>;
}

// Workflow Interface
export interface IWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: INode[];
  edges: IEdge[];
  status: WorkflowStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  tags?: string[];
  settings?: IWorkflowSettings;
  meta?: Record<string, any>;
}

// Workflow Settings
export interface IWorkflowSettings {
  errorWorkflow?: string;
  timezone?: string;
  timeout?: number;
  maxExecutionTime?: number;
  saveExecutionData?: boolean;
  saveManualExecutions?: boolean;
  retryFailedExecutions?: boolean;
  maxConsecutiveFailures?: number;
  executionOrder?: 'sequential' | 'parallel';
}

// Execution Interface

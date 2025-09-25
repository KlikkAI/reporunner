import mongoose, { type Document, Schema } from 'mongoose';

export interface INodeExecution {
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  retryAttempt: number;
}

export interface IExecution extends Document {
  _id: string;
  workflowId: string;
  userId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timeout';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggerType: 'manual' | 'webhook' | 'schedule' | 'api';
  triggerData?: Record<string, any>;
  nodeExecutions: INodeExecution[];
  totalNodes: number;
  completedNodes: number;
  errorMessage?: string;
  metadata: {
    version: number;
    environment: string;
    userAgent?: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  updateNodeExecution(nodeId: string, update: Partial<INodeExecution>): Promise<IExecution>;
}

const nodeExecutionSchema = new Schema({
  nodeId: { type: String, required: true },
  nodeName: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'error', 'skipped'],
    default: 'pending',
  },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number },
  input: { type: Schema.Types.Mixed },
  output: { type: Schema.Types.Mixed },
  error: {
    message: { type: String },
    stack: { type: String },
    code: { type: String },
  },
  retryAttempt: { type: Number, default: 0 },
});

const executionSchema = new Schema<IExecution>(
  {
    workflowId: {
      type: String,
      required: [true, 'Workflow ID is required'],
      ref: 'Workflow',
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'error', 'cancelled', 'timeout'],
      default: 'pending',
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: { type: Date },
    duration: { type: Number },
    triggerType: {
      type: String,
      enum: ['manual', 'webhook', 'schedule', 'api'],
      required: true,
    },
    triggerData: { type: Schema.Types.Mixed },
    nodeExecutions: [nodeExecutionSchema],
    totalNodes: {
      type: Number,
      required: true,
      min: [1, 'Total nodes must be at least 1'],

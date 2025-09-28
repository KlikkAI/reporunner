import { type IWorkflow } from '@reporunner/api-types';
import { model, Schema } from 'mongoose';

// Extended interface for MongoDB document that includes all fields used in the schema
interface IWorkflowDocument extends IWorkflow {
  isActive: boolean;
  organizationId: string;
  tags: string[];
  createdBy: string;
  version: number;
  metadata?: Record<string, any>;
}


const NodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    label: String,
    inputs: { type: Schema.Types.Mixed },
    outputs: { type: Schema.Types.Mixed },
    config: { type: Schema.Types.Mixed },
  },
  meta: { type: Schema.Types.Mixed },
});

const EdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: String,
  targetHandle: String,
  data: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
});

const WorkflowSettingsSchema = new Schema({
  errorHandling: {
    type: String,
    enum: ['stop', 'continue', 'retry'],
    default: 'stop'
  },
  timeout: Number,
  retryAttempts: Number,
  retryDelay: Number,
  timezone: { type: String, default: 'UTC' },
  saveExecutionData: { type: Boolean, default: true },
  saveSuccessfulExecutions: { type: Boolean, default: true },
  saveFailedExecutions: { type: Boolean, default: true },
  executionTimeout: Number,
});

export const WorkflowSchema = new Schema<IWorkflowDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    settings: WorkflowSettingsSchema,
    isActive: { type: Boolean, default: false, index: true },
    tags: [{ type: String, index: true }],
    createdBy: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    version: { type: Number, default: 1 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'workflows',
  }
);

// Compound indexes
WorkflowSchema.index({ organizationId: 1, createdAt: -1 });
WorkflowSchema.index({ isActive: 1, updatedAt: -1 });
WorkflowSchema.index({ createdBy: 1, isActive: 1 });
WorkflowSchema.index({ tags: 1, isActive: 1 });

// Text index for search
WorkflowSchema.index({ name: 'text', description: 'text' });

// Virtual for execution count (will be populated from executions collection)
WorkflowSchema.virtual('executionCount', {
  ref: 'Execution',
  localField: 'id',
  foreignField: 'workflowId',
  count: true,
});

export const WorkflowModel = model<IWorkflowDocument>('Workflow', WorkflowSchema);

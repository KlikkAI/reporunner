import { type IWorkflow, NodeType, WorkflowStatus } from '@reporunner/api-types';
import { model, Schema } from 'mongoose';

const NodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: Object.values(NodeType), required: true },
  name: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  properties: { type: Schema.Types.Mixed, default: {} },
  credentials: [{ type: String }],
  disabled: { type: Boolean, default: false },
  notes: String,
  continueOnError: { type: Boolean, default: false },
  executeOnce: { type: Boolean, default: false },
  retryOnError: { type: Boolean, default: false },
  maxRetries: { type: Number, default: 3 },
});

const EdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  sourceHandle: String,
  target: { type: String, required: true },
  targetHandle: String,
  type: {
    type: String,
    enum: ['default', 'conditional', 'error'],
    default: 'default',
  },
  label: String,
  data: { type: Schema.Types.Mixed },
});

const WorkflowSettingsSchema = new Schema({
  errorWorkflow: String,
  timezone: { type: String, default: 'UTC' },
  timeout: Number,
  maxExecutionTime: Number,
  saveExecutionData: { type: Boolean, default: true },
  saveManualExecutions: { type: Boolean, default: true },
  retryFailedExecutions: { type: Boolean, default: false },
  maxConsecutiveFailures: { type: Number, default: 5 },
  executionOrder: {
    type: String,
    enum: ['sequential', 'parallel'],
    default: 'sequential',
  },
});

export const WorkflowSchema = new Schema<IWorkflow>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    status: {
      type: String,
      enum: Object.values(WorkflowStatus),
      default: WorkflowStatus.DRAFT,
      index: true,
    },
    version: { type: Number, default: 1 },
    createdBy: { type: String, required: true, index: true },
    updatedBy: String,
    tags: [{ type: String, index: true }],
    settings: WorkflowSettingsSchema,
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'workflows',
  }
);

// Compound indexes
WorkflowSchema.index({ organizationId: 1, createdAt: -1 });
WorkflowSchema.index({ status: 1, updatedAt: -1 });
WorkflowSchema.index({ createdBy: 1, status: 1 });
WorkflowSchema.index({ tags: 1, status: 1 });

// Text index for search
WorkflowSchema.index({ name: 'text', description: 'text' });

// Virtual for execution count (will be populated from executions collection)
WorkflowSchema.virtual('executionCount', {
  ref: 'Execution',
  localField: 'id',
  foreignField: 'workflowId',
  count: true,
});

export const WorkflowModel = model<IWorkflow>('Workflow', WorkflowSchema);

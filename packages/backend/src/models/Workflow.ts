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
          id: { type: String },
          field: { type: String },
          operator: { type: String },
          value: { type: Schema.Types.Mixed },
          valueType: { type: String, enum: ['fixed', 'expression'], default: 'fixed' },
          outputName: { type: String },
          enabled: { type: Boolean, default: true },
        },
      ],
      defaultOutput: { type: String },
      outputs: [
        {
          id: { type: String },
          label: { type: String },
        },
      ],
    },
  },
  { _id: false }
);

const workflowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const workflowSchema = new Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: [100, 'Workflow name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    nodes: [workflowNodeSchema],
    edges: [workflowEdgeSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    settings: {
      errorHandling: {
        type: String,
        enum: ['stop', 'continue'],
        default: 'stop',
      },
      timeout: {
        type: Number,
        default: 300000, // 5 minutes
        min: [1000, 'Timeout must be at least 1 second'],
        max: [1800000, 'Timeout cannot exceed 30 minutes'],
      },
      retryAttempts: {
        type: Number,
        default: 3,
        min: [0, 'Retry attempts cannot be negative'],
        max: [10, 'Maximum 10 retry attempts allowed'],
      },
      concurrent: {
        type: Boolean,
        default: false,
      },
    },
    statistics: {
      totalExecutions: { type: Number, default: 0 },
      successfulExecutions: { type: Number, default: 0 },
      failedExecutions: { type: Number, default: 0 },
      lastExecuted: { type: Date },
      averageExecutionTime: { type: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
workflowSchema.index({ userId: 1 });
workflowSchema.index({ isActive: 1 });
workflowSchema.index({ isPublic: 1 });
workflowSchema.index({ tags: 1 });
workflowSchema.index({ 'statistics.lastExecuted': -1 });

// Virtual for success rate
workflowSchema.virtual('successRate').get(function () {
  if (this.statistics.totalExecutions === 0) return 0;
  return (this.statistics.successfulExecutions / this.statistics.totalExecutions) * 100;
});

// Pre-save middleware to increment version
workflowSchema.pre('save', function (next) {
  if (this.isModified('nodes') || this.isModified('edges')) {
    this.version += 1;
  }
  next();
});

export const Workflow = mongoose.model<IWorkflow>('Workflow', workflowSchema);

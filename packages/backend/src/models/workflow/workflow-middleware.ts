{
  type: String;
}
,
          field:
{
  type: String;
}
,
          operator:
{
  type: String;
}
,
          value:
{
  type: Schema.Types.Mixed;
}
,
          valueType:
{
  type: String,
  enum: ['fixed', 'expression'], default: 'fixed' }
  ,
          outputName:
  type: String;
  ,
          enabled:
  type: Boolean,
  default: true
  ,
}
,
      ],
      defaultOutput:
{
  type: String;
}
,
      outputs: [
{
  type: String;
  ,
          label:
  type: String;
  ,
}
,
      ],
    },
  },
{
  _id: false;
}
)

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

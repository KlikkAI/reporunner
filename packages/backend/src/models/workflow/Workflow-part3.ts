averageExecutionTime: {
  type: Number;
}
,
    },
  },
{
  timestamps: true, toJSON;
  :
  {
    virtuals: true;
  }
  ,
    toObject:
  {
    virtuals: true;
  }
  ,
}
)

// Indexes for performance
workflowSchema.index(
{
  userId: 1;
}
)
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

},
    completedNodes:
{
  type: Number,
  default: 0,
      min: [0, 'Completed nodes cannot be negative'],
}
,
    errorMessage:
{
  type: String;
}
,
    metadata:
{
  type: Number, required;
  : true
  ,
      environment:
  type: String,
  default: process.env.NODE_ENV || 'development',
  ,
      userAgent:
  type: String;
  ,
      ipAddress:
  type: String;
  ,
}
,
  },
{
  timestamps: true, toJSON;
  :
    virtuals: true
  ,
    toObject:
    virtuals: true
  ,
}
)

// Indexes for performance
executionSchema.index(
{
  workflowId: 1, startTime;
  : -1
}
)
executionSchema.index(
{
  userId: 1, startTime;
  : -1
}
)
executionSchema.index(
{
  status: 1;
}
)
executionSchema.index({ triggerType: 1 });
executionSchema.index({ startTime: -1 });

// Virtual for progress percentage
executionSchema.virtual('progress').get(function () {
  if (this.totalNodes === 0) return 0;
  return Math.round((this.completedNodes / this.totalNodes) * 100);
});

// Virtual for success rate
executionSchema.virtual('isSuccessful').get(function () {
  return this.status === 'success';
});

// Pre-save middleware to calculate duration
executionSchema.pre('save', function (next) {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  next();
});

// Method to update node execution
executionSchema.methods.updateNodeExecution = function (
  nodeId: string,
  update: Partial<INodeExecution>
) {
  const nodeExecution = this.nodeExecutions.find((ne: INodeExecution) => ne.nodeId === nodeId);
  if (nodeExecution) {
    Object.assign(nodeExecution, update);

    // Calculate duration if both start and end times are present
    if (nodeExecution.startTime && nodeExecution.endTime) {
      nodeExecution.duration = nodeExecution.endTime.getTime() - nodeExecution.startTime.getTime();
    }

    // Update completed nodes count
    if (update.status === 'success' || update.status === 'error' || update.status === 'skipped') {
      this.completedNodes = this.nodeExecutions.filter((ne: INodeExecution) =>
        ['success', 'error', 'skipped'].includes(ne.status)
      ).length;
    }
  }
  return this.save();
};

// Static method to get execution statistics
executionSchema.statics.getStatistics = async function (workflowId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        workflowId,
        startTime: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        successfulExecutions: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failedExecutions: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        averageDuration: { $avg: '$duration' },
      },
    },
  ]);

  return (
    stats[0] || {
      totalExecutions: 0,

},
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
operationSchema.index(
{
  sessionId: 1, version;
  : 1
}
)
operationSchema.index({ workflowId: 1, createdAt: -1 });
operationSchema.index({ userId: 1, createdAt: -1 });
operationSchema.index({ operationId: 1 }, { unique: true });
operationSchema.index({ status: 1 });
operationSchema.index({ 'target.type': 1, 'target.id': 1 });

// TTL index to cleanup old operations (30 days)
operationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Methods for operational transform
operationSchema.methods.transform = function (_otherOperation: IOperation) {
  // This will be implemented by the OperationalTransform service
  // For now, return a simple transform
  return {
    operation: this,
    transformed: false,
    conflicts: [],
  };
};

operationSchema.methods.compose = function (otherOperation: IOperation) {
  // Compose two operations into one if possible
  if (
    this.target.id === otherOperation.target.id &&
    this.target.type === otherOperation.target.type
  ) {
    return {
      ...this.toObject(),
      data: {
        before: this.data.before,
        after: otherOperation.data.after,
        delta: { ...this.data.delta, ...otherOperation.data.delta },
      },
      version: Math.max(this.version, otherOperation.version),
      transformations: [...this.transformations, ...otherOperation.transformations],
    };
  }
  return null;
};

operationSchema.methods.inverse = function () {
  // Create inverse operation for undo functionality
  return {
    ...this.toObject(),
    operationId: `${this.operationId}_inverse`,
    data: {
      before: this.data.after,
      after: this.data.before,
      delta: this.invertDelta(this.data.delta),
    },
    metadata: {
      ...this.metadata,
      source: 'system',
      timestamp: new Date(),
    },
  };
};

operationSchema.methods.invertDelta = function (delta: any) {
  if (!delta) return null;

  // Simple delta inversion - this would be more complex in practice
  const inverted: any = {};

  for (const [key, value] of Object.entries(delta)) {
    if (typeof value === 'object' && value !== null) {
      inverted[key] = this.invertDelta(value);
    } else {
      // For simple values, we'd need the previous state to create proper inverse
      inverted[key] = null; // This would be properly implemented
    }
  }

  return inverted;
};

export const Operation = mongoose.model<IOperation>('Operation', operationSchema);

lastActivity: {
  type: Date,
  default: Date.now,
}
,
        role:
{
  type: String,
  enum: ['owner', 'editor', 'viewer'],
          default: 'editor',
        }
  ,
        cursor:
  {
    x: {
      type: Number;
    }
    ,
          y:
    {
      type: Number;
    }
    ,
          nodeId:
    {
      type: String;
    }
    ,
  }
  ,
        selection:
  {
    nodeIds: [{ type: String }], edgeIds;
    : [
    {
      type: String;
    }
    ],
  }
  ,
}
,
    ],
    isActive:
{
  type: Boolean,
  default: true,
}
,
    endedAt:
{
  type: Date,
}
,
    currentVersion:
{
  type: Number,
  default: 0,
}
,
    lastActivity:
{
  type: Date,
  default: Date.now,
}
,
    settings:
{
      allowAnonymous: {
        type: Boolean,
        default: false,
      },
      maxParticipants: {
        type: Number,
        default: 10,
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
      autoSaveInterval: {
        type: Number,
        default: 5, // 5 minutes
      },
      conflictResolution: {
        type: String,
        enum: ['last-write-wins', 'operational-transform', 'manual'],
        default: 'operational-transform',
      },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
    },
    metadata: {
      totalOperations: {
        type: Number,
        default: 0,
      },
      totalConflicts: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
collaborationSessionSchema.index({ workflowId: 1 });
collaborationSessionSchema.index({ sessionId: 1 }, { unique: true });
collaborationSessionSchema.index({ ownerId: 1 });
collaborationSessionSchema.index({ organizationId: 1 });
collaborationSessionSchema.index({ status: 1 });
collaborationSessionSchema.index({ lastActivity: 1 });

// TTL index to automatically cleanup old sessions (7 days)
collaborationSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Virtual for active participants
collaborationSessionSchema.virtual('activeParticipants').get(function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.participants.filter((p) => p.lastSeen > fiveMinutesAgo);

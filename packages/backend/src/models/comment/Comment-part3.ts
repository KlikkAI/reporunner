type: Number,
},
            endIndex:
{
  type: Number,
}
,
          },
        ],
      },
    ],
    visibility:
{
      type: String,
      enum: ['public', 'private', 'team'],
      default: 'public',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    resolvedBy: {
      type: String,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    editHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        previousContent: {
          type: String,
          required: true,
        },
        editedBy: {
          type: String,
          required: true,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
commentSchema.index({ workflowId: 1, createdAt: -1 });
commentSchema.index({ sessionId: 1 });
commentSchema.index({ authorId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ 'position.nodeId': 1 });
commentSchema.index({ 'position.edgeId': 1 });
commentSchema.index({ tags: 1 });

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
});

// Virtual for author information
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true,
});

// Methods
commentSchema.methods.addReply = function (replyData: any) {
  this.thread.push({
    ...replyData,
    timestamp: new Date(),
  });
  return this.save();
};

commentSchema.methods.addReaction = function (userId: string, reactionType: string) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter((r: any) => r.userId !== userId);

  // Add new reaction
  this.reactions.push({
    userId,
    type: reactionType,

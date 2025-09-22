/**
 * Comment Model for workflow collaboration
 * Supports threaded discussions and annotations
 */

import mongoose, { type Document, Schema } from 'mongoose';

export interface IComment extends Document {
  _id: string;
  workflowId: string;
  sessionId?: string;
  authorId: string;
  parentCommentId?: string; // For threaded replies
  content: string;
  mentions: Array<{
    userId: string;
    userName: string;
    startIndex: number;
    endIndex: number;
  }>;
  attachments: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>;
  position?: {
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  };
  status: 'open' | 'resolved' | 'closed';
  reactions: Array<{
    userId: string;
    type: '👍' | '👎' | '❤️' | '😂' | '😮' | '😢' | '😡';
    timestamp: Date;
  }>;
  thread: Array<{
    authorId: string;
    content: string;
    timestamp: Date;
    edited?: Date;
    mentions?: Array<{
      userId: string;
      userName: string;
      startIndex: number;
      endIndex: number;
    }>;
  }>;
  visibility: 'public' | 'private' | 'team';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  resolvedBy?: string;
  resolvedAt?: Date;
  editHistory: Array<{
    timestamp: Date;
    previousContent: string;
    editedBy: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    workflowId: {
      type: String,
      required: true,
      ref: 'Workflow',
    },
    sessionId: {
      type: String,
      ref: 'CollaborationSession',
    },
    authorId: {
      type: String,
      required: true,
      ref: 'User',
    },
    parentCommentId: {
      type: String,
      ref: 'Comment',
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    mentions: [
      {
        userId: {
          type: String,
          required: true,
          ref: 'User',
        },
        userName: {
          type: String,
          required: true,
        },
        startIndex: {
          type: Number,
          required: true,
        },
        endIndex: {
          type: Number,
          required: true,
        },
      },
    ],
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'file', 'link'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
        },
        mimeType: {
          type: String,
        },
      },
    ],
    position: {
      x: {
        type: Number,
      },
      y: {
        type: Number,
      },
      nodeId: {
        type: String,
      },
      edgeId: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
    reactions: [
      {
        userId: {
          type: String,
          required: true,
          ref: 'User',
        },
        type: {
          type: String,
          enum: ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    thread: [
      {
        authorId: {
          type: String,
          required: true,
          ref: 'User',
        },
        content: {
          type: String,
          required: true,
          maxlength: 5000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        edited: {
          type: Date,
        },
        mentions: [
          {
            userId: {
              type: String,
              ref: 'User',
            },
            userName: {
              type: String,
            },
            startIndex: {
              type: Number,
            },
            endIndex: {
              type: Number,
            },
          },
        ],
      },
    ],
    visibility: {
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
    timestamp: new Date(),
  });

  return this.save();
};

commentSchema.methods.removeReaction = function (userId: string) {
  this.reactions = this.reactions.filter((r: any) => r.userId !== userId);
  return this.save();
};

commentSchema.methods.resolve = function (resolvedBy: string) {
  this.status = 'resolved';
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

commentSchema.methods.edit = function (newContent: string, editedBy: string) {
  // Store edit history
  this.editHistory.push({
    timestamp: new Date(),
    previousContent: this.content,
    editedBy,
  });

  this.content = newContent;
  return this.save();
};

// Pre-save middleware to validate mentions
commentSchema.pre('save', function (next) {
  // Validate that mention indices are within content bounds
  for (const mention of this.mentions) {
    if (mention.startIndex < 0 || mention.endIndex > this.content.length) {
      next(new Error('Invalid mention indices'));
      return;
    }
  }
  next();
});

export const Comment = mongoose.model<IComment>('Comment', commentSchema);

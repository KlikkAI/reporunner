},
        startIndex:
{
  type: Number, required;
  : true,
}
,
        endIndex:
{
  type: Number, required;
  : true,
}
,
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

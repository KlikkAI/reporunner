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
          String,
          enum: ['image', 'file', 'link'],
          required: true,
        },
        url: 
          String,
          required: true,,
        name: 
          String,
          required: true,,
        size: 
          Number,,
        mimeType: 
          String,,,
    ],
    position: 
        type: Number,,
      y: 
        type: Number,,
      nodeId: 
        type: String,,
      edgeId: 
        type: String,,,
    status: 
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
    reactions: [
          type: String,
          required: true,
          ref: 'User',,
          String,
          enum: ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'],
          required: true,
        },
        timestamp: 
          Date,
          default: Date.now,,,
    ],
    thread: [
          type: String,
          required: true,
          ref: 'User',,
        content: 
          type: String,
          required: true,
          maxlength: 5000,,
        timestamp: 
          type: Date,
          default: Date.now,,
        edited: 
          type: Date,,
        mentions: [
              type: String,
              ref: 'User',,
            userName: 
              type: String,,
            startIndex:

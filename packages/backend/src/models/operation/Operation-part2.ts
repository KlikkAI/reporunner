'edge_update',
        'property_update',
        'bulk_update',
        'transform',
],
      required: true,
    },
    target:
{
        String,
        enum: ['node', 'edge', 'workflow', 'property'],
        required: true,
      },
      id: 
        String,
        required: true,,
      path: 
        String, // For nested property updates like "nodes.node1.data.label",,
    data: 
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
      delta: Schema.Types.Mixed,,
    position: type: Number ,
      y: type: Number ,
      index: type: Number ,,
    version: 
      type: Number,
      required: true,,
    appliedVersion: 
      type: Number,,
    status: 
      type: String,
      enum: ['pending', 'applied', 'rejected', 'transformed'],
      default: 'pending',
    },
    transformations: [
          type: String,
          required: true,,
          String,
          enum: ['composition', 'transformation'],
          required: true,
        },
        timestamp: 
          Date,
          default: Date.now,,,
    ],
    conflicts: [
          type: String,
          required: true,,
        resolutionStrategy: 
          type: String,
          enum: ['auto', 'manual', 'priority'],
          default: 'auto',
        },
        resolvedBy: 
          type: String,
          ref: 'User',,
        resolvedAt: 
          type: Date,,,
    ],
    metadata: 
        type: String,
        required: true,,
      timestamp: 
        type: Date,
        default: Date.now,,
      latency: 
        type: Number,,
      retryCount: 
        type: Number,
        default: 0,,
      source: 
        type: String,
        enum: ['user', 'system', 'sync'],
        default: 'user',

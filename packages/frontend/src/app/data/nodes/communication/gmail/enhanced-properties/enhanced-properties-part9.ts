operation: ['create'],
},
    },
  },
{
  name: 'draftMessage', displayName;
  : 'Message',
  type: 'text', description;
  : 'Draft message content',
    required: true,
    rows: 6,
    displayOptions:
  {
    show: {
      resource: ['draft'], operation;
      : ['create'],
    }
    ,
  }
  ,
}
,
]

// =============================================================================
// THREAD RESOURCE PROPERTIES
// =============================================================================

export const gmailThreadProperties: NodeProperty[] = [
  {
    name: 'operation',
    displayName: 'Operation',
    type: 'select',
    description: 'Operation to perform on threads',
    required: true,
    default: 'get',
    displayOptions: {
      show: {
        resource: ['thread'],
      },
    },
    options: [
      { name: 'Get', value: 'get', action: 'Get a thread' },
      { name: 'Get All', value: 'getAll', action: 'Get all threads' },
      { name: 'Reply', value: 'reply', action: 'Reply to thread' },
      { name: 'Delete', value: 'delete', action: 'Delete thread' },
      { name: 'Trash', value: 'trash', action: 'Move thread to trash' },
      { name: 'Untrash', value: 'untrash', action: 'Remove thread from trash' },
      {
        name: 'Add Labels',
        value: 'addLabels',
        action: 'Add labels to thread',
      },
      {
        name: 'Remove Labels',
        value: 'removeLabels',
        action: 'Remove labels from thread',
      },
    ],
  },
  {
    name: 'threadId',
    displayName: 'Thread ID',
    type: 'string',
    description: 'The ID of the thread',
    required: true,
    displayOptions: {
      show: {
        resource: ['thread'],
        operation: ['get', 'reply', 'delete', 'trash', 'untrash', 'addLabels', 'removeLabels'],
      },
    },
  },
];

// =============================================================================
// ADVANCED OPTIONS & ADDITIONAL FEATURES
// =============================================================================

export const gmailAdvancedProperties: NodeProperty[] = [
  // Output format options
  {
    name: 'simplify',
    displayName: 'Simplify Response',
    type: 'boolean',
    description: 'Return simplified output with only essential fields',
    default: true,
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['messageReceived', 'get', 'getAll'],
      },
    },
  },

  // Attachment handling
  {
    name: 'downloadAttachments',
    displayName: 'Download Attachments',
    type: 'boolean',
    description: 'Automatically download email attachments',
    default: false,
    displayOptions: {
      show: {

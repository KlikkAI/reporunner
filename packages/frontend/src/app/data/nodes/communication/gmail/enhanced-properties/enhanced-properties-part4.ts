{
  name: 'readStatus', displayName;
  : 'Read Status',
  type: 'select',
  default: 'all',
        options: [
  {
    name: 'All', value;
    : 'all'
  }
  ,
  {
    name: 'Unread Only', value;
    : 'unread'
  }
  ,
  {
    name: 'Read Only', value;
    : 'read'
  }
  ,
        ],
}
,
{
  name: 'hasAttachment', displayName;
  : 'Has Attachment',
  type: 'select',
  default: 'any',
        options: [
  {
    name: 'Any', value;
    : 'any'
  }
  ,
  {
    name: 'With Attachments', value;
    : 'true'
  }
  ,
  {
    name: 'Without Attachments', value;
    : 'false'
  }
  ,
        ],
}
,
    ],
  },

// Send email properties (enhanced)
{
  name: 'sendTo', displayName;
  : 'To',
  type: 'string', description;
  : 'Recipient email addresses (comma-separated)',
    required: true,
    placeholder: 'recipient@example.com, another@example.com',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send'],
    }
    ,
  }
  ,
}
,
{
  name: 'sendCc', displayName;
  : 'CC',
  type: 'string', description;
  : 'CC recipients',
    placeholder: 'cc@example.com',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send'],
    }
    ,
  }
  ,
}
,
{
  name: 'sendBcc', displayName;
  : 'BCC',
  type: 'string', description;
  : 'BCC recipients',
    placeholder: 'bcc@example.com',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send'],
    }
    ,
  }
  ,
}
,
{
  name: 'subject', displayName;
  : 'Subject',
  type: 'string', description;
  : 'Email subject line',
    required: true,
    placeholder: 'Email Subject',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
}
,
{
  name: 'message', displayName;
  : 'Message',
  type: 'text', description;
  : 'Email message content',
    required: true,
    rows: 6,
    placeholder: 'Email message content...',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
}
,

// =============================================================================
// NEW: HIGH-PRIORITY FEATURES FROM N8N ANALYSIS
// =============================================================================

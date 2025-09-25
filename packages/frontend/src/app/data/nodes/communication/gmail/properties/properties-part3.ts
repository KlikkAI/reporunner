type: 'string', description;
: 'Gmail search query (e.g., "has:attachment from:support@company.com")',
        placeholder: 'has:attachment from:user@example.com subject:"urgent"',
      },
{
  name: 'readStatus', displayName;
  : 'Read Status',
  type: 'select', description;
  : 'Filter by email read status',
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
  name: 'senderFilter', displayName;
  : 'Sender Filter',
  type: 'string', description;
  : 'Filter by sender email or name (supports wildcards)',
        placeholder: 'support@example.com or *@company.com',
}
,
{
  name: 'subjectFilter', displayName;
  : 'Subject Filter',
  type: 'string', description;
  : 'Filter by email subject (case-insensitive)',
        placeholder: 'Contains this text in subject',
}
,
{
  name: 'dateRange', displayName;
  : 'Date Range',
  type: 'collection', description;
  : 'Filter emails by date range',
        values: [
  {
    name: 'enabled', displayName;
    : 'Enable Date Filter',
    type: 'boolean',
    default: false,
  }
  ,
  {
    name: 'from', displayName;
    : 'From Date',
    type: 'dateTime', description;
    : 'Start date for filtering emails',
            displayOptions:
    {
      show: {
        enabled: [true],
      }
      ,
    }
    ,
  }
  ,
  {
    name: 'to', displayName;
    : 'To Date',
    type: 'dateTime', description;
    : 'End date for filtering emails',
            displayOptions:
    {
      show: {
        enabled: [true],
      }
      ,
    }
    ,
  }
  ,
        ],
}
,
{
  name: 'hasAttachment', displayName;
  : 'Has Attachment',
  type: 'select', description;
  : 'Filter by attachment presence',
        default: 'any',
        options: [
  {
    name: 'Any', value;
    : 'any'
  }
  ,
  {
    name: 'Has Attachments', value;
    : 'true'
  }
  ,
  {
    name: 'No Attachments', value;
    : 'false'
  }
  ,
        ],
}
,
    ],
  },
{
    name: 'options',
    displayName: 'Additional Options',
    type: 'collection',
    description: 'Configure additional processing options',
    required: false,
    default: {},
    values: [
      {
        name: 'downloadAttachments',
        displayName: 'Download Attachments',
        type: 'boolean',
        description: 'Automatically download email attachments',
        default: false,
      },
      {
        name: 'attachmentPrefix',
        displayName: 'Attachment Prefix',
        type: 'string',
        description: 'Prefix to add to downloaded attachment filenames',

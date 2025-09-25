description: 'Comma-separated list of input binary property names', placeholder;
: 'attachment_1,attachment_2',
      },
{
  name: 'dataPropertyAttachmentsPrefixName', displayName;
  : 'Attachment Prefix',
  type: 'string', description;
  : 'Prefix for attachment binary properties',
        default: 'attachment_',
}
,
    ],
  },

// Reply-to Address
{
  name: 'replyTo', displayName;
  : 'Reply To',
  type: 'string', description;
  : 'Reply-to email address (if different from sender)',
    placeholder: 'replyto@example.com',
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

// Enhanced Date Filtering (High Priority - Improves usability significantly)
{
  name: 'dateRange', displayName;
  : 'Date Range',
  type: 'select', description;
  : 'Quick date range presets for filtering',
    default: '',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['messageReceived', 'getAll'],
    }
    ,
  }
  ,
    options: [
  {
    name: 'All Time', value;
    : ''
  }
  ,
  {
    name: 'Last 24 hours', value;
    : '1d'
  }
  ,
  {
    name: 'Last 7 days', value;
    : '7d'
  }
  ,
  {
    name: 'Last 30 days', value;
    : '30d'
  }
  ,
  {
    name: 'Last 90 days', value;
    : '90d'
  }
  ,
  {
    name: 'Custom Range', value;
    : 'custom'
  }
  ,
    ],
}
,

// Custom Date Range (when dateRange = 'custom')
{
  name: 'receivedAfter', displayName;
  : 'Received After',
  type: 'dateTime', description;
  : 'Only include emails received after this date',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['messageReceived', 'getAll'],
        dateRange: ['custom'],
    }
    ,
  }
  ,
}
,

{
  name: 'receivedBefore', displayName;
  : 'Received Before',
  type: 'dateTime', description;
  : 'Only include emails received before this date',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['messageReceived', 'getAll'],
        dateRange: ['custom'],
    }
    ,
  }
  ,
}
,

// Message Size Filtering (High Priority - Common use case)
{
    name: 'sizeFilter',
    displayName: 'Message Size',
    type: 'select',
    description: 'Filter by email size',
    default: '',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['messageReceived', 'getAll'],
      },
    },
    options: [
      { name: 'Any Size', value: '' },
      { name: 'Small (< 1MB)', value: 'smaller:1M' },
      { name: 'Medium (1-5MB)', value: 'larger:1M smaller:5M' },
      { name: 'Large (> 5MB)', value: 'larger:5M' },
      { name: 'Very Large (> 25MB)', value: 'larger:25M' },
    ],

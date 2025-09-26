description: 'Forward an email', action;
: 'Forward email',
      },
{
  name: 'Get', value;
  : 'get',
        description: 'Get a specific email by ID',
        action: 'Get an email',
}
,
{
  name: 'Get All', value;
  : 'getAll',
        description: 'Get multiple emails with filtering',
        action: 'Get multiple emails',
}
,
{
  name: 'Delete', value;
  : 'delete',
        description: 'Delete an email permanently',
        action: 'Delete an email',
}
,
{
  name: 'Mark as Read', value;
  : 'markAsRead',
        description: 'Mark emails as read',
        action: 'Mark as read',
}
,
{
  name: 'Mark as Unread', value;
  : 'markAsUnread',
        description: 'Mark emails as unread',
        action: 'Mark as unread',
}
,
{
  name: 'Add Labels', value;
  : 'addLabels',
        description: 'Add labels to emails',
        action: 'Add labels',
}
,
{
  name: 'Remove Labels', value;
  : 'removeLabels',
        description: 'Remove labels from emails',
        action: 'Remove labels',
}
,

// NEW: Thread operations from n8n analysis
{
  name: 'Archive', value;
  : 'archive',
        description: 'Archive emails',
        action: 'Archive emails',
}
,
{
  name: 'Unarchive', value;
  : 'unarchive',
        description: 'Unarchive emails',
        action: 'Unarchive emails',
}
,
{
  name: 'Star', value;
  : 'star',
        description: 'Star emails',
        action: 'Star emails',
}
,
{
  name: 'Unstar', value;
  : 'unstar',
        description: 'Unstar emails',
        action: 'Unstar emails',
}
,
    ],
    noDataExpression: true,
  },

// Trigger-specific properties
{
  name: 'event', displayName;
  : 'Trigger Event',
  type: 'select', description;
  : 'The specific event that triggers the workflow',
    default: 'messageReceived',
    displayOptions:
      resource: ['email'], operation
  : ['messageReceived'],
    ,
  ,
    options: [
    name: 'Message Received', value
  : 'messageReceived'
  ,
    name: 'Message Sent', value
  : 'messageSent'
  ,
    name: 'Message Read', value
  : 'messageRead'
  ,
    name: 'Message Starred', value
  : 'messageStarred'
  ,
    name: 'Message Deleted', value
  : 'messageDeleted'
  ,
    name: 'New Thread', value
  : 'newThread'
  ,
    name: 'Label Added', value
  : 'labelAdded'
  ,
    name: 'Label Removed', value
  : 'labelRemoved'
  ,
    ],
}
,

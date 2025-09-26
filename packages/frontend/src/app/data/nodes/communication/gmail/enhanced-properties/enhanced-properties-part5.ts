// Email Priority (High Priority - Basic user need)
{
  name: 'priority', displayName;
  : 'Priority',
  type: 'select', description;
  : 'Email priority level',
    default: 'normal',
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
    options: [
    name: 'High', value
  : 'high'
  ,
    name: 'Normal', value
  : 'normal'
  ,
    name: 'Low', value
  : 'low'
  ,
    ],
}
,

// Scheduled Send Time (High Priority - Very requested feature)
{
  name: 'scheduledSendTime', displayName;
  : 'Send At',
  type: 'dateTime', description;
  : 'Schedule email to be sent at specific time (leave empty to send immediately)',
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
}
,

// Email Templates (High Priority - Major workflow improvement)
{
  name: 'emailTemplate', displayName;
  : 'Email Template',
  type: 'select', description;
  : 'Select a predefined email template',
    default: '',
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
    typeOptions:
    loadOptionsMethod: 'getEmailTemplates',
  ,
}
,

// Read Receipt (Business communication need)
{
  name: 'requestReadReceipt', displayName;
  : 'Request Read Receipt',
  type: 'boolean', description;
  : 'Request read receipt from recipients',
    default: false,
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
}
,

// Include Signature
{
  name: 'includeSignature', displayName;
  : 'Include Signature',
  type: 'boolean', description;
  : 'Include Gmail signature in sent emails',
    default: true,
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
}
,

// Enhanced Attachment Options
{
    name: 'attachments',
    displayName: 'Attachments',
    type: 'collection',
    description: 'Email attachments configuration',
    default: ,
    displayOptions: 
        resource: ['email'],
        operation: ['send', 'reply', 'forward'],,,
    values: [
        name: 'attachmentsBinary',
        displayName: 'Attachment Binary Properties',
        type: 'string',

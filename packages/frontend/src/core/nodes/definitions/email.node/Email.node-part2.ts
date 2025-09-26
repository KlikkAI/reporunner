name: 'subject', type;
: 'string',
        default: '',
        required: true,
        displayOptions:
{
  operation: ['send'],
  ,
}
,
        description: 'Email subject line',
        placeholder: 'Your email subject here',
      },
{
  displayName: 'Message Type', name;
  : 'messageType',
  type: 'options',
  default: 'text',
        displayOptions:
      operation: ['send'],
    ,
  ,
        options: [
    name: 'Plain Text', value
  : 'text',
  ,
    name: 'HTML', value
  : 'html',
  ,
        ],
        description: 'Format of the email message',
}
,
{
  displayName: 'Message', name;
  : 'message',
  type: 'text',
  default: '',
        required: true,
        displayOptions:
      operation: ['send'],
    ,
  ,
        description: 'Email message content',
        placeholder: 'Your email message here...',
}
,
{
  displayName: 'Mailbox', name;
  : 'mailbox',
  type: 'string',
  default: 'INBOX',
        displayOptions:
      operation: ['read'],
    ,
  ,
        description: 'Mailbox to read from',
        placeholder: 'INBOX, Sent, Draft',
}
,
{
  displayName: 'Read Mode', name;
  : 'readMode',
  type: 'options',
  default: 'unread',
        displayOptions:
      operation: ['read'],
    ,
  ,
        options: [
    name: 'Unread Only', value
  : 'unread',
            description: 'Only fetch unread emails',
  ,
    name: 'All Emails', value
  : 'all',
            description: 'Fetch all emails',
  ,
    name: 'Recent', value
  : 'recent',
            description: 'Fetch recent emails',
  ,
        ],
        description: 'Which emails to read',
}
,
{
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 10,
        min: 1,
        max: 100,
        displayOptions: 
            operation: ['read'],

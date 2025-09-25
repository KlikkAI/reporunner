placeholder: 'gmail_', displayOptions;
:
{
  show: {
    downloadAttachments: [true],
  }
  ,
}
,
      },
{
  name: 'maxAttachmentSize', displayName;
  : 'Max Attachment Size (MB)',
  type: 'number', description;
  : 'Maximum size of attachments to download (in MB)',
        default: 10,
        min: 1,
        max: 25,
        displayOptions:
  {
    show: {
      downloadAttachments: [true],
    }
    ,
  }
  ,
}
,
{
  name: 'maxResults', displayName;
  : 'Max Results',
  type: 'number', description;
  : 'Maximum number of emails to process per poll',
        default: 1,
        min: 1,
        max: 500,
}
,
{
  name: 'markAsRead', displayName;
  : 'Mark as Read',
  type: 'boolean', description;
  : 'Automatically mark processed emails as read',
        default: false,
}
,
{
  name: 'addLabel', displayName;
  : 'Add Label',
  type: 'string', description;
  : 'Label to add to processed emails',
        placeholder: 'processed',
}
,
    ],
  },
]

// Gmail Send Email Properties
export const gmailSendProperties: NodeProperty[] = [
  {
    name: 'operation',
    displayName: 'Operation',
    type: 'select',
    description: 'Operation to perform',
    required: true,
    default: 'send',
    options: [
      { name: 'Send Email', value: 'send' },
      { name: 'Send Reply', value: 'reply' },
      { name: 'Forward Email', value: 'forward' },
    ],
  },
  {
    name: 'to',
    displayName: 'To',
    type: 'string',
    description: 'Recipient email addresses (comma-separated)',
    required: true,
    placeholder: 'recipient@example.com, another@example.com',
    displayOptions: {
      show: {
        operation: ['send'],
      },
    },
  },
  {
    name: 'cc',
    displayName: 'CC',
    type: 'string',
    description: 'CC email addresses (comma-separated)',
    required: false,
    placeholder: 'cc@example.com',
    displayOptions: {
      show: {
        operation: ['send'],
      },
    },
  },
  {
    name: 'bcc',
    displayName: 'BCC',
    type: 'string',
    description: 'BCC email addresses (comma-separated)',
    required: false,
    placeholder: 'bcc@example.com',
    displayOptions: {
      show: {
        operation: ['send'],
      },

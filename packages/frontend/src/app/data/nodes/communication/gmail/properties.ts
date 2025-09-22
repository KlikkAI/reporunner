// Gmail Node - Dynamic Properties Configuration

import type { NodeProperty } from '@/core/types/dynamicProperties';

// Gmail Trigger Properties
export const gmailTriggerProperties: NodeProperty[] = [
  {
    name: 'credential',
    displayName: 'Credential to connect with',
    type: 'credentialsSelect',
    description: 'Gmail OAuth2 credentials for accessing the API',
    required: true,
    credentialTypes: ['gmailOAuth2'],
    default: '',
  },
  {
    name: 'event',
    displayName: 'Event',
    type: 'select',
    description: 'The event that triggers the workflow',
    required: true,
    default: 'messageReceived',
    options: [
      { name: 'Message Received', value: 'messageReceived' },
      { name: 'Message Sent', value: 'messageSent' },
      { name: 'Message Read', value: 'messageRead' },
      { name: 'Message Starred', value: 'messageStarred' },
      { name: 'Message Deleted', value: 'messageDeleted' },
      { name: 'New Thread', value: 'newThread' },
      { name: 'Label Added', value: 'labelAdded' },
      { name: 'Label Removed', value: 'labelRemoved' },
    ],
  },
  {
    name: 'pollTimes',
    displayName: 'Poll Times',
    type: 'collection',
    description: 'Configure when to check for emails with hierarchical time selection',
    required: false,
    default: {
      mode: 'everyMinute',
    },
    values: [
      {
        name: 'mode',
        displayName: 'Polling Frequency',
        type: 'select',
        description: 'How often to check for new emails',
        required: true,
        default: 'everyMinute',
        options: [
          { name: 'Every Minute', value: 'everyMinute' },
          { name: 'Every Hour', value: 'everyHour' },
          { name: 'Every Day', value: 'everyDay' },
          { name: 'Every Week', value: 'everyWeek' },
          { name: 'Every Month', value: 'everyMonth' },
          { name: 'Custom Interval', value: 'customInterval' },
          { name: 'Custom Cron', value: 'customCron' },
        ],
      },
      {
        name: 'intervalMinutes',
        displayName: 'Interval (Minutes)',
        type: 'number',
        description: 'Check every X minutes',
        min: 1,
        max: 1440,
        default: 5,
        displayOptions: {
          show: {
            mode: ['customInterval'],
          },
        },
      },
      {
        name: 'minute',
        displayName: 'Minute',
        type: 'number',
        description: 'Minute of the hour (0-59)',
        min: 0,
        max: 59,
        default: 0,
        displayOptions: {
          show: {
            mode: ['everyHour', 'everyDay', 'everyWeek', 'everyMonth'],
          },
        },
      },
      {
        name: 'hour',
        displayName: 'Hour',
        type: 'number',
        description: 'Hour of the day (0-23)',
        min: 0,
        max: 23,
        default: 9,
        displayOptions: {
          show: {
            mode: ['everyDay', 'everyWeek', 'everyMonth'],
          },
        },
      },
      {
        name: 'weekday',
        displayName: 'Day of Week',
        type: 'select',
        description: 'Which day of the week',
        default: 1,
        options: [
          { name: 'Monday', value: 1 },
          { name: 'Tuesday', value: 2 },
          { name: 'Wednesday', value: 3 },
          { name: 'Thursday', value: 4 },
          { name: 'Friday', value: 5 },
          { name: 'Saturday', value: 6 },
          { name: 'Sunday', value: 0 },
        ],
        displayOptions: {
          show: {
            mode: ['everyWeek'],
          },
        },
      },
      {
        name: 'dayOfMonth',
        displayName: 'Day of Month',
        type: 'number',
        description: 'Day of the month (1-31)',
        min: 1,
        max: 31,
        default: 1,
        displayOptions: {
          show: {
            mode: ['everyMonth'],
          },
        },
      },
      {
        name: 'cronExpression',
        displayName: 'Cron Expression',
        type: 'string',
        description: 'Custom cron expression (e.g., "0 9 * * MON" for 9 AM every Monday)',
        placeholder: '0 9 * * MON',
        displayOptions: {
          show: {
            mode: ['customCron'],
          },
        },
      },
    ],
  },
  {
    name: 'simplify',
    displayName: 'Simplify Response',
    type: 'boolean',
    description: 'Return simplified email data with only essential fields',
    default: true,
  },
  {
    name: 'filters',
    displayName: 'Email Filters',
    type: 'collection',
    description: 'Configure filters to only process emails that match specific criteria',
    required: false,
    default: {},
    values: [
      {
        name: 'includeSpamTrash',
        displayName: 'Include Spam and Trash',
        type: 'boolean',
        description: 'Include emails from spam and trash folders',
        default: false,
      },
      {
        name: 'includeDrafts',
        displayName: 'Include Drafts',
        type: 'boolean',
        description: 'Include draft emails',
        default: false,
      },
      {
        name: 'labelNamesOrIds',
        displayName: 'Label Names or IDs',
        type: 'multiOptions',
        description: 'Filter by specific Gmail labels',
        options: [
          { name: 'INBOX', value: 'INBOX' },
          { name: 'SENT', value: 'SENT' },
          { name: 'DRAFT', value: 'DRAFT' },
          { name: 'SPAM', value: 'SPAM' },
          { name: 'TRASH', value: 'TRASH' },
          { name: 'IMPORTANT', value: 'IMPORTANT' },
          { name: 'STARRED', value: 'STARRED' },
          { name: 'UNREAD', value: 'UNREAD' },
        ],
        default: ['INBOX'],
      },
      {
        name: 'search',
        displayName: 'Search Query',
        type: 'string',
        description: 'Gmail search query (e.g., "has:attachment from:support@company.com")',
        placeholder: 'has:attachment from:user@example.com subject:"urgent"',
      },
      {
        name: 'readStatus',
        displayName: 'Read Status',
        type: 'select',
        description: 'Filter by email read status',
        default: 'all',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Unread Only', value: 'unread' },
          { name: 'Read Only', value: 'read' },
        ],
      },
      {
        name: 'senderFilter',
        displayName: 'Sender Filter',
        type: 'string',
        description: 'Filter by sender email or name (supports wildcards)',
        placeholder: 'support@example.com or *@company.com',
      },
      {
        name: 'subjectFilter',
        displayName: 'Subject Filter',
        type: 'string',
        description: 'Filter by email subject (case-insensitive)',
        placeholder: 'Contains this text in subject',
      },
      {
        name: 'dateRange',
        displayName: 'Date Range',
        type: 'collection',
        description: 'Filter emails by date range',
        values: [
          {
            name: 'enabled',
            displayName: 'Enable Date Filter',
            type: 'boolean',
            default: false,
          },
          {
            name: 'from',
            displayName: 'From Date',
            type: 'dateTime',
            description: 'Start date for filtering emails',
            displayOptions: {
              show: {
                enabled: [true],
              },
            },
          },
          {
            name: 'to',
            displayName: 'To Date',
            type: 'dateTime',
            description: 'End date for filtering emails',
            displayOptions: {
              show: {
                enabled: [true],
              },
            },
          },
        ],
      },
      {
        name: 'hasAttachment',
        displayName: 'Has Attachment',
        type: 'select',
        description: 'Filter by attachment presence',
        default: 'any',
        options: [
          { name: 'Any', value: 'any' },
          { name: 'Has Attachments', value: 'true' },
          { name: 'No Attachments', value: 'false' },
        ],
      },
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
        placeholder: 'gmail_',
        displayOptions: {
          show: {
            downloadAttachments: [true],
          },
        },
      },
      {
        name: 'maxAttachmentSize',
        displayName: 'Max Attachment Size (MB)',
        type: 'number',
        description: 'Maximum size of attachments to download (in MB)',
        default: 10,
        min: 1,
        max: 25,
        displayOptions: {
          show: {
            downloadAttachments: [true],
          },
        },
      },
      {
        name: 'maxResults',
        displayName: 'Max Results',
        type: 'number',
        description: 'Maximum number of emails to process per poll',
        default: 1,
        min: 1,
        max: 500,
      },
      {
        name: 'markAsRead',
        displayName: 'Mark as Read',
        type: 'boolean',
        description: 'Automatically mark processed emails as read',
        default: false,
      },
      {
        name: 'addLabel',
        displayName: 'Add Label',
        type: 'string',
        description: 'Label to add to processed emails',
        placeholder: 'processed',
      },
    ],
  },
];

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
    },
  },
  {
    name: 'subject',
    displayName: 'Subject',
    type: 'string',
    description: 'Email subject line',
    required: true,
    placeholder: 'Email Subject',
    displayOptions: {
      show: {
        operation: ['send'],
      },
    },
  },
  {
    name: 'emailType',
    displayName: 'Email Type',
    type: 'select',
    description: 'Format of the email content',
    default: 'text',
    options: [
      { name: 'Text', value: 'text' },
      { name: 'HTML', value: 'html' },
    ],
  },
  {
    name: 'message',
    displayName: 'Message',
    type: 'text',
    description: 'Email message content',
    required: true,
    rows: 6,
    placeholder: 'Email message content...',
  },
  {
    name: 'attachments',
    displayName: 'Attachments',
    type: 'fixedCollection',
    description: 'Files to attach to the email',
    required: false,
    typeOptions: {
      multipleValues: true,
      multipleValueButtonText: 'Add Attachment',
    },
    values: [
      {
        name: 'type',
        displayName: 'Type',
        type: 'select',
        description: 'How to specify the attachment',
        required: true,
        default: 'binary',
        options: [
          { name: 'Binary Data', value: 'binary' },
          { name: 'File Path', value: 'path' },
          { name: 'URL', value: 'url' },
        ],
      },
      {
        name: 'fileName',
        displayName: 'File Name',
        type: 'string',
        description: 'Name for the attachment file',
        required: true,
        placeholder: 'document.pdf',
      },
      {
        name: 'filePath',
        displayName: 'File Path',
        type: 'string',
        description: 'Path to the file to attach',
        required: true,
        placeholder: '/path/to/file.pdf',
        displayOptions: {
          show: {
            type: ['path'],
          },
        },
      },
      {
        name: 'url',
        displayName: 'URL',
        type: 'string',
        description: 'URL to download the file from',
        required: true,
        placeholder: 'https://example.com/file.pdf',
        displayOptions: {
          show: {
            type: ['url'],
          },
        },
      },
    ],
  },
];

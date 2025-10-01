import type { INodeProperty } from '@/core/nodes/types';

/**
 * Gmail Enhanced Properties
 * Comprehensive property definitions for Gmail trigger nodes
 * Based on GmailPropertiesPanel UI structure
 */
export const gmailEnhancedProperties: INodeProperty[] = [
  // ===== Connection Tab =====
  {
    displayName: 'Gmail Credential',
    name: 'credential',
    type: 'credentialsSelect',
    description: 'Gmail OAuth2 credentials for accessing the API',
    required: true,
    credentialTypes: ['gmailOAuth2'],
    default: '',
  },
  {
    displayName: 'Trigger Event',
    name: 'event',
    type: 'options',
    description: 'The Gmail event that will trigger the workflow',
    default: 'messageReceived',
    options: [
      {
        name: 'Message Received',
        value: 'messageReceived',
        description: 'Trigger when a new message is received',
      },
      {
        name: 'Message Sent',
        value: 'messageSent',
        description: 'Trigger when a message is sent',
      },
      {
        name: 'Message Read',
        value: 'messageRead',
        description: 'Trigger when a message is marked as read',
      },
      {
        name: 'Message Starred',
        value: 'messageStarred',
        description: 'Trigger when a message is starred',
      },
      {
        name: 'Message Deleted',
        value: 'messageDeleted',
        description: 'Trigger when a message is deleted',
      },
      {
        name: 'New Thread',
        value: 'newThread',
        description: 'Trigger when a new thread is created',
      },
      {
        name: 'Label Added',
        value: 'labelAdded',
        description: 'Trigger when a label is added to a message',
      },
      {
        name: 'Label Removed',
        value: 'labelRemoved',
        description: 'Trigger when a label is removed from a message',
      },
    ],
  },
  {
    displayName: 'Simplify Response',
    name: 'simplify',
    type: 'boolean',
    description: 'Return simplified email data instead of full Gmail API response',
    default: true,
  },

  // ===== Polling Configuration =====
  {
    displayName: 'Polling Frequency',
    name: 'pollTimes',
    type: 'fixedCollection',
    description: 'Configure how often to check for new emails',
    default: { mode: 'everyMinute' },
    typeOptions: {
      multipleValues: false,
    },
    options: [
      {
        name: 'mode',
        displayName: 'Polling Mode',
        value: 'mode',
        type: 'options',
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
        value: 'intervalMinutes',
        type: 'number',
        default: 5,
        displayOptions: {
          show: {
            mode: ['customInterval'],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 1440,
        },
      },
      {
        name: 'minute',
        displayName: 'Minute',
        value: 'minute',
        type: 'number',
        default: 0,
        description: 'Minute of the hour (0-59)',
        displayOptions: {
          show: {
            mode: ['everyHour', 'everyDay', 'everyWeek', 'everyMonth'],
          },
        },
        typeOptions: {
          minValue: 0,
          maxValue: 59,
        },
      },
      {
        name: 'hour',
        displayName: 'Hour',
        value: 'hour',
        type: 'number',
        default: 9,
        description: 'Hour of the day (0-23)',
        displayOptions: {
          show: {
            mode: ['everyDay', 'everyWeek', 'everyMonth'],
          },
        },
        typeOptions: {
          minValue: 0,
          maxValue: 23,
        },
      },
      {
        name: 'weekday',
        displayName: 'Day of Week',
        value: 'weekday',
        type: 'options',
        default: 1,
        description: 'Which day of the week',
        displayOptions: {
          show: {
            mode: ['everyWeek'],
          },
        },
        options: [
          { name: 'Monday', value: 1 },
          { name: 'Tuesday', value: 2 },
          { name: 'Wednesday', value: 3 },
          { name: 'Thursday', value: 4 },
          { name: 'Friday', value: 5 },
          { name: 'Saturday', value: 6 },
          { name: 'Sunday', value: 0 },
        ],
      },
      {
        name: 'dayOfMonth',
        displayName: 'Day of Month',
        value: 'dayOfMonth',
        type: 'number',
        default: 1,
        description: 'Day of the month (1-31)',
        displayOptions: {
          show: {
            mode: ['everyMonth'],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 31,
        },
      },
      {
        name: 'cronExpression',
        displayName: 'Cron Expression',
        value: 'cronExpression',
        type: 'string',
        default: '0 9 * * MON',
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

  // ===== Filters =====
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    description: 'Filter which emails trigger the workflow',
    default: {},
    placeholder: 'Add Filter',
    options: [
      {
        name: 'labelNamesOrIds',
        displayName: 'Gmail Labels',
        value: 'labelNamesOrIds',
        type: 'multiOptions',
        default: ['INBOX'],
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
      },
      {
        name: 'readStatus',
        displayName: 'Read Status',
        value: 'readStatus',
        type: 'options',
        default: 'all',
        description: 'Filter by email read status',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Unread Only', value: 'unread' },
          { name: 'Read Only', value: 'read' },
        ],
      },
      {
        name: 'hasAttachment',
        displayName: 'Attachment Filter',
        value: 'hasAttachment',
        type: 'options',
        default: 'any',
        description: 'Filter by attachment presence',
        options: [
          { name: 'Any', value: 'any' },
          { name: 'Has Attachments', value: 'true' },
          { name: 'No Attachments', value: 'false' },
        ],
      },
      {
        name: 'search',
        displayName: 'Gmail Search Query',
        value: 'search',
        type: 'string',
        default: '',
        description: 'Gmail search query (e.g., "has:attachment from:support@company.com")',
        placeholder: 'has:attachment from:user@example.com subject:"urgent"',
        typeOptions: {
          rows: 3,
        },
      },
      {
        name: 'senderFilter',
        displayName: 'Sender Filter',
        value: 'senderFilter',
        type: 'string',
        default: '',
        description: 'Filter by sender email or name (supports wildcards)',
        placeholder: 'support@example.com or *@company.com',
      },
      {
        name: 'subjectFilter',
        displayName: 'Subject Filter',
        value: 'subjectFilter',
        type: 'string',
        default: '',
        description: 'Filter by email subject (case-insensitive)',
        placeholder: 'Contains this text in subject',
      },
      {
        name: 'includeSpamTrash',
        displayName: 'Include Spam and Trash',
        value: 'includeSpamTrash',
        type: 'boolean',
        default: false,
        description: 'Include emails from spam and trash folders',
      },
      {
        name: 'includeDrafts',
        displayName: 'Include Drafts',
        value: 'includeDrafts',
        type: 'boolean',
        default: false,
        description: 'Include draft emails',
      },
    ],
  },

  // ===== Output Options =====
  {
    displayName: 'Output Options',
    name: 'options',
    type: 'collection',
    description: 'Configure email processing and output options',
    default: {},
    placeholder: 'Add Option',
    options: [
      {
        name: 'maxResults',
        displayName: 'Max Results',
        value: 'maxResults',
        type: 'number',
        default: 1,
        description: 'Maximum number of emails to process per poll',
        typeOptions: {
          minValue: 1,
          maxValue: 500,
        },
      },
      {
        name: 'markAsRead',
        displayName: 'Mark as Read',
        value: 'markAsRead',
        type: 'boolean',
        default: false,
        description: 'Automatically mark processed emails as read',
      },
      {
        name: 'addLabel',
        displayName: 'Add Label',
        value: 'addLabel',
        type: 'string',
        default: '',
        description: 'Label to add to processed emails',
        placeholder: 'processed',
      },
      {
        name: 'downloadAttachments',
        displayName: 'Download Attachments',
        value: 'downloadAttachments',
        type: 'boolean',
        default: false,
        description: 'Automatically download email attachments',
      },
      {
        name: 'attachmentPrefix',
        displayName: 'Attachment Prefix',
        value: 'attachmentPrefix',
        type: 'string',
        default: 'gmail_',
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
        value: 'maxAttachmentSize',
        type: 'number',
        default: 10,
        description: 'Maximum size of attachments to download (in MB)',
        typeOptions: {
          minValue: 1,
          maxValue: 25,
        },
        displayOptions: {
          show: {
            downloadAttachments: [true],
          },
        },
      },
    ],
  },
];

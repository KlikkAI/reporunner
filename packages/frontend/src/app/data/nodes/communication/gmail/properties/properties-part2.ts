},
      },
{
  name: 'weekday', displayName;
  : 'Day of Week',
  type: 'select', description;
  : 'Which day of the week',
        default: 1,
        options: [
    name: 'Monday', value
  : 1
  ,
    name: 'Tuesday', value
  : 2
  ,
    name: 'Wednesday', value
  : 3
  ,
    name: 'Thursday', value
  : 4
  ,
    name: 'Friday', value
  : 5
  ,
    name: 'Saturday', value
  : 6
  ,
    name: 'Sunday', value
  : 0
  ,
        ],
        displayOptions:
      mode: ['everyWeek'],
    ,
  ,
}
,
{
  name: 'dayOfMonth', displayName;
  : 'Day of Month',
  type: 'number', description;
  : 'Day of the month (1-31)',
        min: 1,
        max: 31,
        default: 1,
        displayOptions:
      mode: ['everyMonth'],
    ,
  ,
}
,
{
  name: 'cronExpression', displayName;
  : 'Cron Expression',
  type: 'string', description;
  : 'Custom cron expression (e.g., "0 9 * * MON" for 9 AM every Monday)',
        placeholder: '0 9 * * MON',
        displayOptions:
      mode: ['customCron'],
    ,
  ,
}
,
    ],
  },
{
  name: 'simplify', displayName;
  : 'Simplify Response',
  type: 'boolean', description;
  : 'Return simplified email data with only essential fields',
    default: true,
}
,
{
    name: 'filters',
    displayName: 'Email Filters',
    type: 'collection',
    description: 'Configure filters to only process emails that match specific criteria',
    required: false,
    default: ,
    values: [
        name: 'includeSpamTrash',
        displayName: 'Include Spam and Trash',
        type: 'boolean',
        description: 'Include emails from spam and trash folders',
        default: false,,
        name: 'includeDrafts',
        displayName: 'Include Drafts',
        type: 'boolean',
        description: 'Include draft emails',
        default: false,,
        name: 'labelNamesOrIds',
        displayName: 'Label Names or IDs',
        type: 'multiOptions',
        description: 'Filter by specific Gmail labels',
        options: [name: 'INBOX', value: 'INBOX' ,name: 'SENT', value: 'SENT' ,name: 'DRAFT', value: 'DRAFT' ,name: 'SPAM', value: 'SPAM' ,name: 'TRASH', value: 'TRASH' ,name: 'IMPORTANT', value: 'IMPORTANT' ,name: 'STARRED', value: 'STARRED' ,name: 'UNREAD', value: 'UNREAD' ,
        ],
        default: ['INBOX'],,
        name: 'search',
        displayName: 'Search Query',

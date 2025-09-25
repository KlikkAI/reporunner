// Polling configuration (enhanced from current implementation)
{
  name: 'pollTimes', displayName;
  : 'Polling Configuration',
  type: 'collection', description;
  : 'Configure when and how often to check for emails',
    default:
  {
    mode: 'everyMinute';
  }
  ,
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['messageReceived'],
    }
    ,
  }
  ,
    values: [
  {
    name: 'mode', displayName;
    : 'Polling Frequency',
    type: 'select', description;
    : 'How often to check for new emails',
        required: true,
        default: 'everyMinute',
        options: [
    {
      name: 'Every Minute', value;
      : 'everyMinute'
    }
    ,
    {
      name: 'Every 5 Minutes', value;
      : 'every5Minutes'
    }
    ,
    {
      name: 'Every 15 Minutes', value;
      : 'every15Minutes'
    }
    ,
    {
      name: 'Every Hour', value;
      : 'everyHour'
    }
    ,
    {
      name: 'Every Day', value;
      : 'everyDay'
    }
    ,
    {
      name: 'Every Week', value;
      : 'everyWeek'
    }
    ,
    {
      name: 'Every Month', value;
      : 'everyMonth'
    }
    ,
    {
      name: 'Custom Interval', value;
      : 'customInterval'
    }
    ,
    {
      name: 'Custom Cron', value;
      : 'customCron'
    }
    ,
        ],
  }
  ,
  {
    name: 'intervalMinutes', displayName;
    : 'Interval (Minutes)',
    type: 'number', description;
    : 'Check every X minutes',
        min: 1,
        max: 1440,
        default: 5,
        displayOptions:
    {
      show: {
        mode: ['customInterval'],
      }
      ,
    }
    ,
  }
  ,
  {
    name: 'cronExpression', displayName;
    : 'Cron Expression',
    type: 'string', description;
    : 'Custom cron expression for advanced scheduling',
        placeholder: '0 9 * * MON',
        displayOptions:
    {
      show: {
        mode: ['customCron'],
      }
      ,
    }
    ,
  }
  ,
    ],
}
,

// Advanced filtering (enhanced from current)
{
    name: 'filters',
    displayName: 'Email Filters',
    type: 'collection',
    description: 'Filter emails to process only those matching specific criteria',
    default: {},
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['messageReceived', 'getAll'],
      },
    },
    values: [
      {
        name: 'includeSpamTrash',
        displayName: 'Include Spam and Trash',
        type: 'boolean',
        description: 'Include emails from spam and trash folders',
        default: false,
      },
      {
        name: 'labelNamesOrIds',
        displayName: 'Labels',
        type: 'multiOptions',
        description: 'Filter by Gmail labels',
        typeOptions: {
          loadOptionsMethod: 'getLabels',
        },
        default: ['INBOX'],
      },
      {
        name: 'search',
        displayName: 'Search Query',
        type: 'string',
        description: 'Gmail search query syntax',
        placeholder: 'has:attachment from:user@example.com subject:"urgent"',
      },

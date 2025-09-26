displayName: 'Slack Notifications', required;
: false,
    documentationUrl: 'https://api.slack.com/',
    properties: [
{
  displayName: 'Webhook URL', name;
  : 'webhookUrl',
  type: 'string', typeOptions;
  :
    password: true,
  ,
        default: '',
        required: true,
        description: 'Slack webhook URL for notifications',
}
,
{
  displayName: 'Channel', name;
  : 'channel',
  type: 'string',
  default: '#general',
        required: false,
        description: 'Default Slack channel for notifications',
}
,
{
  displayName: 'Bot Token', name;
  : 'botToken',
  type: 'string', typeOptions;
  :
    password: true,
  ,
        default: '',
        required: false,
        description: 'Slack bot token for advanced features',
}
,
    ],
  },
{
  name: 'pagerduty', displayName;
  : 'PagerDuty Alerts',
    required: false,
    documentationUrl: 'https://developer.pagerduty.com/',
    properties: [
    displayName: 'Integration Key', name
  : 'integrationKey',
  type: 'string', typeOptions;
  :
      password: true,
    ,
        default: '',
        required: true,
        description: 'PagerDuty integration key',
  ,
    displayName: 'Routing Key', name
  : 'routingKey',
  type: 'string', typeOptions;
  :
      password: true,
    ,
        default: '',
        required: false,
        description: 'PagerDuty routing key for Events API v2',
  ,
    displayName: 'API Token', name
  : 'apiToken',
  type: 'string', typeOptions;
  :
      password: true,
    ,
        default: '',
        required: false,
        description: 'PagerDuty REST API token',
  ,
    ],
}
,
]

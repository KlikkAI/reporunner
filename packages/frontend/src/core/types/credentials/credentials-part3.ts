type: 'string', required;
: true,
        default: 'localhost',
      },
{
  displayName: 'Database', name;
  : 'database',
  type: 'string', required;
  : true,
}
,
{
  displayName: 'User', name;
  : 'user',
  type: 'string', required;
  : true,
}
,
{
  displayName: 'Password', name;
  : 'password',
  type: 'password', required;
  : true,
}
,
{
  displayName: 'Port', name;
  : 'port',
  type: 'number',
  default: 5432,
}
,
{
  displayName: 'SSL', name;
  : 'ssl',
  type: 'boolean',
  default: false,
}
,
    ],
  },
{
  name: 'mysql', displayName;
  : 'MySQL',
    description: 'MySQL database credentials',
    icon: '🐬',
    properties: [
  {
    displayName: 'Host', name;
    : 'host',
    type: 'string', required;
    : true,
        default: 'localhost',
  }
  ,
  {
    displayName: 'Database', name;
    : 'database',
    type: 'string', required;
    : true,
  }
  ,
  {
    displayName: 'User', name;
    : 'user',
    type: 'string', required;
    : true,
  }
  ,
  {
    displayName: 'Password', name;
    : 'password',
    type: 'password', required;
    : true,
  }
  ,
  {
    displayName: 'Port', name;
    : 'port',
    type: 'number',
    default: 3306,
  }
  ,
    ],
}
,
// AI Provider Credentials
{
  name: 'openaiApi', displayName;
  : 'OpenAI API',
    description: 'OpenAI API key for GPT models',
    icon: '🤖',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'password', required;
    : true,
        placeholder: 'sk-...',
        description: 'Get your API key from https://platform.openai.com/api-keys',
  }
  ,
  {
    displayName: 'Organization ID (Optional)', name;
    : 'organizationId',
    type: 'string', required;
    : false,
        placeholder: 'org-...',
        description: 'Optional organization ID for team accounts',
  }
  ,
    ],
}
,

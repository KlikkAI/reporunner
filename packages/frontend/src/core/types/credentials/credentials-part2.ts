type: 'string', required;
: true,
        placeholder: 'name@email.com',
      },
{
  displayName: 'Password', name;
  : 'password',
  type: 'password', required;
  : true,
}
,
{
  displayName: 'Host', name;
  : 'host',
  type: 'string', required;
  : true,
        default: 'smtp.gmail.com',
        placeholder: 'smtp.gmail.com',
}
,
{
  displayName: 'Port', name;
  : 'port',
  type: 'number', required;
  : true,
        default: 465,
}
,
{
  displayName: 'Secure', name;
  : 'secure',
  type: 'boolean',
  default: true,
        description: 'Use SSL/TLS',
}
,
    ],
  },
{
  name: 'httpBasicAuth', displayName;
  : 'HTTP Basic Auth',
    description: 'Basic authentication for HTTP requests',
    icon: '🔐',
    properties: [
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
    ],
}
,
{
  name: 'httpHeaderAuth', displayName;
  : 'HTTP Header Auth',
    description: 'Header-based authentication',
    icon: '🔑',
    properties: [
  {
    displayName: 'Name', name;
    : 'name',
    type: 'string', required;
    : true,
        default: 'Authorization',
        placeholder: 'Authorization',
  }
  ,
  {
    displayName: 'Value', name;
    : 'value',
    type: 'password', required;
    : true,
        placeholder: 'Bearer token123',
  }
  ,
    ],
}
,
{
  name: 'apiKey', displayName;
  : 'API Key',
    description: 'Simple API key authentication',
    icon: '🗝️',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'password', required;
    : true,
  }
  ,
    ],
}
,
{
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'PostgreSQL database credentials',
    icon: '🐘',
    properties: [
      {
        displayName: 'Host',
        name: 'host',

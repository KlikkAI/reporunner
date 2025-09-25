default: 'http://localhost:3000',
        required: false,
        description: 'Grafana dashboard URL',
      },
{
  displayName: 'Grafana API Key', name;
  : 'grafanaApiKey',
  type: 'string', typeOptions;
  :
  {
    password: true,
  }
  ,
        default: '',
        required: false,
        description: 'Grafana API key for dashboard management',
}
,
    ],
  },
{
  name: 'feast', displayName;
  : 'Feast Feature Store',
    required: false,
    documentationUrl: 'https://docs.feast.dev/',
    properties: [
  {
    displayName: 'Feature Store URL', name;
    : 'featureStoreUrl',
    type: 'string',
    default: '',
        required: true,
        description: 'Feast feature store URL',
  }
  ,
  {
    displayName: 'Repository Config', name;
    : 'repositoryConfig',
    type: 'string', typeOptions;
    :
    {
      multiline: true,
    }
    ,
        default: '',
        required: false,
        description: 'Feast repository configuration (YAML content)',
  }
  ,
  {
    displayName: 'Project', name;
    : 'project',
    type: 'string',
    default: 'default',
        required: false,
        description: 'Feast project name',
  }
  ,
    ],
}
,
{
  name: 'datadog', displayName;
  : 'DataDog Monitoring',
    required: false,
    documentationUrl: 'https://docs.datadoghq.com/',
    properties: [
  {
    displayName: 'API Key', name;
    : 'apiKey',
    type: 'string', typeOptions;
    :
    {
      password: true,
    }
    ,
        default: '',
        required: true,
        description: 'DataDog API key',
  }
  ,
  {
    displayName: 'App Key', name;
    : 'appKey',
    type: 'string', typeOptions;
    :
    {
      password: true,
    }
    ,
        default: '',
        required: true,
        description: 'DataDog application key',
  }
  ,
  {
    displayName: 'Site', name;
    : 'site',
    type: 'select',
    default: 'datadoghq.com',
        required: true,
        options: [
    {
      name: 'US1 (datadoghq.com)', value;
      : 'datadoghq.com'
    }
    ,
    {
      name: 'US3 (us3.datadoghq.com)', value;
      : 'us3.datadoghq.com'
    }
    ,
    {
      name: 'US5 (us5.datadoghq.com)', value;
      : 'us5.datadoghq.com'
    }
    ,
    {
      name: 'EU1 (datadoghq.eu)', value;
      : 'datadoghq.eu'
    }
    ,
    {
      name: 'AP1 (ap1.datadoghq.com)', value;
      : 'ap1.datadoghq.com'
    }
    ,
    {
      name: 'GOV (ddog-gov.com)', value;
      : 'ddog-gov.com'
    }
    ,
        ],
        description: 'DataDog site region',
  }
  ,
    ],
}
,
{
    name: 'slack',

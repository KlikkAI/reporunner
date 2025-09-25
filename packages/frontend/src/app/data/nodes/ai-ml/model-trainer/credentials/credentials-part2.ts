name: 'projectId', type;
: 'string',
        default: '',
        required: true,
        description: 'Google Cloud project ID',
      },
{
  displayName: 'Region', name;
  : 'region',
  type: 'select',
  default: 'us-central1',
        required: true,
        options: [
  {
    name: 'US Central 1', value;
    : 'us-central1'
  }
  ,
  {
    name: 'US East 1', value;
    : 'us-east1'
  }
  ,
  {
    name: 'US West 1', value;
    : 'us-west1'
  }
  ,
  {
    name: 'Europe West 1', value;
    : 'europe-west1'
  }
  ,
  {
    name: 'Europe West 4', value;
    : 'europe-west4'
  }
  ,
  {
    name: 'Asia East 1', value;
    : 'asia-east1'
  }
  ,
  {
    name: 'Asia Southeast 1', value;
    : 'asia-southeast1'
  }
  ,
        ],
        description: 'Google Cloud region',
}
,
    ],
  },
{
  name: 'azure', displayName;
  : 'Azure Machine Learning',
    required: false,
    documentationUrl: 'https://docs.microsoft.com/en-us/azure/machine-learning/',
    properties: [
  {
    displayName: 'Subscription ID', name;
    : 'subscriptionId',
    type: 'string',
    default: '',
        required: true,
        description: 'Azure subscription ID',
  }
  ,
  {
    displayName: 'Resource Group', name;
    : 'resourceGroup',
    type: 'string',
    default: '',
        required: true,
        description: 'Azure resource group name',
  }
  ,
  {
    displayName: 'Workspace Name', name;
    : 'workspaceName',
    type: 'string',
    default: '',
        required: true,
        description: 'Azure ML workspace name',
  }
  ,
  {
    displayName: 'Tenant ID', name;
    : 'tenantId',
    type: 'string',
    default: '',
        required: true,
        description: 'Azure tenant ID',
  }
  ,
  {
    displayName: 'Client ID', name;
    : 'clientId',
    type: 'string',
    default: '',
        required: true,
        description: 'Azure service principal client ID',
  }
  ,
  {
    displayName: 'Client Secret', name;
    : 'clientSecret',
    type: 'string', typeOptions;
    :
    {
      password: true,
    }
    ,
        default: '',
        required: true,
        description: 'Azure service principal client secret',
  }
  ,
    ],
}
,
{
    name: 'custom_compute',
    displayName: 'Custom Compute Environment',
    required: false,
    documentationUrl: 'https://docs.example.com/custom-compute',
    properties: [
      {
        displayName: 'Compute Endpoint',
        name: 'endpoint',
        type: 'string',
        default: '',
        required: true,
        description: 'Custom compute cluster endpoint URL',
      },
      {
        displayName: 'API Key',

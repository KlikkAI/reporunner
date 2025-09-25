},
        options: [
{
  displayName: 'Enable Alerts', name;
  : 'enableAlerts',
  type: 'boolean',
  default: true,
}
,
{
  displayName: 'Alert Thresholds', name;
  : 'thresholds',
  type: 'json',
  default: '{"accuracy_drop": 0.05, "latency_increase": 2.0}',
            displayOptions:
  {
    show: {
      enableAlerts: [true],
    }
    ,
  }
  ,
            description: 'JSON configuration for alert thresholds',
}
,
{
  displayName: 'Alert Channels', name;
  : 'channels',
  type: 'multiSelect',
  default: ['email'],
            displayOptions:
  {
    show: {
      enableAlerts: [true],
    }
    ,
  }
  ,
            options: [
  {
    name: 'Email', value;
    : 'email'
  }
  ,
  {
    name: 'Slack', value;
    : 'slack'
  }
  ,
  {
    name: 'PagerDuty', value;
    : 'pagerduty'
  }
  ,
  {
    name: 'Microsoft Teams', value;
    : 'teams'
  }
  ,
  {
    name: 'Webhook', value;
    : 'webhook'
  }
  ,
  {
    name: 'SMS', value;
    : 'sms'
  }
  ,
            ],
}
,
        ],
      },
    ],
  },

// Experiment Tracking Section
{
    displayName: 'Experiment Tracking',
    name: 'experimentTracking',
    type: 'collection',
    default: {},
    description: 'Configure experiment tracking and versioning',
    options: [
      {
        displayName: 'Enable Experiment Tracking',
        name: 'enabled',
        type: 'boolean',
        default: true,
        description: 'Track experiments and model versions',
      },
      {
        displayName: 'Experiment Tracking Platform',
        name: 'platform',
        type: 'select',
        default: 'mlflow',
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: 'MLflow', value: 'mlflow' },
          { name: 'Weights & Biases', value: 'wandb' },
          { name: 'Neptune', value: 'neptune' },
          { name: 'Comet ML', value: 'comet' },
          { name: 'TensorBoard', value: 'tensorboard' },
          { name: 'Azure ML Experiments', value: 'azure_ml' },
          { name: 'AWS SageMaker Experiments', value: 'sagemaker' },
        ],
        description: 'Platform for experiment tracking',
      },
      {
        displayName: 'Experiment Name',
        name: 'experimentName',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        placeholder: 'my-ml-experiment',
        description: 'Name for the experiment run',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        default: '',
        displayOptions: {
          show: {

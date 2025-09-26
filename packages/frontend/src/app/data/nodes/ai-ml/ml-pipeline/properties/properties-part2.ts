{
  name: 'Feature Engineering', value;
  : 'feature_engineering'
}
,
{
  name: 'Data Validation', value;
  : 'data_validation'
}
,
{
  name: 'Model Training', value;
  : 'model_training'
}
,
{
  name: 'Model Evaluation', value;
  : 'model_evaluation'
}
,
{
  name: 'Model Validation', value;
  : 'model_validation'
}
,
{
  name: 'Model Deployment', value;
  : 'model_deployment'
}
,
{
  name: 'Data Drift Detection', value;
  : 'data_drift_detection'
}
,
{
  name: 'Model Monitoring', value;
  : 'model_monitoring'
}
,
{
  name: 'A/B Testing', value;
  : 'ab_testing'
}
,
{
  name: 'Custom Script', value;
  : 'custom_script'
}
,
            ],
            description: 'Type of stage operation',
          },
{
  displayName: 'Stage Configuration', name;
  : 'stageConfig',
  type: 'json',
  default: '{}',
            description: 'Stage-specific configuration (JSON)',
}
,
{
  displayName: 'Dependencies', name;
  : 'dependencies',
  type: 'string',
  default: '',
            placeholder: 'stage1,stage2',
            description: 'Comma-separated list of dependent stages',
}
,
{
  displayName: 'Retry Policy', name;
  : 'retryPolicy',
  type: 'collection',
  default:
  ,
            options: [
    displayName: 'Max Retries', name
  : 'maxRetries',
  type: 'number',
  default: 3,
                typeOptions:
      minValue: 0, maxValue
  : 10,
    ,
  ,
    displayName: 'Retry Delay (seconds)', name
  : 'retryDelay',
  type: 'number',
  default: 30,
                typeOptions:
      minValue: 1, maxValue
  : 3600,
    ,
  ,
    displayName: 'Exponential Backoff', name
  : 'exponentialBackoff',
  type: 'boolean',
  default: true,
  ,
            ],
}
,
{
  displayName: 'Timeout (minutes)', name;
  : 'timeout',
  type: 'number',
  default: 60,
            typeOptions:
    minValue: 1, maxValue
  : 1440,
  ,
            description: 'Maximum execution time for this stage',
}
,
        ],
      },
    ],
  },

// Data Configuration Section
{
    displayName: 'Data Configuration',
    name: 'dataConfig',
    type: 'collection',
    default: ,
    description: 'Configure data sources and processing',
    options: [
        displayName: 'Data Source Type',
        name: 'dataSourceType',
        type: 'select',
        required: true,
        default: 'workflow_input',
        options: [name: 'Workflow Input', value: 'workflow_input' ,name: 'Database', value: 'database' ,name: 'File Storage', value: 'file_storage' ,name: 'API Endpoint', value: 'api_endpoint' ,name: 'Data Lake', value: 'data_lake' ,name: 'Stream Processing', value: 'stream_processing' ,
        ],

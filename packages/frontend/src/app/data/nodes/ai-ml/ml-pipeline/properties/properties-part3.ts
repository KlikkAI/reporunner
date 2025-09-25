description: 'Source of training/inference data',
},
{
  displayName: 'Data Format', name;
  : 'dataFormat',
  type: 'select', required;
  : true,
        default: 'json',
        options: [
  {
    name: 'JSON', value;
    : 'json'
  }
  ,
  {
    name: 'CSV', value;
    : 'csv'
  }
  ,
  {
    name: 'Parquet', value;
    : 'parquet'
  }
  ,
  {
    name: 'Avro', value;
    : 'avro'
  }
  ,
  {
    name: 'TFRecord', value;
    : 'tfrecord'
  }
  ,
  {
    name: 'HDF5', value;
    : 'hdf5'
  }
  ,
  {
    name: 'Arrow', value;
    : 'arrow'
  }
  ,
        ],
        description: 'Format of the input data',
}
,
{
  displayName: 'Data Validation Rules', name;
  : 'validationRules',
  type: 'fixedCollection',
  default:
  {
  }
  ,
        typeOptions:
  {
    multipleValues: true,
  }
  ,
        options: [
  {
    name: 'rule', displayName;
    : 'Validation Rule',
            values: [
    {
      displayName: 'Rule Name', name;
      : 'ruleName',
      type: 'string', required;
      : true,
                default: '',
    }
    ,
    {
      displayName: 'Rule Type', name;
      : 'ruleType',
      type: 'select', required;
      : true,
                default: 'schema_validation',
                options: [
      {
        name: 'Schema Validation', value;
        : 'schema_validation'
      }
      ,
      {
        name: 'Data Quality Check', value;
        : 'data_quality_check'
      }
      ,
      {
        name: 'Statistical Validation', value;
        : 'statistical_validation',
      }
      ,
      {
        name: 'Business Rule Check', value;
        : 'business_rule_check'
      }
      ,
      {
        name: 'Anomaly Detection', value;
        : 'anomaly_detection'
      }
      ,
                ],
    }
    ,
    {
      displayName: 'Rule Configuration', name;
      : 'ruleConfig',
      type: 'json',
      default: '{}',
    }
    ,
            ],
  }
  ,
        ],
}
,
{
        displayName: 'Feature Store Integration',
        name: 'featureStore',
        type: 'collection',
        default: {},
        options: [
          {
            displayName: 'Enable Feature Store',
            name: 'enabled',
            type: 'boolean',
            default: false,
          },
          {
            displayName: 'Feature Store Provider',
            name: 'provider',
            type: 'select',
            default: 'feast',
            displayOptions: {
              show: {
                enabled: [true],
              },
            },
            options: [
              { name: 'Feast', value: 'feast' },
              { name: 'Tecton', value: 'tecton' },
              { name: 'AWS Feature Store', value: 'aws_feature_store' },
              { name: 'Google Feature Store', value: 'gcp_feature_store' },
              { name: 'Azure Feature Store', value: 'azure_feature_store' },
            ],
          },
          {
            displayName: 'Feature Groups',
            name: 'featureGroups',
            type: 'string',

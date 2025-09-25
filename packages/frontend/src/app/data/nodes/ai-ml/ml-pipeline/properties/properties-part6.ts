type: 'number',
default: 1,
            typeOptions:
{
  minValue: 0, maxValue;
  : 100,
}
,
          },
{
  displayName: 'Max Instances', name;
  : 'maxInstances',
  type: 'number',
  default: 10,
            typeOptions:
  {
    minValue: 1, maxValue;
    : 1000,
  }
  ,
}
,
{
  displayName: 'Target CPU Utilization (%)', name;
  : 'targetCpuUtilization',
  type: 'number',
  default: 70,
            typeOptions:
  {
    minValue: 10, maxValue;
    : 90,
  }
  ,
}
,
        ],
      },
    ],
  },

// Monitoring Configuration Section
{
    displayName: 'Monitoring Configuration',
    name: 'monitoringConfig',
    type: 'collection',
    default: {},
    description: 'Configure pipeline and model monitoring',
    options: [
      {
        displayName: 'Enable Monitoring',
        name: 'enabled',
        type: 'boolean',
        default: true,
        description: 'Enable monitoring for the pipeline',
      },
      {
        displayName: 'Monitoring Platform',
        name: 'platform',
        type: 'select',
        default: 'prometheus',
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: 'Prometheus + Grafana', value: 'prometheus' },
          { name: 'DataDog', value: 'datadog' },
          { name: 'New Relic', value: 'newrelic' },
          { name: 'AWS CloudWatch', value: 'cloudwatch' },
          { name: 'Google Cloud Monitoring', value: 'gcp_monitoring' },
          { name: 'Azure Monitor', value: 'azure_monitor' },
          { name: 'Custom', value: 'custom' },
        ],
        description: 'Monitoring platform to use',
      },
      {
        displayName: 'Metrics to Track',
        name: 'metricsToTrack',
        type: 'multiSelect',
        default: ['model_accuracy', 'inference_latency'],
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: 'Model Accuracy', value: 'model_accuracy' },
          { name: 'Inference Latency', value: 'inference_latency' },
          { name: 'Throughput', value: 'throughput' },
          { name: 'Error Rate', value: 'error_rate' },
          { name: 'Data Drift', value: 'data_drift' },
          { name: 'Concept Drift', value: 'concept_drift' },
          { name: 'Feature Importance', value: 'feature_importance' },
          { name: 'Resource Utilization', value: 'resource_utilization' },
          { name: 'Cost Metrics', value: 'cost_metrics' },
        ],
        description: 'Metrics to monitor',
      },
      {
        displayName: 'Alert Configuration',
        name: 'alertConfig',
        type: 'collection',
        default: {},
        displayOptions: {
          show: {
            enabled: [true],
          },

name: 'optimizationGoal', type;
: 'select',
            required: true,
            default: 'maximize',
            options: [
{
  name: 'Maximize', value;
  : 'maximize'
}
,
{
  name: 'Minimize', value;
  : 'minimize'
}
,
            ],
          },
{
  displayName: 'Minimum Threshold', name;
  : 'minThreshold',
  type: 'number',
  default: 0.8,
            typeOptions:
  {
    minValue: 0, maxValue;
    : 1,
              numberPrecision: 3,
  }
  ,
}
,
        ],
      },
    ],
  },

// Deployment Configuration Section
{
    displayName: 'Deployment Configuration',
    name: 'deploymentConfig',
    type: 'collection',
    default: {},
    description: 'Configure model deployment',
    displayOptions: {
      show: {
        '/pipelineConfig/pipelineType': ['training', 'real_time_serving'],
      },
    },
    options: [
      {
        displayName: 'Auto Deploy',
        name: 'autoDeploy',
        type: 'boolean',
        default: false,
        description: 'Automatically deploy model after successful training',
      },
      {
        displayName: 'Deployment Target',
        name: 'deploymentTarget',
        type: 'select',
        required: true,
        default: 'kubernetes',
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          { name: 'Kubernetes', value: 'kubernetes' },
          { name: 'Docker', value: 'docker' },
          { name: 'AWS SageMaker', value: 'sagemaker' },
          { name: 'Google Cloud Run', value: 'cloud_run' },
          { name: 'Azure Container Instances', value: 'azure_aci' },
          { name: 'Serverless (Lambda)', value: 'serverless' },
          { name: 'Edge Deployment', value: 'edge' },
        ],
        description: 'Target platform for model deployment',
      },
      {
        displayName: 'Deployment Strategy',
        name: 'deploymentStrategy',
        type: 'select',
        default: 'blue_green',
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          { name: 'Blue-Green', value: 'blue_green' },
          { name: 'Canary', value: 'canary' },
          { name: 'Rolling Update', value: 'rolling' },
          { name: 'Shadow Deployment', value: 'shadow' },
          { name: 'A/B Testing', value: 'ab_testing' },
        ],
        description: 'Strategy for deploying the model',
      },
      {
        displayName: 'Scaling Configuration',
        name: 'scalingConfig',
        type: 'collection',
        default: {},
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          {
            displayName: 'Min Instances',
            name: 'minInstances',

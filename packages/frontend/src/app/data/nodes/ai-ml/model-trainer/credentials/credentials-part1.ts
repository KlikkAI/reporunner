import type { CredentialRequirement } from '@/core/nodes/types';

export const modelTrainerCredentials: CredentialRequirement[] = [
  {
    name: 'huggingface',
    displayName: 'HuggingFace API',
    required: false,
    documentationUrl: 'https://huggingface.co/docs/api-inference/quicktour',
    properties: [
      {
        displayName: 'API Token',
        name: 'apiToken',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: true,
        description: 'HuggingFace API token for model access',
      },
      {
        displayName: 'Organization',
        name: 'organization',
        type: 'string',
        default: '',
        required: false,
        description: 'HuggingFace organization name (optional)',
      },
    ],
  },
  {
    name: 'aws',
    displayName: 'AWS SageMaker',
    required: false,
    documentationUrl: 'https://docs.aws.amazon.com/sagemaker/',
    properties: [
      {
        displayName: 'Access Key ID',
        name: 'accessKeyId',
        type: 'string',
        default: '',
        required: true,
        description: 'AWS Access Key ID',
      },
      {
        displayName: 'Secret Access Key',
        name: 'secretAccessKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: true,
        description: 'AWS Secret Access Key',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'select',
        default: 'us-east-1',
        required: true,
        options: [
          { name: 'US East (N. Virginia)', value: 'us-east-1' },
          { name: 'US East (Ohio)', value: 'us-east-2' },
          { name: 'US West (Oregon)', value: 'us-west-2' },
          { name: 'US West (N. California)', value: 'us-west-1' },
          { name: 'Europe (Ireland)', value: 'eu-west-1' },
          { name: 'Europe (London)', value: 'eu-west-2' },
          { name: 'Europe (Frankfurt)', value: 'eu-central-1' },
          { name: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1' },
          { name: 'Asia Pacific (Singapore)', value: 'ap-southeast-1' },
        ],
        description: 'AWS region for SageMaker',
      },
      {
        displayName: 'SageMaker Role ARN',
        name: 'roleArn',
        type: 'string',
        default: '',
        required: true,
        description: 'IAM role ARN for SageMaker training jobs',
      },
    ],
  },
  {
    name: 'gcp',
    displayName: 'Google Cloud AI Platform',
    required: false,
    documentationUrl: 'https://cloud.google.com/ai-platform/docs',
    properties: [
      {
        displayName: 'Service Account Key',
        name: 'serviceAccountKey',
        type: 'json',
        default: '{}',
        required: true,
        description: 'Google Cloud service account key JSON',
      },
      {
        displayName: 'Project ID',

import type { CredentialRequirement } from '@/core/nodes/types';

export const mlPipelineCredentials: CredentialRequirement[] = [
  {
    name: 'mlflow',
    displayName: 'MLflow Tracking Server',
    required: false,
    documentationUrl: 'https://mlflow.org/docs/latest/tracking.html',
    properties: [
      {
        displayName: 'Tracking URI',
        name: 'trackingUri',
        type: 'string',
        default: 'http://localhost:5000',
        required: true,
        description: 'MLflow tracking server URI',
      },
      {
        displayName: 'Username',
        name: 'username',
        type: 'string',
        default: '',
        required: false,
        description: 'Username for MLflow server (if authentication enabled)',
      },
      {
        displayName: 'Password',
        name: 'password',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: false,
        description: 'Password for MLflow server',
      },
      {
        displayName: 'Token',
        name: 'token',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: false,
        description: 'API token for MLflow server',
      },
    ],
  },
  {
    name: 'wandb',
    displayName: 'Weights & Biases',
    required: false,
    documentationUrl: 'https://docs.wandb.ai/',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: true,
        description: 'Weights & Biases API key',
      },
      {
        displayName: 'Entity',
        name: 'entity',
        type: 'string',
        default: '',
        required: false,
        description: 'W&B entity (username or team name)',
      },
      {
        displayName: 'Project',
        name: 'project',
        type: 'string',
        default: '',
        required: false,
        description: 'W&B project name',
      },
    ],
  },
  {
    name: 'kubernetes',
    displayName: 'Kubernetes Cluster',
    required: false,
    documentationUrl:
      'https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/',
    properties: [
      {
        displayName: 'Kubeconfig',
        name: 'kubeconfig',
        type: 'string',
        typeOptions: {
          multiline: true,
        },
        default: '',
        required: true,

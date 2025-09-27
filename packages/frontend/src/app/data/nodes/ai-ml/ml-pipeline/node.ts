import type { EnhancedIntegrationNodeType } from '@/core/nodes/types';
import { mlPipelineActions } from './actions';
import { mlPipelineCredentials } from './credentials';
import { mlPipelineNodeDefinition } from './nodeDefinition';

export const mlPipelineNode: EnhancedIntegrationNodeType = {
  id: 'ml-pipeline',
  name: 'ML Pipeline Orchestrator',
  description:
    'Orchestrate end-to-end machine learning pipelines with data preprocessing, training, validation, and deployment',
  type: 'ai-agent',
  category: 'AI/ML',
  subcategory: 'MLOps',
  icon: '🔄',
  configuration: {
    properties: mlPipelineNodeDefinition.description.properties,
    credentials: mlPipelineCredentials,
    polling: {
      enabled: true,
      defaultInterval: 10000, // Check pipeline status every 10 seconds
    },
  },
  inputs: [
    {
      name: 'main',
      type: 'main',
      displayName: 'Raw Data',
      required: true,
    },
    {
      name: 'model',
      type: 'ai_model',
      displayName: 'Pre-trained Model',
      required: false,
    },
    {
      name: 'config',
      type: 'main',
      displayName: 'Pipeline Config',
      required: false,
    },
  ],
  outputs: [
    {
      name: 'results',
      type: 'main',
      displayName: 'Pipeline Results',
    },
    {
      name: 'model',
      type: 'ai_model',
      displayName: 'Trained Model',
    },
    {
      name: 'deployment',
      type: 'main',
      displayName: 'Deployment Info',
    },
    {
      name: 'metrics',
      type: 'main',
      displayName: 'Pipeline Metrics',
    },
  ],
  codex: {
    categories: ['AI/ML', 'MLOps', 'Pipelines'],
    subcategories: {
      'AI/ML': ['Pipelines', 'Automation', 'Orchestration'],
      MLOps: ['CI/CD', 'Deployment', 'Monitoring'],
    },
  },
  ...mlPipelineActions,
};

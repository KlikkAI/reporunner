import type { EnhancedIntegrationNodeType } from '@/core/nodes/types';
import { modelTrainerActions } from './actions';
import { modelTrainerCredentials } from './credentials';
import { modelTrainerProperties } from './properties';

export const modelTrainerNode: EnhancedIntegrationNodeType = {
  id: 'model-trainer',
  name: 'Model Trainer',
  description: 'Train and fine-tune AI/ML models with advanced configuration options',
  type: 'ai-agent',
  category: 'AI/ML',
  subcategory: 'Training',
  icon: '🤖',
  configuration: {
    properties: modelTrainerProperties,
    credentials: modelTrainerCredentials,
    polling: {
      enabled: true,
      defaultInterval: 5000, // Check training status every 5 seconds
    },
  },
  inputs: [
    {
      name: 'data',
      type: 'main',
      displayName: 'Training Data',
      required: true,
    },
    {
      name: 'dataset',
      type: 'ai_dataset',
      displayName: 'Dataset',
      required: false,
    },
  ],
  outputs: [
    {
      name: 'model',
      type: 'main',
      displayName: 'Trained Model',
    },
    {
      name: 'ai_model',
      type: 'ai_model',
      displayName: 'Model Output',
    },
    {
      name: 'metrics',
      type: 'main',
      displayName: 'Training Metrics',
    },
  ],
  codex: {
    categories: ['AI/ML', 'Training', 'Models'],
    subcategories: {
      'AI/ML': ['Training', 'Fine-tuning', 'Hyperparameters'],
      Models: ['Neural Networks', 'Transformers', 'Vision Models'],
    },
  },
  ...modelTrainerActions,
};

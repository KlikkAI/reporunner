import type { NodeProperty } from '@/core/nodes/types';

export const modelTrainerProperties: NodeProperty[] = [
  // Model Configuration Section
  {
    displayName: 'Model Configuration',
    name: 'modelConfig',
    type: 'collection',
    default: {},
    description: 'Configure the AI model to train',
    options: [
      {
        displayName: 'Model Type',
        name: 'modelType',
        type: 'select',
        required: true,
        default: 'language_model',
        options: [
          { name: 'Language Model', value: 'language_model' },
          { name: 'Text Classification', value: 'classification' },
          { name: 'Text Regression', value: 'regression' },
          { name: 'Embedding Model', value: 'embedding' },
          { name: 'Computer Vision', value: 'computer_vision' },
          { name: 'Time Series', value: 'time_series' },
          { name: 'Anomaly Detection', value: 'anomaly_detection' },
          { name: 'Clustering', value: 'clustering' },
        ],
        description: 'Type of AI model to train',
      },
      {
        displayName: 'Model Name',
        name: 'modelName',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'my-custom-model',
        description: 'Name for the trained model',
      },
      {
        displayName: 'Base Model',
        name: 'baseModel',
        type: 'select',
        required: true,
        default: 'bert-base-uncased',
        displayOptions: {
          show: {
            modelType: ['language_model', 'classification', 'embedding'],
          },
        },
        options: [
          { name: 'BERT Base', value: 'bert-base-uncased' },
          { name: 'BERT Large', value: 'bert-large-uncased' },
          { name: 'RoBERTa Base', value: 'roberta-base' },
          { name: 'RoBERTa Large', value: 'roberta-large' },
          { name: 'DistilBERT', value: 'distilbert-base-uncased' },
          { name: 'ALBERT Base', value: 'albert-base-v2' },
          { name: 'GPT-2', value: 'gpt2' },
          { name: 'GPT-2 Medium', value: 'gpt2-medium' },
          { name: 'T5 Small', value: 't5-small' },
          { name: 'T5 Base', value: 't5-base' },
        ],
        description: 'Pre-trained model to use as base',
      },
      {
        displayName: 'Vision Model',
        name: 'visionModel',
        type: 'select',
        required: true,
        default: 'resnet50',
        displayOptions: {
          show: {
            modelType: ['computer_vision'],
          },
        },
        options: [
          { name: 'ResNet-50', value: 'resnet50' },
          { name: 'ResNet-101', value: 'resnet101' },
          { name: 'EfficientNet-B0', value: 'efficientnet-b0' },
          { name: 'EfficientNet-B7', value: 'efficientnet-b7' },
          { name: 'Vision Transformer', value: 'vit-base-patch16-224' },
          { name: 'CLIP', value: 'clip-vit-base-patch32' },
          { name: 'DeiT', value: 'deit-base-distilled-patch16-224' },
        ],
        description: 'Pre-trained vision model to use',
      },
      {
        displayName: 'Model Description',
        name: 'description',
        type: 'text',
        default: '',
        placeholder: 'Describe what this model does...',
        description: 'Optional description of the model purpose',
      },
    ],
  },

  // Training Configuration Section
  {
    displayName: 'Training Configuration',
    name: 'trainingConfig',

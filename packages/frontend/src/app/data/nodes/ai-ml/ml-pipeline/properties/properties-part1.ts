import type { NodeProperty } from '@/core/nodes/types';

export const mlPipelineProperties: NodeProperty[] = [
  // Pipeline Configuration Section
  {
    displayName: 'Pipeline Configuration',
    name: 'pipelineConfig',
    type: 'collection',
    default: {},
    description: 'Configure the ML pipeline stages',
    options: [
      {
        displayName: 'Pipeline Name',
        name: 'pipelineName',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'my-ml-pipeline',
        description: 'Name for the ML pipeline',
      },
      {
        displayName: 'Pipeline Type',
        name: 'pipelineType',
        type: 'select',
        required: true,
        default: 'training',
        options: [
          { name: 'Training Pipeline', value: 'training' },
          { name: 'Inference Pipeline', value: 'inference' },
          { name: 'Batch Prediction', value: 'batch_prediction' },
          { name: 'Real-time Serving', value: 'real_time_serving' },
          { name: 'Model Evaluation', value: 'evaluation' },
          { name: 'Data Processing', value: 'data_processing' },
          { name: 'Feature Engineering', value: 'feature_engineering' },
          { name: 'Model Comparison', value: 'model_comparison' },
        ],
        description: 'Type of ML pipeline to execute',
      },
      {
        displayName: 'Execution Mode',
        name: 'executionMode',
        type: 'select',
        required: true,
        default: 'sequential',
        options: [
          { name: 'Sequential', value: 'sequential' },
          { name: 'Parallel', value: 'parallel' },
          { name: 'Conditional', value: 'conditional' },
          { name: 'DAG (Directed Acyclic Graph)', value: 'dag' },
        ],
        description: 'How pipeline stages should be executed',
      },
      {
        displayName: 'Environment',
        name: 'environment',
        type: 'select',
        required: true,
        default: 'development',
        options: [
          { name: 'Development', value: 'development' },
          { name: 'Staging', value: 'staging' },
          { name: 'Production', value: 'production' },
          { name: 'Experiment', value: 'experiment' },
        ],
        description: 'Target environment for pipeline execution',
      },
    ],
  },

  // Pipeline Stages Section
  {
    displayName: 'Pipeline Stages',
    name: 'stages',
    type: 'fixedCollection',
    default: {},
    description: 'Configure individual pipeline stages',
    typeOptions: {
      multipleValues: true,
    },
    options: [
      {
        name: 'stage',
        displayName: 'Pipeline Stage',
        values: [
          {
            displayName: 'Stage Name',
            name: 'stageName',
            type: 'string',
            required: true,
            default: '',
            description: 'Name of the pipeline stage',
          },
          {
            displayName: 'Stage Type',
            name: 'stageType',
            type: 'select',
            required: true,
            default: 'data_preprocessing',
            options: [
              { name: 'Data Preprocessing', value: 'data_preprocessing' },

/**
 * Model Trainer Node Definition - Enhanced with Factory Systems
 *
 * Migrated to use PropertyRendererFactory for property generation.
 * Demonstrates integration of factory systems with node definitions.
 *
 * Enhancement: Better integration with configurable systems
 */

import { BaseNodeDefinition, type NodeProperty } from '@/core/nodes/BaseNodeDefinition';
import type { PropertyRendererConfig } from '@/design-system';

/**
 * Model Trainer Node Definition with Factory Integration
 */
export class ModelTrainerNodeDefinition extends BaseNodeDefinition {
  constructor() {
    super({
      name: 'model-trainer',
      displayName: 'Model Trainer',
      description: 'Train and fine-tune AI/ML models with advanced configuration options',
      group: ['AI/ML', 'Training'],
      version: 1,
      defaults: {
        name: 'Model Trainer',
        color: '#3b82f6',
      },
      inputs: ['data', 'dataset'],
      outputs: ['model', 'ai_model', 'metrics'],
      credentials: [
        { name: 'huggingFaceApi', required: false },
        { name: 'awsApi', required: false },
        { name: 'gcpApi', required: false },
      ],
      polling: true,
    });
  }

  protected getNodeIcon(): string {
    return '🤖';
  }

  protected getDefaultColor(): string {
    return '#3b82f6';
  }

  /**
   * Generate properties using PropertyRendererFactory
   */
  protected getPropertyConfigs(): PropertyRendererConfig[] {
    return [
      // Model Configuration
      {
        id: 'modelType',
        type: 'select',
        label: 'Model Type',
        required: true,
        options: [
          { label: 'Language Model', value: 'language_model' },
          { label: 'Text Classification', value: 'classification' },
          { label: 'Text Regression', value: 'regression' },
          { label: 'Embedding Model', value: 'embedding' },
          { label: 'Vision Model', value: 'vision' },
          { label: 'Multimodal Model', value: 'multimodal' },
        ],
        description: 'Select the type of model to train',
      },
      {
        id: 'baseModel',
        type: 'select',
        label: 'Base Model',
        required: true,
        options: [
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'BERT Base', value: 'bert-base-uncased' },
          { label: 'DistilBERT', value: 'distilbert-base-uncased' },
          { label: 'RoBERTa', value: 'roberta-base' },
          { label: 'T5 Small', value: 't5-small' },
          { label: 'Custom Model', value: 'custom' },
        ],
        description: 'Base model to fine-tune',
      },
      {
        id: 'customModelPath',
        type: 'text',
        label: 'Custom Model Path',
        placeholder: 'huggingface/model-name or local/path',
        conditional: {
          showWhen: { baseModel: ['custom'] },
        },
        description: 'HuggingFace model name or local path',
      },

      // Training Configuration
      {
        id: 'trainingConfig',
        type: 'collection',
        label: 'Training Configuration',
        options: [
          {
            label: 'Epochs',
            value: 'epochs',
          },
          {
            label: 'Learning Rate',
            value: 'learningRate',
          },
          {
            label: 'Batch Size',
            value: 'batchSize',
          },
          {
            label: 'Warmup Steps',
            value: 'warmupSteps',
          },
        ],
      },
      {
        id: 'epochs',
        type: 'number',
        label: 'Training Epochs',
        defaultValue: 3,
        validation: {
          rules: [
            { type: 'min', value: 1, message: 'Must be at least 1 epoch' },
            { type: 'max', value: 100, message: 'Must be at most 100 epochs' },
          ],
        },
        description: 'Number of training epochs',
      },
      {
        id: 'learningRate',
        type: 'number',
        label: 'Learning Rate',
        defaultValue: 5e-5,
        validation: {
          rules: [
            { type: 'min', value: 1e-6, message: 'Must be at least 1e-6' },
            { type: 'max', value: 1e-2, message: 'Must be at most 1e-2' },
          ],
        },
        description: 'Learning rate for optimization',
      },
      {
        id: 'batchSize',
        type: 'number',
        label: 'Batch Size',
        defaultValue: 16,
        validation: {
          rules: [
            { type: 'min', value: 1, message: 'Must be at least 1' },
            { type: 'max', value: 128, message: 'Must be at most 128' },
          ],
        },
        description: 'Training batch size',
      },

      // Data Configuration
      {
        id: 'datasetPath',
        type: 'text',
        label: 'Dataset Path',
        required: true,
        placeholder: 'path/to/dataset or dataset-name',
        description: 'Path to training dataset',
      },
      {
        id: 'validationSplit',
        type: 'number',
        label: 'Validation Split',
        defaultValue: 0.2,
        validation: {
          rules: [
            { type: 'min', value: 0.1, message: 'Must be at least 0.1' },
            { type: 'max', value: 0.5, message: 'Must be at most 0.5' },
          ],
        },
        description: 'Fraction of data for validation',
      },
      {
        id: 'maxLength',
        type: 'number',
        label: 'Max Sequence Length',
        defaultValue: 512,
        validation: {
          rules: [
            { type: 'min', value: 64, message: 'Must be at least 64' },
            { type: 'max', value: 4096, message: 'Must be at most 4096' },
          ],
        },
        description: 'Maximum sequence length for tokenization',
      },

      // Output Configuration
      {
        id: 'outputDir',
        type: 'text',
        label: 'Output Directory',
        defaultValue: './trained_model',
        description: 'Directory to save the trained model',
      },
      {
        id: 'saveStrategy',
        type: 'select',
        label: 'Save Strategy',
        defaultValue: 'best',
        options: [
          { label: 'Best Model', value: 'best' },
          { label: 'Every Epoch', value: 'epoch' },
          { label: 'Every N Steps', value: 'steps' },
          { label: 'End Only', value: 'end' },
        ],
        description: 'When to save model checkpoints',
      },

      // Advanced Options
      {
        id: 'enableLogging',
        type: 'switch',
        label: 'Enable Logging',
        defaultValue: true,
        description: 'Enable training progress logging',
      },
      {
        id: 'useGpu',
        type: 'switch',
        label: 'Use GPU',
        defaultValue: true,
        description: 'Use GPU acceleration if available',
      },
      {
        id: 'resumeFromCheckpoint',
        type: 'text',
        label: 'Resume from Checkpoint',
        placeholder: 'path/to/checkpoint',
        description: 'Resume training from a checkpoint',
      },
    ];
  }

  /**
   * Convert PropertyRendererConfigs to legacy NodeProperty format for compatibility
   */
  protected getProperties(): NodeProperty[] {
    const configs = this.getPropertyConfigs();

    return configs.map((config) => this.convertConfigToNodeProperty(config));
  }

  /**
   * Convert PropertyRendererConfig to NodeProperty for backward compatibility
   */
  private convertConfigToNodeProperty(config: PropertyRendererConfig): NodeProperty {
    return {
      displayName: config.label,
      name: config.id,
      type: this.mapRendererTypeToNodeType(config.type),
      description: config.description,
      placeholder: config.placeholder,
      default: config.defaultValue,
      required: config.required,
      options: config.options?.map((option) => ({
        name: option.label,
        value: option.value,
        description: option.description,
      })),
      displayOptions: {
        show: config.conditional?.showWhen,
        hide: config.conditional?.hideWhen,
      },
      typeOptions: this.buildTypeOptions(config),
    };
  }

  /**
   * Map PropertyRenderer types to NodeProperty types
   */
  private mapRendererTypeToNodeType(rendererType: string): string {
    const typeMap: Record<string, string> = {
      text: 'string',
      password: 'password',
      number: 'number',
      checkbox: 'boolean',
      switch: 'boolean',
      select: 'options',
      multiselect: 'multiOptions',
      textarea: 'string',
      datetime: 'dateTime',
      date: 'dateTime',
      color: 'color',
      file: 'file',
      json: 'json',
      collection: 'collection',
      fixedcollection: 'fixedCollection',
      credentials: 'credentialsSelect',
      resource: 'resourceLocator',
      expression: 'expression',
    };

    return typeMap[rendererType] || 'string';
  }

  /**
   * Build type options from PropertyRendererConfig
   */
  private buildTypeOptions(config: PropertyRendererConfig): any {
    const typeOptions: any = {};

    if (config.validation?.rules) {
      for (const rule of config.validation.rules) {
        switch (rule.type) {
          case 'min':
            typeOptions.minValue = rule.value;
            break;
          case 'max':
            typeOptions.maxValue = rule.value;
            break;
          case 'pattern':
            typeOptions.regex = rule.value;
            break;
        }
      }
    }

    if (config.type === 'textarea') {
      typeOptions.rows = 4;
    }

    return Object.keys(typeOptions).length > 0 ? typeOptions : undefined;
  }

  /**
   * Get property renderer configurations for use with PropertyRendererFactory
   */
  public getRendererConfigurations(): PropertyRendererConfig[] {
    return this.getPropertyConfigs();
  }

  /**
   * Execute the model trainer node
   */
  async execute(): Promise<any> {
    // Stub implementation - will be replaced with actual model training logic
    return {
      success: true,
      message: 'Model Trainer execution stub - not yet implemented',
    };
  }
}

export const modelTrainerNodeDefinition = new ModelTrainerNodeDefinition();

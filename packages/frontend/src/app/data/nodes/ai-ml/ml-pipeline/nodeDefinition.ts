/**
 * ML Pipeline Node Definition - Enhanced with PropertyRendererFactory
 *
 * Migrated to use PropertyRendererFactory for property generation.
 * Demonstrates advanced factory integration with ML pipeline configurations.
 *
 * Enhancement: Better integration with configurable systems + validation
 */

import { BaseNodeDefinition, type NodeProperty } from '@/core/nodes/BaseNodeDefinition';
import { PropertyRendererFactory } from '@/design-system';
import type { PropertyRendererConfig } from '@/design-system';

/**
 * ML Pipeline Orchestrator Node Definition with Factory Integration
 */
export class MLPipelineNodeDefinition extends BaseNodeDefinition {
  constructor() {
    super({
      name: 'ml-pipeline',
      displayName: 'ML Pipeline Orchestrator',
      description: 'Orchestrate end-to-end machine learning pipelines with data preprocessing, training, validation, and deployment',
      group: ['AI/ML', 'MLOps'],
      version: 1,
      defaults: {
        name: 'ML Pipeline',
        color: '#9333ea',
      },
      inputs: ['main', 'model', 'config'],
      outputs: ['results', 'model', 'deployment', 'metrics'],
      credentials: [
        { name: 'mlPipelineApi', required: false },
        { name: 'awsApi', required: false },
        { name: 'gcpApi', required: false },
      ],
      polling: true,
    });
  }

  protected getNodeIcon(): string {
    return '🔄';
  }

  protected getDefaultColor(): string {
    return '#9333ea';
  }

  /**
   * Generate properties using PropertyRendererFactory
   */
  protected getPropertyConfigs(): PropertyRendererConfig[] {
    return [
      // Pipeline Configuration
      {
        id: 'pipelineName',
        type: 'text',
        label: 'Pipeline Name',
        required: true,
        placeholder: 'my-ml-pipeline',
        description: 'Name for the ML pipeline',
        validation: {
          rules: [
            { type: 'required', message: 'Pipeline name is required' },
            { type: 'pattern', value: '^[a-zA-Z0-9-_]+$', message: 'Only alphanumeric, dash, and underscore allowed' },
          ],
        },
      },
      {
        id: 'pipelineType',
        type: 'select',
        label: 'Pipeline Type',
        required: true,
        options: [
          { label: 'Training Pipeline', value: 'training' },
          { label: 'Inference Pipeline', value: 'inference' },
          { label: 'Feature Engineering', value: 'feature_engineering' },
          { label: 'Model Validation', value: 'validation' },
          { label: 'Deployment Pipeline', value: 'deployment' },
          { label: 'A/B Testing', value: 'ab_testing' },
        ],
        description: 'Type of ML pipeline to orchestrate',
      },
      {
        id: 'environment',
        type: 'select',
        label: 'Environment',
        defaultValue: 'development',
        options: [
          { label: 'Development', value: 'development' },
          { label: 'Staging', value: 'staging' },
          { label: 'Production', value: 'production' },
        ],
        description: 'Deployment environment',
      },

      // Data Configuration
      {
        id: 'dataSource',
        type: 'select',
        label: 'Data Source',
        required: true,
        options: [
          { label: 'S3 Bucket', value: 's3' },
          { label: 'GCS Bucket', value: 'gcs' },
          { label: 'Local File System', value: 'local' },
          { label: 'Database', value: 'database' },
          { label: 'API Endpoint', value: 'api' },
          { label: 'Stream', value: 'stream' },
        ],
        description: 'Source of training/inference data',
      },
      {
        id: 'dataPath',
        type: 'text',
        label: 'Data Path',
        required: true,
        placeholder: 's3://bucket/path/to/data',
        description: 'Path or URL to the data source',
        conditional: {
          showWhen: { dataSource: ['s3', 'gcs', 'local'] },
        },
      },
      {
        id: 'databaseConfig',
        type: 'json',
        label: 'Database Configuration',
        placeholder: '{"host": "localhost", "database": "ml_data", "table": "training_data"}',
        description: 'Database connection configuration',
        conditional: {
          showWhen: { dataSource: ['database'] },
        },
      },
      {
        id: 'apiConfig',
        type: 'json',
        label: 'API Configuration',
        placeholder: '{"endpoint": "https://api.example.com/data", "headers": {}}',
        description: 'API endpoint configuration',
        conditional: {
          showWhen: { dataSource: ['api'] },
        },
      },

      // Model Configuration
      {
        id: 'modelFramework',
        type: 'select',
        label: 'ML Framework',
        defaultValue: 'scikit-learn',
        options: [
          { label: 'Scikit-Learn', value: 'scikit-learn' },
          { label: 'TensorFlow', value: 'tensorflow' },
          { label: 'PyTorch', value: 'pytorch' },
          { label: 'XGBoost', value: 'xgboost' },
          { label: 'LightGBM', value: 'lightgbm' },
          { label: 'Hugging Face', value: 'huggingface' },
          { label: 'Custom', value: 'custom' },
        ],
        description: 'Machine learning framework to use',
      },
      {
        id: 'modelType',
        type: 'select',
        label: 'Model Type',
        options: [
          { label: 'Classification', value: 'classification' },
          { label: 'Regression', value: 'regression' },
          { label: 'Clustering', value: 'clustering' },
          { label: 'Deep Learning', value: 'deep_learning' },
          { label: 'NLP', value: 'nlp' },
          { label: 'Computer Vision', value: 'cv' },
          { label: 'Time Series', value: 'time_series' },
        ],
        description: 'Type of machine learning model',
      },
      {
        id: 'modelConfig',
        type: 'json',
        label: 'Model Configuration',
        placeholder: '{"algorithm": "random_forest", "n_estimators": 100, "max_depth": 10}',
        description: 'Model-specific configuration parameters',
      },

      // Pipeline Steps
      {
        id: 'enableDataValidation',
        type: 'switch',
        label: 'Enable Data Validation',
        defaultValue: true,
        description: 'Validate input data quality and schema',
      },
      {
        id: 'enableFeatureEngineering',
        type: 'switch',
        label: 'Enable Feature Engineering',
        defaultValue: true,
        description: 'Apply feature preprocessing and engineering',
      },
      {
        id: 'featureConfig',
        type: 'json',
        label: 'Feature Engineering Config',
        placeholder: '{"scaling": "standard", "encoding": "one_hot", "feature_selection": true}',
        description: 'Feature engineering pipeline configuration',
        conditional: {
          showWhen: { enableFeatureEngineering: [true] },
        },
      },
      {
        id: 'enableModelValidation',
        type: 'switch',
        label: 'Enable Model Validation',
        defaultValue: true,
        description: 'Validate model performance and metrics',
      },
      {
        id: 'validationMetrics',
        type: 'multiselect',
        label: 'Validation Metrics',
        options: [
          { label: 'Accuracy', value: 'accuracy' },
          { label: 'Precision', value: 'precision' },
          { label: 'Recall', value: 'recall' },
          { label: 'F1 Score', value: 'f1' },
          { label: 'AUC ROC', value: 'auc_roc' },
          { label: 'MSE', value: 'mse' },
          { label: 'MAE', value: 'mae' },
          { label: 'R²', value: 'r2' },
        ],
        conditional: {
          showWhen: { enableModelValidation: [true] },
        },
        description: 'Metrics to calculate during validation',
      },

      // Deployment Configuration
      {
        id: 'enableDeployment',
        type: 'switch',
        label: 'Enable Auto Deployment',
        defaultValue: false,
        description: 'Automatically deploy successful models',
      },
      {
        id: 'deploymentTarget',
        type: 'select',
        label: 'Deployment Target',
        options: [
          { label: 'REST API', value: 'rest_api' },
          { label: 'Batch Prediction', value: 'batch' },
          { label: 'Streaming', value: 'streaming' },
          { label: 'Edge Device', value: 'edge' },
          { label: 'Container Registry', value: 'container' },
        ],
        conditional: {
          showWhen: { enableDeployment: [true] },
        },
        description: 'Target deployment platform',
      },
      {
        id: 'deploymentConfig',
        type: 'json',
        label: 'Deployment Configuration',
        placeholder: '{"replicas": 3, "memory": "2Gi", "cpu": "1000m"}',
        description: 'Deployment-specific configuration',
        conditional: {
          showWhen: { enableDeployment: [true] },
        },
      },

      // Monitoring & Alerting
      {
        id: 'enableMonitoring',
        type: 'switch',
        label: 'Enable Monitoring',
        defaultValue: true,
        description: 'Monitor pipeline execution and model performance',
      },
      {
        id: 'alertThresholds',
        type: 'json',
        label: 'Alert Thresholds',
        placeholder: '{"accuracy_threshold": 0.85, "latency_threshold": 1000}',
        description: 'Thresholds for monitoring alerts',
        conditional: {
          showWhen: { enableMonitoring: [true] },
        },
      },

      // Resource Configuration
      {
        id: 'computeResources',
        type: 'json',
        label: 'Compute Resources',
        placeholder: '{"cpu": "4", "memory": "8Gi", "gpu": 0}',
        description: 'Required compute resources for pipeline execution',
      },
      {
        id: 'timeoutMinutes',
        type: 'number',
        label: 'Timeout (minutes)',
        defaultValue: 60,
        validation: {
          rules: [
            { type: 'min', value: 1, message: 'Minimum 1 minute' },
            { type: 'max', value: 1440, message: 'Maximum 24 hours' },
          ],
        },
        description: 'Maximum execution time for the pipeline',
      },
    ];
  }

  /**
   * Convert PropertyRendererConfigs to legacy NodeProperty format for compatibility
   */
  protected getProperties(): NodeProperty[] {
    const configs = this.getPropertyConfigs();
    return configs.map(config => this.convertConfigToNodeProperty(config));
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
      required: config.required || false,
      options: config.options?.map(option => ({
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
      'text': 'string',
      'password': 'password',
      'number': 'number',
      'checkbox': 'boolean',
      'switch': 'boolean',
      'select': 'options',
      'multiselect': 'multiOptions',
      'textarea': 'string',
      'datetime': 'dateTime',
      'date': 'dateTime',
      'color': 'color',
      'file': 'file',
      'json': 'json',
      'collection': 'collection',
      'fixedcollection': 'fixedCollection',
      'credentials': 'credentialsSelect',
      'resource': 'resourceLocator',
      'expression': 'expression',
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

    if (config.type === 'textarea' || config.type === 'json') {
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
}

export const mlPipelineNodeDefinition = new MLPipelineNodeDefinition();
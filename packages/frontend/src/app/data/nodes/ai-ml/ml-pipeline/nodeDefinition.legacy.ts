import { BaseNodeDefinition, type NodeProperty } from '@/core/nodes/BaseNodeDefinition';

/**
 * ML Pipeline Orchestrator Node Definition
 * Extends BaseNodeDefinition to eliminate code duplication and provide standardized properties
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
        color: '#9333ea', // Purple for ML
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

  protected getProperties(): NodeProperty[] {
    return [
      // Pipeline Configuration - using base class helpers
      this.createCollectionProperty(
        'Pipeline Configuration',
        'pipelineConfig',
        [
          this.createStringProperty('Pipeline Name', 'pipelineName', {
            required: true,
            placeholder: 'my-ml-pipeline',
            description: 'Name for the ML pipeline',
          }),
          this.createSelectProperty('Pipeline Type', 'pipelineType', [
            { name: 'Training Pipeline', value: 'training' },
            { name: 'Inference Pipeline', value: 'inference' },
            { name: 'Batch Prediction', value: 'batch_prediction' },
            { name: 'Real-time Serving', value: 'real_time_serving' },
            { name: 'Model Evaluation', value: 'evaluation' },
            { name: 'Data Processing', value: 'data_processing' },
            { name: 'Feature Engineering', value: 'feature_engineering' },
            { name: 'Model Comparison', value: 'model_comparison' },
          ], {
            required: true,
            description: 'Type of ML pipeline to execute',
          }),
          this.createSelectProperty('Execution Mode', 'executionMode', [
            { name: 'Sequential', value: 'sequential' },
            { name: 'Parallel', value: 'parallel' },
            { name: 'Conditional', value: 'conditional' },
            { name: 'DAG (Directed Acyclic Graph)', value: 'dag' },
          ], {
            required: true,
            description: 'How pipeline stages should be executed',
          }),
          this.createSelectProperty('Environment', 'environment', [
            { name: 'Development', value: 'development' },
            { name: 'Staging', value: 'staging' },
            { name: 'Production', value: 'production' },
            { name: 'Experiment', value: 'experiment' },
          ], {
            required: true,
            description: 'Target environment for pipeline execution',
          }),
        ],
        { description: 'Configure the ML pipeline stages' }
      ),

      // Pipeline Stages - simplified using base methods
      {
        displayName: 'Pipeline Stages',
        name: 'stages',
        type: 'fixedCollection',
        default: {},
        description: 'Configure individual pipeline stages',
        typeOptions: { multipleValues: true },
        options: [{
          name: 'stage',
          displayName: 'Pipeline Stage',
          values: [
            this.createStringProperty('Stage Name', 'stageName', { required: true }),
            this.createSelectProperty('Stage Type', 'stageType', [
              { name: 'Data Preprocessing', value: 'data_preprocessing' },
              { name: 'Feature Engineering', value: 'feature_engineering' },
              { name: 'Model Training', value: 'model_training' },
              { name: 'Model Evaluation', value: 'model_evaluation' },
              { name: 'Model Deployment', value: 'model_deployment' },
              { name: 'Custom Script', value: 'custom_script' },
            ], { required: true }),
            this.createJsonProperty('Stage Configuration', 'stageConfig', {
              description: 'Stage-specific configuration (JSON)',
            }),
            this.createStringProperty('Dependencies', 'dependencies', {
              placeholder: 'stage1,stage2',
              description: 'Comma-separated list of dependent stages',
            }),
            this.createNumberProperty('Timeout (minutes)', 'timeout', {
              default: 60,
              typeOptions: { minValue: 1, maxValue: 1440 },
              description: 'Maximum execution time for this stage',
            }),
          ],
        }],
      },

      // Data Configuration - using base helpers
      this.createCollectionProperty(
        'Data Configuration',
        'dataConfig',
        [
          this.createSelectProperty('Data Source Type', 'dataSourceType', [
            { name: 'Workflow Input', value: 'workflow_input' },
            { name: 'Database', value: 'database' },
            { name: 'File Storage', value: 'file_storage' },
            { name: 'API Endpoint', value: 'api_endpoint' },
            { name: 'Data Lake', value: 'data_lake' },
            { name: 'Stream Processing', value: 'stream_processing' },
          ], {
            required: true,
            description: 'Source of training/inference data',
          }),
          this.createSelectProperty('Data Format', 'dataFormat', [
            { name: 'JSON', value: 'json' },
            { name: 'CSV', value: 'csv' },
            { name: 'Parquet', value: 'parquet' },
            { name: 'Avro', value: 'avro' },
            { name: 'TFRecord', value: 'tfrecord' },
          ], {
            required: true,
            description: 'Format of the input data',
          }),
          this.createBooleanProperty('Enable Feature Store', 'featureStoreEnabled', {
            description: 'Enable feature store integration',
          }),
        ],
        { description: 'Configure data sources and processing' }
      ),

      // Model Configuration - conditional display and streamlined
      this.createCollectionProperty(
        'Model Configuration',
        'modelConfig',
        [
          this.createSelectProperty('Model Registry', 'modelRegistry', [
            { name: 'Local Registry', value: 'local' },
            { name: 'MLflow', value: 'mlflow' },
            { name: 'AWS SageMaker', value: 'sagemaker' },
            { name: 'Google AI Platform', value: 'gcp_ai_platform' },
            { name: 'Azure ML', value: 'azure_ml' },
            { name: 'HuggingFace Hub', value: 'huggingface' },
          ], {
            required: true,
            description: 'Model registry for storing and versioning models',
          }),
          this.createSelectProperty('Versioning Strategy', 'versioningStrategy', [
            { name: 'Semantic Versioning', value: 'semantic' },
            { name: 'Timestamp', value: 'timestamp' },
            { name: 'Git Commit Hash', value: 'git_hash' },
            { name: 'Auto Increment', value: 'auto_increment' },
          ], {
            required: true,
            description: 'Strategy for model versioning',
          }),
          {
            displayName: 'Comparison Metrics',
            name: 'comparisonMetrics',
            type: 'multiSelect',
            default: ['accuracy', 'f1_score'],
            options: [
              { name: 'Accuracy', value: 'accuracy' },
              { name: 'Precision', value: 'precision' },
              { name: 'Recall', value: 'recall' },
              { name: 'F1 Score', value: 'f1_score' },
              { name: 'AUC-ROC', value: 'auc_roc' },
              { name: 'Mean Squared Error', value: 'mse' },
            ],
            description: 'Metrics for comparing model performance',
          },
        ],
        {
          description: 'Configure model settings',
          displayOptions: this.showWhen('/pipelineConfig/pipelineType', [
            'training', 'inference', 'batch_prediction', 'evaluation'
          ]),
        }
      ),

      // Deployment Configuration - streamlined
      this.createCollectionProperty(
        'Deployment Configuration',
        'deploymentConfig',
        [
          this.createBooleanProperty('Auto Deploy', 'autoDeploy', {
            description: 'Automatically deploy model after successful training',
          }),
          this.createSelectProperty('Deployment Target', 'deploymentTarget', [
            { name: 'Kubernetes', value: 'kubernetes' },
            { name: 'Docker', value: 'docker' },
            { name: 'AWS SageMaker', value: 'sagemaker' },
            { name: 'Google Cloud Run', value: 'cloud_run' },
            { name: 'Azure Container Instances', value: 'azure_aci' },
            { name: 'Serverless (Lambda)', value: 'serverless' },
          ], {
            required: true,
            displayOptions: this.showWhen('autoDeploy', [true]),
            description: 'Target platform for model deployment',
          }),
          this.createSelectProperty('Deployment Strategy', 'deploymentStrategy', [
            { name: 'Blue-Green', value: 'blue_green' },
            { name: 'Canary', value: 'canary' },
            { name: 'Rolling Update', value: 'rolling' },
            { name: 'A/B Testing', value: 'ab_testing' },
          ], {
            displayOptions: this.showWhen('autoDeploy', [true]),
            description: 'Strategy for deploying the model',
          }),
        ],
        {
          description: 'Configure model deployment',
          displayOptions: this.showWhen('/pipelineConfig/pipelineType', [
            'training', 'real_time_serving'
          ]),
        }
      ),

      // Monitoring Configuration - simplified
      this.createCollectionProperty(
        'Monitoring Configuration',
        'monitoringConfig',
        [
          this.createBooleanProperty('Enable Monitoring', 'enabled', {
            default: true,
            description: 'Enable monitoring for the pipeline',
          }),
          this.createSelectProperty('Monitoring Platform', 'platform', [
            { name: 'Prometheus + Grafana', value: 'prometheus' },
            { name: 'DataDog', value: 'datadog' },
            { name: 'AWS CloudWatch', value: 'cloudwatch' },
            { name: 'Google Cloud Monitoring', value: 'gcp_monitoring' },
            { name: 'Azure Monitor', value: 'azure_monitor' },
          ], {
            displayOptions: this.showWhen('enabled', [true]),
            description: 'Monitoring platform to use',
          }),
          {
            displayName: 'Metrics to Track',
            name: 'metricsToTrack',
            type: 'multiSelect',
            default: ['model_accuracy', 'inference_latency'],
            displayOptions: this.showWhen('enabled', [true]),
            options: [
              { name: 'Model Accuracy', value: 'model_accuracy' },
              { name: 'Inference Latency', value: 'inference_latency' },
              { name: 'Throughput', value: 'throughput' },
              { name: 'Error Rate', value: 'error_rate' },
              { name: 'Data Drift', value: 'data_drift' },
              { name: 'Resource Utilization', value: 'resource_utilization' },
            ],
            description: 'Metrics to monitor',
          },
        ],
        { description: 'Configure pipeline and model monitoring' }
      ),

      // Experiment Tracking - simplified
      this.createCollectionProperty(
        'Experiment Tracking',
        'experimentTracking',
        [
          this.createBooleanProperty('Enable Experiment Tracking', 'enabled', {
            default: true,
            description: 'Track experiments and model versions',
          }),
          this.createSelectProperty('Tracking Platform', 'platform', [
            { name: 'MLflow', value: 'mlflow' },
            { name: 'Weights & Biases', value: 'wandb' },
            { name: 'Neptune', value: 'neptune' },
            { name: 'TensorBoard', value: 'tensorboard' },
            { name: 'AWS SageMaker Experiments', value: 'sagemaker' },
          ], {
            displayOptions: this.showWhen('enabled', [true]),
            description: 'Platform for experiment tracking',
          }),
          this.createStringProperty('Experiment Name', 'experimentName', {
            placeholder: 'my-ml-experiment',
            displayOptions: this.showWhen('enabled', [true]),
            description: 'Name for the experiment run',
          }),
          this.createStringProperty('Tags', 'tags', {
            placeholder: 'production,v2.0,text-classification',
            displayOptions: this.showWhen('enabled', [true]),
            description: 'Comma-separated tags for the experiment',
          }),
        ],
        { description: 'Configure experiment tracking and versioning' }
      ),
    ];
  }

  async execute(): Promise<any> {
    // Implementation would be handled by the workflow engine
    // This is a placeholder for the actual execution logic
    throw new Error('ML Pipeline execution should be handled by the workflow engine');
  }
}

// Export the instance
export const mlPipelineNodeDefinition = new MLPipelineNodeDefinition();
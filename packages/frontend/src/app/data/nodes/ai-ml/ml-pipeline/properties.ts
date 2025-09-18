import type { NodeProperty } from "@/core/nodes/types";

export const mlPipelineProperties: NodeProperty[] = [
  // Pipeline Configuration Section
  {
    displayName: "Pipeline Configuration",
    name: "pipelineConfig",
    type: "collection",
    default: {},
    description: "Configure the ML pipeline stages",
    options: [
      {
        displayName: "Pipeline Name",
        name: "pipelineName",
        type: "string",
        required: true,
        default: "",
        placeholder: "my-ml-pipeline",
        description: "Name for the ML pipeline",
      },
      {
        displayName: "Pipeline Type",
        name: "pipelineType",
        type: "select",
        required: true,
        default: "training",
        options: [
          { name: "Training Pipeline", value: "training" },
          { name: "Inference Pipeline", value: "inference" },
          { name: "Batch Prediction", value: "batch_prediction" },
          { name: "Real-time Serving", value: "real_time_serving" },
          { name: "Model Evaluation", value: "evaluation" },
          { name: "Data Processing", value: "data_processing" },
          { name: "Feature Engineering", value: "feature_engineering" },
          { name: "Model Comparison", value: "model_comparison" },
        ],
        description: "Type of ML pipeline to execute",
      },
      {
        displayName: "Execution Mode",
        name: "executionMode",
        type: "select",
        required: true,
        default: "sequential",
        options: [
          { name: "Sequential", value: "sequential" },
          { name: "Parallel", value: "parallel" },
          { name: "Conditional", value: "conditional" },
          { name: "DAG (Directed Acyclic Graph)", value: "dag" },
        ],
        description: "How pipeline stages should be executed",
      },
      {
        displayName: "Environment",
        name: "environment",
        type: "select",
        required: true,
        default: "development",
        options: [
          { name: "Development", value: "development" },
          { name: "Staging", value: "staging" },
          { name: "Production", value: "production" },
          { name: "Experiment", value: "experiment" },
        ],
        description: "Target environment for pipeline execution",
      },
    ],
  },

  // Pipeline Stages Section
  {
    displayName: "Pipeline Stages",
    name: "stages",
    type: "fixedCollection",
    default: {},
    description: "Configure individual pipeline stages",
    typeOptions: {
      multipleValues: true,
    },
    options: [
      {
        name: "stage",
        displayName: "Pipeline Stage",
        values: [
          {
            displayName: "Stage Name",
            name: "stageName",
            type: "string",
            required: true,
            default: "",
            description: "Name of the pipeline stage",
          },
          {
            displayName: "Stage Type",
            name: "stageType",
            type: "select",
            required: true,
            default: "data_preprocessing",
            options: [
              { name: "Data Preprocessing", value: "data_preprocessing" },
              { name: "Feature Engineering", value: "feature_engineering" },
              { name: "Data Validation", value: "data_validation" },
              { name: "Model Training", value: "model_training" },
              { name: "Model Evaluation", value: "model_evaluation" },
              { name: "Model Validation", value: "model_validation" },
              { name: "Model Deployment", value: "model_deployment" },
              { name: "Data Drift Detection", value: "data_drift_detection" },
              { name: "Model Monitoring", value: "model_monitoring" },
              { name: "A/B Testing", value: "ab_testing" },
              { name: "Custom Script", value: "custom_script" },
            ],
            description: "Type of stage operation",
          },
          {
            displayName: "Stage Configuration",
            name: "stageConfig",
            type: "json",
            default: "{}",
            description: "Stage-specific configuration (JSON)",
          },
          {
            displayName: "Dependencies",
            name: "dependencies",
            type: "string",
            default: "",
            placeholder: "stage1,stage2",
            description: "Comma-separated list of dependent stages",
          },
          {
            displayName: "Retry Policy",
            name: "retryPolicy",
            type: "collection",
            default: {},
            options: [
              {
                displayName: "Max Retries",
                name: "maxRetries",
                type: "number",
                default: 3,
                typeOptions: {
                  minValue: 0,
                  maxValue: 10,
                },
              },
              {
                displayName: "Retry Delay (seconds)",
                name: "retryDelay",
                type: "number",
                default: 30,
                typeOptions: {
                  minValue: 1,
                  maxValue: 3600,
                },
              },
              {
                displayName: "Exponential Backoff",
                name: "exponentialBackoff",
                type: "boolean",
                default: true,
              },
            ],
          },
          {
            displayName: "Timeout (minutes)",
            name: "timeout",
            type: "number",
            default: 60,
            typeOptions: {
              minValue: 1,
              maxValue: 1440,
            },
            description: "Maximum execution time for this stage",
          },
        ],
      },
    ],
  },

  // Data Configuration Section
  {
    displayName: "Data Configuration",
    name: "dataConfig",
    type: "collection",
    default: {},
    description: "Configure data sources and processing",
    options: [
      {
        displayName: "Data Source Type",
        name: "dataSourceType",
        type: "select",
        required: true,
        default: "workflow_input",
        options: [
          { name: "Workflow Input", value: "workflow_input" },
          { name: "Database", value: "database" },
          { name: "File Storage", value: "file_storage" },
          { name: "API Endpoint", value: "api_endpoint" },
          { name: "Data Lake", value: "data_lake" },
          { name: "Stream Processing", value: "stream_processing" },
        ],
        description: "Source of training/inference data",
      },
      {
        displayName: "Data Format",
        name: "dataFormat",
        type: "select",
        required: true,
        default: "json",
        options: [
          { name: "JSON", value: "json" },
          { name: "CSV", value: "csv" },
          { name: "Parquet", value: "parquet" },
          { name: "Avro", value: "avro" },
          { name: "TFRecord", value: "tfrecord" },
          { name: "HDF5", value: "hdf5" },
          { name: "Arrow", value: "arrow" },
        ],
        description: "Format of the input data",
      },
      {
        displayName: "Data Validation Rules",
        name: "validationRules",
        type: "fixedCollection",
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        options: [
          {
            name: "rule",
            displayName: "Validation Rule",
            values: [
              {
                displayName: "Rule Name",
                name: "ruleName",
                type: "string",
                required: true,
                default: "",
              },
              {
                displayName: "Rule Type",
                name: "ruleType",
                type: "select",
                required: true,
                default: "schema_validation",
                options: [
                  { name: "Schema Validation", value: "schema_validation" },
                  { name: "Data Quality Check", value: "data_quality_check" },
                  {
                    name: "Statistical Validation",
                    value: "statistical_validation",
                  },
                  { name: "Business Rule Check", value: "business_rule_check" },
                  { name: "Anomaly Detection", value: "anomaly_detection" },
                ],
              },
              {
                displayName: "Rule Configuration",
                name: "ruleConfig",
                type: "json",
                default: "{}",
              },
            ],
          },
        ],
      },
      {
        displayName: "Feature Store Integration",
        name: "featureStore",
        type: "collection",
        default: {},
        options: [
          {
            displayName: "Enable Feature Store",
            name: "enabled",
            type: "boolean",
            default: false,
          },
          {
            displayName: "Feature Store Provider",
            name: "provider",
            type: "select",
            default: "feast",
            displayOptions: {
              show: {
                enabled: [true],
              },
            },
            options: [
              { name: "Feast", value: "feast" },
              { name: "Tecton", value: "tecton" },
              { name: "AWS Feature Store", value: "aws_feature_store" },
              { name: "Google Feature Store", value: "gcp_feature_store" },
              { name: "Azure Feature Store", value: "azure_feature_store" },
            ],
          },
          {
            displayName: "Feature Groups",
            name: "featureGroups",
            type: "string",
            default: "",
            displayOptions: {
              show: {
                enabled: [true],
              },
            },
            placeholder: "user_features,product_features",
            description: "Comma-separated list of feature groups",
          },
        ],
      },
    ],
  },

  // Model Configuration Section
  {
    displayName: "Model Configuration",
    name: "modelConfig",
    type: "collection",
    default: {},
    description: "Configure model settings",
    displayOptions: {
      show: {
        "/pipelineConfig/pipelineType": [
          "training",
          "inference",
          "batch_prediction",
          "evaluation",
        ],
      },
    },
    options: [
      {
        displayName: "Model Registry",
        name: "modelRegistry",
        type: "select",
        required: true,
        default: "local",
        options: [
          { name: "Local Registry", value: "local" },
          { name: "MLflow", value: "mlflow" },
          { name: "AWS SageMaker", value: "sagemaker" },
          { name: "Google AI Platform", value: "gcp_ai_platform" },
          { name: "Azure ML", value: "azure_ml" },
          { name: "HuggingFace Hub", value: "huggingface" },
          { name: "Weights & Biases", value: "wandb" },
        ],
        description: "Model registry for storing and versioning models",
      },
      {
        displayName: "Model Versioning Strategy",
        name: "versioningStrategy",
        type: "select",
        required: true,
        default: "semantic",
        options: [
          { name: "Semantic Versioning", value: "semantic" },
          { name: "Timestamp", value: "timestamp" },
          { name: "Git Commit Hash", value: "git_hash" },
          { name: "Auto Increment", value: "auto_increment" },
          { name: "Custom", value: "custom" },
        ],
        description: "Strategy for model versioning",
      },
      {
        displayName: "Model Comparison Metrics",
        name: "comparisonMetrics",
        type: "multiSelect",
        default: ["accuracy", "f1_score"],
        options: [
          { name: "Accuracy", value: "accuracy" },
          { name: "Precision", value: "precision" },
          { name: "Recall", value: "recall" },
          { name: "F1 Score", value: "f1_score" },
          { name: "AUC-ROC", value: "auc_roc" },
          { name: "AUC-PR", value: "auc_pr" },
          { name: "Mean Squared Error", value: "mse" },
          { name: "Mean Absolute Error", value: "mae" },
          { name: "R²Score", value: "r2_score" },
          { name: "Log Loss", value: "log_loss" },
        ],
        description: "Metrics for comparing model performance",
      },
      {
        displayName: "Model Selection Criteria",
        name: "selectionCriteria",
        type: "collection",
        default: {},
        options: [
          {
            displayName: "Primary Metric",
            name: "primaryMetric",
            type: "select",
            required: true,
            default: "accuracy",
            options: [
              { name: "Accuracy", value: "accuracy" },
              { name: "F1 Score", value: "f1_score" },
              { name: "AUC-ROC", value: "auc_roc" },
              { name: "Mean Squared Error", value: "mse" },
              { name: "Custom Metric", value: "custom" },
            ],
          },
          {
            displayName: "Optimization Goal",
            name: "optimizationGoal",
            type: "select",
            required: true,
            default: "maximize",
            options: [
              { name: "Maximize", value: "maximize" },
              { name: "Minimize", value: "minimize" },
            ],
          },
          {
            displayName: "Minimum Threshold",
            name: "minThreshold",
            type: "number",
            default: 0.8,
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              numberPrecision: 3,
            },
          },
        ],
      },
    ],
  },

  // Deployment Configuration Section
  {
    displayName: "Deployment Configuration",
    name: "deploymentConfig",
    type: "collection",
    default: {},
    description: "Configure model deployment",
    displayOptions: {
      show: {
        "/pipelineConfig/pipelineType": ["training", "real_time_serving"],
      },
    },
    options: [
      {
        displayName: "Auto Deploy",
        name: "autoDeploy",
        type: "boolean",
        default: false,
        description: "Automatically deploy model after successful training",
      },
      {
        displayName: "Deployment Target",
        name: "deploymentTarget",
        type: "select",
        required: true,
        default: "kubernetes",
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          { name: "Kubernetes", value: "kubernetes" },
          { name: "Docker", value: "docker" },
          { name: "AWS SageMaker", value: "sagemaker" },
          { name: "Google Cloud Run", value: "cloud_run" },
          { name: "Azure Container Instances", value: "azure_aci" },
          { name: "Serverless (Lambda)", value: "serverless" },
          { name: "Edge Deployment", value: "edge" },
        ],
        description: "Target platform for model deployment",
      },
      {
        displayName: "Deployment Strategy",
        name: "deploymentStrategy",
        type: "select",
        default: "blue_green",
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          { name: "Blue-Green", value: "blue_green" },
          { name: "Canary", value: "canary" },
          { name: "Rolling Update", value: "rolling" },
          { name: "Shadow Deployment", value: "shadow" },
          { name: "A/B Testing", value: "ab_testing" },
        ],
        description: "Strategy for deploying the model",
      },
      {
        displayName: "Scaling Configuration",
        name: "scalingConfig",
        type: "collection",
        default: {},
        displayOptions: {
          show: {
            autoDeploy: [true],
          },
        },
        options: [
          {
            displayName: "Min Instances",
            name: "minInstances",
            type: "number",
            default: 1,
            typeOptions: {
              minValue: 0,
              maxValue: 100,
            },
          },
          {
            displayName: "Max Instances",
            name: "maxInstances",
            type: "number",
            default: 10,
            typeOptions: {
              minValue: 1,
              maxValue: 1000,
            },
          },
          {
            displayName: "Target CPU Utilization (%)",
            name: "targetCpuUtilization",
            type: "number",
            default: 70,
            typeOptions: {
              minValue: 10,
              maxValue: 90,
            },
          },
        ],
      },
    ],
  },

  // Monitoring Configuration Section
  {
    displayName: "Monitoring Configuration",
    name: "monitoringConfig",
    type: "collection",
    default: {},
    description: "Configure pipeline and model monitoring",
    options: [
      {
        displayName: "Enable Monitoring",
        name: "enabled",
        type: "boolean",
        default: true,
        description: "Enable monitoring for the pipeline",
      },
      {
        displayName: "Monitoring Platform",
        name: "platform",
        type: "select",
        default: "prometheus",
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: "Prometheus + Grafana", value: "prometheus" },
          { name: "DataDog", value: "datadog" },
          { name: "New Relic", value: "newrelic" },
          { name: "AWS CloudWatch", value: "cloudwatch" },
          { name: "Google Cloud Monitoring", value: "gcp_monitoring" },
          { name: "Azure Monitor", value: "azure_monitor" },
          { name: "Custom", value: "custom" },
        ],
        description: "Monitoring platform to use",
      },
      {
        displayName: "Metrics to Track",
        name: "metricsToTrack",
        type: "multiSelect",
        default: ["model_accuracy", "inference_latency"],
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: "Model Accuracy", value: "model_accuracy" },
          { name: "Inference Latency", value: "inference_latency" },
          { name: "Throughput", value: "throughput" },
          { name: "Error Rate", value: "error_rate" },
          { name: "Data Drift", value: "data_drift" },
          { name: "Concept Drift", value: "concept_drift" },
          { name: "Feature Importance", value: "feature_importance" },
          { name: "Resource Utilization", value: "resource_utilization" },
          { name: "Cost Metrics", value: "cost_metrics" },
        ],
        description: "Metrics to monitor",
      },
      {
        displayName: "Alert Configuration",
        name: "alertConfig",
        type: "collection",
        default: {},
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          {
            displayName: "Enable Alerts",
            name: "enableAlerts",
            type: "boolean",
            default: true,
          },
          {
            displayName: "Alert Thresholds",
            name: "thresholds",
            type: "json",
            default: '{"accuracy_drop": 0.05, "latency_increase": 2.0}',
            displayOptions: {
              show: {
                enableAlerts: [true],
              },
            },
            description: "JSON configuration for alert thresholds",
          },
          {
            displayName: "Alert Channels",
            name: "channels",
            type: "multiSelect",
            default: ["email"],
            displayOptions: {
              show: {
                enableAlerts: [true],
              },
            },
            options: [
              { name: "Email", value: "email" },
              { name: "Slack", value: "slack" },
              { name: "PagerDuty", value: "pagerduty" },
              { name: "Microsoft Teams", value: "teams" },
              { name: "Webhook", value: "webhook" },
              { name: "SMS", value: "sms" },
            ],
          },
        ],
      },
    ],
  },

  // Experiment Tracking Section
  {
    displayName: "Experiment Tracking",
    name: "experimentTracking",
    type: "collection",
    default: {},
    description: "Configure experiment tracking and versioning",
    options: [
      {
        displayName: "Enable Experiment Tracking",
        name: "enabled",
        type: "boolean",
        default: true,
        description: "Track experiments and model versions",
      },
      {
        displayName: "Experiment Tracking Platform",
        name: "platform",
        type: "select",
        default: "mlflow",
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        options: [
          { name: "MLflow", value: "mlflow" },
          { name: "Weights & Biases", value: "wandb" },
          { name: "Neptune", value: "neptune" },
          { name: "Comet ML", value: "comet" },
          { name: "TensorBoard", value: "tensorboard" },
          { name: "Azure ML Experiments", value: "azure_ml" },
          { name: "AWS SageMaker Experiments", value: "sagemaker" },
        ],
        description: "Platform for experiment tracking",
      },
      {
        displayName: "Experiment Name",
        name: "experimentName",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        placeholder: "my-ml-experiment",
        description: "Name for the experiment run",
      },
      {
        displayName: "Tags",
        name: "tags",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        placeholder: "production,v2.0,text-classification",
        description: "Comma-separated tags for the experiment",
      },
    ],
  },
];

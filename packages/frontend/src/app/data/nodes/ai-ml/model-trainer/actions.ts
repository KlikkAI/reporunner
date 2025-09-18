// Define action interfaces locally
type NodeExecutionContext = Record<string, any>;
type NodeActionResult = {
  success: boolean;
  data?: any[];
  error?: string | { message: string; code?: string; details?: any };
  metadata?: Record<string, any>;
};
import { aiModelService } from "@/core/services/aiModelService";

export const modelTrainerActions = {
  async execute(context: NodeExecutionContext): Promise<NodeActionResult> {
    const {
      modelConfig,
      trainingConfig,
      dataConfig,
      advancedOptions,
      hardwareConfig,
      outputConfig,
      dataAugmentation,
    } = context.node.parameters;

    try {
      // Validate input data
      const inputData = context.inputData.main;
      if (!inputData || !Array.isArray(inputData)) {
        throw new Error("Input data must be an array of training examples");
      }

      // Validate required columns
      if (inputData.length === 0) {
        throw new Error("Training data cannot be empty");
      }

      const firstRow = inputData[0];
      if (!firstRow[dataConfig.inputColumn]) {
        throw new Error(
          `Input column '${dataConfig.inputColumn}' not found in data`,
        );
      }
      if (!firstRow[dataConfig.targetColumn]) {
        throw new Error(
          `Target column '${dataConfig.targetColumn}' not found in data`,
        );
      }

      // Create AI model configuration
      const modelData = {
        name: modelConfig.modelName,
        description:
          modelConfig.description ||
          `${modelConfig.modelType} model trained on ${inputData.length} samples`,
        type: modelConfig.modelType,
        provider: "custom" as const,
        version: "1.0.0",
        status: "draft" as const,
        configuration: {
          architecture:
            modelConfig.baseModel || modelConfig.visionModel || "custom",
          parameters: {
            model_size:
              modelConfig.baseModel || modelConfig.visionModel || "base",
            hidden_size: getModelHiddenSize(
              modelConfig.baseModel || modelConfig.visionModel,
            ),
            num_layers: getModelLayers(
              modelConfig.baseModel || modelConfig.visionModel,
            ),
            num_attention_heads: getModelHeads(
              modelConfig.baseModel || modelConfig.visionModel,
            ),
            vocabulary_size: 30522,
            max_position_embeddings: dataConfig.maxLength || 512,
            dropout_rate: advancedOptions.dropoutRate || 0.1,
            learning_rate: trainingConfig.learningRate,
          },
          hyperparameters: {
            batch_size: trainingConfig.batchSize,
            epochs: trainingConfig.epochs,
            optimizer: trainingConfig.optimizer,
            weight_decay: trainingConfig.weightDecay,
            warmup_steps: trainingConfig.warmupSteps,
            gradient_clipping: advancedOptions.gradientClipping,
            mixed_precision: advancedOptions.mixedPrecision,
          },
          inputSchema: {
            type:
              modelConfig.modelType === "computer_vision" ? ("image" as const) : ("text" as const),
            format:
              modelConfig.modelType === "computer_vision" ? "jpeg" : "string",
            fields: [
              {
                name: dataConfig.inputColumn,
                type: "string" as const,
                required: true,
                description: "Input data for training",
              },
            ],
            validation: {
              required: [dataConfig.inputColumn],
              maxLength: dataConfig.maxLength,
            },
          },
          outputSchema: {
            type: "text" as const,
            format: "json",
            fields: [
              {
                name: "prediction",
                type: getOutputType(modelConfig.modelType),
                required: true,
                description: "Model prediction",
              },
              {
                name: "confidence",
                type: "number" as const,
                required: true,
                description: "Prediction confidence",
              },
            ],
            validation: {
              required: ["prediction", "confidence"],
            },
          },
          capabilities: getModelCapabilities(modelConfig.modelType),
        },
        metrics: {
          accuracy: 0,
          trainingTime: 0,
          inferenceTime: 50,
          modelSize: 1024 * 1024 * 100, // 100MB initial estimate
          memoryUsage: hardwareConfig.gpuMemoryLimit
            ? hardwareConfig.gpuMemoryLimit * 1024
            : 2048,
          throughput: 10,
          lastEvaluatedAt: new Date(),
          customMetrics: {},
        },
        training: {
          dataset: {
            id: `dataset_${Date.now()}`,
            name: "Training Dataset",
            source: "upload" as const,
            location: "workflow_input",
            format: "json" as const,
            size: JSON.stringify(inputData).length,
            samples: inputData.length,
            features: Object.keys(firstRow).length,
            preprocessingSteps: [
              {
                type: "tokenize" as const,
                parameters: { max_length: dataConfig.maxLength || 512 },
                order: 1,
              },
            ],
          },
          augmentation: dataAugmentation.enabled
            ? {
                techniques: (
                  dataAugmentation.textAugmentation ||
                  dataAugmentation.imageAugmentation ||
                  []
                ).map((technique: string) => ({
                  type: technique,
                  parameters: {},
                  weight: 1.0,
                })),
                probability: dataAugmentation.augmentationProbability || 0.3,
                preserveLabels: true,
              }
            : undefined,
          splitRatio: {
            train: dataConfig.trainSplit,
            validation: dataConfig.validationSplit,
            test: dataConfig.testSplit,
          },
          epochs: trainingConfig.epochs,
          batchSize: trainingConfig.batchSize,
          optimizer: {
            type: trainingConfig.optimizer,
            learningRate: trainingConfig.learningRate,
            weightDecay: trainingConfig.weightDecay,
          },
          earlyStopping: advancedOptions.enableEarlyStopping
            ? {
                metric: "validation_loss",
                patience: advancedOptions.earlyStopping?.patience || 3,
                minDelta: advancedOptions.earlyStopping?.minDelta || 0.001,
                mode: "min" as const,
                restoreBestWeights: true,
              }
            : undefined,
          checkpointing: {
            saveFrequency: advancedOptions.checkpointFrequency || 1,
            saveOptimizer: advancedOptions.saveCheckpoints || true,
            maxToKeep: 3,
            saveFormat: "pytorch" as const,
          },
          distributedTraining: hardwareConfig.distributedTraining
            ? {
                strategy: "data_parallel" as const,
                nodes: 1,
                gpusPerNode: hardwareConfig.numGpus || 2,
                backend: "nccl" as const,
              }
            : undefined,
        },
        createdBy: context.userId || "system",
        tags: [
          modelConfig.modelType,
          trainingConfig.optimizer,
          `${trainingConfig.epochs}_epochs`,
          "workflow_trained",
        ],
        organizationId: context.organizationId,
      };

      // Create the model
      const model = await aiModelService.createModel(modelData);

      // Start training
      const trainingJob = await aiModelService.startTraining(model.id);

      // Prepare training metadata for output
      const trainingMetadata = {
        modelId: model.id,
        trainingJobId: trainingJob.id,
        modelName: model.name,
        modelType: model.type,
        status: trainingJob.status,
        progress: trainingJob.progress,
        epochs: {
          current: trainingJob.currentEpoch,
          total: trainingJob.totalEpochs,
        },
        configuration: {
          batchSize: trainingConfig.batchSize,
          learningRate: trainingConfig.learningRate,
          optimizer: trainingConfig.optimizer,
        },
        dataInfo: {
          totalSamples: inputData.length,
          trainSamples: Math.floor(inputData.length * dataConfig.trainSplit),
          validationSamples: Math.floor(
            inputData.length * dataConfig.validationSplit,
          ),
          testSamples: Math.floor(inputData.length * dataConfig.testSplit),
          features: Object.keys(firstRow).length,
        },
        hardware: {
          useGpu: hardwareConfig.useGpu,
          distributedTraining: hardwareConfig.distributedTraining,
          numGpus: hardwareConfig.numGpus || 1,
        },
        outputPath: outputConfig.modelOutputPath,
        exportFormats: outputConfig.exportFormat,
        startedAt: trainingJob.startedAt,
        estimatedCompletionTime: new Date(
          Date.now() + trainingConfig.epochs * 5000,
        ), // 5 seconds per epoch for demo
      };

      // Return training job information and model metadata
      return {
        success: true,
        data: [
          {
            main: {
              model: {
                id: model.id,
                name: model.name,
                type: model.type,
                status: model.status,
              },
              training: trainingMetadata,
              message: `Training started for model '${model.name}' with job ID: ${trainingJob.id}`,
            },
            ai_model: model,
            training_metrics: {
              jobId: trainingJob.id,
              status: trainingJob.status,
              progress: trainingJob.progress,
              metrics: trainingJob.metrics,
              logs: trainingJob.logs,
            },
          },
        ],
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to start model training",
        data: [
          {
            main: {
              error: error.message,
              timestamp: new Date().toISOString(),
            },
          },
        ],
        metadata: {
          executionTime: Date.now() - context.startTime,
        },
      };
    }
  },

  async test(context: NodeExecutionContext): Promise<NodeActionResult> {
    const { modelConfig, trainingConfig, dataConfig } = context.node.parameters;

    // Validate configuration without actually training
    const validation = {
      modelConfig: validateModelConfig(modelConfig),
      trainingConfig: validateTrainingConfig(trainingConfig),
      dataConfig: validateDataConfig(dataConfig),
    };

    const allValid = Object.values(validation).every((v) => v.valid);

    return {
      success: allValid,
      data: [
        {
          main: {
            validation,
            message: allValid
              ? "Configuration is valid and ready for training"
              : "Configuration has validation errors",
          },
        },
      ],
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
  },
};

// Helper functions
function getModelHiddenSize(modelName: string): number {
  const sizeMap: Record<string, number> = {
    "bert-base-uncased": 768,
    "bert-large-uncased": 1024,
    "roberta-base": 768,
    "roberta-large": 1024,
    "distilbert-base-uncased": 768,
    gpt2: 768,
    "gpt2-medium": 1024,
    "t5-small": 512,
    "t5-base": 768,
    resnet50: 2048,
    resnet101: 2048,
    "efficientnet-b0": 1280,
    "efficientnet-b7": 2560,
    "vit-base-patch16-224": 768,
  };
  return sizeMap[modelName] || 768;
}

function getModelLayers(modelName: string): number {
  const layerMap: Record<string, number> = {
    "bert-base-uncased": 12,
    "bert-large-uncased": 24,
    "roberta-base": 12,
    "roberta-large": 24,
    "distilbert-base-uncased": 6,
    gpt2: 12,
    "gpt2-medium": 24,
    "t5-small": 6,
    "t5-base": 12,
    resnet50: 50,
    resnet101: 101,
    "vit-base-patch16-224": 12,
  };
  return layerMap[modelName] || 12;
}

function getModelHeads(modelName: string): number {
  const headMap: Record<string, number> = {
    "bert-base-uncased": 12,
    "bert-large-uncased": 16,
    "roberta-base": 12,
    "roberta-large": 16,
    "distilbert-base-uncased": 12,
    gpt2: 12,
    "gpt2-medium": 16,
    "t5-small": 8,
    "t5-base": 12,
    "vit-base-patch16-224": 12,
  };
  return headMap[modelName] || 12;
}

function getOutputType(modelType: string): "string" | "number" | "boolean" | "array" | "object" {
  const typeMap: Record<string, "string" | "number" | "boolean" | "array" | "object"> = {
    language_model: "string",
    classification: "string",
    regression: "number",
    embedding: "array",
    computer_vision: "string",
    time_series: "number",
    anomaly_detection: "boolean",
    clustering: "string",
  };
  return typeMap[modelType] || "string";
}

function getModelCapabilities(modelType: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    language_model: ["text_generation", "language_modeling", "completion"],
    classification: [
      "text_classification",
      "sentiment_analysis",
      "intent_detection",
    ],
    regression: ["value_prediction", "scoring", "regression_analysis"],
    embedding: ["text_embedding", "similarity_search", "semantic_search"],
    computer_vision: [
      "image_classification",
      "object_detection",
      "feature_extraction",
    ],
    time_series: ["forecasting", "trend_analysis", "anomaly_detection"],
    anomaly_detection: [
      "outlier_detection",
      "fraud_detection",
      "anomaly_scoring",
    ],
    clustering: ["data_clustering", "segmentation", "pattern_discovery"],
  };
  return capabilityMap[modelType] || ["general_ai"];
}

function validateModelConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.modelName) {
    errors.push("Model name is required");
  }
  if (!config.modelType) {
    errors.push("Model type is required");
  }
  if (
    ["language_model", "classification", "embedding"].includes(
      config.modelType,
    ) &&
    !config.baseModel
  ) {
    errors.push("Base model is required for text models");
  }
  if (config.modelType === "computer_vision" && !config.visionModel) {
    errors.push("Vision model is required for computer vision tasks");
  }

  return { valid: errors.length === 0, errors };
}

function validateTrainingConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.epochs || config.epochs < 1) {
    errors.push("Epochs must be a positive number");
  }
  if (!config.batchSize || config.batchSize < 1) {
    errors.push("Batch size must be a positive number");
  }
  if (!config.learningRate || config.learningRate <= 0) {
    errors.push("Learning rate must be positive");
  }
  if (!config.optimizer) {
    errors.push("Optimizer is required");
  }

  return { valid: errors.length === 0, errors };
}

function validateDataConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.inputColumn) {
    errors.push("Input column is required");
  }
  if (!config.targetColumn) {
    errors.push("Target column is required");
  }

  const totalSplit =
    config.trainSplit + config.validationSplit + config.testSplit;
  if (Math.abs(totalSplit - 1.0) > 0.001) {
    errors.push("Train, validation, and test splits must sum to 1.0");
  }

  return { valid: errors.length === 0, errors };
}

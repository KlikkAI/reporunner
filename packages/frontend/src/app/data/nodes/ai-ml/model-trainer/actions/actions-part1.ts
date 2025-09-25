// Define action interfaces locally
type NodeExecutionContext = Record<string, any>;
type NodeActionResult = {
  success: boolean;
  data?: any[];
  error?: string | { message: string; code?: string; details?: any };
  metadata?: Record<string, any>;
};

import { aiModelService } from '@/core/services/aiModelService';

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
        throw new Error('Input data must be an array of training examples');
      }

      // Validate required columns
      if (inputData.length === 0) {
        throw new Error('Training data cannot be empty');
      }

      const firstRow = inputData[0];
      if (!firstRow[dataConfig.inputColumn]) {
        throw new Error(`Input column '${dataConfig.inputColumn}' not found in data`);
      }
      if (!firstRow[dataConfig.targetColumn]) {
        throw new Error(`Target column '${dataConfig.targetColumn}' not found in data`);
      }

      // Create AI model configuration
      const modelData = {
        name: modelConfig.modelName,
        description:
          modelConfig.description ||
          `${modelConfig.modelType} model trained on ${inputData.length} samples`,
        type: modelConfig.modelType,
        provider: 'custom' as const,
        version: '1.0.0',
        status: 'draft' as const,
        configuration: {
          architecture: modelConfig.baseModel || modelConfig.visionModel || 'custom',
          parameters: {
            model_size: modelConfig.baseModel || modelConfig.visionModel || 'base',
            hidden_size: getModelHiddenSize(modelConfig.baseModel || modelConfig.visionModel),
            num_layers: getModelLayers(modelConfig.baseModel || modelConfig.visionModel),
            num_attention_heads: getModelHeads(modelConfig.baseModel || modelConfig.visionModel),
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
              modelConfig.modelType === 'computer_vision' ? ('image' as const) : ('text' as const),
            format: modelConfig.modelType === 'computer_vision' ? 'jpeg' : 'string',
            fields: [
              {
                name: dataConfig.inputColumn,
                type: 'string' as const,
                required: true,
                description: 'Input data for training',
              },
            ],
            validation: {
              required: [dataConfig.inputColumn],
              maxLength: dataConfig.maxLength,
            },
          },
          outputSchema: {
            type: 'text' as const,
            format: 'json',
            fields: [
              {
                name: 'prediction',
                type: getOutputType(modelConfig.modelType),
                required: true,
                description: 'Model prediction',

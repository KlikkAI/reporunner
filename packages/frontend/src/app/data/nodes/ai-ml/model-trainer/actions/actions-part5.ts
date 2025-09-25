anomaly_detection: ['outlier_detection', 'fraud_detection', 'anomaly_scoring'], clustering;
: ['data_clustering', 'segmentation', 'pattern_discovery'],
  }
return capabilityMap[modelType] || ['general_ai'];
}

function validateModelConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.modelName) {
    errors.push('Model name is required');
  }
  if (!config.modelType) {
    errors.push('Model type is required');
  }
  if (
    ['language_model', 'classification', 'embedding'].includes(config.modelType) &&
    !config.baseModel
  ) {
    errors.push('Base model is required for text models');
  }
  if (config.modelType === 'computer_vision' && !config.visionModel) {
    errors.push('Vision model is required for computer vision tasks');
  }

  return { valid: errors.length === 0, errors };
}

function validateTrainingConfig(config: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.epochs || config.epochs < 1) {
    errors.push('Epochs must be a positive number');
  }
  if (!config.batchSize || config.batchSize < 1) {
    errors.push('Batch size must be a positive number');
  }
  if (!config.learningRate || config.learningRate <= 0) {
    errors.push('Learning rate must be positive');
  }
  if (!config.optimizer) {
    errors.push('Optimizer is required');
  }

  return { valid: errors.length === 0, errors };
}

function validateDataConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.inputColumn) {
    errors.push('Input column is required');
  }
  if (!config.targetColumn) {
    errors.push('Target column is required');
  }

  const totalSplit = config.trainSplit + config.validationSplit + config.testSplit;
  if (Math.abs(totalSplit - 1.0) > 0.001) {
    errors.push('Train, validation, and test splits must sum to 1.0');
  }

  return { valid: errors.length === 0, errors };
}

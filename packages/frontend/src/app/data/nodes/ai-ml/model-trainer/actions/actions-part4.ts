}

const allValid = Object.values(validation).every((v) => v.valid);

return {
      success: allValid,
      data: [
        {
          main: {
            validation,
            message: allValid
              ? 'Configuration is valid and ready for training'
              : 'Configuration has validation errors',
          },
        },
      ],
      metadata: {
        executionTime: Date.now() - context.startTime,
      },
    };
},
}

// Helper functions
function getModelHiddenSize(modelName: string): number {
  const sizeMap: Record<string, number> = {
    'bert-base-uncased': 768,
    'bert-large-uncased': 1024,
    'roberta-base': 768,
    'roberta-large': 1024,
    'distilbert-base-uncased': 768,
    gpt2: 768,
    'gpt2-medium': 1024,
    't5-small': 512,
    't5-base': 768,
    resnet50: 2048,
    resnet101: 2048,
    'efficientnet-b0': 1280,
    'efficientnet-b7': 2560,
    'vit-base-patch16-224': 768,
  };
  return sizeMap[modelName] || 768;
}

function getModelLayers(modelName: string): number {
  const layerMap: Record<string, number> = {
    'bert-base-uncased': 12,
    'bert-large-uncased': 24,
    'roberta-base': 12,
    'roberta-large': 24,
    'distilbert-base-uncased': 6,
    gpt2: 12,
    'gpt2-medium': 24,
    't5-small': 6,
    't5-base': 12,
    resnet50: 50,
    resnet101: 101,
    'vit-base-patch16-224': 12,
  };
  return layerMap[modelName] || 12;
}

function getModelHeads(modelName: string): number {
  const headMap: Record<string, number> = {
    'bert-base-uncased': 12,
    'bert-large-uncased': 16,
    'roberta-base': 12,
    'roberta-large': 16,
    'distilbert-base-uncased': 12,
    gpt2: 12,
    'gpt2-medium': 16,
    't5-small': 8,
    't5-base': 12,
    'vit-base-patch16-224': 12,
  };
  return headMap[modelName] || 12;
}

function getOutputType(modelType: string): 'string' | 'number' | 'boolean' | 'array' | 'object' {
  const typeMap: Record<string, 'string' | 'number' | 'boolean' | 'array' | 'object'> = {
    language_model: 'string',
    classification: 'string',
    regression: 'number',
    embedding: 'array',
    computer_vision: 'string',
    time_series: 'number',
    anomaly_detection: 'boolean',
    clustering: 'string',
  };
  return typeMap[modelType] || 'string';
}

function getModelCapabilities(modelType: string): string[] {
  const capabilityMap: Record<string, string[]> = {
    language_model: ['text_generation', 'language_modeling', 'completion'],
    classification: ['text_classification', 'sentiment_analysis', 'intent_detection'],
    regression: ['value_prediction', 'scoring', 'regression_analysis'],
    embedding: ['text_embedding', 'similarity_search', 'semantic_search'],
    computer_vision: ['image_classification', 'object_detection', 'feature_extraction'],
    time_series: ['forecasting', 'trend_analysis', 'anomaly_detection'],

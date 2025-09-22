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
    type: 'collection',
    default: {},
    description: 'Configure training parameters',
    options: [
      {
        displayName: 'Training Epochs',
        name: 'epochs',
        type: 'number',
        required: true,
        default: 3,
        typeOptions: {
          minValue: 1,
          maxValue: 100,
        },
        description: 'Number of training epochs',
      },
      {
        displayName: 'Batch Size',
        name: 'batchSize',
        type: 'number',
        required: true,
        default: 16,
        typeOptions: {
          minValue: 1,
          maxValue: 128,
        },
        description: 'Training batch size',
      },
      {
        displayName: 'Learning Rate',
        name: 'learningRate',
        type: 'number',
        required: true,
        default: 2e-5,
        typeOptions: {
          minValue: 1e-6,
          maxValue: 1e-1,
          numberPrecision: 6,
        },
        description: 'Learning rate for training',
      },
      {
        displayName: 'Optimizer',
        name: 'optimizer',
        type: 'select',
        required: true,
        default: 'adamw',
        options: [
          { name: 'AdamW', value: 'adamw' },
          { name: 'Adam', value: 'adam' },
          { name: 'SGD', value: 'sgd' },
          { name: 'RMSprop', value: 'rmsprop' },
          { name: 'Adagrad', value: 'adagrad' },
        ],
        description: 'Optimization algorithm',
      },
      {
        displayName: 'Weight Decay',
        name: 'weightDecay',
        type: 'number',
        default: 0.01,
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 4,
        },
        description: 'Weight decay for regularization',
      },
      {
        displayName: 'Warmup Steps',
        name: 'warmupSteps',
        type: 'number',
        default: 500,
        typeOptions: {
          minValue: 0,
          maxValue: 10000,
        },
        description: 'Number of warmup steps for learning rate scheduler',
      },
    ],
  },

  // Data Configuration Section
  {
    displayName: 'Data Configuration',
    name: 'dataConfig',
    type: 'collection',
    default: {},
    description: 'Configure training data',
    options: [
      {
        displayName: 'Input Column',
        name: 'inputColumn',
        type: 'string',
        required: true,
        default: 'text',
        description: 'Column name containing input data',
      },
      {
        displayName: 'Target Column',
        name: 'targetColumn',
        type: 'string',
        required: true,
        default: 'label',
        description: 'Column name containing target labels',
      },
      {
        displayName: 'Train Split Ratio',
        name: 'trainSplit',
        type: 'number',
        required: true,
        default: 0.8,
        typeOptions: {
          minValue: 0.1,
          maxValue: 0.9,
          numberPrecision: 2,
        },
        description: 'Proportion of data for training',
      },
      {
        displayName: 'Validation Split Ratio',
        name: 'validationSplit',
        type: 'number',
        required: true,
        default: 0.1,
        typeOptions: {
          minValue: 0.05,
          maxValue: 0.5,
          numberPrecision: 2,
        },
        description: 'Proportion of data for validation',
      },
      {
        displayName: 'Test Split Ratio',
        name: 'testSplit',
        type: 'number',
        required: true,
        default: 0.1,
        typeOptions: {
          minValue: 0.05,
          maxValue: 0.5,
          numberPrecision: 2,
        },
        description: 'Proportion of data for testing',
      },
      {
        displayName: 'Max Sequence Length',
        name: 'maxLength',
        type: 'number',
        default: 512,
        displayOptions: {
          show: {
            '/modelConfig/modelType': ['language_model', 'classification', 'embedding'],
          },
        },
        typeOptions: {
          minValue: 64,
          maxValue: 4096,
        },
        description: 'Maximum sequence length for tokenization',
      },
    ],
  },

  // Advanced Options Section
  {
    displayName: 'Advanced Options',
    name: 'advancedOptions',
    type: 'collection',
    default: {},
    description: 'Advanced training configuration',
    options: [
      {
        displayName: 'Enable Early Stopping',
        name: 'enableEarlyStopping',
        type: 'boolean',
        default: true,
        description: 'Stop training early if validation loss stops improving',
      },
      {
        displayName: 'Early Stopping Patience',
        name: 'earlyStopping.patience',
        type: 'number',
        default: 3,
        displayOptions: {
          show: {
            enableEarlyStopping: [true],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
        description: 'Number of epochs to wait before stopping',
      },
      {
        displayName: 'Early Stopping Delta',
        name: 'earlyStopping.minDelta',
        type: 'number',
        default: 0.001,
        displayOptions: {
          show: {
            enableEarlyStopping: [true],
          },
        },
        typeOptions: {
          minValue: 0.0001,
          maxValue: 0.1,
          numberPrecision: 4,
        },
        description: 'Minimum change to qualify as improvement',
      },
      {
        displayName: 'Gradient Clipping',
        name: 'gradientClipping',
        type: 'number',
        default: 1.0,
        typeOptions: {
          minValue: 0.1,
          maxValue: 10,
          numberPrecision: 1,
        },
        description: 'Maximum norm for gradient clipping',
      },
      {
        displayName: 'Dropout Rate',
        name: 'dropoutRate',
        type: 'number',
        default: 0.1,
        typeOptions: {
          minValue: 0,
          maxValue: 0.9,
          numberPrecision: 2,
        },
        description: 'Dropout rate for regularization',
      },
      {
        displayName: 'Enable Mixed Precision',
        name: 'mixedPrecision',
        type: 'boolean',
        default: false,
        description: 'Use mixed precision training for faster training',
      },
      {
        displayName: 'Save Checkpoints',
        name: 'saveCheckpoints',
        type: 'boolean',
        default: true,
        description: 'Save model checkpoints during training',
      },
      {
        displayName: 'Checkpoint Frequency',
        name: 'checkpointFrequency',
        type: 'number',
        default: 1,
        displayOptions: {
          show: {
            saveCheckpoints: [true],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 10,
        },
        description: 'Save checkpoint every N epochs',
      },
    ],
  },

  // Hardware Configuration Section
  {
    displayName: 'Hardware Configuration',
    name: 'hardwareConfig',
    type: 'collection',
    default: {},
    description: 'Configure compute resources',
    options: [
      {
        displayName: 'Use GPU',
        name: 'useGpu',
        type: 'boolean',
        default: true,
        description: 'Use GPU for training if available',
      },
      {
        displayName: 'GPU Memory Limit (GB)',
        name: 'gpuMemoryLimit',
        type: 'number',
        default: 8,
        displayOptions: {
          show: {
            useGpu: [true],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 80,
        },
        description: 'GPU memory limit in GB',
      },
      {
        displayName: 'Enable Distributed Training',
        name: 'distributedTraining',
        type: 'boolean',
        default: false,
        description: 'Use multiple GPUs for training',
      },
      {
        displayName: 'Number of GPUs',
        name: 'numGpus',
        type: 'number',
        default: 2,
        displayOptions: {
          show: {
            distributedTraining: [true],
          },
        },
        typeOptions: {
          minValue: 2,
          maxValue: 8,
        },
        description: 'Number of GPUs to use',
      },
    ],
  },

  // Output Configuration Section
  {
    displayName: 'Output Configuration',
    name: 'outputConfig',
    type: 'collection',
    default: {},
    description: 'Configure training outputs',
    options: [
      {
        displayName: 'Model Output Path',
        name: 'modelOutputPath',
        type: 'string',
        default: './models',
        description: 'Directory to save the trained model',
      },
      {
        displayName: 'Export Format',
        name: 'exportFormat',
        type: 'multiSelect',
        default: ['pytorch'],
        options: [
          { name: 'PyTorch', value: 'pytorch' },
          { name: 'TensorFlow', value: 'tensorflow' },
          { name: 'ONNX', value: 'onnx' },
          { name: 'HuggingFace', value: 'huggingface' },
        ],
        description: 'Model export formats',
      },
      {
        displayName: 'Generate Training Report',
        name: 'generateReport',
        type: 'boolean',
        default: true,
        description: 'Generate detailed training report',
      },
      {
        displayName: 'Save Training Logs',
        name: 'saveTrainingLogs',
        type: 'boolean',
        default: true,
        description: 'Save detailed training logs',
      },
      {
        displayName: 'Include Metrics',
        name: 'includeMetrics',
        type: 'multiSelect',
        default: ['loss', 'accuracy', 'f1_score'],
        options: [
          { name: 'Loss', value: 'loss' },
          { name: 'Accuracy', value: 'accuracy' },
          { name: 'Precision', value: 'precision' },
          { name: 'Recall', value: 'recall' },
          { name: 'F1 Score', value: 'f1_score' },
          { name: 'BLEU Score', value: 'bleu_score' },
          { name: 'ROUGE Score', value: 'rouge_score' },
          { name: 'Perplexity', value: 'perplexity' },
        ],
        description: 'Metrics to track and report',
      },
    ],
  },

  // Data Augmentation Section
  {
    displayName: 'Data Augmentation',
    name: 'dataAugmentation',
    type: 'collection',
    default: {},
    description: 'Configure data augmentation techniques',
    options: [
      {
        displayName: 'Enable Data Augmentation',
        name: 'enabled',
        type: 'boolean',
        default: false,
        description: 'Apply data augmentation during training',
      },
      {
        displayName: 'Text Augmentation',
        name: 'textAugmentation',
        type: 'multiSelect',
        default: ['synonym_replacement'],
        displayOptions: {
          show: {
            enabled: [true],
            '/modelConfig/modelType': ['language_model', 'classification'],
          },
        },
        options: [
          { name: 'Synonym Replacement', value: 'synonym_replacement' },
          { name: 'Random Insertion', value: 'random_insertion' },
          { name: 'Random Deletion', value: 'random_deletion' },
          { name: 'Random Swap', value: 'random_swap' },
          { name: 'Back Translation', value: 'back_translation' },
          { name: 'Paraphrasing', value: 'paraphrasing' },
        ],
        description: 'Text augmentation techniques',
      },
      {
        displayName: 'Image Augmentation',
        name: 'imageAugmentation',
        type: 'multiSelect',
        default: ['rotation', 'flip'],
        displayOptions: {
          show: {
            enabled: [true],
            '/modelConfig/modelType': ['computer_vision'],
          },
        },
        options: [
          { name: 'Rotation', value: 'rotation' },
          { name: 'Horizontal Flip', value: 'flip' },
          { name: 'Color Jitter', value: 'color_jitter' },
          { name: 'Random Crop', value: 'random_crop' },
          { name: 'Gaussian Blur', value: 'gaussian_blur' },
          { name: 'Noise Addition', value: 'noise_addition' },
        ],
        description: 'Image augmentation techniques',
      },
      {
        displayName: 'Augmentation Probability',
        name: 'augmentationProbability',
        type: 'number',
        default: 0.3,
        displayOptions: {
          show: {
            enabled: [true],
          },
        },
        typeOptions: {
          minValue: 0.1,
          maxValue: 1.0,
          numberPrecision: 2,
        },
        description: 'Probability of applying augmentation',
      },
    ],
  },
];

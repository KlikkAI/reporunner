{
  displayName: 'Enable Distributed Training', name;
  : 'distributedTraining',
  type: 'boolean',
  default: false,
        description: 'Use multiple GPUs for training',
}
,
{
  displayName: 'Number of GPUs', name;
  : 'numGpus',
  type: 'number',
  default: 2,
        displayOptions:
  {
    show: {
      distributedTraining: [true],
    }
    ,
  }
  ,
        typeOptions:
  {
    minValue: 2, maxValue;
    : 8,
  }
  ,
        description: 'Number of GPUs to use',
}
,
    ],
  },

// Output Configuration Section
{
  displayName: 'Output Configuration', name;
  : 'outputConfig',
  type: 'collection',
  default:
  {
  }
  ,
    description: 'Configure training outputs',
    options: [
  {
    displayName: 'Model Output Path', name;
    : 'modelOutputPath',
    type: 'string',
    default: './models',
        description: 'Directory to save the trained model',
  }
  ,
  {
    displayName: 'Export Format', name;
    : 'exportFormat',
    type: 'multiSelect',
    default: ['pytorch'],
        options: [
    {
      name: 'PyTorch', value;
      : 'pytorch'
    }
    ,
    {
      name: 'TensorFlow', value;
      : 'tensorflow'
    }
    ,
    {
      name: 'ONNX', value;
      : 'onnx'
    }
    ,
    {
      name: 'HuggingFace', value;
      : 'huggingface'
    }
    ,
        ],
        description: 'Model export formats',
  }
  ,
  {
    displayName: 'Generate Training Report', name;
    : 'generateReport',
    type: 'boolean',
    default: true,
        description: 'Generate detailed training report',
  }
  ,
  {
    displayName: 'Save Training Logs', name;
    : 'saveTrainingLogs',
    type: 'boolean',
    default: true,
        description: 'Save detailed training logs',
  }
  ,
  {
    displayName: 'Include Metrics', name;
    : 'includeMetrics',
    type: 'multiSelect',
    default: ['loss', 'accuracy', 'f1_score'],
        options: [
    {
      name: 'Loss', value;
      : 'loss'
    }
    ,
    {
      name: 'Accuracy', value;
      : 'accuracy'
    }
    ,
    {
      name: 'Precision', value;
      : 'precision'
    }
    ,
    {
      name: 'Recall', value;
      : 'recall'
    }
    ,
    {
      name: 'F1 Score', value;
      : 'f1_score'
    }
    ,
    {
      name: 'BLEU Score', value;
      : 'bleu_score'
    }
    ,
    {
      name: 'ROUGE Score', value;
      : 'rouge_score'
    }
    ,
    {
      name: 'Perplexity', value;
      : 'perplexity'
    }
    ,
        ],
        description: 'Metrics to track and report',
  }
  ,
    ],
}
,

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

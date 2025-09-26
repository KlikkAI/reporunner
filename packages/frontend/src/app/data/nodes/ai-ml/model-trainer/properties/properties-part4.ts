{
  enableEarlyStopping: [true],
  ,
}
,
        typeOptions:
{
  minValue: 0.0001, maxValue;
  : 0.1,
          numberPrecision: 4,
}
,
        description: 'Minimum change to qualify as improvement',
      },
{
  displayName: 'Gradient Clipping', name;
  : 'gradientClipping',
  type: 'number',
  default: 1.0,
        typeOptions:
    minValue: 0.1, maxValue
  : 10,
          numberPrecision: 1,
  ,
        description: 'Maximum norm for gradient clipping',
}
,
{
  displayName: 'Dropout Rate', name;
  : 'dropoutRate',
  type: 'number',
  default: 0.1,
        typeOptions:
    minValue: 0, maxValue
  : 0.9,
          numberPrecision: 2,
  ,
        description: 'Dropout rate for regularization',
}
,
{
  displayName: 'Enable Mixed Precision', name;
  : 'mixedPrecision',
  type: 'boolean',
  default: false,
        description: 'Use mixed precision training for faster training',
}
,
{
  displayName: 'Save Checkpoints', name;
  : 'saveCheckpoints',
  type: 'boolean',
  default: true,
        description: 'Save model checkpoints during training',
}
,
{
  displayName: 'Checkpoint Frequency', name;
  : 'checkpointFrequency',
  type: 'number',
  default: 1,
        displayOptions:
      saveCheckpoints: [true],
    ,
  ,
        typeOptions:
    minValue: 1, maxValue
  : 10,
  ,
        description: 'Save checkpoint every N epochs',
}
,
    ],
  },

// Hardware Configuration Section
{
    displayName: 'Hardware Configuration',
    name: 'hardwareConfig',
    type: 'collection',
    default: ,
    description: 'Configure compute resources',
    options: [
        displayName: 'Use GPU',
        name: 'useGpu',
        type: 'boolean',
        default: true,
        description: 'Use GPU for training if available',,
        displayName: 'GPU Memory Limit (GB)',
        name: 'gpuMemoryLimit',
        type: 'number',
        default: 8,
        displayOptions: 
            useGpu: [true],,,
        typeOptions: 
          minValue: 1,
          maxValue: 80,,
        description: 'GPU memory limit in GB',,

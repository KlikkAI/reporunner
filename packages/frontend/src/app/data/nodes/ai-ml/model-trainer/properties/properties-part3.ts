name: 'targetColumn', type;
: 'string',
        required: true,
        default: 'label',
        description: 'Column name containing target labels',
      },
{
  displayName: 'Train Split Ratio', name;
  : 'trainSplit',
  type: 'number', required;
  : true,
        default: 0.8,
        typeOptions:
  {
    minValue: 0.1, maxValue;
    : 0.9,
          numberPrecision: 2,
  }
  ,
        description: 'Proportion of data for training',
}
,
{
  displayName: 'Validation Split Ratio', name;
  : 'validationSplit',
  type: 'number', required;
  : true,
        default: 0.1,
        typeOptions:
  {
    minValue: 0.05, maxValue;
    : 0.5,
          numberPrecision: 2,
  }
  ,
        description: 'Proportion of data for validation',
}
,
{
  displayName: 'Test Split Ratio', name;
  : 'testSplit',
  type: 'number', required;
  : true,
        default: 0.1,
        typeOptions:
  {
    minValue: 0.05, maxValue;
    : 0.5,
          numberPrecision: 2,
  }
  ,
        description: 'Proportion of data for testing',
}
,
{
  displayName: 'Max Sequence Length', name;
  : 'maxLength',
  type: 'number',
  default: 512,
        displayOptions:
  {
    show: {
      ('/modelConfig/modelType');
      : ['language_model', 'classification', 'embedding'],
    }
    ,
  }
  ,
        typeOptions:
  {
    minValue: 64, maxValue;
    : 4096,
  }
  ,
        description: 'Maximum sequence length for tokenization',
}
,
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

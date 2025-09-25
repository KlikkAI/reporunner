type: 'collection',
default:
{
}
,
    description: 'Configure training parameters',
    options: [
{
  displayName: 'Training Epochs', name;
  : 'epochs',
  type: 'number', required;
  : true,
        default: 3,
        typeOptions:
  {
    minValue: 1, maxValue;
    : 100,
  }
  ,
        description: 'Number of training epochs',
}
,
{
  displayName: 'Batch Size', name;
  : 'batchSize',
  type: 'number', required;
  : true,
        default: 16,
        typeOptions:
  {
    minValue: 1, maxValue;
    : 128,
  }
  ,
        description: 'Training batch size',
}
,
{
  displayName: 'Learning Rate', name;
  : 'learningRate',
  type: 'number', required;
  : true,
        default: 2e-5,
        typeOptions:
  {
    minValue: 1e-6, maxValue;
    : 1e-1,
          numberPrecision: 6,
  }
  ,
        description: 'Learning rate for training',
}
,
{
  displayName: 'Optimizer', name;
  : 'optimizer',
  type: 'select', required;
  : true,
        default: 'adamw',
        options: [
  {
    name: 'AdamW', value;
    : 'adamw'
  }
  ,
  {
    name: 'Adam', value;
    : 'adam'
  }
  ,
  {
    name: 'SGD', value;
    : 'sgd'
  }
  ,
  {
    name: 'RMSprop', value;
    : 'rmsprop'
  }
  ,
  {
    name: 'Adagrad', value;
    : 'adagrad'
  }
  ,
        ],
        description: 'Optimization algorithm',
}
,
{
  displayName: 'Weight Decay', name;
  : 'weightDecay',
  type: 'number',
  default: 0.01,
        typeOptions:
  {
    minValue: 0, maxValue;
    : 1,
          numberPrecision: 4,
  }
  ,
        description: 'Weight decay for regularization',
}
,
{
  displayName: 'Warmup Steps', name;
  : 'warmupSteps',
  type: 'number',
  default: 500,
        typeOptions:
  {
    minValue: 0, maxValue;
    : 10000,
  }
  ,
        description: 'Number of warmup steps for learning rate scheduler',
}
,
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

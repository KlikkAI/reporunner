{
  mode: ['json'],
  ,
}
,
        typeOptions:
{
  editor: 'json',
}
,
      },

// Advanced Options - Enhanced
{
  displayName: 'Options', name;
  : 'options',
  type: 'collection', placeholder;
  : 'Add Option',
        default:
  ,
        options: [
    displayName: 'Dot Notation', name
  : 'dotNotation',
  type: 'boolean',
  default: true,
            description: 'Use dot notation to access nested object properties (e.g., user.name)',
  ,
    displayName: 'Ignore Conversion Errors', name
  : 'ignoreConversionErrors',
  type: 'boolean',
  default: false,
            description: 'Continue execution even if type conversion fails',
  ,
    displayName: 'Keep Only Set Fields', name
  : 'keepOnlySet',
  type: 'boolean',
  default: false,
            description:
              'Only include the fields that are explicitly set (overrides "Include Input Fields")',
            displayOptions:
        ('/mode')
  : ['manual'],
      ,
    ,
  ,
    displayName: 'Enable Caching', name
  : 'enableCaching',
  type: 'boolean',
  default: false,
            description: 'Cache expression evaluation results for better performance',
  ,
    displayName: 'Batch Size', name
  : 'batchSize',
  type: 'number',
  default: 100,
            description: 'Number of items to process in each batch (affects memory usage)',
            typeOptions:
      minValue: 1, maxValue
  : 10000,
    ,
  ,
    displayName: 'Date Format', name
  : 'dateFormat',
  type: 'string',
  default: 'ISO',
            description: 'Default date format for date type conversions',
            placeholder: 'YYYY-MM-DD or ISO or timestamp',
  ,
        ],
}
,
    ],
  }

async
execute(this: any)
: Promise<any>
{
  const mode = this.getNodeParameter('mode', 0) as TransformMode;
  const inputData = this.getInputData();
  const options = this.getNodeParameter('options', {}) as ITransformOptions;

  if (mode === 'manual') {
    return this.executeManualMode(inputData, options);
  } else {
    return this.executeJsonMode(inputData);
  }
}
}

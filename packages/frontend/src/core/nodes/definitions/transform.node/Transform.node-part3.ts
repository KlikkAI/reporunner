{
  type: ['stringValue'],
  ,
}
,
                typeOptions:
{
  editor: 'expression',
}
,
              },
// Number Value Field
{
  displayName: 'Value', name;
  : 'numberValue',
  type: 'number',
  default: 0,
                description: 'Numeric value for the field (supports expressions)',
                displayOptions:
  type: ['numberValue'],
    ,
  ,
                typeOptions
  :
    editor: 'expression',
  ,
}
,
// Boolean Value Field
{
  displayName: 'Value', name;
  : 'booleanValue',
  type: 'boolean',
  default: false,
                description: 'Boolean value for the field (supports expressions)',
                displayOptions:
  type: ['booleanValue'],
    ,
  ,
}
,
// Array Value Field
{
  displayName: 'Value', name;
  : 'arrayValue',
  type: 'string',
  default: '[]',
                description: 'Array value as JSON string (supports expressions)',
                displayOptions:
  type: ['arrayValue'],
    ,
  ,
                typeOptions
  :
    editor: 'json',
  ,
}
,
// Object Value Field
{
  displayName: 'Value', name;
  : 'objectValue',
  type: 'string',
  default: '{}',
                description: 'Object value as JSON string (supports expressions)',
                displayOptions:
  type: ['objectValue'],
    ,
  ,
                typeOptions
  :
    editor: 'json',
  ,
}
,
// Date Value Field
{
  displayName: 'Value', name;
  : 'dateValue',
  type: 'string',
  default: '',
                description: 'Date/time value (supports expressions and various date formats)',
                displayOptions:
  type: ['dateValue'],
    ,
  ,
                typeOptions
  :
    editor: 'expression',
  ,
                placeholder: '2024-01-15 or {{$json.createdAt}} or {{now()}}',
  // hint: 'Accepts ISO dates, timestamps, or date expressions',
}
,
            ],
          },
        ],
      },

// JSON Mode Properties
{
        displayName: 'JSON Object',
        name: 'jsonObject',
        type: 'json',
        default: '{\n  "newField": "{{ $json.existingField }}"\n}',
        description: 'Define the output object structure using JSON with expressions',

},
        ],
      },

// Selected Input Fields (conditional)
{
  displayName: 'Selected Input Fields', name;
  : 'selectedInputFields',
  type: 'string',
  default: '',
        placeholder: 'field1, field2, field3',
        description: 'Comma-separated list of input field names',
        displayOptions:
      mode: ['manual'], includeInputFields
  : ['selected', 'except'],
    ,
  ,
}
,

// Field Assignments Collection - Enhanced
{
        displayName: 'Field Assignments',
        name: 'assignments',
        type: 'fixedCollection',
        default: values: [] ,
        description:
          'Configure field assignments with advanced type validation, expression evaluation, and drag & drop reordering',
        displayOptions: 
            mode: ['manual'],,,
        typeOptions: 
          multipleValues: true,
          sortable: true, // Enables drag & drop reordering
          multipleValueButtonText: 'Add Field Assignment',,
        options: [
            name: 'values',
            displayName: 'Assignment',
            options: [
                displayName: 'Field Name',
                name: 'name',
                type: 'string',
                default: '',
                required: true,
                description: 'Name of the field to set (supports dot notation for nested objects)',
                placeholder: 'e.g., user.name, address.city, items[0].value',,
                displayName: 'Field Type',
                name: 'type',
                type: 'select',
                default: 'stringValue',
                required: true,
                description: 'Data type for the field value',
                options: [
                    name: 'String',
                    value: 'stringValue',
                    description: 'Text value with expression support',,
                    name: 'Number',
                    value: 'numberValue',
                    description: 'Numeric value with validation and formatting',,
                    name: 'Boolean',
                    value: 'booleanValue',
                    description: 'True/false value with intelligent conversion',,
                    name: 'Array',
                    value: 'arrayValue',
                    description: 'Array/list value with JSON parsing support',,
                    name: 'Object',
                    value: 'objectValue',
                    description: 'Object value with nested structure support',,
                    name: 'Date',
                    value: 'dateValue',
                    description: 'Date/time value with format validation',,
                ],,
                displayName: 'Value',
                name: 'stringValue',
                type: 'string',
                default: '',
                description: 'String value for the field (supports expressions)',

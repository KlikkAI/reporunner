resource: ['email'], operation;
: ['messageReceived', 'get', 'getAll'],
      },
    },
  },
{
  name: 'attachmentPrefix', displayName;
  : 'Attachment Prefix',
  type: 'string', description;
  : 'Prefix for downloaded attachment filenames',
    placeholder: 'gmail_',
    displayOptions:
      downloadAttachments: [true],
    ,
  ,
}
,

// Batch processing options
{
  name: 'maxResults', displayName;
  : 'Max Results',
  type: 'number', description;
  : 'Maximum number of items to return',
    default: 100,
    min: 1,
    max: 500,
    displayOptions:
      operation: ['getAll', 'messageReceived'],
    ,
  ,
}
,

// Email format options
{
  name: 'emailType', displayName;
  : 'Email Format',
  type: 'select', description;
  : 'Format of the email content',
    default: 'text',
    options: [
    name: 'Text', value
  : 'text'
  ,
    name: 'HTML', value
  : 'html'
  ,
    name: 'Both', value
  : 'both'
  ,
    ],
    displayOptions:
      resource: ['email'], operation
  : ['send', 'reply', 'forward'],
    ,
  ,
}
,

// Advanced attachment options
{
  name: 'attachments', displayName;
  : 'Attachments',
  type: 'fixedCollection', description;
  : 'Files to attach to the email',
    typeOptions:
    multipleValues: true, multipleValueButtonText
  : 'Add Attachment',
  ,
    displayOptions:
      resource: ['email', 'draft'], operation
  : ['send', 'reply', 'forward', 'create'],
    ,
  ,
    values: [
    name: 'type', displayName
  : 'Type',
  type: 'select', required;
  : true,
        default: 'binary',
        options: [
      name: 'Binary Data', value
  : 'binary'
    ,
      name: 'File Path', value
  : 'path'
    ,
      name: 'URL', value
  : 'url'
    ,
        ],
  ,
    name: 'fileName', displayName
  : 'File Name',
  type: 'string', required;
  : true,
        placeholder: 'document.pdf',
  ,
    ],
}
,

// =============================================================================
// ADVANCED AI & ENTERPRISE FEATURES (FROM N8N ANALYSIS)
// =============================================================================

// AI-Powered Classification (Lower Priority - Cutting edge feature)
{
    name: 'enableAutoClassification',

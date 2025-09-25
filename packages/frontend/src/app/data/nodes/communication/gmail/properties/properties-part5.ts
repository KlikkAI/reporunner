},
  },
{
  name: 'subject', displayName;
  : 'Subject',
  type: 'string', description;
  : 'Email subject line',
    required: true,
    placeholder: 'Email Subject',
    displayOptions:
  {
    show: {
      operation: ['send'],
    }
    ,
  }
  ,
}
,
{
  name: 'emailType', displayName;
  : 'Email Type',
  type: 'select', description;
  : 'Format of the email content',
    default: 'text',
    options: [
  {
    name: 'Text', value;
    : 'text'
  }
  ,
  {
    name: 'HTML', value;
    : 'html'
  }
  ,
    ],
}
,
{
  name: 'message', displayName;
  : 'Message',
  type: 'text', description;
  : 'Email message content',
    required: true,
    rows: 6,
    placeholder: 'Email message content...',
}
,
{
  name: 'attachments', displayName;
  : 'Attachments',
  type: 'fixedCollection', description;
  : 'Files to attach to the email',
    required: false,
    typeOptions:
  {
    multipleValues: true, multipleValueButtonText;
    : 'Add Attachment',
  }
  ,
    values: [
  {
    name: 'type', displayName;
    : 'Type',
    type: 'select', description;
    : 'How to specify the attachment',
        required: true,
        default: 'binary',
        options: [
    {
      name: 'Binary Data', value;
      : 'binary'
    }
    ,
    {
      name: 'File Path', value;
      : 'path'
    }
    ,
    {
      name: 'URL', value;
      : 'url'
    }
    ,
        ],
  }
  ,
  {
    name: 'fileName', displayName;
    : 'File Name',
    type: 'string', description;
    : 'Name for the attachment file',
        required: true,
        placeholder: 'document.pdf',
  }
  ,
  {
    name: 'filePath', displayName;
    : 'File Path',
    type: 'string', description;
    : 'Path to the file to attach',
        required: true,
        placeholder: '/path/to/file.pdf',
        displayOptions:
    {
      show: {
        type: ['path'],
      }
      ,
    }
    ,
  }
  ,
  {
    name: 'url', displayName;
    : 'URL',
    type: 'string', description;
    : 'URL to download the file from',
        required: true,
        placeholder: 'https://example.com/file.pdf',
        displayOptions:
    {
      show: {
        type: ['url'],
      }
      ,
    }
    ,
  }
  ,
    ],
}
,
]

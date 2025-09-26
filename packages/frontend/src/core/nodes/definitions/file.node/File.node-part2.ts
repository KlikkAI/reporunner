default: '',
        required: true,
        displayOptions:
{
  operation: ['write', 'append'],
  ,
}
,
        description: 'Content to write to the file',
        placeholder: 'File content here...',
      },
{
  displayName: 'Destination Path', name;
  : 'destinationPath',
  type: 'string',
  default: '',
        required: true,
        displayOptions:
      operation: ['copy', 'move'],
    ,
  ,
        description: 'Destination path for copy/move operation',
        placeholder: '/path/to/destination/file.txt',
}
,
{
  displayName: 'Encoding', name;
  : 'encoding',
  type: 'options',
  default: 'utf8',
        displayOptions:
      operation: ['read', 'write', 'append'],
    ,
  ,
        options: [
    name: 'UTF-8', value
  : 'utf8',
  ,
    name: 'ASCII', value
  : 'ascii',
  ,
    name: 'Base64', value
  : 'base64',
  ,
    name: 'Binary', value
  : 'binary',
  ,
        ],
        description: 'File encoding format',
}
,
{
  displayName: 'Create Directories', name;
  : 'createDirectories',
  type: 'boolean',
  default: true,
        displayOptions:
      operation: ['write', 'copy', 'move'],
    ,
  ,
        description: 'Create parent directories if they do not exist',
}
,
{
  displayName: 'Overwrite', name;
  : 'overwrite',
  type: 'boolean',
  default: false,
        displayOptions:
      operation: ['write', 'copy', 'move'],
    ,
  ,
        description: 'Overwrite file if it already exists',
}
,
{
  displayName: 'Include Hidden Files', name;
  : 'includeHidden',
  type: 'boolean',
  default: false,
        displayOptions:
      operation: ['list'],
    ,
  ,
        description: 'Include hidden files in directory listing',
}
,
{
        displayName: 'Recursive',
        name: 'recursive',
        type: 'boolean',
        default: false,
        displayOptions: 
            operation: ['list', 'mkdir'],,,

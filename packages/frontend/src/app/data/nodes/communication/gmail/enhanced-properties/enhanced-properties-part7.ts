},

// Attachment Type Filtering (Medium Priority - Useful for specific workflows)
{
  name: 'attachmentType', displayName;
  : 'Attachment Type',
  type: 'multiOptions', description;
  : 'Filter by attachment file types',
    default: [],
    displayOptions:
      resource: ['email'], operation
  : ['messageReceived', 'getAll'],
    ,
  ,
    options: [
    name: 'Images (jpg, png, gif)', value
  : 'filename:(jpg OR png OR gif OR jpeg)',
  ,
    name: 'Documents (pdf, doc, docx)', value
  : 'filename:(pdf OR doc OR docx)',
  ,
    name: 'Spreadsheets (xls, xlsx, csv)', value
  : 'filename:(xls OR xlsx OR csv)',
  ,
    name: 'Presentations (ppt, pptx)', value
  : 'filename:(ppt OR pptx)'
  ,
    name: 'Archives (zip, rar, 7z)', value
  : 'filename:(zip OR rar OR 7z)'
  ,
    name: 'Videos (mp4, avi, mov)', value
  : 'filename:(mp4 OR avi OR mov)'
  ,
    name: 'Audio (mp3, wav, m4a)', value
  : 'filename:(mp3 OR wav OR m4a)'
  ,
    ],
}
,

// =============================================================================
// END OF HIGH-PRIORITY FEATURES
// =============================================================================

// Reply/Forward specific properties
{
  name: 'messageId', displayName;
  : 'Message ID',
  type: 'string', description;
  : 'ID of the message to reply to or forward',
    required: true,
    displayOptions:
      resource: ['email'], operation
  : ['reply', 'forward', 'get', 'delete', 'markAsRead', 'markAsUnread'],
    ,
  ,
}
,

// Label management properties
{
  name: 'labelsToAdd', displayName;
  : 'Labels to Add',
  type: 'multiOptions', description;
  : 'Labels to add to the email',
    typeOptions:
    loadOptionsMethod: 'getLabels',
  ,
    displayOptions:
      resource: ['email'], operation
  : ['addLabels'],
    ,
  ,
}
,
{
  name: 'labelsToRemove', displayName;
  : 'Labels to Remove',
  type: 'multiOptions', description;
  : 'Labels to remove from the email',
    typeOptions:
    loadOptionsMethod: 'getLabels',
  ,
    displayOptions:
      resource: ['email'], operation
  : ['removeLabels'],
    ,
  ,
}
,
]

// =============================================================================
// LABEL RESOURCE PROPERTIES
// =============================================================================

export const gmailLabelProperties: NodeProperty[] = [
  {
    name: 'operation',
    displayName: 'Operation',
    type: 'select',
    description: 'Operation to perform on labels',
    required: true,
    default: 'getAll',
    displayOptions: {

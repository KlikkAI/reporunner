show: {
  resource: ['label'],
}
,
    },
    options: [
{
  name: 'Create', value;
  : 'create', action: 'Create a label'
}
,
{
  name: 'Delete', value;
  : 'delete', action: 'Delete a label'
}
,
{
  name: 'Get', value;
  : 'get', action: 'Get a label'
}
,
{
  name: 'Get All', value;
  : 'getAll', action: 'Get all labels'
}
,
    ],
  },
{
  name: 'labelId', displayName;
  : 'Label ID',
  type: 'string', description;
  : 'The ID of the label',
    required: true,
    displayOptions:
  {
    show: {
      resource: ['label'], operation;
      : ['delete', 'get'],
    }
    ,
  }
  ,
}
,
{
  name: 'name', displayName;
  : 'Label Name',
  type: 'string', description;
  : 'Name for the new label',
    required: true,
    displayOptions:
  {
    show: {
      resource: ['label'], operation;
      : ['create'],
    }
    ,
  }
  ,
}
,
]

// =============================================================================
// DRAFT RESOURCE PROPERTIES
// =============================================================================

export const gmailDraftProperties: NodeProperty[] = [
  {
    name: 'operation',
    displayName: 'Operation',
    type: 'select',
    description: 'Operation to perform on drafts',
    required: true,
    default: 'create',
    displayOptions: {
      show: {
        resource: ['draft'],
      },
    },
    options: [
      { name: 'Create', value: 'create', action: 'Create a draft' },
      { name: 'Get', value: 'get', action: 'Get a draft' },
      { name: 'Delete', value: 'delete', action: 'Delete a draft' },
      { name: 'Get All', value: 'getAll', action: 'Get all drafts' },
      { name: 'Send', value: 'send', action: 'Send a draft' },
    ],
  },
  {
    name: 'draftId',
    displayName: 'Draft ID',
    type: 'string',
    description: 'The ID of the draft',
    required: true,
    displayOptions: {
      show: {
        resource: ['draft'],
        operation: ['get', 'delete', 'send'],
      },
    },
  },
  // Draft composition properties (reuse email properties)
  {
    name: 'draftTo',
    displayName: 'To',
    type: 'string',
    description: 'Recipient email addresses',
    required: true,
    displayOptions: {
      show: {
        resource: ['draft'],
        operation: ['create'],
      },
    },
  },
  {
    name: 'draftSubject',
    displayName: 'Subject',
    type: 'string',
    description: 'Draft subject line',
    required: true,
    displayOptions: {
      show: {
        resource: ['draft'],

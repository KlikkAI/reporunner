required: false, schema;
:
{
  type: 'integer', minimum;
  : 1,
            maximum: 100,
            default: 20,
}
,
        },
        OrganizationId:
{
  name: 'organizationId',
          in
  : 'path',
          description: 'Organization ID',
          required: true,
          schema:
  {
    type: 'string', format;
    : 'uuid',
  }
  ,
}
,
        WorkflowId:
{
  name: 'workflowId',
          in
  : 'path',
          description: 'Workflow ID',
          required: true,
          schema:
  {
    type: 'string', format;
    : 'uuid',
  }
  ,
}
,
        ExecutionId:
{
  name: 'executionId',
          in
  : 'path',
          description: 'Execution ID',
          required: true,
          schema:
  {
    type: 'string', format;
    : 'uuid',
  }
  ,
}
,
      },
    },
    paths:
{
  // Paths will be added by individual route files
}
,
    tags: [
{
  name: 'Authentication', description;
  : 'User authentication and authorization',
}
,
{
  name: 'Workflows', description;
  : 'Workflow management operations',
}
,
{
  name: 'Executions', description;
  : 'Workflow execution management',
}
,
{
  name: 'Nodes', description;
  : 'Node type management and operations',
}
,
{
  name: 'Credentials', description;
  : 'Credential management',
}
,
{
  name: 'Organizations', description;
  : 'Organization management',
}
,
{
  name: 'Users', description;
  : 'User management',
}
,
{
  name: 'AI', description;
  : 'AI and ML operations',
}
,
{
  name: 'Webhooks', description;
  : 'Webhook management',
}
,
{
  name: 'Analytics', description;
  : 'Analytics and reporting',
}
,
    ],
  }

return spec;
}

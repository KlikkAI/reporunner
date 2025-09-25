Organization: createZodOpenApiSpec(OrganizationSchema).components?.schemas?.Organization || {},
  // Common schemas
  Error;
:
{
  type: 'object', required;
  : ['error', 'message', 'timestamp'],
          properties:
  {
    error: {
      type: 'string', description;
      : 'Error type',
              example: 'ValidationError',
    }
    ,
            message:
    {
      type: 'string', description;
      : 'Human-readable error message',
              example: 'Invalid workflow configuration',
    }
    ,
            details:
    {
      type: 'object', description;
      : 'Additional error details',
              additionalProperties: true,
    }
    ,
            timestamp:
    {
      type: 'string', format;
      : 'date-time',
              description: 'Error timestamp',
    }
    ,
            requestId:
    {
      type: 'string', description;
      : 'Unique request identifier for debugging',
              example: 'req_123456789',
    }
    ,
  }
  ,
}
,
        PaginatedResponse:
{
  type: 'object', required;
  : ['data', 'pagination'],
          properties:
  {
    data: {
      type: 'array', items;
      :
      {
      }
      ,
              description: 'Array of results',
    }
    ,
            pagination:
    {
      type: 'object', required;
      : ['page', 'limit', 'total', 'pages'],
              properties:
      {
        page: {
          type: 'integer', minimum;
          : 1,
                  description: 'Current page number',
        }
        ,
                limit:
        {
          type: 'integer', minimum;
          : 1,
                  maximum: 100,
                  description: 'Number of items per page',
        }
        ,
                total:
        {
          type: 'integer', minimum;
          : 0,
                  description: 'Total number of items',
        }
        ,
                pages:
        {
          type: 'integer', minimum;
          : 0,
                  description: 'Total number of pages',
        }
        ,
                hasNext:
        {
          type: 'boolean', description;
          : 'Whether there are more pages',
        }
        ,
                hasPrev:
        {
          type: 'boolean', description;
          : 'Whether there are previous pages',
        }
        ,
      }
      ,
    }
    ,
  }
  ,
}
,
        SuccessResponse:
{
          type: 'object',
          required: ['success', 'message', 'timestamp'],
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
              description: 'Response data',
              additionalProperties: true,
            },
            timestamp: {

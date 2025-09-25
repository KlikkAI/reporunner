type: 'string', format;
: 'date-time',
              description: 'Response timestamp',
            },
          },
        },
      },
      responses:
{
  BadRequest: {
    description: 'Bad Request', content;
    :
    {
      ('application/json');
      :
      {
        schema: {
          $ref: '#/components/schemas/Error',
        }
        ,
              example:
        {
          error: 'BadRequest', message;
          : 'Invalid request parameters',
                timestamp: '2024-01-01T00:00:00.000Z',
        }
        ,
      }
      ,
    }
    ,
  }
  ,
        Unauthorized:
  {
    description: 'Unauthorized', content;
    :
    {
      ('application/json');
      :
      {
        schema: {
          $ref: '#/components/schemas/Error',
        }
        ,
              example:
        {
          error: 'Unauthorized', message;
          : 'Authentication required',
                timestamp: '2024-01-01T00:00:00.000Z',
        }
        ,
      }
      ,
    }
    ,
  }
  ,
        Forbidden:
  {
    description: 'Forbidden', content;
    :
    {
      ('application/json');
      :
      {
        schema: {
          $ref: '#/components/schemas/Error',
        }
        ,
              example:
        {
          error: 'Forbidden', message;
          : 'Insufficient permissions',
                timestamp: '2024-01-01T00:00:00.000Z',
        }
        ,
      }
      ,
    }
    ,
  }
  ,
        NotFound:
  {
    description: 'Not Found', content;
    :
    {
      ('application/json');
      :
      {
        schema: {
          $ref: '#/components/schemas/Error',
        }
        ,
              example:
        {
          error: 'NotFound', message;
          : 'Resource not found',
                timestamp: '2024-01-01T00:00:00.000Z',
        }
        ,
      }
      ,
    }
    ,
  }
  ,
        InternalServerError:
  {
    description: 'Internal Server Error', content;
    :
    {
      ('application/json');
      :
      {
        schema: {
          $ref: '#/components/schemas/Error',
        }
        ,
              example:
        {
          error: 'InternalServerError', message;
          : 'An unexpected error occurred',
                timestamp: '2024-01-01T00:00:00.000Z',
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
      parameters:
{
        PaginationPage: {
          name: 'page',
          in: 'query',
          description: 'Page number (1-based)',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        PaginationLimit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',

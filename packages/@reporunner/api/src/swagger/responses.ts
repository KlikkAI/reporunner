import type { OpenAPIV3 } from 'openapi-types';

/**
 * Common OpenAPI response definitions
 */
export const commonResponses: Record<string, OpenAPIV3.ResponseObject> = {
  BadRequest: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          error: 'BadRequest',
          message: 'Invalid request parameters',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  },

  Unauthorized: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  },

  Forbidden: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          error: 'Forbidden',
          message: 'Insufficient permissions',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  },

  NotFound: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          error: 'NotFound',
          message: 'Resource not found',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  },

  InternalServerError: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          error: 'InternalServerError',
          message: 'An unexpected error occurred',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  },
};
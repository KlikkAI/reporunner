import type { OpenAPIV3 } from 'openapi-types';

/**
 * Common reusable OpenAPI schemas
 */

export const commonSchemasDetailed: Record<string, OpenAPIV3.SchemaObject> = {
  // Error Response
  ErrorResponse: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Validation failed',
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'VALIDATION_ERROR',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
            additionalProperties: true,
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp',
          },
        },
      },
    },
  },

  // Success Response
  SuccessResponse: {
    type: 'object',
    required: ['success'],
    properties: {
      success: {
        type: 'boolean',
        description: 'Success status',
        example: true,
      },
      message: {
        type: 'string',
        description: 'Success message',
      },
    },
  },

  // Pagination Meta
  PaginationMeta: {
    type: 'object',
    required: ['page', 'limit', 'total', 'totalPages'],
    properties: {
      page: {
        type: 'number',
        description: 'Current page number (1-indexed)',
        example: 1,
        minimum: 1,
      },
      limit: {
        type: 'number',
        description: 'Items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
      },
      total: {
        type: 'number',
        description: 'Total number of items',
        example: 150,
      },
      totalPages: {
        type: 'number',
        description: 'Total number of pages',
        example: 8,
      },
      hasNext: {
        type: 'boolean',
        description: 'Whether there is a next page',
        example: true,
      },
      hasPrev: {
        type: 'boolean',
        description: 'Whether there is a previous page',
        example: false,
      },
    },
  },

  // Organization Schema
  Organization: {
    type: 'object',
    required: ['id', 'name', 'createdAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique organization identifier',
        example: '950e8400-e29b-41d4-a716-446655440000',
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Organization name',
        example: 'Acme Corporation',
      },
      slug: {
        type: 'string',
        description: 'Organization slug for URLs',
        example: 'acme-corp',
      },
      logo: {
        type: 'string',
        format: 'uri',
        description: 'Organization logo URL',
      },
      settings: {
        type: 'object',
        description: 'Organization settings',
        additionalProperties: true,
      },
      plan: {
        type: 'string',
        enum: ['free', 'starter', 'professional', 'enterprise'],
        description: 'Subscription plan',
        example: 'professional',
      },
      memberCount: {
        type: 'number',
        description: 'Number of members',
        example: 15,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
  },

  // Node Type Info
  NodeTypeInfo: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Node type identifier',
        example: 'http-request',
      },
      name: {
        type: 'string',
        description: 'Display name',
        example: 'HTTP Request',
      },
      description: {
        type: 'string',
        description: 'Node description',
      },
      category: {
        type: 'string',
        description: 'Node category',
        example: 'Core',
      },
      subcategory: {
        type: 'string',
        description: 'Node subcategory',
        example: 'Communication',
      },
      icon: {
        type: 'string',
        description: 'Icon name or URL',
      },
      version: {
        type: 'number',
        description: 'Node type version',
        example: 1,
      },
      inputs: {
        type: 'array',
        description: 'Input configurations',
        items: { type: 'object' },
      },
      outputs: {
        type: 'array',
        description: 'Output configurations',
        items: { type: 'object' },
      },
      properties: {
        type: 'array',
        description: 'Node properties',
        items: { type: 'object' },
      },
      credentials: {
        type: 'array',
        description: 'Required credentials',
        items: { type: 'string' },
      },
    },
  },

  // Validation Error Detail
  ValidationErrorDetail: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        description: 'Field name that failed validation',
        example: 'email',
      },
      message: {
        type: 'string',
        description: 'Validation error message',
        example: 'Invalid email format',
      },
      value: {
        description: 'Value that failed validation',
      },
    },
  },
};

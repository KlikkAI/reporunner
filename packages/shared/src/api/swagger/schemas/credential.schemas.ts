import type { OpenAPIV3 } from 'openapi-types';

/**
 * Credential-related OpenAPI schemas
 */

export const credentialSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Core Credential Schema
  Credential: {
    type: 'object',
    required: ['id', 'name', 'type', 'createdAt', 'updatedAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique credential identifier',
        example: '750e8400-e29b-41d4-a716-446655440000',
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Credential name',
        example: 'Production Gmail Account',
      },
      type: {
        type: 'string',
        description: 'Credential type',
        example: 'gmail-oauth2',
      },
      data: {
        type: 'object',
        description: 'Encrypted credential data',
        additionalProperties: true,
        example: { clientId: '***', accessToken: '***' },
      },
      isVerified: {
        type: 'boolean',
        description: 'Whether credential has been tested successfully',
        example: true,
      },
      lastVerifiedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last successful verification timestamp',
      },
      organizationId: {
        type: 'string',
        format: 'uuid',
        description: 'Organization ID',
      },
      createdBy: {
        type: 'string',
        format: 'uuid',
        description: 'User ID who created the credential',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
        example: '2025-10-02T13:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
  },

  // Create Credential Request
  CreateCredentialRequest: {
    type: 'object',
    required: ['name', 'type', 'data'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Credential name',
      },
      type: {
        type: 'string',
        description: 'Credential type identifier',
        example: 'gmail-oauth2',
      },
      data: {
        type: 'object',
        description: 'Credential data (will be encrypted)',
        additionalProperties: true,
      },
    },
  },

  // Update Credential Request
  UpdateCredentialRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
      },
      data: {
        type: 'object',
        description: 'Updated credential data (will be encrypted)',
        additionalProperties: true,
      },
    },
  },

  // Test Credential Response
  TestCredentialResponse: {
    type: 'object',
    required: ['success'],
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the test was successful',
        example: true,
      },
      message: {
        type: 'string',
        description: 'Test result message',
        example: 'Successfully connected to Gmail API',
      },
      details: {
        type: 'object',
        description: 'Additional test details',
        additionalProperties: true,
      },
    },
  },

  // Credential List Response
  CredentialListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Credential',
        },
      },
      pagination: {
        $ref: '#/components/schemas/PaginationMeta',
      },
    },
  },

  // Credential Type Info
  CredentialTypeInfo: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Type identifier',
        example: 'gmail-oauth2',
      },
      displayName: {
        type: 'string',
        description: 'Human-readable name',
        example: 'Gmail OAuth2',
      },
      description: {
        type: 'string',
        description: 'Type description',
      },
      authType: {
        type: 'string',
        enum: ['oauth2', 'apiKey', 'basic', 'jwt', 'custom'],
      },
      properties: {
        type: 'array',
        description: 'Required credential properties',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
      },
    },
  },
};

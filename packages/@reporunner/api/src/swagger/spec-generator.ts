import type { OpenAPIV3 } from 'openapi-types';
import { createZodOpenApiSpec } from 'zod-to-openapi';
import { ExecutionSchema, OrganizationSchema, UserSchema, WorkflowSchema } from '../schemas';

export function generateOpenAPISpec(): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      title: 'Reporunner API',
      version: '1.0.0',
      description: `
# Reporunner API

Welcome to the Reporunner API documentation. This API provides comprehensive workflow automation capabilities with enterprise-grade features.

## Features

- 🔄 **Workflow Management**: Create, update, execute, and monitor workflows
- 🔐 **Enterprise Authentication**: JWT, OAuth2, SAML, and SSO support
- 🤖 **AI Integration**: Native AI and ML capabilities
- 📊 **Real-time Monitoring**: Live execution tracking and analytics
- 🔌 **Extensible Nodes**: Plugin architecture for custom integrations
- 🏢 **Multi-tenant**: Organization-based isolation and management

## Authentication

Most endpoints require authentication. Include your access token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_ACCESS_TOKEN
\`\`\`

## Rate Limiting

API requests are rate limited to prevent abuse:
- **Standard**: 1000 requests per 15 minutes per IP
- **Authenticated**: 5000 requests per 15 minutes per user

## Webhooks

Reporunner supports webhooks for real-time notifications of workflow events.

## SDKs

Official SDKs are available for:
- TypeScript/JavaScript
- Python
- Go

## Support

- 📖 [Documentation](https://docs.reporunner.com)
- 💬 [Discord Community](https://discord.gg/reporunner)
- 🐛 [Bug Reports](https://github.com/reporunner/reporunner/issues)
      `,
      contact: {
        name: 'Reporunner Team',
        url: 'https://reporunner.com',
        email: 'support@reporunner.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.reporunner.com',
        description: 'Production server',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server authentication',
        },
      },
      schemas: {
        // Core schemas
        Workflow: createZodOpenApiSpec(WorkflowSchema).components?.schemas?.Workflow || {},
        Execution: createZodOpenApiSpec(ExecutionSchema).components?.schemas?.Execution || {},
        User: createZodOpenApiSpec(UserSchema).components?.schemas?.User || {},
        Organization:
          createZodOpenApiSpec(OrganizationSchema).components?.schemas?.Organization || {},

        // Common schemas
        Error: {
          type: 'object',
          required: ['error', 'message', 'timestamp'],
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'ValidationError',
            },
            message: {
              type: 'string',
              description: 'Human-readable error message',
              example: 'Invalid workflow configuration',
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
            requestId: {
              type: 'string',
              description: 'Unique request identifier for debugging',
              example: 'req_123456789',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          required: ['data', 'pagination'],
          properties: {
            data: {
              type: 'array',
              items: {},
              description: 'Array of results',
            },
            pagination: {
              type: 'object',
              required: ['page', 'limit', 'total', 'pages'],
              properties: {
                page: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current page number',
                },
                limit: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 100,
                  description: 'Number of items per page',
                },
                total: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of items',
                },
                pages: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Total number of pages',
                },
                hasNext: {
                  type: 'boolean',
                  description: 'Whether there are more pages',
                },
                hasPrev: {
                  type: 'boolean',
                  description: 'Whether there are previous pages',
                },
              },
            },
          },
        },
        SuccessResponse: {
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
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
            },
          },
        },
      },
      responses: {
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
      },
      parameters: {
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
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        OrganizationId: {
          name: 'organizationId',
          in: 'path',
          description: 'Organization ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
        WorkflowId: {
          name: 'workflowId',
          in: 'path',
          description: 'Workflow ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
        ExecutionId: {
          name: 'executionId',
          in: 'path',
          description: 'Execution ID',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      },
    },
    paths: {
      // Paths will be added by individual route files
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Workflows',
        description: 'Workflow management operations',
      },
      {
        name: 'Executions',
        description: 'Workflow execution management',
      },
      {
        name: 'Nodes',
        description: 'Node type management and operations',
      },
      {
        name: 'Credentials',
        description: 'Credential management',
      },
      {
        name: 'Organizations',
        description: 'Organization management',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'AI',
        description: 'AI and ML operations',
      },
      {
        name: 'Webhooks',
        description: 'Webhook management',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting',
      },
    ],
  };

  return spec;
}

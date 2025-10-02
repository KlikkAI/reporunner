import type { OpenAPIV3 } from 'openapi-types';
import { apiInfo, apiServers } from './info';
import { commonParameters } from './parameters';
import { commonResponses } from './responses';
import { commonSchemas } from './schemas';
import { defaultSecurity, securitySchemes } from './security';
import { apiTags } from './tags';

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPIV3.Document {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: apiInfo,
    servers: apiServers,
    security: defaultSecurity,
    components: {
      securitySchemes,
      schemas: {
        // Basic schemas for API documentation
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            nodes: { type: 'array', items: { type: 'object' } },
            edges: { type: 'array', items: { type: 'object' } },
            status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'name', 'nodes', 'edges'],
        },
        Execution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            workflowId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
            },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            results: { type: 'object' },
          },
          required: ['id', 'workflowId', 'status', 'startTime'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user', 'viewer'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'name', 'role'],
        },

        // Common schemas
        ...commonSchemas,
      },
      responses: commonResponses,
      parameters: commonParameters,
    },
    paths: {
      // Minimal path skeletons derived from existing route mounts
      '/api/v1/workflows': {
        get: {
          tags: ['Workflows'],
          summary: 'Get workflows',
          responses: { '200': { description: 'OK' } },
        },
        post: {
          tags: ['Workflows'],
          summary: 'Create workflow',
          responses: { '201': { description: 'Created' } },
        },
      },
      '/api/v1/workflows/{workflowId}': {
        get: { tags: ['Workflows'], summary: 'Get workflow', responses: { '200': { description: 'OK' } } },
        put: { tags: ['Workflows'], summary: 'Update workflow', responses: { '200': { description: 'OK' } } },
        delete: { tags: ['Workflows'], summary: 'Delete workflow', responses: { '204': { description: 'No Content' } } },
      },
      '/api/v1/workflows/{workflowId}/execute': {
        post: { tags: ['Workflows'], summary: 'Execute workflow', responses: { '202': { description: 'Accepted' } } },
      },
      '/api/v1/workflows/{workflowId}/activate': {
        post: { tags: ['Workflows'], summary: 'Activate workflow', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/workflows/{workflowId}/deactivate': {
        post: { tags: ['Workflows'], summary: 'Deactivate workflow', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/executions': {
        get: { tags: ['Executions'], summary: 'Get executions', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/executions/{id}': {
        get: { tags: ['Executions'], summary: 'Get execution', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/executions/{id}/cancel': {
        post: { tags: ['Executions'], summary: 'Cancel execution', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/credentials': {
        get: { tags: ['Credentials'], summary: 'Get credentials', responses: { '200': { description: 'OK' } } },
        post: { tags: ['Credentials'], summary: 'Create credential', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/credentials/{id}': {
        get: { tags: ['Credentials'], summary: 'Get credential', responses: { '200': { description: 'OK' } } },
        put: { tags: ['Credentials'], summary: 'Update credential', responses: { '200': { description: 'OK' } } },
        delete: { tags: ['Credentials'], summary: 'Delete credential', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/credentials/{id}/test': {
        post: { tags: ['Credentials'], summary: 'Test credential', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/auth/login': {
        post: { tags: ['Authentication'], summary: 'Login', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/auth/register': {
        post: { tags: ['Authentication'], summary: 'Register', responses: { '201': { description: 'Created' } } },
      },

      '/api/v1/users/profile': {
        get: { tags: ['Users'], summary: 'Get profile', responses: { '200': { description: 'OK' } } },
        put: { tags: ['Users'], summary: 'Update profile', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/organizations': {
        get: { tags: ['Organizations'], summary: 'Get organizations', responses: { '200': { description: 'OK' } } },
        post: { tags: ['Organizations'], summary: 'Create organization', responses: { '201': { description: 'Created' } } },
      },
      '/api/v1/organizations/{id}': {
        get: { tags: ['Organizations'], summary: 'Get organization', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/nodes': {
        get: { tags: ['Nodes'], summary: 'Get nodes', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/nodes/{nodeType}': {
        get: { tags: ['Nodes'], summary: 'Get node details', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/ai/chat': {
        post: { tags: ['AI'], summary: 'AI chat', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/webhooks': {
        post: { tags: ['Webhooks'], summary: 'Generic webhook', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/webhooks/{workflowId}': {
        post: { tags: ['Webhooks'], summary: 'Workflow webhook', responses: { '200': { description: 'OK' } } },
      },
      '/api/v1/webhooks/test': {
        post: { tags: ['Webhooks'], summary: 'Test webhook', responses: { '200': { description: 'OK' } } },
      },

      '/api/v1/analytics/dashboard': {
        get: { tags: ['Analytics'], summary: 'Dashboard analytics', responses: { '200': { description: 'OK' } } },
      },
    },
    tags: apiTags,
  };

  return spec;
}

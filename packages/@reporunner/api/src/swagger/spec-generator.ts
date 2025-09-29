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
            status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
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
      // Paths will be added by individual route files
    },
    tags: apiTags,
  };

  return spec;
}

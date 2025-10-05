import type { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI tag definitions for organizing endpoints
 */
export const apiTags: OpenAPIV3.TagObject[] = [
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
];

import type { OpenAPIV3 } from 'openapi-types';

/**
 * Common OpenAPI parameter definitions
 */
export const commonParameters: Record<string, OpenAPIV3.ParameterObject> = {
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

  UserId: {
    name: 'userId',
    in: 'path',
    description: 'User ID',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid',
    },
  },

  NodeType: {
    name: 'nodeType',
    in: 'path',
    description: 'Node type identifier',
    required: true,
    schema: {
      type: 'string',
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
    },
  },
};

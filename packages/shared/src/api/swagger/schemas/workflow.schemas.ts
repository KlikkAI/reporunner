import type { OpenAPIV3 } from 'openapi-types';

/**
 * Workflow-related OpenAPI schemas
 */

export const workflowSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Core Workflow Schema
  Workflow: {
    type: 'object',
    required: ['id', 'name', 'nodes', 'edges', 'status', 'createdAt', 'updatedAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique workflow identifier',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Workflow name',
        example: 'Daily Email Automation',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Workflow description',
        example: 'Sends automated daily summary emails to stakeholders',
      },
      nodes: {
        type: 'array',
        description: 'Workflow nodes',
        items: {
          $ref: '#/components/schemas/WorkflowNode',
        },
      },
      edges: {
        type: 'array',
        description: 'Connections between nodes',
        items: {
          $ref: '#/components/schemas/WorkflowEdge',
        },
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'draft', 'error'],
        description: 'Workflow status',
        example: 'active',
      },
      settings: {
        $ref: '#/components/schemas/WorkflowSettings',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Workflow tags',
        example: ['automation', 'email', 'daily'],
      },
      organizationId: {
        type: 'string',
        format: 'uuid',
        description: 'Organization ID',
      },
      createdBy: {
        type: 'string',
        format: 'uuid',
        description: 'User ID who created the workflow',
      },
      updatedBy: {
        type: 'string',
        format: 'uuid',
        description: 'User ID who last updated the workflow',
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
        example: '2025-10-02T14:30:00.000Z',
      },
    },
  },

  // Workflow Node Schema
  WorkflowNode: {
    type: 'object',
    required: ['id', 'type', 'position', 'data'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique node identifier',
        example: 'node-1',
      },
      type: {
        type: 'string',
        description: 'Node type',
        example: 'http-request',
      },
      position: {
        type: 'object',
        required: ['x', 'y'],
        properties: {
          x: { type: 'number', example: 250 },
          y: { type: 'number', example: 100 },
        },
      },
      data: {
        type: 'object',
        description: 'Node-specific data and configuration',
        additionalProperties: true,
      },
    },
  },

  // Workflow Edge Schema
  WorkflowEdge: {
    type: 'object',
    required: ['id', 'source', 'target'],
    properties: {
      id: {
        type: 'string',
        description: 'Unique edge identifier',
        example: 'edge-1',
      },
      source: {
        type: 'string',
        description: 'Source node ID',
        example: 'node-1',
      },
      target: {
        type: 'string',
        description: 'Target node ID',
        example: 'node-2',
      },
      sourceHandle: {
        type: 'string',
        description: 'Source handle identifier',
        example: 'output-1',
      },
      targetHandle: {
        type: 'string',
        description: 'Target handle identifier',
        example: 'input-1',
      },
      type: {
        type: 'string',
        description: 'Edge type',
        example: 'default',
      },
    },
  },

  // Workflow Settings Schema
  WorkflowSettings: {
    type: 'object',
    properties: {
      errorWorkflow: {
        type: 'string',
        format: 'uuid',
        description: 'Error handler workflow ID',
      },
      timezone: {
        type: 'string',
        description: 'Workflow timezone',
        example: 'America/New_York',
      },
      saveExecutionData: {
        type: 'boolean',
        description: 'Whether to save execution data',
        default: true,
      },
      saveManualExecutions: {
        type: 'boolean',
        description: 'Whether to save manual executions',
        default: true,
      },
      callerPolicy: {
        type: 'string',
        enum: ['any', 'workflowsFromSameOwner', 'workflowsFromAList'],
        description: 'Who can call this workflow',
        default: 'workflowsFromSameOwner',
      },
    },
  },

  // Create Workflow Request
  CreateWorkflowRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Workflow name',
        example: 'New Automation Workflow',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Workflow description',
      },
      nodes: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WorkflowNode',
        },
        default: [],
      },
      edges: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WorkflowEdge',
        },
        default: [],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      settings: {
        $ref: '#/components/schemas/WorkflowSettings',
      },
    },
  },

  // Update Workflow Request
  UpdateWorkflowRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        maxLength: 1000,
      },
      nodes: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WorkflowNode',
        },
      },
      edges: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WorkflowEdge',
        },
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'draft'],
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      settings: {
        $ref: '#/components/schemas/WorkflowSettings',
      },
    },
  },

  // Workflow List Response
  WorkflowListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Workflow',
        },
      },
      pagination: {
        $ref: '#/components/schemas/PaginationMeta',
      },
    },
  },

  // Execute Workflow Request
  ExecuteWorkflowRequest: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Input data for workflow execution',
        additionalProperties: true,
      },
      mode: {
        type: 'string',
        enum: ['manual', 'trigger', 'test'],
        description: 'Execution mode',
        default: 'manual',
      },
    },
  },
};

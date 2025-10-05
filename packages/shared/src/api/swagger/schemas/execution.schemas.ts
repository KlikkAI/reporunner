import type { OpenAPIV3 } from 'openapi-types';

/**
 * Execution-related OpenAPI schemas
 */

export const executionSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Core Execution Schema
  Execution: {
    type: 'object',
    required: ['id', 'workflowId', 'status', 'mode', 'startedAt'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique execution identifier',
        example: '650e8400-e29b-41d4-a716-446655440000',
      },
      workflowId: {
        type: 'string',
        format: 'uuid',
        description: 'Workflow ID being executed',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      status: {
        type: 'string',
        enum: ['pending', 'running', 'success', 'error', 'cancelled', 'waiting'],
        description: 'Execution status',
        example: 'success',
      },
      mode: {
        type: 'string',
        enum: ['manual', 'trigger', 'retry', 'test'],
        description: 'Execution mode',
        example: 'manual',
      },
      startedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Execution start timestamp',
        example: '2025-10-02T13:00:00.000Z',
      },
      finishedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Execution end timestamp',
        example: '2025-10-02T13:05:30.000Z',
      },
      duration: {
        type: 'number',
        description: 'Execution duration in milliseconds',
        example: 330000,
      },
      data: {
        type: 'object',
        description: 'Execution input data',
        additionalProperties: true,
      },
      results: {
        type: 'object',
        description: 'Execution results by node',
        additionalProperties: {
          $ref: '#/components/schemas/NodeExecutionResult',
        },
      },
      error: {
        $ref: '#/components/schemas/ExecutionError',
      },
      createdBy: {
        type: 'string',
        format: 'uuid',
        description: 'User ID who triggered the execution',
      },
    },
  },

  // Node Execution Result
  NodeExecutionResult: {
    type: 'object',
    properties: {
      nodeId: {
        type: 'string',
        description: 'Node identifier',
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'skipped'],
      },
      startTime: {
        type: 'string',
        format: 'date-time',
      },
      endTime: {
        type: 'string',
        format: 'date-time',
      },
      duration: {
        type: 'number',
        description: 'Node execution duration in milliseconds',
      },
      data: {
        type: 'object',
        description: 'Node output data',
        additionalProperties: true,
      },
      error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          stack: { type: 'string' },
        },
      },
    },
  },

  // Execution Error
  ExecutionError: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Error message',
        example: 'HTTP request failed with status 500',
      },
      nodeId: {
        type: 'string',
        description: 'Node ID where error occurred',
      },
      stack: {
        type: 'string',
        description: 'Error stack trace',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'When the error occurred',
      },
    },
  },

  // Execution List Response
  ExecutionListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Execution',
        },
      },
      pagination: {
        $ref: '#/components/schemas/PaginationMeta',
      },
    },
  },

  // Execution Statistics
  ExecutionStatistics: {
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total executions',
        example: 1523,
      },
      success: {
        type: 'number',
        description: 'Successful executions',
        example: 1450,
      },
      error: {
        type: 'number',
        description: 'Failed executions',
        example: 68,
      },
      running: {
        type: 'number',
        description: 'Currently running executions',
        example: 5,
      },
      successRate: {
        type: 'number',
        format: 'float',
        description: 'Success rate percentage',
        example: 95.21,
      },
      averageDuration: {
        type: 'number',
        description: 'Average execution duration in milliseconds',
        example: 12500,
      },
    },
  },
};

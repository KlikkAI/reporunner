import type { OpenAPIV3 } from 'openapi-types';

/**
 * Complete OpenAPI path definitions with request/response schemas
 */

export const apiPaths: OpenAPIV3.PathsObject = {
  // ==================== AUTHENTICATION ====================
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        '401': {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [],
    },
  },

  '/api/v1/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'User registration',
      description: 'Register a new user account',
      operationId: 'register',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Registration successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [],
    },
  },

  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description: 'Get new access token using refresh token',
      operationId: 'refreshToken',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        '401': {
          description: 'Invalid or expired refresh token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [],
    },
  },

  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Invalidate current session',
      operationId: 'logout',
      responses: {
        '200': {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== WORKFLOWS ====================
  '/api/v1/workflows': {
    get: {
      tags: ['Workflows'],
      summary: 'List workflows',
      description: 'Get paginated list of workflows',
      operationId: 'listWorkflows',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'number', minimum: 1, default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          description: 'Items per page',
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['active', 'inactive', 'draft', 'error'] },
          description: 'Filter by status',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by name or description',
        },
      ],
      responses: {
        '200': {
          description: 'Workflows retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkflowListResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Workflows'],
      summary: 'Create workflow',
      description: 'Create a new workflow',
      operationId: 'createWorkflow',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateWorkflowRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Workflow created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/workflows/{workflowId}': {
    get: {
      tags: ['Workflows'],
      summary: 'Get workflow',
      description: 'Get workflow by ID',
      operationId: 'getWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Workflow ID',
        },
      ],
      responses: {
        '200': {
          description: 'Workflow retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
        '404': {
          description: 'Workflow not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    put: {
      tags: ['Workflows'],
      summary: 'Update workflow',
      description: 'Update workflow by ID',
      operationId: 'updateWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateWorkflowRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Workflow updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
        '404': {
          description: 'Workflow not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    delete: {
      tags: ['Workflows'],
      summary: 'Delete workflow',
      description: 'Delete workflow by ID',
      operationId: 'deleteWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '204': {
          description: 'Workflow deleted successfully',
        },
        '404': {
          description: 'Workflow not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/workflows/{workflowId}/execute': {
    post: {
      tags: ['Workflows'],
      summary: 'Execute workflow',
      description: 'Trigger workflow execution',
      operationId: 'executeWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ExecuteWorkflowRequest' },
          },
        },
      },
      responses: {
        '202': {
          description: 'Execution started',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Execution' },
            },
          },
        },
        '404': {
          description: 'Workflow not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/workflows/{workflowId}/activate': {
    post: {
      tags: ['Workflows'],
      summary: 'Activate workflow',
      description: 'Activate workflow for automatic execution',
      operationId: 'activateWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Workflow activated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/workflows/{workflowId}/deactivate': {
    post: {
      tags: ['Workflows'],
      summary: 'Deactivate workflow',
      description: 'Deactivate workflow',
      operationId: 'deactivateWorkflow',
      parameters: [
        {
          name: 'workflowId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Workflow deactivated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Workflow' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== EXECUTIONS ====================
  '/api/v1/executions': {
    get: {
      tags: ['Executions'],
      summary: 'List executions',
      description: 'Get paginated list of workflow executions',
      operationId: 'listExecutions',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'number', minimum: 1, default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: 'workflowId',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by workflow ID',
        },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['pending', 'running', 'success', 'error', 'cancelled'] },
        },
      ],
      responses: {
        '200': {
          description: 'Executions retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExecutionListResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/executions/{id}': {
    get: {
      tags: ['Executions'],
      summary: 'Get execution',
      description: 'Get execution details by ID',
      operationId: 'getExecution',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Execution retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Execution' },
            },
          },
        },
        '404': {
          description: 'Execution not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/executions/{id}/cancel': {
    post: {
      tags: ['Executions'],
      summary: 'Cancel execution',
      description: 'Cancel running execution',
      operationId: 'cancelExecution',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Execution cancelled',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Execution' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== CREDENTIALS ====================
  '/api/v1/credentials': {
    get: {
      tags: ['Credentials'],
      summary: 'List credentials',
      description: 'Get paginated list of credentials',
      operationId: 'listCredentials',
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'number', minimum: 1, default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'number', minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by credential type',
        },
      ],
      responses: {
        '200': {
          description: 'Credentials retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CredentialListResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Credentials'],
      summary: 'Create credential',
      description: 'Create a new credential',
      operationId: 'createCredential',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCredentialRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Credential created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credential' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/credentials/{id}': {
    get: {
      tags: ['Credentials'],
      summary: 'Get credential',
      description: 'Get credential by ID',
      operationId: 'getCredential',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Credential retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credential' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    put: {
      tags: ['Credentials'],
      summary: 'Update credential',
      description: 'Update credential by ID',
      operationId: 'updateCredential',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCredentialRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Credential updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Credential' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    delete: {
      tags: ['Credentials'],
      summary: 'Delete credential',
      description: 'Delete credential by ID',
      operationId: 'deleteCredential',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '204': {
          description: 'Credential deleted successfully',
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/credentials/{id}/test': {
    post: {
      tags: ['Credentials'],
      summary: 'Test credential',
      description: 'Test credential connection',
      operationId: 'testCredential',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Test result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TestCredentialResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== USERS ====================
  '/api/v1/users/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get user profile',
      description: 'Get current user profile',
      operationId: 'getUserProfile',
      responses: {
        '200': {
          description: 'Profile retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    put: {
      tags: ['Users'],
      summary: 'Update user profile',
      description: 'Update current user profile',
      operationId: 'updateUserProfile',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/users/change-password': {
    post: {
      tags: ['Users'],
      summary: 'Change password',
      description: 'Change user password',
      operationId: 'changePassword',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Password changed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== ORGANIZATIONS ====================
  '/api/v1/organizations': {
    get: {
      tags: ['Organizations'],
      summary: 'List organizations',
      description: 'Get user organizations',
      operationId: 'listOrganizations',
      responses: {
        '200': {
          description: 'Organizations retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Organization' },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  '/api/v1/organizations/{id}': {
    get: {
      tags: ['Organizations'],
      summary: 'Get organization',
      description: 'Get organization by ID',
      operationId: 'getOrganization',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Organization retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Organization' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },

  // ==================== NODES ====================
  '/api/v1/nodes': {
    get: {
      tags: ['Nodes'],
      summary: 'List node types',
      description: 'Get available node types',
      operationId: 'listNodeTypes',
      parameters: [
        {
          name: 'category',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by category',
        },
      ],
      responses: {
        '200': {
          description: 'Node types retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NodeTypeInfo' },
                  },
                },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
};

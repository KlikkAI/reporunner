/**
 * Database Constants
 */

export const DATABASE_COLLECTIONS = {
  USERS: 'users',
  WORKFLOWS: 'workflows',
  EXECUTIONS: 'executions',
  CREDENTIALS: 'credentials',
} as const;

export const DATABASE_INDEXES = {
  USERS: {
    EMAIL: { email: 1 },
    CREATED_AT: { createdAt: -1 },
  },
  WORKFLOWS: {
    USER_ID: { userId: 1 },
    CREATED_AT: { createdAt: -1 },
    ACTIVE: { isActive: 1 },
    USER_ACTIVE: { userId: 1, isActive: 1 },
  },
  EXECUTIONS: {
    WORKFLOW_ID: { workflowId: 1 },
    USER_ID: { userId: 1 },
    STATUS: { status: 1 },
    CREATED_AT: { createdAt: -1 },
    WORKFLOW_STATUS: { workflowId: 1, status: 1 },
  },
  CREDENTIALS: {
    USER_ID: { userId: 1 },
    INTEGRATION: { integration: 1 },
    USER_INTEGRATION: { userId: 1, integration: 1 },
  },
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

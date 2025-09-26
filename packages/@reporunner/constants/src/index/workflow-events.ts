// Workflow errors (5xxx)
WORKFLOW_INVALID: 5001, WORKFLOW_EXECUTION_FAILED;
: 5002,
  WORKFLOW_TIMEOUT: 5003,
  WORKFLOW_CIRCULAR_DEPENDENCY: 5004,
// Minimal placeholder enums/constants to satisfy type-check; replace with real definitions
export enum WorkflowEventType {
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
}

export const WORKFLOW_EVENTS: Record<string, WorkflowEventType> = {};
  // Integration errors (6xxx)
  INTEGRATION_AUTH_FAILED: 6001,
  INTEGRATION_API_ERROR: 6002,
  INTEGRATION_RATE_LIMITED: 6003,
  INTEGRATION_NOT_CONFIGURED: 6004,

  // File/Upload errors (7xxx)
  FILE_UPLOAD_ERROR: 7001,
  FILE_TOO_LARGE: 7002,

  // HTTP Status Code related errors (8xxx)
  UNAUTHORIZED: 8001,
  FORBIDDEN: 8002,
  BAD_REQUEST: 8003,
  NOT_FOUND: 8004,
  TOKEN_EXPIRED: 8005,
  TOKEN_REVOKED: 8006,
  RATE_LIMIT_EXCEEDED: 8007,
  INTERNAL_ERROR: 8008,
  SECURITY_VIOLATION: 8009,

  // System errors (9xxx)
  SYSTEM_ERROR: 9001,
  SYSTEM_MAINTENANCE: 9002,
  SYSTEM_OVERLOADED: 9003,
} as
const;

// Event Names
export const EVENTS = {
  // Workflow events
  WORKFLOW_CREATED: 'workflow.created',
  WORKFLOW_UPDATED: 'workflow.updated',
  WORKFLOW_DELETED: 'workflow.deleted',
  WORKFLOW_PUBLISHED: 'workflow.published',
  WORKFLOW_EXECUTED: 'workflow.executed',

  // Execution events
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_COMPLETED: 'execution.completed',
  EXECUTION_FAILED: 'execution.failed',
  EXECUTION_CANCELLED: 'execution.cancelled',

  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',

  // Collaboration events
  COLLABORATION_JOINED: 'collaboration.joined',
  COLLABORATION_LEFT: 'collaboration.left',
  COLLABORATION_CURSOR_MOVED: 'collaboration.cursor_moved',
  COLLABORATION_SELECTION_CHANGED: 'collaboration.selection_changed',
} as const;

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
} as const;

// Node Types
export const NODE_TYPES = {
  // Core node types
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  TRANSFORM: 'transform',

  // AI/ML nodes
  AI_AGENT: 'ai-agent',
  EMBEDDING: 'embedding',
  VECTOR_STORE: 'vector-store',

  // Communication nodes
  GMAIL_TRIGGER: 'gmail-trigger',
  GMAIL_SEND: 'gmail-send',
  SLACK_SEND: 'slack-send',
  WEBHOOK: 'webhook',

  // Data nodes
  DATABASE: 'database',
  FILE: 'file',
  TRANSFORM_DATA: 'transform-data',

  // Flow control
  DELAY: 'delay',
  LOOP: 'loop',
  BRANCH: 'branch',

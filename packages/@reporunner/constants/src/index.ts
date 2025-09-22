// System Constants
export const SYSTEM = {
  APP_NAME: "Reporunner",
  VERSION: "1.0.0",
  DEFAULT_TIMEZONE: "UTC",
  DEFAULT_LOCALE: "en-US",
  MAX_WORKFLOW_SIZE: 1000, // Max nodes in a workflow
  MAX_EXECUTION_TIME: 3600000, // 1 hour in ms
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 300000, // 5 minutes
} as const;

// API Configuration
export const API = {
  PREFIX: "/api/v1",
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  RATE_LIMIT_WINDOW: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
} as const;

// Database Configuration
export const DATABASE = {
  MONGODB_POOL_SIZE: 10,
  POSTGRES_POOL_SIZE: 20,
  REDIS_TTL_DEFAULT: 3600, // 1 hour
  REDIS_TTL_SESSION: 86400, // 24 hours
  REDIS_TTL_CACHE: 600, // 10 minutes
} as const;

// Authentication
export const AUTH = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 7200000, // 2 hours
  SESSION_EXPIRY: 86400000, // 24 hours
  MFA_TOKEN_LENGTH: 6,
  MFA_TOKEN_EXPIRY: 300000, // 5 minutes
} as const;

// WebSocket Configuration
export const WEBSOCKET = {
  PING_INTERVAL: 25000, // 25 seconds
  PING_TIMEOUT: 60000, // 60 seconds
  MAX_PAYLOAD_SIZE: 10485760, // 10MB
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE: 52428800, // 50MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
  ],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "text/plain", "text/csv"],
  TEMP_DIR: "/tmp/uploads",
} as const;

// Queue Configuration
export const QUEUE = {
  DEFAULT_JOB_OPTIONS: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
  WORKFLOW_QUEUE: "workflow-execution",
  EMAIL_QUEUE: "email-notifications",
  WEBHOOK_QUEUE: "webhook-delivery",
  ANALYTICS_QUEUE: "analytics-events",
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication errors (1xxx)
  AUTH_INVALID_CREDENTIALS: 1001,
  AUTH_TOKEN_EXPIRED: 1002,
  AUTH_TOKEN_INVALID: 1003,
  AUTH_UNAUTHORIZED: 1004,
  AUTH_ACCOUNT_LOCKED: 1005,
  AUTH_EMAIL_NOT_VERIFIED: 1006,
  AUTH_MFA_REQUIRED: 1007,
  AUTH_MFA_INVALID: 1008,

  // Validation errors (2xxx)
  VALIDATION_ERROR: 2001,
  VALIDATION_REQUIRED_FIELD: 2002,
  VALIDATION_INVALID_FORMAT: 2003,
  VALIDATION_OUT_OF_RANGE: 2004,

  // Resource errors (3xxx)
  RESOURCE_NOT_FOUND: 3001,
  RESOURCE_ALREADY_EXISTS: 3002,
  RESOURCE_CONFLICT: 3003,
  RESOURCE_LIMIT_EXCEEDED: 3004,

  // Workflow errors (4xxx)
  WORKFLOW_INVALID: 4001,
  WORKFLOW_EXECUTION_FAILED: 4002,
  WORKFLOW_TIMEOUT: 4003,
  WORKFLOW_CIRCULAR_DEPENDENCY: 4004,

  // Integration errors (5xxx)
  INTEGRATION_AUTH_FAILED: 5001,
  INTEGRATION_API_ERROR: 5002,
  INTEGRATION_RATE_LIMITED: 5003,
  INTEGRATION_NOT_CONFIGURED: 5004,

  // System errors (9xxx)
  SYSTEM_ERROR: 9001,
  SYSTEM_MAINTENANCE: 9002,
  SYSTEM_OVERLOADED: 9003,
} as const;

// Event Names
export const EVENTS = {
  // Workflow events
  WORKFLOW_CREATED: "workflow.created",
  WORKFLOW_UPDATED: "workflow.updated",
  WORKFLOW_DELETED: "workflow.deleted",
  WORKFLOW_PUBLISHED: "workflow.published",
  WORKFLOW_EXECUTED: "workflow.executed",

  // Execution events
  EXECUTION_STARTED: "execution.started",
  EXECUTION_COMPLETED: "execution.completed",
  EXECUTION_FAILED: "execution.failed",
  EXECUTION_CANCELLED: "execution.cancelled",

  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",

  // Collaboration events
  COLLABORATION_JOINED: "collaboration.joined",
  COLLABORATION_LEFT: "collaboration.left",
  COLLABORATION_CURSOR_MOVED: "collaboration.cursor_moved",
  COLLABORATION_SELECTION_CHANGED: "collaboration.selection_changed",
} as const;

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
} as const;

// Node Types
export const NODE_TYPES = {
  // Core node types
  TRIGGER: "trigger",
  ACTION: "action",
  CONDITION: "condition",
  TRANSFORM: "transform",

  // AI/ML nodes
  AI_AGENT: "ai-agent",
  EMBEDDING: "embedding",
  VECTOR_STORE: "vector-store",

  // Communication nodes
  GMAIL_TRIGGER: "gmail-trigger",
  GMAIL_SEND: "gmail-send",
  SLACK_SEND: "slack-send",
  WEBHOOK: "webhook",

  // Data nodes
  DATABASE: "database",
  FILE: "file",
  TRANSFORM_DATA: "transform-data",

  // Flow control
  DELAY: "delay",
  LOOP: "loop",
  BRANCH: "branch",
} as const;

export const AI_PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
  OLLAMA: "ollama",
  MISTRAL: "mistral",
  COHERE: "cohere",
} as const;

export const NODE_CATEGORIES = {
  TRIGGER: "trigger",
  ACTION: "action",
  LOGIC: "logic",
  DATA: "data",
  COMMUNICATION: "communication",
  AI_ML: "ai-ml",
  INTEGRATION: "integration",
  UTILITY: "utility",
} as const;

// Default Messages
export const MESSAGES = {
  SUCCESS: {
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    OPERATION_COMPLETED: "Operation completed successfully",
  },
  ERROR: {
    INTERNAL_ERROR: "An internal error occurred. Please try again later.",
    UNAUTHORIZED: "You are not authorized to perform this action",
    NOT_FOUND: "The requested resource was not found",
    VALIDATION_FAILED: "Validation failed. Please check your input.",
    RATE_LIMITED: "Too many requests. Please try again later.",
  },
} as const;

export default {
  SYSTEM,
  API,
  DATABASE,
  AUTH,
  WEBSOCKET,
  UPLOAD,
  QUEUE,
  ERROR_CODES,
  EVENTS,
  PATTERNS,
  MESSAGES,
};

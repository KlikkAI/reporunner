// System Constants
export const SYSTEM = {
  APP_NAME: 'Reporunner',
  VERSION: '1.0.0',
  DEFAULT_TIMEZONE: 'UTC',
  DEFAULT_LOCALE: 'en-US',
  MAX_WORKFLOW_SIZE: 1000, // Max nodes in a workflow
  MAX_EXECUTION_TIME: 3600000, // 1 hour in ms
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 300000, // 5 minutes
} as const;

// API Configuration
export const API = {
  PREFIX: '/api/v1',
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
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
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
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'text/csv'],
  TEMP_DIR: '/tmp/uploads',
} as const;

// Queue Configuration
export const QUEUE = {
  DEFAULT_JOB_OPTIONS: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  WORKFLOW_QUEUE: 'workflow-execution',
  EMAIL_QUEUE: 'email-notifications',
  WEBHOOK_QUEUE: 'webhook-delivery',
  ANALYTICS_QUEUE: 'analytics-events',
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

/**
 * Shared Constants
 * Centralized constants used across the application
 * Consolidated from @reporunner/constants and existing shared constants
 */

export * from '../types/audit';
export * from '../types/schedules';
// Re-export constants from types
export * from '../types/security';
export * from '../types/triggers';

// ============================================================================
// SYSTEM CONSTANTS (from @reporunner/constants)
// ============================================================================

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

// Legacy exports for backward compatibility
export const APP_NAME = SYSTEM.APP_NAME;
export const APP_VERSION = SYSTEM.VERSION;
export const API_VERSION = 'v1';

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// API CONFIGURATION (from @reporunner/constants)
// ============================================================================

export const API = {
  PREFIX: '/api/v1',
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  RATE_LIMIT_WINDOW: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000,
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Security
  SECURITY: {
    BASE: '/security',
    METRICS: '/security/metrics',
    THREATS: '/security/threats',
    SCANS: '/security/scans',
    ALERTS: '/security/alerts',
    COMPLIANCE: '/security/compliance',
  },

  // Audit
  AUDIT: {
    BASE: '/audit',
    EVENTS: '/audit/events',
    REPORTS: '/audit/reports',
    EXPORT: '/audit/export',
  },

  // Triggers
  TRIGGERS: {
    BASE: '/triggers',
    WEBHOOK: '/triggers/webhook',
    TEST: '/triggers/:id/test',
    EVENTS: '/triggers/:id/events',
    METRICS: '/triggers/:id/metrics',
  },

  // Schedules
  SCHEDULES: {
    BASE: '/schedules',
    TOGGLE: '/schedules/:id/toggle',
    TRIGGER: '/schedules/:id/trigger',
    ANALYTICS: '/schedules/analytics',
    EXECUTIONS: '/schedules/:id/executions',
  },

  // Workflows
  WORKFLOWS: {
    BASE: '/workflows',
    EXECUTE: '/workflows/:id/execute',
    HISTORY: '/workflows/:id/history',
    TEMPLATES: '/workflows/templates',
  },

  // Health
  HEALTH: '/health',
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // HTTP Status errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',

  // Security errors
  SECURITY_THREAT_DETECTED: 'SECURITY_THREAT_DETECTED',
  VULNERABILITY_FOUND: 'VULNERABILITY_FOUND',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Workflow errors
  WORKFLOW_EXECUTION_FAILED: 'WORKFLOW_EXECUTION_FAILED',
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  WORKFLOW_INVALID: 'WORKFLOW_INVALID',

  // Trigger errors
  TRIGGER_EXECUTION_FAILED: 'TRIGGER_EXECUTION_FAILED',
  TRIGGER_CONDITION_NOT_MET: 'TRIGGER_CONDITION_NOT_MET',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',

  // Schedule errors
  SCHEDULE_EXECUTION_FAILED: 'SCHEDULE_EXECUTION_FAILED',
  INVALID_CRON_EXPRESSION: 'INVALID_CRON_EXPRESSION',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',

  // File errors
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT_ORDER: 'desc',
} as const;

// ============================================================================
// CACHE SETTINGS
// ============================================================================

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
} as const;

// ============================================================================
// FILE UPLOAD SETTINGS
// ============================================================================

export const FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/json',
    'application/zip',
  ],
  UPLOAD_PATH: '/uploads',
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  API: {
    WINDOW: 15 * 60, // 15 minutes
    MAX_REQUESTS: 1000,
  },
  AUTH: {
    WINDOW: 15 * 60, // 15 minutes
    MAX_REQUESTS: 5,
  },
  WEBHOOK: {
    WINDOW: 60, // 1 minute
    MAX_REQUESTS: 100,
  },
} as const;

// ============================================================================
// RETRY SETTINGS
// ============================================================================

export const RETRY_SETTINGS = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// WEBHOOK SETTINGS
// ============================================================================

export const WEBHOOK_SETTINGS = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  SIGNATURE_HEADER: 'X-Webhook-Signature',
  TIMESTAMP_HEADER: 'X-Webhook-Timestamp',
} as const;

// ============================================================================
// AUTHENTICATION & SECURITY SETTINGS (Enhanced from @reporunner/constants)
// ============================================================================

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

export const SECURITY_SETTINGS = {
  PASSWORD_MIN_LENGTH: AUTH.PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  MAX_LOGIN_ATTEMPTS: AUTH.MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION: 15 * 60, // 15 minutes
  SESSION_TIMEOUT: 30 * 60, // 30 minutes
} as const;

// ============================================================================
// MONITORING SETTINGS
// ============================================================================

export const MONITORING = {
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  METRICS_COLLECTION_INTERVAL: 60000, // 1 minute
  LOG_RETENTION_DAYS: 30,
  AUDIT_RETENTION_DAYS: 2555, // 7 years for compliance
  ALERT_COOLDOWN: 5 * 60, // 5 minutes
} as const;

// ============================================================================
// WORKFLOW SETTINGS
// ============================================================================

export const WORKFLOW_SETTINGS = {
  MAX_EXECUTION_TIME: 60 * 60, // 1 hour
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_TIMEOUT: 5 * 60, // 5 minutes
  MAX_CONCURRENT_EXECUTIONS: 10,
  CLEANUP_INTERVAL: 24 * 60 * 60, // 24 hours
} as const;

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export const NOTIFICATION_SETTINGS = {
  MAX_NOTIFICATIONS_PER_USER: 100,
  NOTIFICATION_EXPIRY: 30 * 24 * 60 * 60, // 30 days
  BATCH_SIZE: 50,
  DELIVERY_TIMEOUT: 10000, // 10 seconds
} as const;

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// ============================================================================
// LOG LEVELS
// ============================================================================

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace',
} as const;

// ============================================================================
// DATABASE SETTINGS (Enhanced from @reporunner/constants)
// ============================================================================

export const DATABASE = {
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 60000, // 1 minute
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  // Additional from @reporunner/constants
  MONGODB_POOL_SIZE: 10,
  POSTGRES_POOL_SIZE: 20,
  REDIS_TTL_DEFAULT: 3600, // 1 hour
  REDIS_TTL_SESSION: 86400, // 24 hours
  REDIS_TTL_CACHE: 600, // 10 minutes
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  CRON: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  IP_ADDRESS:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,
} as const;

// ============================================================================
// MIME TYPES
// ============================================================================

export const MIME_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  CSV: 'text/csv',
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const;

// ============================================================================
// TIME ZONES
// ============================================================================

export const TIMEZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  GMT: 'Europe/London',
  CET: 'Europe/Paris',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get error message by code
 */
export function getErrorMessage(code: keyof typeof ERROR_CODES): string {
  const messages = {
    INVALID_CREDENTIALS: 'Invalid username or password',
    TOKEN_EXPIRED: 'Authentication token has expired',
    TOKEN_INVALID: 'Invalid authentication token',
    TOKEN_REVOKED: 'Authentication token has been revoked',
    UNAUTHORIZED_ACCESS: 'Unauthorized access',
    VALIDATION_ERROR: 'Validation error',
    INVALID_INPUT: 'Invalid input provided',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    RESOURCE_NOT_FOUND: 'Resource not found',
    RESOURCE_ALREADY_EXISTS: 'Resource already exists',
    RESOURCE_CONFLICT: 'Resource conflict',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    BAD_REQUEST: 'Bad request',
    NOT_FOUND: 'Not found',
    SECURITY_THREAT_DETECTED: 'Security threat detected',
    VULNERABILITY_FOUND: 'Vulnerability found',
    COMPLIANCE_VIOLATION: 'Compliance violation',
    SECURITY_VIOLATION: 'Security violation',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INTERNAL_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service unavailable',
    DATABASE_ERROR: 'Database error',
    NETWORK_ERROR: 'Network error',
    WORKFLOW_EXECUTION_FAILED: 'Workflow execution failed',
    WORKFLOW_NOT_FOUND: 'Workflow not found',
    WORKFLOW_INVALID: 'Invalid workflow',
    TRIGGER_EXECUTION_FAILED: 'Trigger execution failed',
    TRIGGER_CONDITION_NOT_MET: 'Trigger condition not met',
    WEBHOOK_DELIVERY_FAILED: 'Webhook delivery failed',
    SCHEDULE_EXECUTION_FAILED: 'Schedule execution failed',
    INVALID_CRON_EXPRESSION: 'Invalid cron expression',
    SCHEDULE_CONFLICT: 'Schedule conflict',
    FILE_UPLOAD_ERROR: 'File upload error',
    FILE_TOO_LARGE: 'File too large',
  };

  return messages[code] || 'Unknown error';
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION;
}

/**
 * Check if environment is development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Check if environment is test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === ENVIRONMENTS.TEST;
}

// ============================================================================
// ADDITIONAL CONSTANTS FROM @reporunner/constants
// ============================================================================

// WebSocket Configuration
export const WEBSOCKET = {
  PING_INTERVAL: 25000, // 25 seconds
  PING_TIMEOUT: 60000, // 60 seconds
  MAX_PAYLOAD_SIZE: 10485760, // 10MB
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
} as const;

// File Upload (Enhanced)
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

// Enhanced Error Codes (merged with existing)
export const ENHANCED_ERROR_CODES = {
  ...ERROR_CODES,
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

  // Workflow errors (5xxx)
  WORKFLOW_INVALID: 5001,
  WORKFLOW_EXECUTION_FAILED: 5002,
  WORKFLOW_TIMEOUT: 5003,
  WORKFLOW_CIRCULAR_DEPENDENCY: 5004,

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
} as const;

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

// Enhanced Regex Patterns (merged with existing)
export const PATTERNS = {
  ...REGEX_PATTERNS,
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
} as const;

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
  MISTRAL: 'mistral',
  COHERE: 'cohere',
} as const;

export const NODE_CATEGORIES = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  LOGIC: 'logic',
  DATA: 'data',
  COMMUNICATION: 'communication',
  AI_ML: 'ai-ml',
  INTEGRATION: 'integration',
  UTILITY: 'utility',
} as const;

// Default Messages
export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    OPERATION_COMPLETED: 'Operation completed successfully',
  },
  ERROR: {
    INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_FAILED: 'Validation failed. Please check your input.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
  },
} as const;

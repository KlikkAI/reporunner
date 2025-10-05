/**
 * Shared Constants
 * Centralized constants used across the application
 */

export * from '../types/audit';
export * from '../types/schedules';
// Re-export constants from types
export * from '../types/security';
export * from '../types/triggers';

// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

export const APP_NAME = 'Reporunner';
export const APP_VERSION = '1.0.0';
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
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Security errors
  SECURITY_THREAT_DETECTED: 'SECURITY_THREAT_DETECTED',
  VULNERABILITY_FOUND: 'VULNERABILITY_FOUND',
  COMPLIANCE_VIOLATION: 'COMPLIANCE_VIOLATION',
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
// SECURITY SETTINGS
// ============================================================================

export const SECURITY_SETTINGS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  MAX_LOGIN_ATTEMPTS: 5,
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
// DATABASE SETTINGS
// ============================================================================

export const DATABASE = {
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 60000, // 1 minute
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
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
    UNAUTHORIZED_ACCESS: 'Unauthorized access',
    VALIDATION_ERROR: 'Validation error',
    INVALID_INPUT: 'Invalid input provided',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    RESOURCE_NOT_FOUND: 'Resource not found',
    RESOURCE_ALREADY_EXISTS: 'Resource already exists',
    RESOURCE_CONFLICT: 'Resource conflict',
    SECURITY_THREAT_DETECTED: 'Security threat detected',
    VULNERABILITY_FOUND: 'Vulnerability found',
    COMPLIANCE_VIOLATION: 'Compliance violation',
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
"

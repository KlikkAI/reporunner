/**
 * @reporunner/constants - Shared constants for Reporunner platform
 * Centralized error codes, authentication constants, and other shared values
 */

// Error codes used throughout the platform
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REVOKED: 'TOKEN_REVOKED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // File Upload
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Security
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',

  // General
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Authentication constants
export const AUTH = {
  TOKEN_HEADER: 'Authorization',
  TOKEN_PREFIX: 'Bearer',
  SESSION_COOKIE: 'session',
  REFRESH_COOKIE: 'refresh_token',
} as const;

// HTTP Status codes (re-exported from backend for consistency)
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Type exports for better TypeScript support
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type AuthConstant = typeof AUTH[keyof typeof AUTH];
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];
export const ErrorTypes = {
  ValidationError: 'ValidationError',
  AuthenticationError: 'AuthenticationError',
  AuthorizationError: 'AuthorizationError',
  NotFoundError: 'NotFoundError',
  ConflictError: 'ConflictError',
  ServiceError: 'ServiceError',
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

export class BaseError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = type;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.ValidationError, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.AuthenticationError, 'AUTH_ERROR', details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.AuthorizationError, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.NotFoundError, 'NOT_FOUND', details);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.ConflictError, 'CONFLICT', details);
  }
}

export class ServiceError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, ErrorTypes.ServiceError, 'SERVICE_ERROR', details);
  }
}

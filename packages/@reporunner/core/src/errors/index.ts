// Base ApplicationError class for the core package
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// Extend ApplicationError for specific domain errors
export class DomainError extends ApplicationError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'DomainError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, code?: string) {
    super(message, code || 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, code || 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized access', code?: string) {
    super(message, code || 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Access forbidden', code?: string) {
    super(message, code || 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict', code?: string) {
    super(message, code || 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalError extends ApplicationError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, code || 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}

// ApplicationError is already exported above

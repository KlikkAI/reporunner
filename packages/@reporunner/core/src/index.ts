/**
 * @reporunner/core - Shared core functionality for Reporunner
 * Provides base classes, interfaces, and utilities for consistent architecture
 */

// Base classes - using existing implementations from repository and base directories
export { BaseRepository, BaseEntity, PaginatedResult, PaginationOptions, RepositoryOptions } from './repository/BaseRepository';
export { BaseService } from './base/BaseService';
export { BaseMiddleware } from './base/BaseMiddleware';
export { BaseValidationMiddleware } from './middleware/BaseValidationMiddleware';
export type { ValidationMiddlewareOptions } from './middleware/BaseValidationMiddleware';
export { Cacheable } from './decorators/Cacheable';
// Decorators
export { Injectable } from './decorators/Injectable';
export { Log } from './decorators/Log';
export { Transactional } from './decorators/Transactional';
export { Validate } from './decorators/Validate';
// Errors - from both errors/index.ts and utils/errors.ts
export {
  ConflictError,
  DomainError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
} from './errors';
export {
  AuthenticationError,
  AuthorizationError,
  BaseError,
  ErrorTypes,
  ValidationError, // Use ValidationError from utils/errors (supports details)
} from './utils/errors';
export type { ICache } from './interfaces/ICache';
export type { IEventBus } from './interfaces/IEventBus';
export type { ILogger } from './interfaces/ILogger';
export type { IMapper } from './interfaces/IMapper';
// Interfaces
export type { IRepository } from './interfaces/IRepository';
export type { IService } from './interfaces/IService';
export type { IUseCase } from './interfaces/IUseCase';
// PaginatedResult and RepositoryOptions already exported from BaseRepository above
// Common types
export type { Result } from './types/Result';
export type { ServiceDependencies } from './types/ServiceDependencies';
export { Cache } from './utils/Cache';
export { ErrorHandler } from './utils/ErrorHandler';
// Utilities
export { Logger } from './utils/logger';
export type { LogLevel, LogEntry, LoggerOptions } from './utils/logger';
export { Retry } from './utils/Retry';
export { Validator, SchemaValidator } from './utils/validation';
export type { ValidationRule, SchemaDefinition } from './utils/validation';
// Use cases
export { IfUseCase } from './use-cases/If.use-case';
export { MapUseCase } from './use-cases/Map.use-case';
export { FilterUseCase } from './use-cases/Filter.use-case';
export { CatchUseCase } from './use-cases/Catch.use-case';
export { ErrorUseCase } from './use-cases/Error.use-case';

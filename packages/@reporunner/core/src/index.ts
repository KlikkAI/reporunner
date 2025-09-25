/**
 * @reporunner/core - Shared core functionality for Reporunner
 * Provides base classes, interfaces, and utilities for consistent architecture
 */

// Base classes
export { BaseEntity } from './base/BaseEntity';
export { BaseRepository } from './base/BaseRepository';
export { BaseService } from './base/BaseService';
export { BaseController } from './base/BaseController';
export { BaseUseCase } from './base/BaseUseCase';
export { DomainEvent } from './base/DomainEvent';
export { ValueObject } from './base/ValueObject';

// Interfaces
export type { IRepository } from './interfaces/IRepository';
export type { IService } from './interfaces/IService';
export type { IUseCase } from './interfaces/IUseCase';
export type { ILogger } from './interfaces/ILogger';
export type { ICache } from './interfaces/ICache';
export type { IEventBus } from './interfaces/IEventBus';
export type { IMapper } from './interfaces/IMapper';

// Common types
export type { Result } from './types/Result';
export type { PaginatedResult } from './types/PaginatedResult';
export type { ServiceDependencies } from './types/ServiceDependencies';
export type { RepositoryOptions } from './types/RepositoryOptions';

// Utilities
export { Logger } from './utils/Logger';
export { Cache } from './utils/Cache';
export { Retry } from './utils/Retry';
export { Validator } from './utils/Validator';
export { ErrorHandler } from './utils/ErrorHandler';

// Errors
export {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
} from './errors';

// Decorators
export { Injectable } from './decorators/Injectable';
export { Transactional } from './decorators/Transactional';
export { Cacheable } from './decorators/Cacheable';
export { Validate } from './decorators/Validate';
export { Log } from './decorators/Log';

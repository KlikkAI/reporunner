/**
 * @reporunner/core - Shared core functionality for Reporunner
 * Provides base classes, interfaces, and utilities for consistent architecture
 */

export { BaseController } from './base/BaseController';
// Base classes
export { BaseEntity } from './base/BaseEntity';
export { BaseRepository } from './base/BaseRepository';
export { BaseService } from './base/BaseService';
export { BaseUseCase } from './base/BaseUseCase';
export { DomainEvent } from './base/DomainEvent';
export { ValueObject } from './base/ValueObject';
export { Cacheable } from './decorators/Cacheable';
// Decorators
export { Injectable } from './decorators/Injectable';
export { Log } from './decorators/Log';
export { Transactional } from './decorators/Transactional';
export { Validate } from './decorators/Validate';
// Errors
export {
  ConflictError,
  DomainError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors';
export type { ICache } from './interfaces/ICache';
export type { IEventBus } from './interfaces/IEventBus';
export type { ILogger } from './interfaces/ILogger';
export type { IMapper } from './interfaces/IMapper';
// Interfaces
export type { IRepository } from './interfaces/IRepository';
export type { IService } from './interfaces/IService';
export type { IUseCase } from './interfaces/IUseCase';
export type { PaginatedResult } from './types/PaginatedResult';
export type { RepositoryOptions } from './types/RepositoryOptions';
// Common types
export type { Result } from './types/Result';
export type { ServiceDependencies } from './types/ServiceDependencies';
export { Cache } from './utils/Cache';
export { ErrorHandler } from './utils/ErrorHandler';
// Utilities
export { Logger } from './utils/Logger';
export { Retry } from './utils/Retry';
export { Validator } from './utils/Validator';
// Use cases
export { IfUseCase } from './use-cases/If.use-case';
export { MapUseCase } from './use-cases/Map.use-case';
export { FilterUseCase } from './use-cases/Filter.use-case';
export { CatchUseCase } from './use-cases/Catch.use-case';
export { ErrorUseCase } from './use-cases/Error.use-case';

import { IBaseRepository } from '../repository/base-repository.interface';
import { Filter, Pagination, Sort } from '../types/repository.types';
import { EventBus } from '../events/event-bus';
import { IValidator } from '../validation/validator';
import { IBaseService, ServiceResult, IDomainEvent } from './base-service.interface';

/**
 * Base service class that provides common CRUD operations and business logic
 * abstractions for all services in the system.
 */
export abstract class BaseService<T, ID = string> implements IBaseService<T, ID> {
  protected readonly eventBus: EventBus;

  constructor(
    protected readonly repository: IBaseRepository<T, ID>,
    protected readonly validator?: IValidator<T>
  ) {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Create a successful service result
   */
  protected success<R>(data: R, metadata?: Record<string, any>): ServiceResult<R> {
    return {
      success: true,
      data,
      metadata
    };
  }

  /**
   * Create a failed service result
   */
  protected failure<R>(error: Error, metadata?: Record<string, any>): ServiceResult<R> {
    return {
      success: false,
      error,
      metadata
    };
  }

  /**
   * Execute operation with error handling
   */
  protected async execute<R>(operation: () => Promise<R>): Promise<ServiceResult<R>> {
    try {
      const result = await operation();
      return this.success(result);
    } catch (error) {
      return this.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Publish domain event
   */
  protected async publishEvent(event: IDomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
  
  /**
   * Find an entity by ID
   */
  async getById(id: ID): Promise<ServiceResult<T>> {
    return this.execute(async () => {
      const entity = await this.repository.findById(id);
      if (!entity) {
        throw new Error(`Entity with ID ${String(id)} not found`);
      }
      return entity;
    });
  }
  
  /**
   * Find one entity matching the filter
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    return this.repository.findOne(filter);
  }
  
  /**
   * Find all entities matching the criteria
   */
  async find(filter?: Filter<T>, sort?: Sort<T>, pagination?: Pagination): Promise<ServiceResult<T[]>> {
    return this.execute(() => this.repository.find(filter, sort, pagination));
  }
  
  /**
   * Count entities matching the filter
   */
  async count(filter?: Filter<T>): Promise<ServiceResult<number>> {
    return this.execute(() => this.repository.count(filter));
  }
  
  /**
   * Create a new entity
   */
  async create(data: Partial<T>): Promise<ServiceResult<T>> {
    return this.execute(async () => {
      // Validate using validator if provided
      if (this.validator) {
        const validationResult = await this.validator.validate(data);
        if (!validationResult.valid) {
          throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      await this.validateCreate(data);
      const entity = await this.repository.create(data);
      await this.afterCreate(entity);
      
      return entity;
    });
  }
  
  /**
   * Create multiple entities
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    for (const item of data) {
      await this.validateCreate(item);
    }
    const entities = await this.repository.createMany(data);
    for (const entity of entities) {
      await this.afterCreate(entity);
    }
    return entities;
  }
  
  /**
   * Update an entity
   */
  async update(id: ID, data: Partial<T>): Promise<ServiceResult<T>> {
    return this.execute(async () => {
      // Validate using validator if provided
      if (this.validator) {
        const validationResult = await this.validator.validate(data);
        if (!validationResult.valid) {
          throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      await this.validateUpdate(id, data);
      const entity = await this.repository.update(id, data);
      await this.afterUpdate(entity);
      
      return entity;
    });
  }
  
  /**
   * Update multiple entities
   */
  async updateMany(filter: Filter<T>, data: Partial<T>): Promise<number> {
    await this.validateUpdateMany(filter, data);
    return this.repository.updateMany(filter, data);
  }
  
  /**
   * Delete an entity
   */
  async delete(id: ID): Promise<ServiceResult<boolean>> {
    return this.execute(async () => {
      await this.validateDelete(id);
      const result = await this.repository.delete(id);
      if (result) {
        await this.afterDelete(id);
      }
      return result;
    });
  }
  
  /**
   * Delete multiple entities
   */
  async deleteMany(filter: Filter<T>): Promise<number> {
    await this.validateDeleteMany(filter);
    return this.repository.deleteMany(filter);
  }
  
  /**
   * Check if an entity exists
   */
  async exists(id: ID): Promise<ServiceResult<boolean>> {
    return this.execute(() => this.repository.exists({ _id: id } as any));
  }
  
  /**
   * Hook for validating entity creation
   */
  protected async validateCreate(data: Partial<T>): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook called after entity creation
   */
  protected async afterCreate(entity: T): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook for validating entity updates
   */
  protected async validateUpdate(id: ID, data: Partial<T>): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook for validating bulk updates
   */
  protected async validateUpdateMany(filter: Filter<T>, data: Partial<T>): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook for validating entity deletion
   */
  protected async validateDelete(id: ID): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook for validating bulk deletion
   */
  protected async validateDeleteMany(filter: Filter<T>): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Hook called after entity deletion
   */
  protected async afterDelete(id: ID): Promise<void> {
    // Override in concrete implementations
  }
  
  /**
   * Execute operations in a transaction
   */
  protected async withTransaction<R>(operation: () => Promise<R>): Promise<R> {
    await this.repository.beginTransaction();
    try {
      const result = await operation();
      await this.repository.commitTransaction();
      return result;
    } catch (error) {
      await this.repository.rollbackTransaction();
      throw error;
    }
  }
}
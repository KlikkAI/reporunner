import type { ICache } from '../interfaces/ICache';
import type { Filter } from '../types';
import { BaseRepository } from './base-repository';

/**
 * Abstract base class for repositories that support caching.
 * Extends the base repository with caching capabilities.
 */
export abstract class CachedRepository<T, ID = string> extends BaseRepository<T, ID> {
  constructor(
    protected readonly cache: ICache,
    protected readonly cacheTtl: number = 3600, // Default 1 hour
    protected readonly cachePrefix: string = 'entity'
  ) {
    super();
  }

  /**
   * Convert entity to string for caching
   */
  protected abstract serialize(entity: T): string;

  /**
   * Convert cached string back to entity
   */
  protected abstract deserialize(data: string): T;

  /**
   * Get cache key for an entity
   */
  protected getCacheKey(id: ID): string {
    return `${this.cachePrefix}:${id}`;
  }

  /**
   * Get entity from cache
   */
  protected async getFromCache(id: ID): Promise<T | null> {
    try {
      const key = this.getCacheKey(id);
      const cached = await this.cache.get(key);
      return cached ? this.deserialize(cached as string) : null;
    } catch (_error) {
      return null; // Cache failures shouldn't break the app
    }
  }

  /**
   * Save entity to cache
   */
  protected async saveToCache(id: ID, entity: T): Promise<void> {
    try {
      const key = this.getCacheKey(id);
      const value = this.serialize(entity);
      await this.cache.setex(key, this.cacheTtl, value);
    } catch (_error) {
      // Cache failures shouldn't break the app
    }
  }

  /**
   * Invalidate entity in cache
   */
  protected async invalidateCache(id: ID): Promise<void> {
    try {
      const key = this.getCacheKey(id);
      await this.cache.del(key);
    } catch (_error) {
      // Cache failures shouldn't break the app
    }
  }

  /**
   * Get multiple entities from cache
   */
  protected async getManyFromCache(ids: ID[]): Promise<Map<ID, T>> {
    try {
      const keys = ids.map((id) => this.getCacheKey(id));
      const values = await this.cache.mget(keys);

      const result = new Map<ID, T>();
      values.forEach((value, index) => {
        if (value) {
          result.set(ids[index], this.deserialize(value as string));
        }
      });

      return result;
    } catch (_error) {
      return new Map(); // Cache failures shouldn't break the app
    }
  }

  /**
   * Save multiple entities to cache
   */
  protected async saveManyToCache(entities: T[]): Promise<void> {
    try {
      await Promise.all(entities.map((entity) => this.saveToCache(this.getId(entity), entity)));
    } catch (_error) {
      // Cache failures shouldn't break the app
    }
  }

  /**
   * Invalidate multiple entities in cache
   */
  protected async invalidateManyCache(ids: ID[]): Promise<void> {
    try {
      const keys = ids.map((id) => this.getCacheKey(id));
      await this.cache.delMany(keys);
    } catch (_error) {
      // Cache failures shouldn't break the app
    }
  }

  /**
   * Get ID from entity
   */
  protected abstract getId(entity: T): ID;

  // Override base repository methods to add caching

  async findById(id: ID): Promise<T | null> {
    const cached = await this.getFromCache(id);
    if (cached) {
      return cached;
    }

    // Call the concrete implementation instead of super
    const entity = await this.findByIdImpl(id);
    if (entity) {
      await this.saveToCache(id, entity);
    }

    return entity;
  }

  // Abstract method to be implemented by concrete classes
  protected abstract findByIdImpl(id: ID): Promise<T | null>;

  async create(data: Partial<T>): Promise<T> {
    const entity = await this.createImpl(data);
    await this.saveToCache(this.getId(entity), entity);
    return entity;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const entities = await this.createManyImpl(data);
    await this.saveManyToCache(entities);
    return entities;
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    const entity = await this.updateImpl(id, data);
    await this.saveToCache(id, entity);
    return entity;
  }

  async updateMany(filter: Filter<T>, data: Partial<T>): Promise<number> {
    // Since we don't know which specific entities were updated,
    // we can't effectively manage the cache for bulk updates
    const count = await this.updateManyImpl(filter, data);
    return count;
  }

  async delete(id: ID): Promise<boolean> {
    const result = await this.deleteImpl(id);
    if (result) {
      await this.invalidateCache(id);
    }
    return result;
  }

  async deleteMany(filter: Filter<T>): Promise<number> {
    // Since we don't know which specific entities were deleted,
    // we can't effectively manage the cache for bulk deletes
    const count = await this.deleteManyImpl(filter);
    return count;
  }

  // Abstract methods that concrete implementations must provide
  protected abstract createImpl(data: Partial<T>): Promise<T>;
  protected abstract createManyImpl(data: Partial<T>[]): Promise<T[]>;
  protected abstract updateImpl(id: ID, data: Partial<T>): Promise<T>;
  protected abstract updateManyImpl(filter: Filter<T>, data: Partial<T>): Promise<number>;
  protected abstract deleteImpl(id: ID): Promise<boolean>;
  protected abstract deleteManyImpl(filter: Filter<T>): Promise<number>;
}

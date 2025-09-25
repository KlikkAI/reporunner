import { Collection, Db, Filter, FindOptions, Document } from 'mongodb';
import { RedisCache } from '../infrastructure/cache/redis-cache';
import { logger } from '../utils/logger';

export interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Filter<any>, options?: FindOptions): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filter?: Filter<any>): Promise<number>;
}

export interface EntityMapper<T, D> {
  toDomain(document: D): T;
  toPersistence(entity: T): D;
}

export abstract class BaseRepository<T extends { id: string }, D extends Document>
  implements Repository<T>
{
  protected collection: Collection<D>;
  protected readonly CACHE_TTL = 3600; // 1 hour default
  protected readonly CACHE_PREFIX: string;

  constructor(
    protected readonly db: Db,
    protected readonly cache: RedisCache,
    protected readonly collectionName: string,
    protected readonly mapper: EntityMapper<T, D>,
    cachePrefix?: string
  ) {
    this.collection = db.collection<D>(collectionName);
    this.CACHE_PREFIX = cachePrefix || collectionName;
    this.ensureIndexes();
  }

  // Abstract method for child classes to implement their specific indexes
  protected abstract ensureIndexes(): Promise<void>;

  // Common repository methods

  async findById(id: string): Promise<T | null> {
    try {
      // Try cache first
      const cached = await this.getFromCache(id);
      if (cached) return cached;

      // Query database
      const document = await this.collection.findOne({ _id: id } as any);
      if (!document) return null;

      // Map to domain entity
      const entity = this.mapper.toDomain(document);

      // Cache the result
      await this.saveToCache(id, entity);

      return entity;
    } catch (error) {
      logger.error(`Failed to find ${this.collectionName} by ID: ${id}`, error);
      throw error;
    }
  }

  async findAll(filter?: Filter<D>, options?: FindOptions): Promise<T[]> {
    try {
      const cursor = this.collection.find(filter || {}, options);
      const documents = await cursor.toArray();
      return documents.map((doc) => this.mapper.toDomain(doc));
    } catch (error) {
      logger.error(`Failed to find ${this.collectionName}`, error);
      throw error;
    }
  }

  async save(entity: T): Promise<void> {
    try {
      const document = this.mapper.toPersistence(entity);

      await this.collection.replaceOne({ _id: entity.id } as any, document, { upsert: true });

      // Invalidate cache
      await this.invalidateCache(entity.id);

      logger.debug(`${this.collectionName} saved: ${entity.id}`);
    } catch (error) {
      logger.error(`Failed to save ${this.collectionName}: ${entity.id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ _id: id } as any);

      // Invalidate cache
      await this.invalidateCache(id);

      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete ${this.collectionName}: ${id}`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({ _id: id } as any);
      return count > 0;
    } catch (error) {
      logger.error(`Failed to check ${this.collectionName} existence: ${id}`, error);
      throw error;
    }
  }

  async count(filter?: Filter<D>): Promise<number> {
    try {
      return await this.collection.countDocuments(filter || {});
    } catch (error) {
      logger.error(`Failed to count ${this.collectionName}`, error);
      throw error;
    }
  }

  // Cache management methods

  protected async getFromCache(id: string): Promise<T | null> {
    if (!this.cache.isConnected()) return null;

    try {
      const key = this.getCacheKey(id);
      const cached = await this.cache.get(key);

      if (cached) {
        logger.debug(`Cache hit for ${this.collectionName}: ${id}`);
        const document = JSON.parse(cached);
        return this.mapper.toDomain(document);
      }

      return null;
    } catch (error) {
      logger.warn(`Failed to get ${this.collectionName} from cache: ${id}`, error);
      return null;
    }
  }

  protected async saveToCache(id: string, entity: T): Promise<void> {
    if (!this.cache.isConnected()) return;

    try {
      const key = this.getCacheKey(id);
      const document = this.mapper.toPersistence(entity);
      const value = JSON.stringify(document);

      await this.cache.setex(key, this.CACHE_TTL, value);
      logger.debug(`${this.collectionName} cached: ${id}`);
    } catch (error) {
      logger.warn(`Failed to cache ${this.collectionName}: ${id}`, error);
    }
  }

  protected async invalidateCache(id: string): Promise<void> {
    if (!this.cache.isConnected()) return;

    try {
      const key = this.getCacheKey(id);
      await this.cache.del(key);
      logger.debug(`Cache invalidated for ${this.collectionName}: ${id}`);
    } catch (error) {
      logger.warn(`Failed to invalidate cache for ${this.collectionName}: ${id}`, error);
    }
  }

  protected getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}:${id}`;
  }

  // Batch operations for performance

  async saveMany(entities: T[]): Promise<void> {
    if (entities.length === 0) return;

    try {
      const documents = entities.map((e) => this.mapper.toPersistence(e));

      const operations = documents.map((doc) => ({
        replaceOne: {
          filter: { _id: (doc as any)._id },
          replacement: doc,
          upsert: true,
        },
      }));

      await this.collection.bulkWrite(operations as any);

      // Invalidate cache for all
      await Promise.all(entities.map((e) => this.invalidateCache(e.id)));

      logger.debug(`Batch saved ${entities.length} ${this.collectionName}`);
    } catch (error) {
      logger.error(`Failed to batch save ${this.collectionName}`, error);
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];

    try {
      // Try to get from cache first
      const cached = await Promise.all(ids.map((id) => this.getFromCache(id)));
      const cachedEntities = cached.filter((e) => e !== null) as T[];
      const cachedIds = new Set(cachedEntities.map((e) => e.id));

      // Get missing from database
      const missingIds = ids.filter((id) => !cachedIds.has(id));

      if (missingIds.length === 0) {
        return cachedEntities;
      }

      const documents = await this.collection.find({ _id: { $in: missingIds } } as any).toArray();

      const dbEntities = documents.map((doc) => this.mapper.toDomain(doc));

      // Cache the database results
      await Promise.all(dbEntities.map((e) => this.saveToCache(e.id, e)));

      return [...cachedEntities, ...dbEntities];
    } catch (error) {
      logger.error(`Failed to find ${this.collectionName} by IDs`, error);
      throw error;
    }
  }

  // Pagination helper

  async findPaginated(
    filter: Filter<D>,
    page: number,
    limit: number,
    sort?: Record<string, 1 | -1>
  ): Promise<{ items: T[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const sortOption = sort || { createdAt: -1 };

      const [documents, total] = await Promise.all([
        this.collection
          .find(filter)
          .sort(sortOption as any)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(filter),
      ]);

      const items = documents.map((doc) => this.mapper.toDomain(doc));

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`Failed to find paginated ${this.collectionName}`, error);
      throw error;
    }
  }
}

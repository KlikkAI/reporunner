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
  implements Repository<T> {
  
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
      return documents.map(doc => this.mapper.toDomain(doc));
    } catch (error) {
      logger.error(`Failed to find ${this.collectionName}`, error);
      throw error;
    }
  }

  async save(entity: T): Promise<void> {
    try {
      const document = this.mapper.toPersistence(entity);
      
      await this.collection.replaceOne(
        { _id: entity.id } as any,
        document,
        { upsert: true }
      );

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

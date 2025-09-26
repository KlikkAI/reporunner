import type { Collection, Db, Filter, FindOptions } from 'mongodb';
import { TenantMapper } from '../../application/mappers/tenant.mapper';
import type { Tenant } from '../../domain/entities/tenant.entity';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import { logger } from '../../shared/utils/logger';
import type { RedisCache } from '../cache/redis-cache';

export class MongoTenantRepository implements TenantRepository {
  private readonly collection: Collection;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'tenant';

  constructor(
    private readonly db: Db,
    private readonly cache: RedisCache
  ) {
    this.collection = db.collection('tenants');
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ organizationId: 1 }, { unique: true });
      await this.collection.createIndex({ slug: 1 }, { unique: true });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ createdAt: -1 });
      await this.collection.createIndex({ 'plan.type': 1 });
      await this.collection.createIndex({ name: 'text' });

      logger.info('Tenant collection indexes created');
    } catch (error) {
      logger.error('Failed to create tenant indexes', error);
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    try {
      // Check cache first
      const cached = await this.getFromCache(id);
      if (cached) return cached;

      // Query database
      const document = await this.collection.findOne({ _id: id });
      if (!document) return null;

      // Map to domain entity
      const tenant = TenantMapper.toDomain(document);

      // Cache the result
      await this.saveToCache(id, tenant);

      return tenant;
    } catch (error) {
      logger.error(`Failed to find tenant by ID: ${id}`, error);
      throw error;
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Tenant | null> {
    try {
      const document = await this.collection.findOne({ organizationId });
      return document ? TenantMapper.toDomain(document) : null;
    } catch (error) {
      logger.error(`Failed to find tenant by organization ID: ${organizationId}`, error);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    try {
      const document = await this.collection.findOne({ slug });
      return document ? TenantMapper.toDomain(document) : null;
    } catch (error) {
      logger.error(`Failed to find tenant by slug: ${slug}`, error);
      throw error;
    }
  }

  async findAll(filter?: Filter<any>, options?: FindOptions): Promise<Tenant[]> {
    try {
      const cursor = this.collection.find(filter || {}, options);
      const documents = await cursor.toArray();
      return documents.map((doc) => TenantMapper.toDomain(doc));
    } catch (error) {
      logger.error('Failed to find tenants', error);
      throw error;
    }
  }

  async save(tenant: Tenant): Promise<void> {
    try {
      const document = TenantMapper.toPersistence(tenant);

      await this.collection.replaceOne({ _id: tenant.id }, document, { upsert: true });

      // Invalidate cache
      await this.invalidateCache(tenant.id);

      logger.debug(`Tenant saved: ${tenant.id}`);
    } catch (error) {
      logger.error(`Failed to save tenant: ${tenant.id}`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ _id: id });

      // Invalidate cache
      await this.invalidateCache(id);

      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete tenant: ${id}`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error(`Failed to check tenant existence: ${id}`, error);
      throw error;
    }
  }

  async count(filter?: Filter<any>): Promise<number> {
    try {
      return await this.collection.countDocuments(filter || {});
    } catch (error) {
      logger.error('Failed to count tenants', error);
      throw error;
    }
  }

  // Cache management methods

  private async getFromCache(id: string): Promise<Tenant | null> {
    try {
      const key = this.getCacheKey(id);
      const cached = await this.cache.get(key);

      if (cached) {
        logger.debug(`Cache hit for tenant: ${id}`);
        return TenantMapper.toDomain(JSON.parse(cached));
      }

      return null;
    } catch (error) {
      logger.warn(`Failed to get tenant from cache: ${id}`, error);
      return null;
    }
  }

  private async saveToCache(id: string, tenant: Tenant): Promise<void> {
    try {
      const key = this.getCacheKey(id);
      const value = JSON.stringify(TenantMapper.toPersistence(tenant));

      await this.cache.setex(key, this.CACHE_TTL, value);
      logger.debug(`Tenant cached: ${id}`);
    } catch (error) {
      logger.warn(`Failed to cache tenant: ${id}`, error);
    }
  }

  private async invalidateCache(id: string): Promise<void> {
    try {
      const key = this.getCacheKey(id);
      await this.cache.del(key);
      logger.debug(`Cache invalidated for tenant: ${id}`);
    } catch (error) {
      logger.warn(`Failed to invalidate cache for tenant: ${id}`, error);
    }
  }

  private getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}:${id}`;
  }

  // Batch operations for performance

  async saveMany(tenants: Tenant[]): Promise<void> {
    try {
      const documents = tenants.map((t) => TenantMapper.toPersistence(t));

      const operations = documents.map((doc) => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true,
        },
      }));

      await this.collection.bulkWrite(operations);

      // Invalidate cache for all
      await Promise.all(tenants.map((t) => this.invalidateCache(t.id)));

      logger.debug(`Batch saved ${tenants.length} tenants`);
    } catch (error) {
      logger.error('Failed to batch save tenants', error);
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<Tenant[]> {
    try {
      // Try to get from cache first
      const cached = await Promise.all(ids.map((id) => this.getFromCache(id)));
      const cachedTenants = cached.filter((t) => t !== null) as Tenant[];
      const cachedIds = new Set(cachedTenants.map((t) => t.id));

      // Get missing from database
      const missingIds = ids.filter((id) => !cachedIds.has(id));

      if (missingIds.length === 0) {
        return cachedTenants;
      }

      const documents = await this.collection.find({ _id: { $in: missingIds } }).toArray();

      const dbTenants = documents.map((doc) => TenantMapper.toDomain(doc));

      // Cache the database results
      await Promise.all(dbTenants.map((t) => this.saveToCache(t.id, t)));

      return [...cachedTenants, ...dbTenants];
    } catch (error) {
      logger.error('Failed to find tenants by IDs', error);
      throw error;
    }
  }
}

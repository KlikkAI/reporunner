import { Db, Collection, Filter, FindOptions } from 'mongodb';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantMapper } from '../../application/mappers/tenant.mapper';
import { RedisCache } from '../cache/redis-cache';
import { logger } from '../../shared/utils/logger';

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
      return documents.map(doc => TenantMapper.toDomain(doc));
    } catch (error) {
      logger.error('Failed to find tenants', error);
      throw error;
    }
  }

  async save(tenant: Tenant): Promise<void> {
    try {
      const document = TenantMapper.toPersistence(tenant);
      
      await this.collection.replaceOne(
        { _id: tenant.id },
        document,
        { upsert: true }
      );

// Invalidate cache

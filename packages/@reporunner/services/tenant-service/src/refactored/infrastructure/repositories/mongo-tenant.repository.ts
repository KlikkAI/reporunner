import { CachedMongoDBRepository } from '@reporunner/core/src/repository/mongodb/cached-mongodb-repository';
import { ICache } from '@reporunner/core/src/cache/cache.interface';
import { Collection, Db, ObjectId } from 'mongodb';
import { TenantMapper } from '../../application/mappers/tenant.mapper';
import type { Tenant } from '../../domain/entities/tenant.entity';
import type { TenantRepository } from '../../domain/repositories/tenant.repository';
import { logger } from '../../shared/utils/logger';
import type { RedisCache } from '../cache/redis-cache';

export class MongoTenantRepository extends CachedMongoDBRepository<Tenant> implements TenantRepository {
  protected readonly entityName = 'Tenant';

  constructor(
    db: Db,
    cache: ICache
  ) {
    super(
      db.collection('tenants'),
      cache,
      3600, // 1 hour TTL
      'tenant' // Cache prefix
    );
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

  async findByOrganizationId(organizationId: string): Promise<Tenant | null> {
    return this.findOne({ organizationId });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.findOne({ slug });
  }

  async findAll(filter?: Filter<any>, options?: FindOptions): Promise<Tenant[]> {
    return this.find(filter || {}, options?.sort, options?.skip ? { skip: options.skip, limit: options.limit || 0 } : undefined);
  }

  // Override create to enforce unique constraints
  protected async validateCreate(data: Partial<Tenant>): Promise<void> {
    await super.validateCreate(data);

    const existingSlug = await this.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new Error(`Tenant with slug ${data.slug} already exists`);
    }

    const existingOrg = await this.findOne({ organizationId: data.organizationId });
    if (existingOrg) {
      throw new Error(`Tenant for organization ${data.organizationId} already exists`);
    }
  }

  // Domain-specific batch operations
  async saveMany(tenants: Tenant[]): Promise<void> {
    // Validate unique constraints
    for (const tenant of tenants) {
      await this.validateCreate(tenant);
    }

    // Use base repository createMany
    await this.createMany(tenants);
  }

  async findByIds(ids: string[]): Promise<Tenant[]> {
    // Use the base repository's find with optimized caching
    return this.find({
      _id: { $in: ids.map(id => this.toObjectId(id)) }
    });
}

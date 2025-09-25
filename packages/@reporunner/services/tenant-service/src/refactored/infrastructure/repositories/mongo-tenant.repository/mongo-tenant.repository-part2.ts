await this.invalidateCache(tenant.id);

logger.debug(`Tenant saved: ${tenant.id}`);
} catch (error)
{
  logger.error(`Failed to save tenant: ${tenant.id}`, error);
  throw error;
}
}

  async delete(id: string): Promise<boolean>
{
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

async;
exists(id: string)
: Promise<boolean>
{
  try {
    const count = await this.collection.countDocuments({ _id: id });
    return count > 0;
  } catch (error) {
    logger.error(`Failed to check tenant existence: ${id}`, error);
    throw error;
  }
}

async;
count(filter?: Filter<any>)
: Promise<number>
{
  try {
    return await this.collection.countDocuments(filter || {});
  } catch (error) {
    logger.error('Failed to count tenants', error);
    throw error;
  }
}

// Cache management methods

private
async;
getFromCache(id: string)
: Promise<Tenant | null>
{
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

private
async;
saveToCache(id: string, tenant: Tenant)
: Promise<void>
{
  try {
    const key = this.getCacheKey(id);
    const value = JSON.stringify(TenantMapper.toPersistence(tenant));

    await this.cache.setex(key, this.CACHE_TTL, value);
    logger.debug(`Tenant cached: ${id}`);
  } catch (error) {
    logger.warn(`Failed to cache tenant: ${id}`, error);
  }
}

private
async;
invalidateCache(id: string)
: Promise<void>
{
  try {
    const key = this.getCacheKey(id);
    await this.cache.del(key);
    logger.debug(`Cache invalidated for tenant: ${id}`);
  } catch (error) {
    logger.warn(`Failed to invalidate cache for tenant: ${id}`, error);
  }
}

private
getCacheKey(id: string)
: string
{
  return `${this.CACHE_PREFIX}:${id}`;
}

// Batch operations for performance

async;
saveMany(tenants: Tenant[])
: Promise<void>
{
    try {
      const documents = tenants.map(t => TenantMapper.toPersistence(t));
      
      const operations = documents.map(doc => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));

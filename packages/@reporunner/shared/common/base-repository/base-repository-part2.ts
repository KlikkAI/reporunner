// Invalidate cache
await this.invalidateCache(id);

return result.deletedCount > 0;
} catch (error)
{
  logger.error(`Failed to delete ${this.collectionName}: ${id}`, error);
  throw error;
}
}

  async exists(id: string): Promise<boolean>
{
  try {
    const count = await this.collection.countDocuments({ _id: id } as any);
    return count > 0;
  } catch (error) {
    logger.error(`Failed to check ${this.collectionName} existence: ${id}`, error);
    throw error;
  }
}

async;
count(filter?: Filter<D>)
: Promise<number>
{
  try {
    return await this.collection.countDocuments(filter || {});
  } catch (error) {
    logger.error(`Failed to count ${this.collectionName}`, error);
    throw error;
  }
}

// Cache management methods

protected
async;
getFromCache(id: string)
: Promise<T | null>
{
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

protected
async;
saveToCache(id: string, entity: T)
: Promise<void>
{
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

protected
async;
invalidateCache(id: string)
: Promise<void>
{
  if (!this.cache.isConnected()) return;

  try {
    const key = this.getCacheKey(id);
    await this.cache.del(key);
    logger.debug(`Cache invalidated for ${this.collectionName}: ${id}`);
  } catch (error) {
    logger.warn(`Failed to invalidate cache for ${this.collectionName}: ${id}`, error);
  }
}

protected
getCacheKey(id: string)
: string
{
  return `${this.CACHE_PREFIX}:${id}`;
}

// Batch operations for performance

async;
saveMany(entities: T[])
: Promise<void>
{
    if (entities.length === 0) return;
    
    try {
      const documents = entities.map(e => this.mapper.toPersistence(e));
      
      const operations = documents.map(doc => ({
        replaceOne: {
          filter: { _id: (doc as any)._id },
          replacement: doc,
          upsert: true
        }
      }));
      
      await this.collection.bulkWrite(operations as any);

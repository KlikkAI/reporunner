// Invalidate cache for all
await Promise.all(entities.map((e) => this.invalidateCache(e.id)));

logger.debug(`Batch saved ${entities.length} ${this.collectionName}`);
} catch (error)
{
  logger.error(`Failed to batch save ${this.collectionName}`, error);
  throw error;
}
}

  async findByIds(ids: string[]): Promise<T[]>
{
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

async;
findPaginated(
    filter: Filter<D>,
    page: number,
    limit: number,
    sort?: Record<string, 1 | -1>
  )
: Promise<
{
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
>
{
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
        totalPages: Math.ceil(total / limit)
      };
  } catch (error) {
    logger.error(`Failed to find paginated ${this.collectionName}`, error);
    throw error;
  }
}
}

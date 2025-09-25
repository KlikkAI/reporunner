await this.collection.bulkWrite(operations);

// Invalidate cache for all
await Promise.all(tenants.map((t) => this.invalidateCache(t.id)));

logger.debug(`Batch saved ${tenants.length} tenants`);
} catch (error)
{
  logger.error('Failed to batch save tenants', error);
  throw error;
}
}

  async findByIds(ids: string[]): Promise<Tenant[]>
{
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

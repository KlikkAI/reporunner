if (cached) {
  return JSON.parse(cached);
}

const tenant = await this.database.findOne(this.TENANTS_COLLECTION, { id });

if (tenant) {
  await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenant));
}

return tenant;
} catch (error)
{
  logger.error('Failed to get tenant:', error);
  throw new Error(`Failed to get tenant: ${error.message}`);
}
}

  async getTenantByDomain(domain: string): Promise<Tenant | null>
{
  try {
    const cacheKey = `tenant:domain:${domain}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const tenant = await this.database.findOne(this.TENANTS_COLLECTION, {
      $or: [{ domain }, { subdomain: domain }],
    });

    if (tenant) {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenant));
    }

    return tenant;
  } catch (error) {
    logger.error('Failed to get tenant by domain:', error);
    throw new Error(`Failed to get tenant by domain: ${error.message}`);
  }
}

async;
updateTenant(id: string, updates: Partial<Tenant>)
: Promise<void>
{
  try {
    const tenant = await this.getTenant(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = {
      ...updates,
      updatedAt: new Date(),
    };

    await this.database.updateOne(this.TENANTS_COLLECTION, { id }, updatedTenant);

    // Clear cache
    await this.clearTenantCache(id);

    logger.info(`Tenant ${id} updated successfully`);
    this.eventBus.emit('tenant.updated', { id, updates });
  } catch (error) {
    logger.error('Failed to update tenant:', error);
    throw new Error(`Failed to update tenant: ${error.message}`);
  }
}

async;
suspendTenant(id: string, reason: string)
: Promise<void>
{
  try {
    await this.updateTenant(id, {
      status: 'suspended',
      metadata: {
        ...((await this.getTenant(id))?.metadata || {}),
        suspension_reason: reason,
        suspended_at: new Date(),
      },
    });

    // Revoke all active sessions
    await this.revokeAllSessions(id);

    logger.info(`Tenant ${id} suspended: ${reason}`);
    this.eventBus.emit('tenant.suspended', { id, reason });
  } catch (error) {
    logger.error('Failed to suspend tenant:', error);
    throw new Error(`Failed to suspend tenant: ${error.message}`);
  }
}

async;
deleteTenant(id: string)
: Promise<void>
{
    try {
      const tenant = await this.getTenant(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

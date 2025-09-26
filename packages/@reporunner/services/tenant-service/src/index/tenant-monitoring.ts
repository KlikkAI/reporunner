{
  name: 'storage', current;
  : tenant.usage.storageUsedGB, max: tenant.limits.storageGB
}
,
{
  name: 'apiCalls', current;
  : tenant.usage.apiCallsThisMonth, max: tenant.limits.apiCallsPerMonth
}
,
      ]

for (const check of checks) {
  const percentage = (check.current / check.max) * 100;

  if (check.current > check.max) {
    violations.push({
      limit: check.name,
      current: check.current,
      max: check.max,
      percentage,
    });
  } else if (percentage >= 80) {
    // Warning at 80%
    warnings.push({
      limit: check.name,
      current: check.current,
      max: check.max,
      percentage,
    });
  }
}

return {
        withinLimits: violations.length === 0,
        violations,
        warnings,
      };
} catch (error)
{
  logger.error('Failed to check limits:', error);
  throw new Error(`Failed to check limits: ${error.message}`);
}
}

  async getUsageMetrics(
    tenantId: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    days: number = 30
  ): Promise<UsageMetrics[]>
{
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.database.findMany(
        this.USAGE_COLLECTION,
        {
          tenantId,
          period,
          date: { $gte: startDate },
        },
        {
          sort: { date: -1 },
          limit: days,
        }
      );
  } catch (error) {
    logger.error('Failed to get usage metrics:', error);
    throw new Error(`Failed to get usage metrics: ${error.message}`);
  }
}

async;
createBackup(tenantId: string, type: 'manual' | 'scheduled' | 'migration')
: Promise<string>
{
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const backup: TenantBackup = {
        id: this.generateId(),
        tenantId,
        type,
        status: 'pending',
        size_bytes: 0,
        storage_location: `backups/${tenantId}/${Date.now()}`,
        encryption_key_id: tenant.isolation.encryption_key_id,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        metadata: {
          workflows_count: 0,
          users_count: 0,
          executions_count: 0,
          version: '1.0.0',
        },
      };

      await this.database.create(this.BACKUPS_COLLECTION, backup);

      // Schedule backup job
      await this.tenantQueue.add('create-tenant-backup', {
        backupId: backup.id,
        tenantId,
      });

      logger.info(`Backup ${backup.id} initiated for tenant ${tenantId}`);
      this.eventBus.emit('tenant.backup.started', { tenantId, backup });

      return backup.id;
    } catch (error) {

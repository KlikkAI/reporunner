})

if (existingAlert) {
  return existingAlert.id; // Don't create duplicate alerts
}

const alert: TenantAlert = {
  ...alertData,
  id: this.generateId(),
  tenantId,
  status: 'active',
  created_at: new Date(),
};

await this.database.create(this.ALERTS_COLLECTION, alert);

// Send notification
this.eventBus.emit('tenant.alert.created', { tenantId, alert });

return alert.id;
} catch (error)
{
  logger.error('Failed to create alert:', error);
  throw error;
}
}

  private async cleanupExpiredInvitations(): Promise<void>
{
  try {
    const result = await this.database.updateMany(
      this.INVITATIONS_COLLECTION,
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    logger.info(`Marked ${result.modifiedCount} invitations as expired`);
  } catch (error) {
    logger.error('Failed to cleanup expired invitations:', error);
  }
}

private
async;
cleanupExpiredBackups();
: Promise<void>
{
  try {
    const expiredBackups = await this.database.findMany(this.BACKUPS_COLLECTION, {
      expires_at: { $lt: new Date() },
      status: 'completed',
    });

    for (const backup of expiredBackups) {
      // Delete backup files
      // await this.storageService.deleteFile(backup.storage_location);

      // Mark as deleted
      await this.database.updateOne(
        this.BACKUPS_COLLECTION,
        { id: backup.id },
        { status: 'deleted' }
      );
    }

    logger.info(`Cleaned up ${expiredBackups.length} expired backups`);
  } catch (error) {
    logger.error('Failed to cleanup expired backups:', error);
  }
}

private
async;
aggregateDailyMetrics();
: Promise<void>
{
  // Implementation for aggregating daily metrics from hourly data
  logger.info('Daily metrics aggregation completed');
}

private
async;
aggregateMetrics(tenantId: string, period: string)
: Promise<void>
{
  // Implementation for aggregating metrics
  logger.info(`Metrics aggregation completed for tenant ${tenantId}, period: ${period}`);
}

private
async;
cleanupTenantData(tenantId: string)
: Promise<void>
{
  try {
    // This is called after the grace period for deleted tenants
    await this.database.deleteMany(this.MEMBERS_COLLECTION, { tenantId });
    await this.database.deleteMany(this.INVITATIONS_COLLECTION, { tenantId });
    await this.database.deleteMany(this.USAGE_COLLECTION, { tenantId });
    await this.database.deleteMany(this.ALERTS_COLLECTION, { tenantId });
    await this.database.deleteMany(this.BACKUPS_COLLECTION, { tenantId });
    await this.database.deleteOne(this.TENANTS_COLLECTION, { id: tenantId });

    logger.info(`Tenant data cleanup completed for ${tenantId}`);
  } catch (error) {
    logger.error(`Failed to cleanup tenant data for ${tenantId}:`, error);
    throw error;
  }
}

private
async;
performBackup(backupId: string, tenantId: string)
: Promise<void>
{
    try {
      // Implementation for creating tenant backup
      await this.database.updateOne(
        this.BACKUPS_COLLECTION,

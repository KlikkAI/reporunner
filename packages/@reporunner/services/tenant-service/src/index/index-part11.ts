logger.error('Failed to create backup:', error);
throw new Error(`Failed to create backup: ${error.message}`);
}
  }

  private async processTenantJob(job: Job): Promise<void>
{
  const { name, data } = job;

  try {
    switch (name) {
      case 'setup-tenant-infrastructure':
        await this.setupTenantInfrastructure(data.tenantId);
        break;
      case 'send-invitation-email':
        await this.sendInvitationEmail(data.tenantId, data.invitation);
        break;
      case 'cleanup-tenant-data':
        await this.cleanupTenantData(data.tenantId);
        break;
      case 'create-tenant-backup':
        await this.performBackup(data.backupId, data.tenantId);
        break;
      case 'migrate-tenant-data':
        await this.migrateTenantData(data.tenantId, data.targetRegion);
        break;
      default:
        logger.warn(`Unknown tenant job type: ${name}`);
    }
  } catch (error) {
    logger.error(`Failed to process tenant job ${name}:`, error);
    throw error;
  }
}

private
async;
processMetricsJob(job: Job)
: Promise<void>
{
  const { tenantId, period } = job.data;

  try {
    await this.aggregateMetrics(tenantId, period);
  } catch (error) {
    logger.error(`Failed to process metrics job for tenant ${tenantId}:`, error);
    throw error;
  }
}

private
async;
processCleanupJob(job: Job)
: Promise<void>
{
  try {
    await this.cleanupExpiredInvitations();
    await this.cleanupExpiredBackups();
    await this.aggregateDailyMetrics();
  } catch (error) {
    logger.error('Failed to process cleanup job:', error);
    throw error;
  }
}

private
async;
setupTenantInfrastructure(tenantId: string)
: Promise<void>
{
  try {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    // Create tenant-specific database schema
    await this.database.createSchema(tenant.isolation.database_schema);

    // Setup Redis namespace
    await this.redis.setupNamespace(tenant.isolation.redis_namespace);

    // Initialize storage buckets
    // await this.storageService.createBucket(tenant.isolation.storage_prefix);

    // Setup encryption keys
    // await this.encryptionService.createKey(tenant.isolation.encryption_key_id);

    logger.info(`Infrastructure setup completed for tenant ${tenantId}`);
  } catch (error) {
    logger.error(`Failed to setup infrastructure for tenant ${tenantId}:`, error);
    throw error;
  }
}

private
async;
sendInvitationEmail(tenantId: string, invitation: TenantInvitation)
: Promise<void>
{
  try {
    this.eventBus.emit('notification.send', {
      type: 'email',
      target: invitation.email,
      subject: "You've been invited to join our workspace",
      template: 'tenant_invitation',
      data: {
        tenantId,
        invitation,
        acceptUrl: `${process.env.APP_URL}/accept-invitation?token=${invitation.token}`,
      },
    });

    logger.info(`Invitation email sent for invitation ${invitation.id}`);
  } catch (error) {
    logger.error(`Failed to send invitation email:`, error);
    throw error;
  }
}

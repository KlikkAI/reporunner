this.database = database;
this.eventBus = eventBus;

// Initialize BullMQ queues
this.tenantQueue = new Queue('tenant-operations', {
  connection: this.redis.getConnection(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

this.worker = new Worker('tenant-operations', this.processTenantJob.bind(this), {
  connection: this.redis.getConnection(),
  concurrency: 3,
});

this.metricsWorker = new Worker('tenant-metrics', this.processMetricsJob.bind(this), {
  connection: this.redis.getConnection(),
  concurrency: 2,
});

this.cleanupWorker = new Worker('tenant-cleanup', this.processCleanupJob.bind(this), {
  connection: this.redis.getConnection(),
  concurrency: 1,
});

this.initializeDatabase();
this.initializeEventListeners();
this.startPeriodicJobs();
}

  private async initializeDatabase(): Promise<void>
{
  try {
    // Create indexes for tenants
    await this.database.createIndex(this.TENANTS_COLLECTION, { domain: 1 }, { unique: true });
    await this.database.createIndex(
      this.TENANTS_COLLECTION,
      { subdomain: 1 },
      { unique: true, sparse: true }
    );
    await this.database.createIndex(this.TENANTS_COLLECTION, { status: 1 });
    await this.database.createIndex(this.TENANTS_COLLECTION, { plan: 1 });
    await this.database.createIndex(this.TENANTS_COLLECTION, { 'metadata.region': 1 });
    await this.database.createIndex(this.TENANTS_COLLECTION, { createdAt: -1 });
    await this.database.createIndex(this.TENANTS_COLLECTION, { last_activity: -1 });

    // Create indexes for members
    await this.database.createIndex(
      this.MEMBERS_COLLECTION,
      { tenantId: 1, userId: 1 },
      { unique: true }
    );
    await this.database.createIndex(this.MEMBERS_COLLECTION, { tenantId: 1 });
    await this.database.createIndex(this.MEMBERS_COLLECTION, { userId: 1 });
    await this.database.createIndex(this.MEMBERS_COLLECTION, { role: 1 });
    await this.database.createIndex(this.MEMBERS_COLLECTION, { status: 1 });
    await this.database.createIndex(this.MEMBERS_COLLECTION, { lastActiveAt: -1 });

    // Create indexes for invitations
    await this.database.createIndex(this.INVITATIONS_COLLECTION, { tenantId: 1 });
    await this.database.createIndex(this.INVITATIONS_COLLECTION, { email: 1 });
    await this.database.createIndex(this.INVITATIONS_COLLECTION, { token: 1 }, { unique: true });
    await this.database.createIndex(this.INVITATIONS_COLLECTION, { status: 1 });
    await this.database.createIndex(this.INVITATIONS_COLLECTION, { expiresAt: 1 });

    // Create indexes for usage metrics
    await this.database.createIndex(this.USAGE_COLLECTION, { tenantId: 1, period: 1, date: -1 });
    await this.database.createIndex(this.USAGE_COLLECTION, { date: -1 });

    // Create indexes for alerts
    await this.database.createIndex(this.ALERTS_COLLECTION, { tenantId: 1, status: 1 });
    await this.database.createIndex(this.ALERTS_COLLECTION, { created_at: -1 });
    await this.database.createIndex(this.ALERTS_COLLECTION, { type: 1, severity: 1 });

    // Create indexes for backups
    await this.database.createIndex(this.BACKUPS_COLLECTION, { tenantId: 1, created_at: -1 });
    await this.database.createIndex(this.BACKUPS_COLLECTION, { status: 1 });
    await this.database.createIndex(this.BACKUPS_COLLECTION, { expires_at: 1 });

    logger.info('TenantService database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create TenantService database indexes:', error);
    throw error;
  }
}

private
initializeEventListeners();
: void
{
    this.worker.on('completed', (job) => {
      logger.debug(`Tenant job ${job.id} completed`);
    });

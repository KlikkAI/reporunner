this.worker.on('failed', (job, err) => {
  logger.error(`Tenant job ${job?.id} failed:`, err);
});

// Listen for platform events that affect tenants
this.eventBus.on('user.login', (data) => {
  this.updateMemberActivity(data.userId, data.tenantId);
});

this.eventBus.on('workflow.executed', (data) => {
  this.incrementUsage(data.tenantId, 'workflow_executions', 1);
});

this.eventBus.on('api.call', (data) => {
  this.incrementUsage(data.tenantId, 'apiCalls', 1);
});
}

  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'isolation'>): Promise<string>
{
  try {
    // Validate input
    const validatedData = TenantSchema.parse(tenantData);

    // Check domain uniqueness
    const existingTenant = await this.getTenantByDomain(validatedData.domain);
    if (existingTenant) {
      throw new Error('Domain already exists');
    }

    if (validatedData.subdomain) {
      const existingSubdomain = await this.getTenantByDomain(validatedData.subdomain);
      if (existingSubdomain) {
        throw new Error('Subdomain already exists');
      }
    }

    // Generate tenant isolation resources
    const isolation = await this.generateTenantIsolation(validatedData.name);

    const newTenant: Tenant = {
      ...tenantData,
      id: this.generateId(),
      status: tenantData.plan === 'starter' && !tenantData.trial_info ? 'trial' : 'active',
      limits: this.getPlanLimits(tenantData.plan),
      usage: {
        currentUsers: 0,
        currentWorkflows: 0,
        executionsThisMonth: 0,
        storageUsedGB: 0,
        apiCallsThisMonth: 0,
        concurrent_executions_peak: 0,
        last_reset_date: new Date(),
      },
      isolation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    await this.database.create(this.TENANTS_COLLECTION, newTenant);

    // Setup tenant infrastructure
    await this.tenantQueue.add('setup-tenant-infrastructure', { tenantId: newTenant.id });

    // Create owner membership for creator
    if (tenantData.metadata.created_by) {
      await this.addMember(newTenant.id, {
        tenantId: newTenant.id,
        userId: tenantData.metadata.created_by,
        role: 'owner',
        permissions: ['*'],
        status: 'active',
        preferences: {
          notifications: true,
          weekly_digest: true,
          language: tenantData.metadata.language || 'en',
          timezone: tenantData.metadata.timezone || 'UTC',
        },
        login_count: 0,
      });
    }

    // Clear cache
    await this.clearTenantCache(newTenant.id);

    logger.info(`Tenant ${newTenant.id} created successfully`);
    this.eventBus.emit('tenant.created', newTenant);

    return newTenant.id;
  } catch (error) {
    logger.error('Failed to create tenant:', error);
    throw new Error(`Failed to create tenant: ${error.message}`);
  }
}

async;
getTenant(id: string)
: Promise<Tenant | null>
{
    try {
      const cacheKey = `tenant:${id}`;
      const cached = await this.redis.get(cacheKey);

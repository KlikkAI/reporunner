{
  status: 'expired';
}
)
throw new Error('Invitation has expired');
}

// Add user as member
const memberId = await this.addMember(invitation.tenantId, {
  tenantId: invitation.tenantId,
  userId,
  role: invitation.role,
  permissions: this.getDefaultPermissions(invitation.role),
  custom_permissions: invitation.custom_permissions,
  status: 'active',
  preferences: {
    notifications: true,
    weekly_digest: true,
    language: 'en',
    timezone: 'UTC',
  },
  login_count: 0,
});

// Mark invitation as accepted
await this.database.updateOne(
  this.INVITATIONS_COLLECTION,
  { id: invitation.id },
  { status: 'accepted', accepted_at: new Date() }
);

logger.info(`Invitation ${invitation.id} accepted by user ${userId}`);
this.eventBus.emit('tenant.invitation.accepted', { invitation, userId, memberId });

return memberId;
} catch (error)
{
  logger.error('Failed to accept invitation:', error);
  throw new Error(`Failed to accept invitation: ${error.message}`);
}
}

  async updateUsage(tenantId: string, usage: Partial<UsageMetrics['metrics']>): Promise<void>
{
  try {
    // Update current usage in tenant
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return;

    const updatedUsage = { ...tenant.usage };

    // Update fields that exist in both interfaces
    if (usage.users !== undefined) updatedUsage.currentUsers = usage.users;
    if (usage.workflows !== undefined) updatedUsage.currentWorkflows = usage.workflows;
    if (usage.apiCalls !== undefined) updatedUsage.apiCallsThisMonth += usage.apiCalls;
    if (usage.storageGB !== undefined) updatedUsage.storageUsedGB = usage.storageGB;
    if (usage.workflow_executions !== undefined)
      updatedUsage.executionsThisMonth += usage.workflow_executions;
    if (usage.concurrent_executions_peak !== undefined) {
      updatedUsage.concurrent_executions_peak = Math.max(
        updatedUsage.concurrent_executions_peak,
        usage.concurrent_executions_peak
      );
    }

    await this.updateTenant(tenantId, { usage: updatedUsage });

    // Record detailed usage metrics
    await this.recordUsageMetrics(tenantId, usage);

    // Check limits and create alerts if necessary
    await this.checkAndAlertLimits(tenantId);
  } catch (error) {
    logger.error('Failed to update usage:', error);
  }
}

async;
incrementUsage(tenantId: string, metric: string, increment: number = 1)
: Promise<void>
{
  try {
    const usage: Partial<UsageMetrics['metrics']> = {};
    usage[metric] = increment;
    await this.updateUsage(tenantId, usage);
  } catch (error) {
    logger.error('Failed to increment usage:', error);
  }
}

async;
checkLimits(tenantId: string)
: Promise<
{
  withinLimits: boolean;
  violations: Array<{ limit: string; current: number; max: number; percentage: number }>;
  warnings: Array<{ limit: string; current: number; max: number; percentage: number }>;
}
>
{
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const violations: Array<{ limit: string; current: number; max: number; percentage: number }> = [];
      const warnings: Array<{ limit: string; current: number; max: number; percentage: number }> = [];

      const checks = [
        { name: 'users', current: tenant.usage.currentUsers, max: tenant.limits.maxUsers },
        { name: 'workflows', current: tenant.usage.currentWorkflows, max: tenant.limits.maxWorkflows },
        { name: 'executions', current: tenant.usage.executionsThisMonth, max: tenant.limits.maxExecutions },

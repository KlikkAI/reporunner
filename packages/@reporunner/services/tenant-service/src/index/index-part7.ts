// Mark as deleted instead of hard delete for data retention
await this.updateTenant(id, {
  status: 'deleted',
  metadata: {
    ...tenant.metadata,
    deleted_at: new Date(),
  },
});

// Schedule data cleanup
await this.tenantQueue.add(
  'cleanup-tenant-data',
  { tenantId: id },
  { delay: 30 * 24 * 60 * 60 * 1000 } // 30 days delay
);

logger.info(`Tenant ${id} marked for deletion`);
this.eventBus.emit('tenant.deleted', { id });
} catch (error)
{
  logger.error('Failed to delete tenant:', error);
  throw new Error(`Failed to delete tenant: ${error.message}`);
}
}

  async addMember(tenantId: string, memberData: Omit<TenantMember, 'id' | 'joinedAt'>): Promise<string>
{
  try {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check user limits
    const currentMemberCount = await this.database.countDocuments(this.MEMBERS_COLLECTION, {
      tenantId,
      status: { $ne: 'suspended' },
    });

    if (currentMemberCount >= tenant.limits.maxUsers) {
      throw new Error('User limit exceeded for this tenant');
    }

    // Check if user is already a member
    const existingMember = await this.database.findOne(this.MEMBERS_COLLECTION, {
      tenantId,
      userId: memberData.userId,
    });

    if (existingMember) {
      throw new Error('User is already a member of this tenant');
    }

    const newMember: TenantMember = {
      ...memberData,
      id: this.generateId(),
      joinedAt: new Date(),
    };

    await this.database.create(this.MEMBERS_COLLECTION, newMember);

    // Update tenant usage
    await this.incrementUsage(tenantId, 'currentUsers', 1);

    logger.info(`Member ${newMember.id} added to tenant ${tenantId}`);
    this.eventBus.emit('tenant.member.added', { tenantId, member: newMember });

    return newMember.id;
  } catch (error) {
    logger.error('Failed to add member:', error);
    throw new Error(`Failed to add member: ${error.message}`);
  }
}

async;
removeMember(tenantId: string, memberId: string)
: Promise<void>
{
    try {
      const member = await this.database.findOne(this.MEMBERS_COLLECTION, {
        id: memberId,
        tenantId,
      });

      if (!member) {
        throw new Error('Member not found');
      }

      // Prevent removing the last owner
      if (member.role === 'owner') {
        const ownerCount = await this.database.countDocuments(
          this.MEMBERS_COLLECTION,
          { tenantId, role: 'owner', status: 'active' }
        );

        if (ownerCount <= 1) {
          throw new Error('Cannot remove the last owner of a tenant');
        }
      }

      await this.database.deleteOne(this.MEMBERS_COLLECTION, { id: memberId });

      // Update tenant usage
      await this.incrementUsage(tenantId, 'currentUsers', -1);

      logger.info(`Member ${memberId} removed from tenant ${tenantId}`);

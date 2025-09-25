this.eventBus.emit('tenant.member.removed', { tenantId, memberId });
} catch (error)
{
  logger.error('Failed to remove member:', error);
  throw new Error(`Failed to remove member: ${error.message}`);
}
}

  async getTenantMembers(tenantId: string, options:
{
  status?: string;
  role?: string;
  limit?: number;
  offset?: number;
}
=
{
}
): Promise<
{
  members: TenantMember[], total
  : number
}
>
{
  try {
    const filter: any = { tenantId };

    if (options.status) filter.status = options.status;
    if (options.role) filter.role = options.role;

    const [members, total] = await Promise.all([
      this.database.findMany(this.MEMBERS_COLLECTION, filter, {
        limit: options.limit || 100,
        skip: options.offset || 0,
        sort: { joinedAt: -1 },
      }),
      this.database.countDocuments(this.MEMBERS_COLLECTION, filter),
    ]);

    return { members, total };
  } catch (error) {
    logger.error('Failed to get tenant members:', error);
    throw new Error(`Failed to get tenant members: ${error.message}`);
  }
}

async;
inviteUser(tenantId: string, invitationData: Omit<TenantInvitation, 'id' | 'status' | 'createdAt' | 'expiresAt' | 'token'>)
: Promise<string>
{
  try {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check if user is already invited or is a member
    const existingInvitation = await this.database.findOne(this.INVITATIONS_COLLECTION, {
      tenantId,
      email: invitationData.email,
      status: 'pending',
    });

    if (existingInvitation) {
      throw new Error('User already has a pending invitation');
    }

    const existingMember = await this.database.findOne(this.MEMBERS_COLLECTION, {
      tenantId,
      // Assuming email is available in user profile
    });

    const invitation: TenantInvitation = {
      ...invitationData,
      id: this.generateId(),
      status: 'pending',
      token: this.generateSecureToken(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    };

    await this.database.create(this.INVITATIONS_COLLECTION, invitation);

    // Send invitation email
    await this.tenantQueue.add('send-invitation-email', {
      tenantId,
      invitation,
    });

    logger.info(`Invitation ${invitation.id} created for tenant ${tenantId}`);
    this.eventBus.emit('tenant.invitation.sent', { tenantId, invitation });

    return invitation.id;
  } catch (error) {
    logger.error('Failed to create invitation:', error);
    throw new Error(`Failed to create invitation: ${error.message}`);
  }
}

async;
acceptInvitation(token: string, userId: string)
: Promise<string>
{
    try {
      const invitation = await this.database.findOne(this.INVITATIONS_COLLECTION, {
        token,
        status: 'pending',
      });

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      if (invitation.expiresAt < new Date()) {
        await this.database.updateOne(
          this.INVITATIONS_COLLECTION,
          { id: invitation.id },

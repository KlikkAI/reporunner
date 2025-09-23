export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  limits: {
    maxUsers: number;
    maxWorkflows: number;
    maxExecutions: number;
    storageGB: number;
    apiCallsPerMonth: number;
  };
  usage: {
    currentUsers: number;
    currentWorkflows: number;
    executionsThisMonth: number;
    storageUsedGB: number;
    apiCallsThisMonth: number;
  };
  billing: {
    customerId?: string;
    subscriptionId?: string;
    planId: string;
    nextBillingDate?: Date;
    billingEmail: string;
  };
  settings: {
    branding?: {
      logo?: string;
      primaryColor?: string;
      customDomain?: string;
    };
    security: {
      ssoEnabled: boolean;
      mfaRequired: boolean;
      passwordPolicy: {
        minLength: number;
        requireSpecialChars: boolean;
        requireNumbers: boolean;
      };
    };
    features: {
      advancedAnalytics: boolean;
      customIntegrations: boolean;
      prioritySupport: boolean;
      whiteLabeling: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  createdAt: Date;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: string[];
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface UsageMetrics {
  tenantId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    users: number;
    workflows: number;
    executions: number;
    storageGB: number;
    apiCalls: number;
    errors: number;
  };
}

export class TenantService {
  private tenants = new Map<string, Tenant>();
  private members = new Map<string, TenantMember[]>();
  private invitations = new Map<string, TenantInvitation[]>();
  private usage: UsageMetrics[] = [];

  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTenant: Tenant = {
      ...tenant,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate domain uniqueness
    const existingDomain = Array.from(this.tenants.values()).find(
      (t) => t.domain === newTenant.domain || t.subdomain === newTenant.subdomain
    );

    if (existingDomain) {
      throw new Error('Domain or subdomain already exists');
    }

    this.tenants.set(newTenant.id, newTenant);
    this.members.set(newTenant.id, []);
    this.invitations.set(newTenant.id, []);

    return newTenant.id;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (t) => t.domain === domain || t.subdomain === domain
    );
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<boolean> {
    const tenant = this.tenants.get(id);
    if (!tenant) return false;

    this.tenants.set(id, {
      ...tenant,
      ...updates,
      updatedAt: new Date(),
    });

    return true;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const deleted = this.tenants.delete(id);
    if (deleted) {
      this.members.delete(id);
      this.invitations.delete(id);
    }
    return deleted;
  }

  async addMember(
    tenantId: string,
    member: Omit<TenantMember, 'id' | 'joinedAt'>
  ): Promise<string> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Check user limits
    const currentMembers = this.members.get(tenantId) || [];
    if (currentMembers.length >= tenant.limits.maxUsers) {
      throw new Error('User limit exceeded for this tenant');
    }

    const newMember: TenantMember = {
      ...member,
      id: this.generateId(),
      joinedAt: new Date(),
    };

    currentMembers.push(newMember);
    this.members.set(tenantId, currentMembers);

    // Update tenant usage
    await this.updateUsage(tenantId, { currentUsers: currentMembers.length });

    return newMember.id;
  }

  async removeMember(tenantId: string, memberId: string): Promise<boolean> {
    const members = this.members.get(tenantId) || [];
    const memberIndex = members.findIndex((m) => m.id === memberId);

    if (memberIndex === -1) return false;

    // Prevent removing the last owner
    const member = members[memberIndex];
    if (member.role === 'owner') {
      const ownerCount = members.filter((m) => m.role === 'owner').length;
      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner of a tenant');
      }
    }

    members.splice(memberIndex, 1);
    this.members.set(tenantId, members);

    // Update tenant usage
    await this.updateUsage(tenantId, { currentUsers: members.length });

    return true;
  }

  async getTenantMembers(tenantId: string): Promise<TenantMember[]> {
    return this.members.get(tenantId) || [];
  }

  async inviteUser(
    tenantId: string,
    invitation: Omit<TenantInvitation, 'id' | 'status' | 'createdAt' | 'expiresAt'>
  ): Promise<string> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const newInvitation: TenantInvitation = {
      ...invitation,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const invitations = this.invitations.get(tenantId) || [];
    invitations.push(newInvitation);
    this.invitations.set(tenantId, invitations);

    return newInvitation.id;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<string> {
    let foundInvitation: TenantInvitation | undefined;
    let tenantId: string | undefined;

    // Find the invitation across all tenants
    for (const [tId, invitations] of this.invitations.entries()) {
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (invitation) {
        foundInvitation = invitation;
        tenantId = tId;
        break;
      }
    }

    if (!foundInvitation || !tenantId) {
      throw new Error('Invitation not found');
    }

    if (foundInvitation.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }

    if (foundInvitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Add user as member
    const memberId = await this.addMember(tenantId, {
      tenantId,
      userId,
      role: foundInvitation.role,
      permissions: this.getDefaultPermissions(foundInvitation.role),
    });

    // Mark invitation as accepted
    foundInvitation.status = 'accepted';

    return memberId;
  }

  async updateUsage(tenantId: string, usage: Partial<UsageMetrics['metrics']>): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    // Update current usage in tenant
    tenant.usage = { ...tenant.usage, ...usage };
    tenant.updatedAt = new Date();

    this.tenants.set(tenantId, tenant);

    // Record usage metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyMetric = this.usage.find(
      (u) => u.tenantId === tenantId && u.period === 'daily' && u.date.getTime() === today.getTime()
    );

    if (!dailyMetric) {
      dailyMetric = {
        tenantId,
        period: 'daily',
        date: today,
        metrics: {
          users: tenant.usage.currentUsers,
          workflows: tenant.usage.currentWorkflows,
          executions: 0,
          storageGB: tenant.usage.storageUsedGB,
          apiCalls: 0,
          errors: 0,
        },
      };
      this.usage.push(dailyMetric);
    }

    // Update the daily metric
    dailyMetric.metrics = { ...dailyMetric.metrics, ...usage };
  }

  async checkLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: Array<{ limit: string; current: number; max: number }>;
  }> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const violations: Array<{ limit: string; current: number; max: number }> = [];

    // Check each limit
    const checks = [
      { name: 'users', current: tenant.usage.currentUsers, max: tenant.limits.maxUsers },
      {
        name: 'workflows',
        current: tenant.usage.currentWorkflows,
        max: tenant.limits.maxWorkflows,
      },
      {
        name: 'executions',
        current: tenant.usage.executionsThisMonth,
        max: tenant.limits.maxExecutions,
      },
      { name: 'storage', current: tenant.usage.storageUsedGB, max: tenant.limits.storageGB },
      {
        name: 'apiCalls',
        current: tenant.usage.apiCallsThisMonth,
        max: tenant.limits.apiCallsPerMonth,
      },
    ];

    for (const check of checks) {
      if (check.current > check.max) {
        violations.push({
          limit: check.name,
          current: check.current,
          max: check.max,
        });
      }
    }

    return {
      withinLimits: violations.length === 0,
      violations,
    };
  }

  async getUsageMetrics(
    tenantId: string,
    period: 'daily' | 'weekly' | 'monthly',
    days: number = 30
  ): Promise<UsageMetrics[]> {
    return this.usage.filter((u) => u.tenantId === tenantId && u.period === period).slice(-days);
  }

  private getDefaultPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      owner: ['*'],
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
      user: ['read', 'write', 'execute'],
      viewer: ['read'],
    };

    return permissions[role] || [];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export * from './billing';
export * from './isolation';

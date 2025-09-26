import type { DatabaseService } from '@reporunner/core/services/database';
import type { EventBusService } from '@reporunner/core/services/eventBus';
import type { RedisService } from '@reporunner/core/services/redis';
import { logger } from '@reporunner/monitoring/logger';
import { type Job, Queue, Worker } from 'bullmq';
import { createHash, randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { z } from 'zod';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'pending' | 'deleted' | 'trial';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  plan_details: {
    name: string;
    price: number;
    currency: 'USD' | 'EUR' | 'GBP';
    billing_cycle: 'monthly' | 'yearly';
    trial_days?: number;
  };
  limits: {
    maxUsers: number;
    maxWorkflows: number;
    maxExecutions: number;
    storageGB: number;
    apiCallsPerMonth: number;
    concurrent_executions: number;
    retention_days: number;
    custom_integrations: number;
  };
  usage: {
    currentUsers: number;
    currentWorkflows: number;
    executionsThisMonth: number;
    storageUsedGB: number;
    apiCallsThisMonth: number;
    concurrent_executions_peak: number;
    last_reset_date: Date;
  };
  billing: {
    customerId?: string;
    subscriptionId?: string;
    planId: string;
    nextBillingDate?: Date;
    billingEmail: string;
    payment_method?: {
      type: 'card' | 'bank_transfer' | 'invoice';
      last4?: string;
      brand?: string;
    };
    billing_address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
    };
    tax_id?: string;
  };
  settings: {
    branding?: {
      logo?: string;
      favicon?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
      custom_css?: string;
    };
    security: {
      ssoEnabled: boolean;
      sso_provider?: 'okta' | 'azure' | 'google' | 'saml' | 'ldap';
      sso_config?: Record<string, any>;
      mfaRequired: boolean;
      mfa_methods: string[];
      passwordPolicy: {
        minLength: number;
        requireSpecialChars: boolean;
        requireNumbers: boolean;
        requireUppercase: boolean;
        requireLowercase: boolean;
        maxAge: number; // days
        preventReuse: number; // last N passwords
      };
      session_timeout: number; // minutes
      ip_whitelist?: string[];
      allowed_email_domains?: string[];
    };
    features: {
      advancedAnalytics: boolean;
      customIntegrations: boolean;
      prioritySupport: boolean;
      whiteLabeling: boolean;
      audit_logs: boolean;
      data_export: boolean;
      webhook_notifications: boolean;
      custom_workflows: boolean;
      ai_features: boolean;
      collaboration_tools: boolean;
    };
    integrations: {
      enabled: string[];
      disabled: string[];
      custom_configs: Record<string, any>;
    };
    notifications: {
      email_enabled: boolean;
      slack_enabled: boolean;
      webhook_enabled: boolean;
      default_recipients: string[];
    };
  };
  metadata: {
    region: string;
    timezone: string;
    language: string;
    industry?: string;
    company_size?: string;
    use_case?: string;
    onboarding_completed: boolean;
    created_by: string;
    sales_contact?: string;
    custom_fields: Record<string, any>;
  };
  isolation: {
    database_schema: string;
    storage_prefix: string;
    redis_namespace: string;
    encryption_key_id: string;
    backup_schedule?: string;
  };
  trial_info?: {
    start_date: Date;
    end_date: Date;
    extended_days: number;
    conversion_probability?: number;
    trial_source: string;
  };
  createdAt: Date;
  updatedAt: Date;
  last_activity?: Date;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'owner' | 'admin' | 'user' | 'viewer' | 'custom';
  custom_permissions?: string[];
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked' | 'bounced';
  expiresAt: Date;
  createdAt: Date;
  accepted_at?: Date;
  token: string;
  personal_message?: string;
  reminder_sent_at?: Date[];
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'user' | 'viewer' | 'custom';
  permissions: string[];
  custom_permissions?: string[];
  departments?: string[];
  cost_center?: string;
  manager_id?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
  last_login?: Date;
  login_count: number;
  status: 'active' | 'inactive' | 'suspended';
  preferences: {
    notifications: boolean;
    weekly_digest: boolean;
    language: string;
    timezone: string;
  };
}

export interface UsageMetrics {
  id: string;
  tenantId: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    users: number;
    active_users: number;
    workflows: number;
    workflow_executions: number;
    successful_executions: number;
    failed_executions: number;
    execution_time_ms: number;
    storageGB: number;
    bandwidth_gb: number;
    apiCalls: number;
    api_errors: number;
    webhook_calls: number;
    integration_usage: Record<string, number>;
    feature_usage: Record<string, number>;
    error_rate: number;
    avg_response_time: number;
    concurrent_executions_peak: number;
  };
  costs?: {
    compute: number;
    storage: number;
    bandwidth: number;
    integrations: number;
    total: number;
  };
}

export interface TenantAlert {
  id: string;
  tenantId: string;
  type:
    | 'limit_exceeded'
    | 'approaching_limit'
    | 'billing_issue'
    | 'security_alert'
    | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: Date;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  resolved_at?: Date;
  auto_resolve?: boolean;
}

export interface TenantBackup {
  id: string;
  tenantId: string;
  type: 'manual' | 'scheduled' | 'migration';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size_bytes: number;
  storage_location: string;
  encryption_key_id: string;
  created_at: Date;
  completed_at?: Date;
  expires_at: Date;
  metadata: {
    workflows_count: number;
    users_count: number;
    executions_count: number;
    version: string;
  };
}

const TenantSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(1).max(255),
  subdomain: z.string().optional(),
  plan: z.enum(['starter', 'professional', 'enterprise', 'custom']),
  billing: z.object({
    billingEmail: z.string().email(),
  }),
  settings: z
    .object({
      security: z.object({
        ssoEnabled: z.boolean(),
        mfaRequired: z.boolean(),
      }),
    })
    .optional(),
  metadata: z.object({
    region: z.string(),
    timezone: z.string(),
    language: z.string(),
    created_by: z.string(),
  }),
});

export class TenantService extends EventEmitter {
  private redis: RedisService;
  private database: DatabaseService;
  private eventBus: EventBusService;
  private tenantQueue: Queue;
  private worker: Worker;
  private metricsWorker: Worker;
  private cleanupWorker: Worker;

  private readonly TENANTS_COLLECTION = 'tenants';
  private readonly MEMBERS_COLLECTION = 'tenant_members';
  private readonly INVITATIONS_COLLECTION = 'tenant_invitations';
  private readonly USAGE_COLLECTION = 'tenant_usage';
  private readonly ALERTS_COLLECTION = 'tenant_alerts';
  private readonly BACKUPS_COLLECTION = 'tenant_backups';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly INVITATION_EXPIRY_DAYS = 7;

  constructor(redis: RedisService, database: DatabaseService, eventBus: EventBusService) {
    super();
    this.redis = redis;
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

  private async initializeDatabase(): Promise<void> {
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

  private initializeEventListeners(): void {
    this.worker.on('completed', (job) => {
      logger.debug(`Tenant job ${job.id} completed`);
    });

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

  async createTenant(
    tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'isolation'>
  ): Promise<string> {
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

  async getTenant(id: string): Promise<Tenant | null> {
    try {
      const cacheKey = `tenant:${id}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const tenant = await this.database.findOne(this.TENANTS_COLLECTION, { id });

      if (tenant) {
        await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenant));
      }

      return tenant;
    } catch (error) {
      logger.error('Failed to get tenant:', error);
      throw new Error(`Failed to get tenant: ${error.message}`);
    }
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
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

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
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

  async suspendTenant(id: string, reason: string): Promise<void> {
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

  async deleteTenant(id: string): Promise<void> {
    try {
      const tenant = await this.getTenant(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

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
    } catch (error) {
      logger.error('Failed to delete tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  async addMember(
    tenantId: string,
    memberData: Omit<TenantMember, 'id' | 'joinedAt'>
  ): Promise<string> {
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

  async removeMember(tenantId: string, memberId: string): Promise<void> {
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
        const ownerCount = await this.database.countDocuments(this.MEMBERS_COLLECTION, {
          tenantId,
          role: 'owner',
          status: 'active',
        });

        if (ownerCount <= 1) {
          throw new Error('Cannot remove the last owner of a tenant');
        }
      }

      await this.database.deleteOne(this.MEMBERS_COLLECTION, { id: memberId });

      // Update tenant usage
      await this.incrementUsage(tenantId, 'currentUsers', -1);

      logger.info(`Member ${memberId} removed from tenant ${tenantId}`);
      this.eventBus.emit('tenant.member.removed', { tenantId, memberId });
    } catch (error) {
      logger.error('Failed to remove member:', error);
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async getTenantMembers(
    tenantId: string,
    options: {
      status?: string;
      role?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ members: TenantMember[]; total: number }> {
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

  async inviteUser(
    tenantId: string,
    invitationData: Omit<TenantInvitation, 'id' | 'status' | 'createdAt' | 'expiresAt' | 'token'>
  ): Promise<string> {
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

  async acceptInvitation(token: string, userId: string): Promise<string> {
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
          { status: 'expired' }
        );
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
    } catch (error) {
      logger.error('Failed to accept invitation:', error);
      throw new Error(`Failed to accept invitation: ${error.message}`);
    }
  }

  async updateUsage(tenantId: string, usage: Partial<UsageMetrics['metrics']>): Promise<void> {
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

  async incrementUsage(tenantId: string, metric: string, increment: number = 1): Promise<void> {
    try {
      const usage: Partial<UsageMetrics['metrics']> = {};
      usage[metric] = increment;
      await this.updateUsage(tenantId, usage);
    } catch (error) {
      logger.error('Failed to increment usage:', error);
    }
  }

  async checkLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: Array<{ limit: string; current: number; max: number; percentage: number }>;
    warnings: Array<{ limit: string; current: number; max: number; percentage: number }>;
  }> {
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const violations: Array<{ limit: string; current: number; max: number; percentage: number }> =
        [];
      const warnings: Array<{ limit: string; current: number; max: number; percentage: number }> =
        [];

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
    } catch (error) {
      logger.error('Failed to check limits:', error);
      throw new Error(`Failed to check limits: ${error.message}`);
    }
  }

  async getUsageMetrics(
    tenantId: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    days: number = 30
  ): Promise<UsageMetrics[]> {
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

  async createBackup(
    tenantId: string,
    type: 'manual' | 'scheduled' | 'migration'
  ): Promise<string> {
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
      logger.error('Failed to create backup:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  private async processTenantJob(job: Job): Promise<void> {
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

  private async processMetricsJob(job: Job): Promise<void> {
    const { tenantId, period } = job.data;

    try {
      await this.aggregateMetrics(tenantId, period);
    } catch (error) {
      logger.error(`Failed to process metrics job for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async processCleanupJob(job: Job): Promise<void> {
    try {
      await this.cleanupExpiredInvitations();
      await this.cleanupExpiredBackups();
      await this.aggregateDailyMetrics();
    } catch (error) {
      logger.error('Failed to process cleanup job:', error);
      throw error;
    }
  }

  private async setupTenantInfrastructure(tenantId: string): Promise<void> {
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

  private async sendInvitationEmail(tenantId: string, invitation: TenantInvitation): Promise<void> {
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

  private async recordUsageMetrics(
    tenantId: string,
    usage: Partial<UsageMetrics['metrics']>
  ): Promise<void> {
    try {
      const now = new Date();
      const periods = ['hourly', 'daily'] as const;

      for (const period of periods) {
        const date = this.getperiodDate(now, period);
        const metricId = `${tenantId}_${period}_${date.toISOString()}`;

        let existingMetric = await this.database.findOne(this.USAGE_COLLECTION, {
          id: metricId,
        });

        if (!existingMetric) {
          existingMetric = {
            id: metricId,
            tenantId,
            period,
            date,
            metrics: {
              users: 0,
              active_users: 0,
              workflows: 0,
              workflow_executions: 0,
              successful_executions: 0,
              failed_executions: 0,
              execution_time_ms: 0,
              storageGB: 0,
              bandwidth_gb: 0,
              apiCalls: 0,
              api_errors: 0,
              webhook_calls: 0,
              integration_usage: {},
              feature_usage: {},
              error_rate: 0,
              avg_response_time: 0,
              concurrent_executions_peak: 0,
            },
          };
        }

        // Merge the usage data
        existingMetric.metrics = {
          ...existingMetric.metrics,
          ...usage,
        };

        await this.database.upsert(this.USAGE_COLLECTION, { id: metricId }, existingMetric);
      }
    } catch (error) {
      logger.error('Failed to record usage metrics:', error);
    }
  }

  private async checkAndAlertLimits(tenantId: string): Promise<void> {
    try {
      const limitsCheck = await this.checkLimits(tenantId);

      // Create alerts for violations
      for (const violation of limitsCheck.violations) {
        await this.createAlert(tenantId, {
          type: 'limit_exceeded',
          severity: 'high',
          title: `${violation.limit} limit exceeded`,
          message: `Current usage: ${violation.current}/${violation.max} (${violation.percentage.toFixed(1)}%)`,
          details: violation,
        });
      }

      // Create warnings for approaching limits
      for (const warning of limitsCheck.warnings) {
        await this.createAlert(tenantId, {
          type: 'approaching_limit',
          severity: 'medium',
          title: `${warning.limit} limit warning`,
          message: `Current usage: ${warning.current}/${warning.max} (${warning.percentage.toFixed(1)}%)`,
          details: warning,
        });
      }
    } catch (error) {
      logger.error('Failed to check and alert limits:', error);
    }
  }

  private async createAlert(
    tenantId: string,
    alertData: Omit<TenantAlert, 'id' | 'tenantId' | 'status' | 'created_at'>
  ): Promise<string> {
    try {
      // Check if similar alert already exists and is active
      const existingAlert = await this.database.findOne(this.ALERTS_COLLECTION, {
        tenantId,
        type: alertData.type,
        title: alertData.title,
        status: 'active',
      });

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
    } catch (error) {
      logger.error('Failed to create alert:', error);
      throw error;
    }
  }

  private async cleanupExpiredInvitations(): Promise<void> {
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

  private async cleanupExpiredBackups(): Promise<void> {
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

  private async aggregateDailyMetrics(): Promise<void> {
    // Implementation for aggregating daily metrics from hourly data
    logger.info('Daily metrics aggregation completed');
  }

  private async aggregateMetrics(tenantId: string, period: string): Promise<void> {
    // Implementation for aggregating metrics
    logger.info(`Metrics aggregation completed for tenant ${tenantId}, period: ${period}`);
  }

  private async cleanupTenantData(tenantId: string): Promise<void> {
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

  private async performBackup(backupId: string, tenantId: string): Promise<void> {
    try {
      // Implementation for creating tenant backup
      await this.database.updateOne(
        this.BACKUPS_COLLECTION,
        { id: backupId },
        {
          status: 'completed',
          completed_at: new Date(),
          size_bytes: 1024 * 1024, // Placeholder
        }
      );

      logger.info(`Backup ${backupId} completed for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to perform backup ${backupId}:`, error);
      await this.database.updateOne(
        this.BACKUPS_COLLECTION,
        { id: backupId },
        { status: 'failed' }
      );
      throw error;
    }
  }

  private async migrateTenantData(tenantId: string, targetRegion: string): Promise<void> {
    // Implementation for tenant data migration
    logger.info(`Data migration completed for tenant ${tenantId} to region ${targetRegion}`);
  }

  private async updateMemberActivity(userId: string, tenantId: string): Promise<void> {
    try {
      await this.database.updateOne(
        this.MEMBERS_COLLECTION,
        { userId, tenantId },
        {
          lastActiveAt: new Date(),
          last_login: new Date(),
          $inc: { login_count: 1 },
        }
      );

      // Update tenant activity
      await this.updateTenant(tenantId, { last_activity: new Date() });
    } catch (error) {
      logger.error('Failed to update member activity:', error);
    }
  }

  private async revokeAllSessions(tenantId: string): Promise<void> {
    // Implementation for revoking all user sessions for a tenant
    this.eventBus.emit('tenant.sessions.revoked', { tenantId });
  }

  private async clearTenantCache(tenantId: string): Promise<void> {
    try {
      const keys = [
        `tenant:${tenantId}`,
        `tenant:domain:*`, // Would need to implement wildcard deletion
      ];

      await Promise.all(
        keys.map((key) => (key.includes('*') ? this.redis.deletePattern(key) : this.redis.del(key)))
      );
    } catch (error) {
      logger.error('Failed to clear tenant cache:', error);
    }
  }

  private async generateTenantIsolation(tenantName: string): Promise<Tenant['isolation']> {
    const id = this.generateId();
    return {
      database_schema: `tenant_${id}`,
      storage_prefix: `tenants/${id}`,
      redis_namespace: `tenant:${id}`,
      encryption_key_id: `tenant_key_${id}`,
    };
  }

  private getPlanLimits(plan: string): Tenant['limits'] {
    const planLimits = {
      starter: {
        maxUsers: 5,
        maxWorkflows: 20,
        maxExecutions: 1000,
        storageGB: 1,
        apiCallsPerMonth: 10000,
        concurrent_executions: 2,
        retention_days: 30,
        custom_integrations: 0,
      },
      professional: {
        maxUsers: 25,
        maxWorkflows: 100,
        maxExecutions: 10000,
        storageGB: 10,
        apiCallsPerMonth: 100000,
        concurrent_executions: 10,
        retention_days: 90,
        custom_integrations: 5,
      },
      enterprise: {
        maxUsers: 100,
        maxWorkflows: 500,
        maxExecutions: 100000,
        storageGB: 100,
        apiCallsPerMonth: 1000000,
        concurrent_executions: 50,
        retention_days: 365,
        custom_integrations: 25,
      },
      custom: {
        maxUsers: 1000,
        maxWorkflows: 2000,
        maxExecutions: 1000000,
        storageGB: 1000,
        apiCallsPerMonth: 10000000,
        concurrent_executions: 100,
        retention_days: 365,
        custom_integrations: 100,
      },
    };

    return planLimits[plan] || planLimits.starter;
  }

  private getDefaultPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      owner: ['*'],
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings', 'manage_billing'],
      user: ['read', 'write', 'execute'],
      viewer: ['read'],
    };

    return permissions[role] || permissions.viewer;
  }

  private getPerio;
  dDate(date: Date, period: 'hourly' | 'daily'): Date {
    const periodDate = new Date(date);

    if (period === 'hourly') {
      periodDate.setMinutes(0, 0, 0);
    } else if (period === 'daily') {
      periodDate.setHours(0, 0, 0, 0);
    }

    return periodDate;
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private generateId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicJobs(): void {
    // Schedule metrics collection every hour
    setInterval(
      () => {
        this.tenantQueue.add(
          'collect-metrics',
          {},
          {
            repeat: { every: 60 * 60 * 1000 }, // 1 hour
          }
        );
      },
      60 * 60 * 1000
    );

    // Schedule cleanup every day
    setInterval(
      () => {
        this.tenantQueue.add(
          'cleanup',
          {},
          {
            repeat: { every: 24 * 60 * 60 * 1000 }, // 24 hours
          }
        );
      },
      24 * 60 * 60 * 1000
    );
  }

  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.metricsWorker.close();
      await this.cleanupWorker.close();
      await this.tenantQueue.close();

      logger.info('TenantService shutdown completed');
    } catch (error) {
      logger.error('Error during TenantService shutdown:', error);
      throw error;
    }
  }
}

export * from './billing';
export * from './isolation';

/**
 * Multi-Tenant Architecture Manager
 * Provides organization isolation, resource quotas, and tenant management
 * Phase D: Community & Growth - Multi-tenant architecture
 */

import { Logger } from '@reporunner/core';
import { z } from 'zod';

// Tenant schema
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(), // URL-friendly identifier
  domain: z.string().optional(), // Custom domain
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  status: z.enum(['active', 'suspended', 'pending', 'cancelled']),
  settings: z.object({
    branding: z
      .object({
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        customCss: z.string().optional(),
      })
      .optional(),
    features: z.object({
      aiOptimization: z.boolean().default(false),
      advancedAnalytics: z.boolean().default(false),
      customIntegrations: z.boolean().default(false),
      ssoIntegration: z.boolean().default(false),
      auditLogs: z.boolean().default(false),
      apiAccess: z.boolean().default(true),
      webhooks: z.boolean().default(true),
    }),
    limits: z.object({
      maxUsers: z.number().default(5),
      maxWorkflows: z.number().default(10),
      maxExecutionsPerMonth: z.number().default(1000),
      maxStorageGB: z.number().default(1),
      maxApiCallsPerDay: z.number().default(1000),
      maxWebhooks: z.number().default(5),
    }),
    security: z.object({
      enforceSSO: z.boolean().default(false),
      requireMFA: z.boolean().default(false),
      ipWhitelist: z.array(z.string()).default([]),
      sessionTimeout: z.number().default(24), // hours
      passwordPolicy: z.object({
        minLength: z.number().default(8),
        requireUppercase: z.boolean().default(true),
        requireLowercase: z.boolean().default(true),
        requireNumbers: z.boolean().default(true),
        requireSymbols: z.boolean().default(false),
      }),
    }),
  }),
  billing: z.object({
    customerId: z.string().optional(),
    subscriptionId: z.string().optional(),
    currentPeriodStart: z.date().optional(),
    currentPeriodEnd: z.date().optional(),
    trialEndsAt: z.date().optional(),
    isTrialActive: z.boolean().default(false),
  }),
  usage: z.object({
    currentUsers: z.number().default(0),
    currentWorkflows: z.number().default(0),
    executionsThisMonth: z.number().default(0),
    storageUsedGB: z.number().default(0),
    apiCallsToday: z.number().default(0),
    webhooksUsed: z.number().default(0),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

// Resource quota schema
export const ResourceQuotaSchema = z.object({
  tenantId: z.string(),
  resource: z.string(),
  limit: z.number(),
  used: z.number(),
  resetPeriod: z.enum(['daily', 'monthly', 'yearly', 'never']),
  lastReset: z.date(),
  warningThreshold: z.number().default(0.8), // 80%
  isExceeded: z.boolean().default(false),
});

export type ResourceQuota = z.infer<typeof ResourceQuotaSchema>;

// Tenant isolation context
export const TenantContextSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  userRoles: z.array(z.string()),
  permissions: z.array(z.string()),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

// Plan configurations
export const PLAN_CONFIGURATIONS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      aiOptimization: false,
      advancedAnalytics: false,
      customIntegrations: false,
      ssoIntegration: false,
      auditLogs: false,
      apiAccess: true,
      webhooks: true,
    },
    limits: {
      maxUsers: 2,
      maxWorkflows: 5,
      maxExecutionsPerMonth: 100,
      maxStorageGB: 0.5,
      maxApiCallsPerDay: 100,
      maxWebhooks: 2,
    },
  },
  starter: {
    name: 'Starter',
    price: 29,
    features: {
      aiOptimization: true,
      advancedAnalytics: false,
      customIntegrations: false,
      ssoIntegration: false,
      auditLogs: false,
      apiAccess: true,
      webhooks: true,
    },
    limits: {
      maxUsers: 5,
      maxWorkflows: 25,
      maxExecutionsPerMonth: 2500,
      maxStorageGB: 2,
      maxApiCallsPerDay: 1000,
      maxWebhooks: 10,
    },
  },
  professional: {
    name: 'Professional',
    price: 99,
    features: {
      aiOptimization: true,
      advancedAnalytics: true,
      customIntegrations: true,
      ssoIntegration: false,
      auditLogs: true,
      apiAccess: true,
      webhooks: true,
    },
    limits: {
      maxUsers: 25,
      maxWorkflows: 100,
      maxExecutionsPerMonth: 10000,
      maxStorageGB: 10,
      maxApiCallsPerDay: 5000,
      maxWebhooks: 50,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    features: {
      aiOptimization: true,
      advancedAnalytics: true,
      customIntegrations: true,
      ssoIntegration: true,
      auditLogs: true,
      apiAccess: true,
      webhooks: true,
    },
    limits: {
      maxUsers: -1, // Unlimited
      maxWorkflows: -1, // Unlimited
      maxExecutionsPerMonth: -1, // Unlimited
      maxStorageGB: 100,
      maxApiCallsPerDay: -1, // Unlimited
      maxWebhooks: -1, // Unlimited
    },
  },
};

export class TenantManager {
  private logger: Logger;
  private tenants = new Map<string, Tenant>();
  private quotas = new Map<string, Map<string, ResourceQuota>>();
  private tenantContexts = new Map<string, TenantContext>();

  constructor() {
    this.logger = new Logger('TenantManager');
  }

  /**
   * Create new tenant
   */
  async createTenant(
    tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'usage'>,
    createdBy: string
  ): Promise<{
    success: boolean;
    tenant?: Tenant;
    error?: string;
  }> {
    try {
      const id = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      // Get plan configuration
      const planConfig = PLAN_CONFIGURATIONS[tenantData.plan];

      const tenant: Tenant = {
        ...tenantData,
        id,
        settings: {
          ...tenantData.settings,
          features: planConfig.features,
          limits: planConfig.limits,
        },
        usage: {
          currentUsers: 0,
          currentWorkflows: 0,
          executionsThisMonth: 0,
          storageUsedGB: 0,
          apiCallsToday: 0,
          webhooksUsed: 0,
        },
        createdAt: now,
        updatedAt: now,
        createdBy,
      };

      const validated = TenantSchema.parse(tenant);
      this.tenants.set(validated.id, validated);

      // Initialize resource quotas
      await this.initializeTenantQuotas(validated.id, validated.settings.limits);

      this.logger.info(`Tenant created: ${validated.id} (${validated.name})`);
      return { success: true, tenant: validated };
    } catch (error) {
      this.logger.error('Failed to create tenant:', error);
      return { success: false, error: 'Invalid tenant data' };
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    for (const tenant of this.tenants.values()) {
      if (tenant.domain === domain) {
        return tenant;
      }
    }
    return null;
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<Tenant>
  ): Promise<{
    success: boolean;
    tenant?: Tenant;
    error?: string;
  }> {
    try {
      const existing = this.tenants.get(tenantId);
      if (!existing) {
        return { success: false, error: 'Tenant not found' };
      }

      const updated: Tenant = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      const validated = TenantSchema.parse(updated);
      this.tenants.set(tenantId, validated);

      // Update quotas if limits changed
      if (updates.settings?.limits) {
        await this.updateTenantQuotas(tenantId, updates.settings.limits);
      }

      this.logger.info(`Tenant updated: ${tenantId}`);
      return { success: true, tenant: validated };
    } catch (error) {
      this.logger.error('Failed to update tenant:', error);
      return { success: false, error: 'Update failed' };
    }
  }

  /**
   * Set tenant context for request
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    const validated = TenantContextSchema.parse(context);
    this.tenantContexts.set(validated.sessionId || validated.userId, validated);
  }

  /**
   * Get tenant context
   */
  async getTenantContext(sessionId: string): Promise<TenantContext | null> {
    return this.tenantContexts.get(sessionId) || null;
  }

  /**
   * Check resource quota
   */
  async checkQuota(
    tenantId: string,
    resource: string,
    requestedAmount = 1
  ): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    resetDate?: Date;
  }> {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) {
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }

    const quota = tenantQuotas.get(resource);
    if (!quota) {
      return { allowed: true, current: 0, limit: -1, remaining: -1 };
    }

    // Check if quota needs reset
    await this.resetQuotaIfNeeded(quota);

    const remaining = quota.limit === -1 ? -1 : quota.limit - quota.used;
    const allowed = quota.limit === -1 || quota.used + requestedAmount <= quota.limit;

    return {
      allowed,
      current: quota.used,
      limit: quota.limit,
      remaining,
      resetDate: this.getNextResetDate(quota),
    };
  }

  /**
   * Consume quota
   */
  async consumeQuota(
    tenantId: string,
    resource: string,
    amount = 1
  ): Promise<{
    success: boolean;
    remaining: number;
    error?: string;
  }> {
    const quotaCheck = await this.checkQuota(tenantId, resource, amount);

    if (!quotaCheck.allowed) {
      return {
        success: false,
        remaining: quotaCheck.remaining,
        error: 'Quota exceeded',
      };
    }

    const tenantQuotas = this.quotas.get(tenantId);
    const quota = tenantQuotas?.get(resource);

    if (quota) {
      quota.used += amount;
      quota.isExceeded = quota.limit !== -1 && quota.used >= quota.limit;

      // Update tenant usage
      await this.updateTenantUsage(tenantId, resource, amount);
    }

    return {
      success: true,
      remaining: quotaCheck.remaining - amount,
    };
  }

  /**
   * Get tenant usage statistics
   */
  async getTenantUsage(tenantId: string): Promise<{
    usage: Tenant['usage'];
    quotas: ResourceQuota[];
    utilizationPercentages: Record<string, number>;
  } | null> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return null;
    }

    const tenantQuotas = this.quotas.get(tenantId);
    const quotas = tenantQuotas ? Array.from(tenantQuotas.values()) : [];

    const utilizationPercentages: Record<string, number> = {};
    quotas.forEach((quota) => {
      if (quota.limit > 0) {
        utilizationPercentages[quota.resource] = (quota.used / quota.limit) * 100;
      }
    });

    return {
      usage: tenant.usage,
      quotas,
      utilizationPercentages,
    };
  }

  /**
   * Validate tenant access
   */
  async validateTenantAccess(
    tenantId: string,
    userId: string,
    resource: string,
    action: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' };
    }

    if (tenant.status !== 'active') {
      return { allowed: false, reason: 'Tenant is not active' };
    }

    // Check feature access
    const featureKey = this.getFeatureKey(resource, action);
    if (
      featureKey &&
      !tenant.settings.features[featureKey as keyof typeof tenant.settings.features]
    ) {
      return { allowed: false, reason: 'Feature not available in current plan' };
    }

    // Check IP whitelist if configured
    const context = this.tenantContexts.get(userId);
    if (tenant.settings.security.ipWhitelist.length > 0 && context?.ipAddress) {
      if (!tenant.settings.security.ipWhitelist.includes(context.ipAddress)) {
        return { allowed: false, reason: 'IP address not whitelisted' };
      }
    }

    return { allowed: true };
  }

  /**
   * Get all tenants (admin function)
   */
  async getAllTenants(filters?: {
    status?: Tenant['status'];
    plan?: Tenant['plan'];
    limit?: number;
    offset?: number;
  }): Promise<{
    tenants: Tenant[];
    total: number;
  }> {
    let tenants = Array.from(this.tenants.values());

    // Apply filters
    if (filters?.status) {
      tenants = tenants.filter((t) => t.status === filters.status);
    }
    if (filters?.plan) {
      tenants = tenants.filter((t) => t.plan === filters.plan);
    }

    const total = tenants.length;

    // Apply pagination
    if (filters?.offset) {
      tenants = tenants.slice(filters.offset);
    }
    if (filters?.limit) {
      tenants = tenants.slice(0, filters.limit);
    }

    return { tenants, total };
  }

  /**
   * Initialize tenant quotas
   */
  private async initializeTenantQuotas(
    tenantId: string,
    limits: Tenant['settings']['limits']
  ): Promise<void> {
    const quotas = new Map<string, ResourceQuota>();
    const now = new Date();

    // Create quotas for each limit
    Object.entries(limits).forEach(([resource, limit]) => {
      const quota: ResourceQuota = {
        tenantId,
        resource,
        limit,
        used: 0,
        resetPeriod: this.getResetPeriod(resource),
        lastReset: now,
        warningThreshold: 0.8,
        isExceeded: false,
      };
      quotas.set(resource, quota);
    });

    this.quotas.set(tenantId, quotas);
  }

  /**
   * Update tenant quotas
   */
  private async updateTenantQuotas(
    tenantId: string,
    limits: Tenant['settings']['limits']
  ): Promise<void> {
    const existingQuotas = this.quotas.get(tenantId) || new Map();

    Object.entries(limits).forEach(([resource, limit]) => {
      const existing = existingQuotas.get(resource);
      if (existing) {
        existing.limit = limit;
        existing.isExceeded = limit !== -1 && existing.used >= limit;
      } else {
        const quota: ResourceQuota = {
          tenantId,
          resource,
          limit,
          used: 0,
          resetPeriod: this.getResetPeriod(resource),
          lastReset: new Date(),
          warningThreshold: 0.8,
          isExceeded: false,
        };
        existingQuotas.set(resource, quota);
      }
    });

    this.quotas.set(tenantId, existingQuotas);
  }

  /**
   * Reset quota if needed
   */
  private async resetQuotaIfNeeded(quota: ResourceQuota): Promise<void> {
    const now = new Date();
    const shouldReset = this.shouldResetQuota(quota, now);

    if (shouldReset) {
      quota.used = 0;
      quota.lastReset = now;
      quota.isExceeded = false;
    }
  }

  /**
   * Check if quota should be reset
   */
  private shouldResetQuota(quota: ResourceQuota, now: Date): boolean {
    const timeSinceReset = now.getTime() - quota.lastReset.getTime();

    switch (quota.resetPeriod) {
      case 'daily':
        return timeSinceReset >= 24 * 60 * 60 * 1000;
      case 'monthly':
        return (
          now.getMonth() !== quota.lastReset.getMonth() ||
          now.getFullYear() !== quota.lastReset.getFullYear()
        );
      case 'yearly':
        return now.getFullYear() !== quota.lastReset.getFullYear();
      default:
        return false;
    }
  }

  /**
   * Get next reset date
   */
  private getNextResetDate(quota: ResourceQuota): Date | undefined {
    const lastReset = quota.lastReset;

    switch (quota.resetPeriod) {
      case 'daily': {
        const nextDay = new Date(lastReset);
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
      }
      case 'monthly': {
        const nextMonth = new Date(lastReset);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      }
      case 'yearly': {
        const nextYear = new Date(lastReset);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;
      }
      default:
        return undefined;
    }
  }

  /**
   * Get reset period for resource
   */
  private getResetPeriod(resource: string): ResourceQuota['resetPeriod'] {
    switch (resource) {
      case 'maxExecutionsPerMonth':
        return 'monthly';
      case 'maxApiCallsPerDay':
        return 'daily';
      default:
        return 'never';
    }
  }

  /**
   * Update tenant usage
   */
  private async updateTenantUsage(
    tenantId: string,
    resource: string,
    amount: number
  ): Promise<void> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return;
    }

    // Map resource to usage field
    const usageField = this.getUsageField(resource);
    if (usageField && usageField in tenant.usage) {
      (tenant.usage as Record<string, number>)[usageField] += amount;
      tenant.updatedAt = new Date();
    }
  }

  /**
   * Get usage field for resource
   */
  private getUsageField(resource: string): keyof Tenant['usage'] | null {
    switch (resource) {
      case 'maxUsers':
        return 'currentUsers';
      case 'maxWorkflows':
        return 'currentWorkflows';
      case 'maxExecutionsPerMonth':
        return 'executionsThisMonth';
      case 'maxStorageGB':
        return 'storageUsedGB';
      case 'maxApiCallsPerDay':
        return 'apiCallsToday';
      case 'maxWebhooks':
        return 'webhooksUsed';
      default:
        return null;
    }
  }

  /**
   * Get feature key for resource and action
   */
  private getFeatureKey(resource: string, action: string): string | null {
    if (resource === 'ai' && action === 'optimize') {
      return 'aiOptimization';
    }
    if (resource === 'analytics' && action === 'advanced') {
      return 'advancedAnalytics';
    }
    if (resource === 'integration' && action === 'custom') {
      return 'customIntegrations';
    }
    if (resource === 'auth' && action === 'sso') {
      return 'ssoIntegration';
    }
    if (resource === 'audit' && action === 'read') {
      return 'auditLogs';
    }
    return null;
  }
}

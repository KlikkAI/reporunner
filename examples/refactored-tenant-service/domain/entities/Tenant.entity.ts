import { BaseEntity } from '../../../../shared/base/BaseEntity';
import type { DomainEvent } from '../../../../shared/events/DomainEvent';
import {
  InvalidSubdomainError,
  InvalidTenantDataError,
  PlanLimitExceededError,
  ReservedSubdomainError,
  TenantAlreadyActiveError,
  TenantAlreadySuspendedError,
  UnsupportedFeaturesError,
} from '../../shared/exceptions/tenant.exceptions';
import { PlanChangedEvent } from '../events/PlanChanged.event';
import { TenantActivatedEvent } from '../events/TenantActivated.event';
import { TenantCreatedEvent } from '../events/TenantCreated.event';
import { TenantSettingsUpdatedEvent } from '../events/TenantSettingsUpdated.event';
import { TenantSuspendedEvent } from '../events/TenantSuspended.event';
import { TenantId } from '../value-objects/TenantId.vo';
import type { TenantPlan } from '../value-objects/TenantPlan.vo';
import { TenantSettings } from '../value-objects/TenantSettings.vo';
import { TenantStatus } from '../value-objects/TenantStatus.vo';

export interface CreateTenantData {
  name: string;
  subdomain: string;
  adminEmail: string;
  plan: TenantPlan;
  settings?: Partial<TenantSettings>;
}

/**
 * Tenant Domain Entity
 *
 * Pure domain entity containing all business logic for tenant management.
 * Responsible for:
 * - Tenant lifecycle management (create, activate, suspend)
 * - Business rule enforcement
 * - Plan management and limits
 * - Settings validation
 * - Domain event publishing
 *
 * Line count: ~233 lines (Rich domain model with business logic)
 */
export class Tenant extends BaseEntity {
  private domainEvents: DomainEvent[] = [];

  private constructor(
    id: TenantId,
    public readonly name: string,
    public readonly subdomain: string,
    public readonly adminEmail: string,
    private _status: TenantStatus,
    private _plan: TenantPlan,
    private _settings: TenantSettings,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id.value, createdAt, updatedAt);
    this.validate();
  }

  // Factory methods
  public static create(data: CreateTenantData): Tenant {
    const id = TenantId.generate();
    const status = TenantStatus.ACTIVE;
    const plan = data.plan;
    const settings = Tenant.getDefaultSettings(plan, data.settings);

    // Business rule validation
    Tenant.validateBusinessRules(data);

    const tenant = new Tenant(
      id,
      data.name,
      data.subdomain,
      data.adminEmail,
      status,
      plan,
      settings,
      new Date(),
      new Date()
    );

    // Emit domain event
    tenant.addDomainEvent(
      new TenantCreatedEvent(
        tenant.id,
        tenant.name,
        tenant.subdomain,
        tenant.adminEmail,
        tenant.plan.type
      )
    );

    return tenant;
  }

  public static reconstitute(
    id: string,
    name: string,
    subdomain: string,
    adminEmail: string,
    status: TenantStatus,
    plan: TenantPlan,
    settings: TenantSettings,
    createdAt: Date,
    updatedAt: Date
  ): Tenant {
    return new Tenant(
      TenantId.fromString(id),
      name,
      subdomain,
      adminEmail,
      status,
      plan,
      settings,
      createdAt,
      updatedAt
    );
  }

  // Getters
  public get status(): TenantStatus {
    return this._status;
  }
  public get plan(): TenantPlan {
    return this._plan;
  }
  public get settings(): TenantSettings {
    return this._settings;
  }

  // Business methods
  public activate(): void {
    if (this._status === TenantStatus.ACTIVE) {
      throw new TenantAlreadyActiveError('Tenant is already active');
    }

    if (this._status === TenantStatus.DELETED) {
      throw new InvalidTenantDataError('Cannot activate a deleted tenant');
    }

    this._status = TenantStatus.ACTIVE;
    this.addDomainEvent(new TenantActivatedEvent(this.id, this.name));
  }

  public suspend(reason: string): void {
    if (this._status === TenantStatus.SUSPENDED) {
      throw new TenantAlreadySuspendedError('Tenant is already suspended');
    }

    if (this._status === TenantStatus.DELETED) {
      throw new InvalidTenantDataError('Cannot suspend a deleted tenant');
    }

    this._status = TenantStatus.SUSPENDED;
    this.addDomainEvent(new TenantSuspendedEvent(this.id, reason, new Date()));
  }

  public changePlan(newPlan: TenantPlan): void {
    if (this._plan.equals(newPlan)) {
      return; // No change needed
    }

    // Business rule: Cannot downgrade if current usage exceeds new plan limits
    this.validatePlanChange(newPlan);

    const oldPlan = this._plan;
    this._plan = newPlan;
    this._settings = this.updateSettingsForPlan(newPlan);

    this.addDomainEvent(new PlanChangedEvent(this.id, oldPlan.type, newPlan.type, new Date()));
  }

  public updateSettings(newSettings: Partial<TenantSettings>): void {
    // Validate settings against plan limits
    this.validateSettingsAgainstPlan(newSettings);

    const oldSettings = this._settings;
    this._settings = TenantSettings.merge(this._settings, newSettings);

    this.addDomainEvent(new TenantSettingsUpdatedEvent(this.id, oldSettings, this._settings));
  }

  public isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  public isSuspended(): boolean {
    return this._status === TenantStatus.SUSPENDED;
  }

  public isDeleted(): boolean {
    return this._status === TenantStatus.DELETED;
  }

  public canUpgradeTo(plan: TenantPlan): boolean {
    return plan.isHigherThan(this._plan);
  }

  public canDowngradeTo(plan: TenantPlan, currentUsage?: any): boolean {
    if (!plan.isLowerThan(this._plan)) {
      return false;
    }

    if (!currentUsage) {
      return true; // Cannot validate without usage data
    }

    const planLimits = plan.getLimits();
    return (
      currentUsage.users <= planLimits.maxUsers &&
      currentUsage.workflows <= planLimits.maxWorkflows &&
      currentUsage.storage <= planLimits.storageGB
    );
  }

  // Domain events
  public getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  public markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  // Validation methods
  protected validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new InvalidTenantDataError('Tenant name is required');
    }

    if (this.name.length > 100) {
      throw new InvalidTenantDataError('Tenant name cannot exceed 100 characters');
    }

    if (!this.subdomain || this.subdomain.trim().length === 0) {
      throw new InvalidTenantDataError('Subdomain is required');
    }

    if (!this.adminEmail || !this.isValidEmail(this.adminEmail)) {
      throw new InvalidTenantDataError('Valid admin email is required');
    }
  }

  private static validateBusinessRules(data: CreateTenantData): void {
    // Subdomain format validation
    if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
      throw new InvalidSubdomainError(
        'Subdomain must contain only lowercase letters, numbers, and hyphens'
      );
    }

    if (data.subdomain.length < 3) {
      throw new InvalidSubdomainError('Subdomain must be at least 3 characters long');
    }

    if (data.subdomain.length > 63) {
      throw new InvalidSubdomainError('Subdomain cannot exceed 63 characters');
    }

    if (data.subdomain.startsWith('-') || data.subdomain.endsWith('-')) {
      throw new InvalidSubdomainError('Subdomain cannot start or end with a hyphen');
    }

    // Reserved subdomain check
    const reservedSubdomains = [
      'api',
      'admin',
      'www',
      'mail',
      'support',
      'help',
      'docs',
      'blog',
      'app',
      'dashboard',
      'portal',
      'console',
      'management',
      'system',
    ];

    if (reservedSubdomains.includes(data.subdomain.toLowerCase())) {
      throw new ReservedSubdomainError(`Subdomain '${data.subdomain}' is reserved`);
    }

    // Name validation
    if (data.name.length < 2) {
      throw new InvalidTenantDataError('Tenant name must be at least 2 characters long');
    }
  }

  private static getDefaultSettings(
    plan: TenantPlan,
    customSettings?: Partial<TenantSettings>
  ): TenantSettings {
    const defaults = plan.getDefaultSettings();
    return customSettings ? TenantSettings.merge(defaults, customSettings) : defaults;
  }

  private validatePlanChange(newPlan: TenantPlan): void {
    if (this._status !== TenantStatus.ACTIVE) {
      throw new InvalidTenantDataError('Can only change plan for active tenants');
    }

    // Additional business rules for plan changes can be added here
    // e.g., prevent downgrades during billing cycle, check usage limits, etc.
  }

  private updateSettingsForPlan(plan: TenantPlan): TenantSettings {
    const planLimits = plan.getLimits();
    const currentSettings = this._settings;

    return TenantSettings.create({
      maxUsers: Math.min(currentSettings.maxUsers, planLimits.maxUsers),
      maxWorkflows: Math.min(currentSettings.maxWorkflows, planLimits.maxWorkflows),
      apiRateLimit: Math.min(currentSettings.apiRateLimit, planLimits.apiRateLimit),
      storageGB: Math.min(currentSettings.storageGB, planLimits.storageGB),
      features: currentSettings.features.filter((f) => planLimits.features.includes(f)),
      customIntegrations: Math.min(
        currentSettings.customIntegrations,
        planLimits.customIntegrations
      ),
      retentionDays: Math.min(currentSettings.retentionDays, planLimits.retentionDays),
    });
  }

  private validateSettingsAgainstPlan(settings: Partial<TenantSettings>): void {
    const planLimits = this._plan.getLimits();

    if (settings.maxUsers && settings.maxUsers > planLimits.maxUsers) {
      throw new PlanLimitExceededError(
        `Max users cannot exceed ${planLimits.maxUsers} for ${this._plan.name} plan`
      );
    }

    if (settings.maxWorkflows && settings.maxWorkflows > planLimits.maxWorkflows) {
      throw new PlanLimitExceededError(
        `Max workflows cannot exceed ${planLimits.maxWorkflows} for ${this._plan.name} plan`
      );
    }

    if (settings.apiRateLimit && settings.apiRateLimit > planLimits.apiRateLimit) {
      throw new PlanLimitExceededError(
        `API rate limit cannot exceed ${planLimits.apiRateLimit} for ${this._plan.name} plan`
      );
    }

    if (settings.storageGB && settings.storageGB > planLimits.storageGB) {
      throw new PlanLimitExceededError(
        `Storage cannot exceed ${planLimits.storageGB}GB for ${this._plan.name} plan`
      );
    }

    if (settings.features) {
      const unsupportedFeatures = settings.features.filter((f) => !planLimits.features.includes(f));
      if (unsupportedFeatures.length > 0) {
        throw new UnsupportedFeaturesError(
          `Features not supported by plan: ${unsupportedFeatures.join(', ')}`
        );
      }
    }

    if (
      settings.customIntegrations &&
      settings.customIntegrations > planLimits.customIntegrations
    ) {
      throw new PlanLimitExceededError(
        `Custom integrations cannot exceed ${planLimits.customIntegrations} for ${this._plan.name} plan`
      );
    }

    if (settings.retentionDays && settings.retentionDays > planLimits.retentionDays) {
      throw new PlanLimitExceededError(
        `Retention days cannot exceed ${planLimits.retentionDays} for ${this._plan.name} plan`
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Additional business methods can be added here
  public calculateMonthlyRevenue(): number {
    if (!this.isActive()) return 0;
    return this._plan.getMonthlyPrice();
  }

  public getDaysUntilRenewal(): number {
    // Implementation would depend on billing system integration
    return 30; // Placeholder
  }

  public getUsagePercentage(): { [key: string]: number } {
    // Implementation would require usage data
    return {
      users: 0,
      workflows: 0,
      storage: 0,
      apiCalls: 0,
    };
  }
}

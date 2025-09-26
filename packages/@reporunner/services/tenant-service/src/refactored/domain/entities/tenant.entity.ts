import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { TenantStatus } from '../enums/tenant-status.enum';
import { PlanChangedEvent } from '../events/plan-changed.event';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantSuspendedEvent } from '../events/tenant-suspended.event';
import { TenantUpdatedEvent } from '../events/tenant-updated.event';
import {
  InvalidTenantStateException,
  TenantLimitExceededException,
} from '../exceptions/tenant.exceptions';
import type { BillingInfo } from '../value-objects/billing-info.vo';
import type { SSOConfig } from '../value-objects/sso-config.vo';
import type { TenantPlan } from '../value-objects/tenant-plan.vo';
import type { TenantSettings } from '../value-objects/tenant-settings.vo';

export interface TenantProps {
  id?: string;
  name: string;
  slug: string;
  organizationId: string;
  plan: TenantPlan;
  billingInfo?: BillingInfo;
  ssoConfig?: SSOConfig;
  settings: TenantSettings;
  status: TenantStatus;
  createdAt?: Date;
  updatedAt?: Date;
  ownerId: string;
  metadata?: Record<string, any>;
}

export class Tenant extends AggregateRoot {
  private _id: string;
  private _name: string;
  private _slug: string;
  private _organizationId: string;
  private _plan: TenantPlan;
  private _billingInfo?: BillingInfo;
  private _ssoConfig?: SSOConfig;
  private _settings: TenantSettings;
  private _status: TenantStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _ownerId: string;
  private _metadata: Record<string, any>;

  constructor(props: TenantProps) {
    super();
    this._id = props.id || uuidv4();
    this._name = props.name;
    this._slug = props.slug;
    this._organizationId = props.organizationId;
    this._plan = props.plan;
    this._billingInfo = props.billingInfo;
    this._ssoConfig = props.ssoConfig;
    this._settings = props.settings;
    this._status = props.status;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._ownerId = props.ownerId;
    this._metadata = props.metadata || {};
  }

  // Getters
  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get slug(): string {
    return this._slug;
  }
  get organizationId(): string {
    return this._organizationId;
  }
  get plan(): TenantPlan {
    return this._plan;
  }
  get billingInfo(): BillingInfo | undefined {
    return this._billingInfo;
  }
  get ssoConfig(): SSOConfig | undefined {
    return this._ssoConfig;
  }
  get settings(): TenantSettings {
    return this._settings;
  }
  get status(): TenantStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get ownerId(): string {
    return this._ownerId;
  }
  get metadata(): Record<string, any> {
    return this._metadata;
  }

  // Business Methods

  static create(props: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
    const tenant = new Tenant({
      ...props,
      status: TenantStatus.ACTIVE,
    });

    tenant.addEvent(
      new TenantCreatedEvent({
        tenantId: tenant.id,
        name: tenant.name,
        organizationId: tenant.organizationId,
        plan: tenant.plan.type,
        ownerId: tenant.ownerId,
      })
    );

    return tenant;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name cannot be empty');
    }

    this._name = name;
    this._updatedAt = new Date();

    this.addEvent(
      new TenantUpdatedEvent({
        tenantId: this.id,
        changes: { name },
      })
    );
  }

  changePlan(newPlan: TenantPlan): void {
    if (this._status === TenantStatus.SUSPENDED) {
      throw new InvalidTenantStateException('Cannot change plan for suspended tenant');
    }

    const oldPlan = this._plan;
    this._plan = newPlan;
    this._updatedAt = new Date();

    this.addEvent(
      new PlanChangedEvent({
        tenantId: this.id,
        oldPlan: oldPlan.type,
        newPlan: newPlan.type,
        changedBy: this.ownerId,
      })
    );
  }

  updateBillingInfo(billingInfo: BillingInfo): void {
    this._billingInfo = billingInfo;
    this._updatedAt = new Date();

    this.addEvent(
      new TenantUpdatedEvent({
        tenantId: this.id,
        changes: { billingInfo: billingInfo.toJSON() },
      })
    );
  }

  configureSso(ssoConfig: SSOConfig): void {
    if (!this._plan.features.sso) {
      throw new InvalidTenantStateException('SSO is not available in current plan');
    }

    this._ssoConfig = ssoConfig;
    this._updatedAt = new Date();

    this.addEvent(
      new TenantUpdatedEvent({
        tenantId: this.id,
        changes: { ssoEnabled: true, ssoProvider: ssoConfig.provider },
      })
    );
  }

  updateSettings(settings: Partial<TenantSettings>): void {
    this._settings = this._settings.merge(settings);
    this._updatedAt = new Date();

    this.addEvent(
      new TenantUpdatedEvent({
        tenantId: this.id,
        changes: { settings },
      })
    );
  }

  suspend(reason: string): void {
    if (this._status === TenantStatus.SUSPENDED) {
      throw new InvalidTenantStateException('Tenant is already suspended');
    }

    this._status = TenantStatus.SUSPENDED;
    this._updatedAt = new Date();
    this._metadata.suspendedAt = new Date();
    this._metadata.suspensionReason = reason;

    this.addEvent(
      new TenantSuspendedEvent({
        tenantId: this.id,
        reason,
        suspendedAt: new Date(),
      })
    );
  }

  activate(): void {
    if (this._status === TenantStatus.ACTIVE) {
      throw new InvalidTenantStateException('Tenant is already active');
    }

    this._status = TenantStatus.ACTIVE;
    this._updatedAt = new Date();
    delete this._metadata.suspendedAt;
    delete this._metadata.suspensionReason;

    this.addEvent(
      new TenantUpdatedEvent({
        tenantId: this.id,
        changes: { status: TenantStatus.ACTIVE },
      })
    );
  }

  checkLimit(resource: string, currentUsage: number): void {
    const limit = this._plan.limits[resource];
    if (limit && currentUsage >= limit) {
      throw new TenantLimitExceededException(
        `Tenant has exceeded ${resource} limit: ${currentUsage}/${limit}`
      );
    }
  }

  canUseFeature(feature: string): boolean {
    return this._plan.features[feature] === true;
  }

  isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this._status === TenantStatus.SUSPENDED;
  }

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      name: this._name,
      slug: this._slug,
      organizationId: this._organizationId,
      plan: this._plan.toJSON(),
      billingInfo: this._billingInfo?.toJSON(),
      ssoConfig: this._ssoConfig?.toJSON(),
      settings: this._settings.toJSON(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      ownerId: this._ownerId,
      metadata: this._metadata,
    };
  }
}

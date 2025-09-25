import { v4 as uuidv4 } from 'uuid';
import { TenantPlan } from '../value-objects/tenant-plan.vo';
import { BillingInfo } from '../value-objects/billing-info.vo';
import { SSOConfig } from '../value-objects/sso-config.vo';
import { TenantSettings } from '../value-objects/tenant-settings.vo';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantUpdatedEvent } from '../events/tenant-updated.event';
import { PlanChangedEvent } from '../events/plan-changed.event';
import { TenantSuspendedEvent } from '../events/tenant-suspended.event';
import { DomainEvent } from '../base/domain-event';
import { AggregateRoot } from '../base/aggregate-root';
import { TenantStatus } from '../enums/tenant-status.enum';
import {
  InvalidTenantStateException,
  TenantLimitExceededException,
} from '../exceptions/tenant.exceptions';

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
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get slug(): string { return this._slug; }
  get organizationId(): string { return this._organizationId; }
  get plan(): TenantPlan { return this._plan; }
  get billingInfo(): BillingInfo | undefined { return this._billingInfo; }
  get ssoConfig(): SSOConfig | undefined { return this._ssoConfig; }
  get settings(): TenantSettings { return this._settings; }
  get status(): TenantStatus { return this._status; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get ownerId(): string { return this._ownerId; }
  get metadata(): Record<string, any> { return this._metadata; }

  // Business Methods
  
  static create(props: Omit<TenantProps, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
    const tenant = new Tenant({
      ...props,
      status: TenantStatus.ACTIVE
    });
    
    tenant.addEvent(new TenantCreatedEvent({
      tenantId: tenant.id,
      name: tenant.name,
      organizationId: tenant.organizationId,
      plan: tenant.plan.type,
      ownerId: tenant.ownerId
    }));
    
    return tenant;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name cannot be empty');
    }

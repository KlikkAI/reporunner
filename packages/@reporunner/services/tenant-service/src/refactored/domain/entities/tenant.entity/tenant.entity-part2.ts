this._name = name;
this._updatedAt = new Date();

this.addEvent(
  new TenantUpdatedEvent({
    tenantId: this.id,
    changes: { name },
  })
);
}

  changePlan(newPlan: TenantPlan): void
{
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

updateBillingInfo(billingInfo: BillingInfo)
: void
{
  this._billingInfo = billingInfo;
  this._updatedAt = new Date();

  this.addEvent(
    new TenantUpdatedEvent({
      tenantId: this.id,
      changes: { billingInfo: billingInfo.toJSON() },
    })
  );
}

configureSso(ssoConfig: SSOConfig)
: void
{
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

updateSettings(settings: Partial<TenantSettings>)
: void
{
  this._settings = this._settings.merge(settings);
  this._updatedAt = new Date();

  this.addEvent(
    new TenantUpdatedEvent({
      tenantId: this.id,
      changes: { settings },
    })
  );
}

suspend(reason: string)
: void
{
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

activate();
: void
{
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

checkLimit(resource: string, currentUsage: number)
: void
{
    const limit = this._plan.limits[resource];
    if (limit && currentUsage >= limit) {
      throw new TenantLimitExceededException(
        `Tenant has exceeded ${resource} limit: ${currentUsage}/${limit}`
      );

}
  }

  canUseFeature(feature: string): boolean
{
  return this._plan.features[feature] === true;
}

isActive();
: boolean
{
  return this._status === TenantStatus.ACTIVE;
}

isSuspended();
: boolean
{
  return this._status === TenantStatus.SUSPENDED;
}

toJSON();
: Record<string, any>
{
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
      metadata: this._metadata
    };
}
}

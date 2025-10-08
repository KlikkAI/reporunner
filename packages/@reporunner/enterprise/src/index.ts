export interface EnterpriseConfig {
  features: {
    sso: boolean;
    rbac: boolean;
    audit: boolean;
    compliance: boolean;
  };
  limits: {
    maxUsers: number;
    maxWorkflows: number;
    maxExecutions: number;
  };
}

export interface SSOProvider {
  name: string;
  type: 'saml' | 'oauth' | 'ldap';
  config: Record<string, unknown>;
  enabled: boolean;
}

export class EnterpriseManager {
  constructor(private config: EnterpriseConfig) {}

  isFeatureEnabled(feature: keyof EnterpriseConfig['features']): boolean {
    return this.config.features[feature];
  }

  getLimit(limit: keyof EnterpriseConfig['limits']): number {
    return this.config.limits[limit];
  }
}

export * from './audit';
export * from './compliance';
export * from './rbac';
export * from './sso';

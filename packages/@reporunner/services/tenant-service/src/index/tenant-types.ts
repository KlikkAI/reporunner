

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

ai_features: boolean;
collaboration_tools: boolean;
}
integrations:
{
  enabled: string[];
  disabled: string[];
  custom_configs: Record<string, any>;
}
{
  email_enabled: boolean;
  slack_enabled: boolean;
  webhook_enabled: boolean;
  default_recipients: string[];
}
}
metadata:
{
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
}
{
  database_schema: string;
  storage_prefix: string;
  redis_namespace: string;
  encryption_key_id: string;
  backup_schedule?: string;
}
trial_info?: {
    start_date: Date;
end_date: Date;
extended_days: number;
conversion_probability?: number;
trial_source: string;
}
createdAt: Date
updatedAt: Date
last_activity?: Date
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

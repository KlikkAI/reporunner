apiCalls: number;
api_errors: number;
webhook_calls: number;
integration_usage: Record<string, number>;
feature_usage: Record<string, number>;
error_rate: number;
avg_response_time: number;
concurrent_executions_peak: number;
}
costs?:
{
  compute: number;
  storage: number;
  bandwidth: number;
  integrations: number;
  total: number;
}
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

  constructor(
    redis: RedisService,
    database: DatabaseService,
    eventBus: EventBusService
  ) {
    super();
    this.redis = redis;

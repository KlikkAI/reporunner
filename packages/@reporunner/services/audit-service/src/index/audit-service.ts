recommendations: Array<{
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_impact: number;
}>;
generated_by: string;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  rules: Array<{
    condition: {
      field: string;
      operator: string;
      value: any;
    };
    retention_days: number;
    archive_after_days?: number;
    encryption_required?: boolean;
  }>;
  default_retention_days: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    time_window?: number; // minutes
    threshold?: number;
  }>;
  actions: Array<{
    type: 'email' | 'slack' | 'webhook' | 'sms';
    target: string;
    template?: string;
    immediate?: boolean;
  }>;
  cooldown_minutes?: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  last_triggered?: Date;
}

export interface AuditMetrics {
  total_events: number;
  events_by_severity: Record<string, number>;
  events_by_outcome: Record<string, number>;
  top_users: Array<{ user_id: string; event_count: number }>;
  top_resources: Array<{ resource: string; event_count: number }>;
  top_actions: Array<{ action: string; event_count: number }>;
  risk_distribution: Record<string, number>;
  compliance_scores: Record<string, number>;
  anomalies_detected: number;
  blocked_actions: number;
  period: { start: Date; end: Date };
}

const AuditEventSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.any()),
  outcome: z.enum(['success', 'failure', 'pending']),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  risk_score: z.number().min(0).max(100).optional(),
  geo_location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  compliance_tags: z.array(z.string()).optional(),
  retention_period: z.number().optional(),
});

export class AuditService extends EventEmitter {
  private redis: RedisService;
  private database: DatabaseService;
  private eventBus: EventBusService;
  private auditQueue: Queue;
  private worker: Worker;
  private retentionWorker: Worker;
  private alertWorker: Worker;

  private readonly AUDIT_COLLECTION = 'audit_events';
  private readonly RULES_COLLECTION = 'compliance_rules';

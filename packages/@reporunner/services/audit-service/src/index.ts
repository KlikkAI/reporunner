import type { DatabaseService } from '@reporunner/core/services/database';
import type { EventBusService } from '@reporunner/core/services/eventBus';
import type { RedisService } from '@reporunner/core/services/redis';
import { logger } from '@reporunner/monitoring/logger';
import { type Job, Queue, Worker } from 'bullmq';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { z } from 'zod';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'pending';
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
  geo_location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  compliance_tags?: string[];
  retention_period?: number; // days
  encrypted_fields?: string[];
  hash?: string;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure' | 'pending';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  risk_score_min?: number;
  risk_score_max?: number;
  compliance_tags?: string[];
  search_text?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'timestamp' | 'severity' | 'risk_score';
  sort_order?: 'asc' | 'desc';
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  standard: 'SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI-DSS' | 'CCPA' | 'NIST' | 'Custom';
  category: 'access' | 'data' | 'security' | 'operational' | 'privacy';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conditions: Array<{
    field: string;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'regex'
      | 'exists'
      | 'not_exists';
    value: any;
    case_sensitive?: boolean;
  }>;
  actions: Array<{
    type: 'alert' | 'block' | 'quarantine' | 'notify';
    target?: string;
    immediate?: boolean;
  }>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceReport {
  id: string;
  standard: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  status: 'compliant' | 'non-compliant' | 'partial';
  violations: Array<{
    rule: string;
    rule_id: string;
    count: number;
    severity: string;
    risk_impact: number;
    examples: AuditEvent[];
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  summary: {
    totalEvents: number;
    violations: number;
    complianceScore: number;
    risk_score: number;
    coverage_percentage: number;
  };
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
  private readonly REPORTS_COLLECTION = 'compliance_reports';
  private readonly POLICIES_COLLECTION = 'retention_policies';
  private readonly ALERTS_COLLECTION = 'alert_rules';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly BATCH_SIZE = 1000;

  constructor(redis: RedisService, database: DatabaseService, eventBus: EventBusService) {
    super();
    this.redis = redis;
    this.database = database;
    this.eventBus = eventBus;

    // Initialize BullMQ queues
    this.auditQueue = new Queue('audit-processing', {
      connection: this.redis.getConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.worker = new Worker('audit-processing', this.processAuditJob.bind(this), {
      connection: this.redis.getConnection(),
      concurrency: 5,
    });

    this.retentionWorker = new Worker('audit-retention', this.processRetentionJob.bind(this), {
      connection: this.redis.getConnection(),
      concurrency: 2,
    });

    this.alertWorker = new Worker('audit-alerts', this.processAlertJob.bind(this), {
      connection: this.redis.getConnection(),
      concurrency: 10,
    });

    this.initializeEventListeners();
    this.initializeDatabase();
    this.startRetentionScheduler();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Create indexes for audit events
      await this.database.createIndex(this.AUDIT_COLLECTION, { timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { userId: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { organizationId: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { action: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { resource: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { severity: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { outcome: 1, timestamp: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { risk_score: -1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { compliance_tags: 1 });
      await this.database.createIndex(this.AUDIT_COLLECTION, { hash: 1 }, { unique: true });

      // Create text search index
      await this.database.createIndex(this.AUDIT_COLLECTION, {
        action: 'text',
        resource: 'text',
        'details.description': 'text',
      });

      // Create TTL index for automatic cleanup
      await this.database.createIndex(
        this.AUDIT_COLLECTION,
        { timestamp: 1 },
        { expireAfterSeconds: 31536000 } // 365 days default
      );

      // Create indexes for other collections
      await this.database.createIndex(this.RULES_COLLECTION, { standard: 1, enabled: 1 });
      await this.database.createIndex(this.REPORTS_COLLECTION, { standard: 1, generatedAt: -1 });
      await this.database.createIndex(this.POLICIES_COLLECTION, { enabled: 1 });
      await this.database.createIndex(this.ALERTS_COLLECTION, { enabled: 1 });

      logger.info('AuditService database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create AuditService database indexes:', error);
      throw error;
    }
  }

  private initializeEventListeners(): void {
    this.worker.on('completed', (job) => {
      logger.debug(`Audit job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Audit job ${job?.id} failed:`, err);
    });

    this.eventBus.on('audit.event', (eventData) => {
      this.logEventAsync(eventData).catch((err) => {
        logger.error('Failed to log audit event:', err);
      });
    });

    this.eventBus.on('compliance.rule.violated', (data) => {
      this.handleComplianceViolation(data);
    });
  }

  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>): Promise<string> {
    try {
      // Validate input
      const validatedEvent = AuditEventSchema.parse(event);

      const auditEvent: AuditEvent = {
        ...validatedEvent,
        id: this.generateId(),
        timestamp: new Date(),
        hash: this.calculateEventHash({
          ...validatedEvent,
          timestamp: new Date(),
        }),
      };

      // Add to processing queue for async handling
      await this.auditQueue.add('process-audit-event', auditEvent, {
        priority: this.getSeverityPriority(auditEvent.severity),
      });

      // Cache recent event for quick access
      await this.cacheRecentEvent(auditEvent);

      // Emit real-time event
      this.emit('audit.logged', auditEvent);
      this.eventBus.emit('audit.event.logged', auditEvent);

      return auditEvent.id;
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      throw new Error(`Failed to log audit event: ${error.message}`);
    }
  }

  async logEventAsync(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>): Promise<void> {
    try {
      await this.logEvent(event);
    } catch (error) {
      logger.error('Failed to log audit event async:', error);
    }
  }

  async logBulkEvents(
    events: Array<Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>>
  ): Promise<string[]> {
    const eventIds: string[] = [];
    const batchSize = Math.min(this.BATCH_SIZE, events.length);

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const batchPromises = batch.map((event) => this.logEvent(event));
      const batchIds = await Promise.all(batchPromises);
      eventIds.push(...batchIds);
    }

    return eventIds;
  }

  private async processAuditJob(job: Job): Promise<void> {
    const auditEvent: AuditEvent = job.data;

    try {
      // Store in database
      await this.database.create(this.AUDIT_COLLECTION, auditEvent);

      // Check compliance rules
      await this.checkComplianceRules(auditEvent);

      // Check alert rules
      await this.checkAlertRules(auditEvent);

      // Update metrics cache
      await this.updateMetricsCache(auditEvent);

      logger.debug(`Audit event ${auditEvent.id} processed successfully`);
    } catch (error) {
      logger.error(`Failed to process audit event ${auditEvent.id}:`, error);
      throw error;
    }
  }

  async queryEvents(filter: AuditFilter): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      const cacheKey = `audit:query:${this.hashFilter(filter)}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const mongoFilter = this.buildMongoFilter(filter);
      const sortOptions = this.buildSortOptions(filter);

      const [events, total] = await Promise.all([
        this.database.findMany(this.AUDIT_COLLECTION, mongoFilter, {
          sort: sortOptions,
          limit: filter.limit || 100,
          skip: filter.offset || 0,
        }),
        this.database.countDocuments(this.AUDIT_COLLECTION, mongoFilter),
      ]);

      const result = { events, total };

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Failed to query audit events:', error);
      throw new Error(`Failed to query audit events: ${error.message}`);
    }
  }

  async exportEvents(
    filter: AuditFilter,
    format: 'json' | 'csv' | 'xml' | 'xlsx'
  ): Promise<Buffer | string> {
    try {
      const { events } = await this.queryEvents({
        ...filter,
        limit: undefined, // Remove limit for export
        offset: undefined,
      });

      switch (format) {
        case 'json':
          return JSON.stringify(events, null, 2);
        case 'csv':
          return this.convertToCSV(events);
        case 'xml':
          return this.convertToXML(events);
        case 'xlsx':
          return await this.convertToXLSX(events);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      logger.error('Failed to export audit events:', error);
      throw new Error(`Failed to export audit events: ${error.message}`);
    }
  }

  async addComplianceRule(
    rule: Omit<ComplianceRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const complianceRule: ComplianceRule = {
        ...rule,
        id: this.generateId(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await this.database.create(this.RULES_COLLECTION, complianceRule);
      await this.redis.del('compliance:rules:*'); // Invalidate cache

      logger.info(`Compliance rule ${complianceRule.id} added successfully`);
      this.eventBus.emit('compliance.rule.added', complianceRule);

      return complianceRule.id;
    } catch (error) {
      logger.error('Failed to add compliance rule:', error);
      throw new Error(`Failed to add compliance rule: ${error.message}`);
    }
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<void> {
    try {
      await this.database.updateOne(
        this.RULES_COLLECTION,
        { id },
        { ...updates, updated_at: new Date() }
      );

      await this.redis.del('compliance:rules:*');
      this.eventBus.emit('compliance.rule.updated', { id, updates });

      logger.info(`Compliance rule ${id} updated successfully`);
    } catch (error) {
      logger.error('Failed to update compliance rule:', error);
      throw new Error(`Failed to update compliance rule: ${error.message}`);
    }
  }

  async getComplianceRules(standard?: string): Promise<ComplianceRule[]> {
    try {
      const cacheKey = `compliance:rules:${standard || 'all'}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const filter = standard ? { standard, enabled: true } : { enabled: true };
      const rules = await this.database.findMany(this.RULES_COLLECTION, filter);

      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(rules));
      return rules;
    } catch (error) {
      logger.error('Failed to get compliance rules:', error);
      throw new Error(`Failed to get compliance rules: ${error.message}`);
    }
  }

  async generateComplianceReport(
    standard: string,
    period: { start: Date; end: Date },
    options: { includeRecommendations?: boolean; detailed?: boolean } = {}
  ): Promise<ComplianceReport> {
    try {
      const relevantRules = await this.getComplianceRules(standard);
      const { events: periodEvents } = await this.queryEvents({
        startDate: period.start,
        endDate: period.end,
        limit: undefined,
      });

      const violations: ComplianceReport['violations'] = [];
      let totalViolations = 0;
      let totalRiskScore = 0;

      for (const rule of relevantRules) {
        const violatingEvents = periodEvents.filter((event) =>
          this.checkRuleViolation(rule, event)
        );

        if (violatingEvents.length > 0) {
          const riskImpact = this.calculateRiskImpact(rule, violatingEvents);

          violations.push({
            rule: rule.name,
            rule_id: rule.id,
            count: violatingEvents.length,
            severity: this.calculateRuleSeverity(violatingEvents),
            risk_impact: riskImpact,
            examples: violatingEvents.slice(0, 5),
            trend: await this.calculateViolationTrend(rule.id, period),
          });

          totalViolations += violatingEvents.length;
          totalRiskScore += riskImpact;
        }
      }

      const complianceScore = Math.max(
        0,
        Math.min(
          100,
          ((periodEvents.length - totalViolations) / Math.max(1, periodEvents.length)) * 100
        )
      );

      const coveragePercentage =
        (relevantRules.length / this.getTotalRulesForStandard(standard)) * 100;

      const report: ComplianceReport = {
        id: this.generateId(),
        standard,
        generatedAt: new Date(),
        period,
        status:
          complianceScore >= 95 ? 'compliant' : complianceScore >= 80 ? 'partial' : 'non-compliant',
        violations,
        summary: {
          totalEvents: periodEvents.length,
          violations: totalViolations,
          complianceScore: Math.round(complianceScore),
          risk_score: Math.round(totalRiskScore),
          coverage_percentage: Math.round(coveragePercentage),
        },
        recommendations: options.includeRecommendations
          ? await this.generateRecommendations(violations, periodEvents)
          : [],
        generated_by: 'system',
      };

      // Store report
      await this.database.create(this.REPORTS_COLLECTION, report);

      logger.info(`Compliance report generated for ${standard}: ${report.status}`);
      this.eventBus.emit('compliance.report.generated', report);

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw new Error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  async getAuditMetrics(filter: Omit<AuditFilter, 'limit' | 'offset'>): Promise<AuditMetrics> {
    try {
      const cacheKey = `audit:metrics:${this.hashFilter(filter)}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const { events } = await this.queryEvents({
        ...filter,
        limit: undefined,
        offset: undefined,
      });

      const metrics: AuditMetrics = {
        total_events: events.length,
        events_by_severity: this.groupBy(events, 'severity'),
        events_by_outcome: this.groupBy(events, 'outcome'),
        top_users: this.getTopItems(events, 'userId', 10),
        top_resources: this.getTopItems(events, 'resource', 10),
        top_actions: this.getTopItems(events, 'action', 10),
        risk_distribution: this.getRiskDistribution(events),
        compliance_scores: await this.getComplianceScores(events),
        anomalies_detected: await this.countAnomalies(events),
        blocked_actions: events.filter((e) => e.outcome === 'failure' && e.severity === 'critical')
          .length,
        period: {
          start:
            filter.startDate || new Date(Math.min(...events.map((e) => e.timestamp.getTime()))),
          end: filter.endDate || new Date(Math.max(...events.map((e) => e.timestamp.getTime()))),
        },
      };

      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      logger.error('Failed to get audit metrics:', error);
      throw new Error(`Failed to get audit metrics: ${error.message}`);
    }
  }

  async addRetentionPolicy(
    policy: Omit<RetentionPolicy, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    try {
      const retentionPolicy: RetentionPolicy = {
        ...policy,
        id: this.generateId(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      await this.database.create(this.POLICIES_COLLECTION, retentionPolicy);
      await this.redis.del('retention:policies:*');

      logger.info(`Retention policy ${retentionPolicy.id} added successfully`);
      return retentionPolicy.id;
    } catch (error) {
      logger.error('Failed to add retention policy:', error);
      throw new Error(`Failed to add retention policy: ${error.message}`);
    }
  }

  async addAlertRule(rule: Omit<AlertRule, 'id' | 'created_at'>): Promise<string> {
    try {
      const alertRule: AlertRule = {
        ...rule,
        id: this.generateId(),
        created_at: new Date(),
      };

      await this.database.create(this.ALERTS_COLLECTION, alertRule);
      await this.redis.del('alert:rules:*');

      logger.info(`Alert rule ${alertRule.id} added successfully`);
      return alertRule.id;
    } catch (error) {
      logger.error('Failed to add alert rule:', error);
      throw new Error(`Failed to add alert rule: ${error.message}`);
    }
  }

  private async checkComplianceRules(event: AuditEvent): Promise<void> {
    try {
      const rules = await this.getComplianceRules();
      const violations: ComplianceRule[] = [];

      for (const rule of rules) {
        if (this.checkRuleViolation(rule, event)) {
          violations.push(rule);

          // Execute rule actions
          for (const action of rule.actions) {
            if (action.immediate) {
              await this.executeRuleAction(rule, event, action);
            } else {
              await this.auditQueue.add('execute-rule-action', {
                rule,
                event,
                action,
              });
            }
          }
        }
      }

      if (violations.length > 0) {
        this.eventBus.emit('compliance.violations.detected', {
          event,
          violations,
        });
      }
    } catch (error) {
      logger.error('Failed to check compliance rules:', error);
    }
  }

  private async checkAlertRules(event: AuditEvent): Promise<void> {
    try {
      const rules = await this.database.findMany(this.ALERTS_COLLECTION, { enabled: true });

      for (const rule of rules) {
        if (await this.shouldTriggerAlert(rule, event)) {
          await this.auditQueue.add(
            'trigger-alert',
            {
              rule,
              event,
            },
            {
              priority: this.getSeverityPriority(rule.severity),
            }
          );
        }
      }
    } catch (error) {
      logger.error('Failed to check alert rules:', error);
    }
  }

  private checkRuleViolation(rule: ComplianceRule, event: AuditEvent): boolean {
    return rule.conditions.every((condition) => {
      const eventValue = this.getEventFieldValue(event, condition.field);

      switch (condition.operator) {
        case 'equals':
          return eventValue === condition.value;
        case 'not_equals':
          return eventValue !== condition.value;
        case 'contains': {
          const containsValue = String(eventValue);
          const searchValue = String(condition.value);
          return condition.case_sensitive
            ? containsValue.includes(searchValue)
            : containsValue.toLowerCase().includes(searchValue.toLowerCase());
        }
        case 'not_contains': {
          const notContainsValue = String(eventValue);
          const notSearchValue = String(condition.value);
          return condition.case_sensitive
            ? !notContainsValue.includes(notSearchValue)
            : !notContainsValue.toLowerCase().includes(notSearchValue.toLowerCase());
        }
        case 'greater_than':
          return Number(eventValue) > Number(condition.value);
        case 'less_than':
          return Number(eventValue) < Number(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(eventValue));
        case 'exists':
          return eventValue !== undefined && eventValue !== null;
        case 'not_exists':
          return eventValue === undefined || eventValue === null;
        default:
          return false;
      }
    });
  }

  private async shouldTriggerAlert(rule: AlertRule, event: AuditEvent): boolean {
    // Check if rule is in cooldown
    if (rule.last_triggered && rule.cooldown_minutes) {
      const cooldownEnd = new Date(rule.last_triggered.getTime() + rule.cooldown_minutes * 60000);
      if (new Date() < cooldownEnd) {
        return false;
      }
    }

    // Check conditions
    for (const condition of rule.conditions) {
      const eventValue = this.getEventFieldValue(event, condition.field);

      if (condition.time_window && condition.threshold) {
        // Time-based threshold check
        const windowStart = new Date(Date.now() - condition.time_window * 60000);
        const recentEvents = await this.database.countDocuments(this.AUDIT_COLLECTION, {
          timestamp: { $gte: windowStart },
          [condition.field]: condition.value,
        });

        if (recentEvents < condition.threshold) {
          return false;
        }
      } else {
        // Simple condition check
        if (!this.checkSimpleCondition(eventValue, condition.operator, condition.value)) {
          return false;
        }
      }
    }

    return true;
  }

  private checkSimpleCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return value === expected;
      case 'not_equals':
        return value !== expected;
      case 'contains':
        return String(value).includes(String(expected));
      case 'greater_than':
        return Number(value) > Number(expected);
      case 'less_than':
        return Number(value) < Number(expected);
      default:
        return false;
    }
  }

  private async executeRuleAction(
    rule: ComplianceRule,
    event: AuditEvent,
    action: any
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          this.eventBus.emit('audit.alert', {
            rule: rule.name,
            event,
            severity: rule.severity,
            message: `Compliance rule violation: ${rule.description}`,
          });
          break;
        case 'block':
          this.eventBus.emit('audit.block', {
            rule: rule.name,
            event,
            target: action.target,
          });
          break;
        case 'quarantine':
          this.eventBus.emit('audit.quarantine', {
            rule: rule.name,
            event,
            target: action.target,
          });
          break;
        case 'notify':
          this.eventBus.emit('audit.notify', {
            rule: rule.name,
            event,
            target: action.target,
          });
          break;
      }
    } catch (error) {
      logger.error('Failed to execute rule action:', error);
    }
  }

  private processRetentionJob = async (job: Job): Promise<void> => {
    try {
      const policies = await this.database.findMany(this.POLICIES_COLLECTION, { enabled: true });

      for (const policy of policies) {
        for (const rule of policy.rules) {
          const cutoffDate = new Date(Date.now() - rule.retention_days * 24 * 60 * 60 * 1000);

          const filter = {
            timestamp: { $lt: cutoffDate },
            ...this.buildRetentionFilter(rule.condition),
          };

          if (rule.archive_after_days) {
            const archiveDate = new Date(
              Date.now() - rule.archive_after_days * 24 * 60 * 60 * 1000
            );
            // Archive old events
            await this.archiveEvents(filter, archiveDate);
          }

          // Delete expired events
          const deleteResult = await this.database.deleteMany(this.AUDIT_COLLECTION, filter);

          logger.info(
            `Retention policy ${policy.id} processed: deleted ${deleteResult.deletedCount} events`
          );
        }
      }
    } catch (error) {
      logger.error('Failed to process retention job:', error);
      throw error;
    }
  };

  private processAlertJob = async (job: Job): Promise<void> => {
    const { rule, event } = job.data;

    try {
      // Execute alert actions
      for (const action of rule.actions) {
        await this.executeAlertAction(rule, event, action);
      }

      // Update last triggered time
      await this.database.updateOne(
        this.ALERTS_COLLECTION,
        { id: rule.id },
        { last_triggered: new Date() }
      );

      logger.info(`Alert ${rule.id} triggered successfully`);
    } catch (error) {
      logger.error(`Failed to process alert job for rule ${rule.id}:`, error);
      throw error;
    }
  };

  private async executeAlertAction(rule: AlertRule, event: AuditEvent, action: any): Promise<void> {
    switch (action.type) {
      case 'email':
        this.eventBus.emit('notification.send', {
          type: 'email',
          target: action.target,
          subject: `Audit Alert: ${rule.name}`,
          template: action.template || 'audit_alert',
          data: { rule, event },
        });
        break;
      case 'slack':
        this.eventBus.emit('notification.send', {
          type: 'slack',
          target: action.target,
          template: action.template || 'audit_alert_slack',
          data: { rule, event },
        });
        break;
      case 'webhook':
        this.eventBus.emit('notification.send', {
          type: 'webhook',
          target: action.target,
          data: { rule, event, alert_type: 'audit' },
        });
        break;
      case 'sms':
        this.eventBus.emit('notification.send', {
          type: 'sms',
          target: action.target,
          message: `Audit Alert: ${rule.name} - ${event.action} on ${event.resource}`,
        });
        break;
    }
  }

  private buildMongoFilter(filter: AuditFilter): any {
    const mongoFilter: any = {};

    if (filter.startDate || filter.endDate) {
      mongoFilter.timestamp = {};
      if (filter.startDate) mongoFilter.timestamp.$gte = filter.startDate;
      if (filter.endDate) mongoFilter.timestamp.$lte = filter.endDate;
    }

    if (filter.userId) mongoFilter.userId = filter.userId;
    if (filter.organizationId) mongoFilter.organizationId = filter.organizationId;
    if (filter.action) mongoFilter.action = filter.action;
    if (filter.resource) mongoFilter.resource = filter.resource;
    if (filter.outcome) mongoFilter.outcome = filter.outcome;
    if (filter.severity) mongoFilter.severity = filter.severity;

    if (filter.risk_score_min !== undefined || filter.risk_score_max !== undefined) {
      mongoFilter.risk_score = {};
      if (filter.risk_score_min !== undefined) mongoFilter.risk_score.$gte = filter.risk_score_min;
      if (filter.risk_score_max !== undefined) mongoFilter.risk_score.$lte = filter.risk_score_max;
    }

    if (filter.compliance_tags && filter.compliance_tags.length > 0) {
      mongoFilter.compliance_tags = { $in: filter.compliance_tags };
    }

    if (filter.search_text) {
      mongoFilter.$text = { $search: filter.search_text };
    }

    return mongoFilter;
  }

  private buildSortOptions(filter: AuditFilter): any {
    const sortBy = filter.sort_by || 'timestamp';
    const sortOrder = filter.sort_order === 'asc' ? 1 : -1;
    return { [sortBy]: sortOrder };
  }

  private buildRetentionFilter(condition: any): any {
    const filter: any = {};
    const field = condition.field;
    const value = condition.value;

    switch (condition.operator) {
      case 'equals':
        filter[field] = value;
        break;
      case 'contains':
        filter[field] = { $regex: value, $options: 'i' };
        break;
      case 'greater_than':
        filter[field] = { $gt: value };
        break;
      case 'less_than':
        filter[field] = { $lt: value };
        break;
    }

    return filter;
  }

  private async cacheRecentEvent(event: AuditEvent): Promise<void> {
    const key = `audit:recent:${event.organizationId}`;
    await this.redis.lpush(key, JSON.stringify(event));
    await this.redis.ltrim(key, 0, 99); // Keep last 100 events
    await this.redis.expire(key, 3600); // 1 hour TTL
  }

  private async updateMetricsCache(event: AuditEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const metricsKey = `audit:metrics:${event.organizationId}:${today}`;

    await Promise.all([
      this.redis.hincrby(metricsKey, 'total_events', 1),
      this.redis.hincrby(metricsKey, `severity_${event.severity}`, 1),
      this.redis.hincrby(metricsKey, `outcome_${event.outcome}`, 1),
      this.redis.hincrby(metricsKey, `action_${event.action}`, 1),
      this.redis.expire(metricsKey, 86400 * 7), // 7 days TTL
    ]);
  }

  private startRetentionScheduler(): void {
    // Schedule retention cleanup every 6 hours
    setInterval(
      () => {
        this.auditQueue.add(
          'process-retention',
          {},
          {
            repeat: { every: 6 * 60 * 60 * 1000 }, // 6 hours
          }
        );
      },
      6 * 60 * 60 * 1000
    );
  }

  private async archiveEvents(filter: any, archiveDate: Date): Promise<void> {
    // Implementation for archiving events to cold storage
    // This could be S3, tape storage, or another database
    logger.info('Archiving events (implementation needed for cold storage)');
  }

  private getEventFieldValue(event: AuditEvent, field: string): any {
    const fields = field.split('.');
    let value: any = event;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }

  private calculateRuleSeverity(events: AuditEvent[]): string {
    const severityLevels = events.map((e) => e.severity);

    if (severityLevels.includes('critical')) return 'critical';
    if (severityLevels.includes('high')) return 'high';
    if (severityLevels.includes('medium')) return 'medium';
    return 'low';
  }

  private calculateRiskImpact(rule: ComplianceRule, events: AuditEvent[]): number {
    const baseRisk = { low: 10, medium: 25, high: 50, critical: 100 }[rule.severity] || 10;
    const eventCount = events.length;
    const avgRiskScore = events.reduce((sum, e) => sum + (e.risk_score || 0), 0) / events.length;

    return Math.round(baseRisk * (1 + Math.log(eventCount)) * (1 + avgRiskScore / 100));
  }

  private async calculateViolationTrend(
    ruleId: string,
    period: { start: Date; end: Date }
  ): Promise<'increasing' | 'decreasing' | 'stable'> {
    // Calculate trend by comparing with previous period
    const periodDuration = period.end.getTime() - period.start.getTime();
    const previousPeriod = {
      start: new Date(period.start.getTime() - periodDuration),
      end: period.start,
    };

    const [currentCount, previousCount] = await Promise.all([
      this.database.countDocuments(this.AUDIT_COLLECTION, {
        timestamp: { $gte: period.start, $lte: period.end },
        // Add rule matching logic here
      }),
      this.database.countDocuments(this.AUDIT_COLLECTION, {
        timestamp: { $gte: previousPeriod.start, $lte: previousPeriod.end },
        // Add rule matching logic here
      }),
    ]);

    const changePercent =
      previousCount === 0
        ? currentCount > 0
          ? 100
          : 0
        : ((currentCount - previousCount) / previousCount) * 100;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private getTotalRulesForStandard(standard: string): number {
    const ruleCounts = {
      SOC2: 200,
      GDPR: 150,
      HIPAA: 180,
      ISO27001: 114,
      'PCI-DSS': 300,
      CCPA: 100,
      NIST: 400,
    };

    return ruleCounts[standard] || 100;
  }

  private async generateRecommendations(
    violations: ComplianceReport['violations'],
    events: AuditEvent[]
  ): Promise<ComplianceReport['recommendations']> {
    const recommendations = [];

    // High-frequency violation recommendation
    const highFreqViolations = violations.filter((v) => v.count > 10);
    if (highFreqViolations.length > 0) {
      recommendations.push({
        title: 'Address High-Frequency Violations',
        description: `${highFreqViolations.length} rules have more than 10 violations. Focus on these areas first.`,
        priority: 'high' as const,
        estimated_impact: 30,
      });
    }

    // Critical severity recommendation
    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push({
        title: 'Immediate Action Required',
        description: `${criticalViolations.length} critical violations detected. Immediate remediation required.`,
        priority: 'critical' as const,
        estimated_impact: 50,
      });
    }

    // Trend-based recommendation
    const increasingViolations = violations.filter((v) => v.trend === 'increasing');
    if (increasingViolations.length > 0) {
      recommendations.push({
        title: 'Monitor Increasing Trends',
        description: `${increasingViolations.length} violation types are increasing. Implement preventive measures.`,
        priority: 'medium' as const,
        estimated_impact: 20,
      });
    }

    return recommendations;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce(
      (groups, item) => {
        const value = String(item[key]);
        groups[value] = (groups[value] || 0) + 1;
        return groups;
      },
      {} as Record<string, number>
    );
  }

  private getTopItems<T>(
    array: T[],
    key: keyof T,
    limit: number
  ): Array<{ [K in keyof T]: T[K] } & { event_count: number }> {
    const counts = this.groupBy(array, key);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(
        ([value, count]) =>
          ({
            [key]: value,
            event_count: count,
          }) as any
      );
  }

  private getRiskDistribution(events: AuditEvent[]): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    events.forEach((event) => {
      const riskScore = event.risk_score || 0;
      if (riskScore >= 80) distribution.critical++;
      else if (riskScore >= 60) distribution.high++;
      else if (riskScore >= 30) distribution.medium++;
      else distribution.low++;
    });

    return distribution;
  }

  private async getComplianceScores(events: AuditEvent[]): Promise<Record<string, number>> {
    const standards = ['SOC2', 'GDPR', 'HIPAA', 'ISO27001', 'PCI-DSS'];
    const scores: Record<string, number> = {};

    for (const standard of standards) {
      const rules = await this.getComplianceRules(standard);
      let violations = 0;

      for (const rule of rules) {
        violations += events.filter((event) => this.checkRuleViolation(rule, event)).length;
      }

      const score = Math.max(
        0,
        Math.min(100, ((events.length - violations) / Math.max(1, events.length)) * 100)
      );
      scores[standard] = Math.round(score);
    }

    return scores;
  }

  private async countAnomalies(events: AuditEvent[]): Promise<number> {
    // Simple anomaly detection based on unusual patterns
    let anomalies = 0;

    // Check for unusual high-risk events
    anomalies += events.filter((e) => e.risk_score && e.risk_score > 90).length;

    // Check for unusual failure rates
    const failures = events.filter((e) => e.outcome === 'failure').length;
    const failureRate = failures / events.length;
    if (failureRate > 0.1) anomalies += Math.floor(failures * 0.5); // 50% of failures considered anomalies

    // Check for unusual activity patterns (high frequency from single user)
    const userCounts = this.groupBy(events, 'userId');
    const avgEventsPerUser = events.length / Object.keys(userCounts).length;

    Object.values(userCounts).forEach((count) => {
      if (count > avgEventsPerUser * 5) {
        // 5x above average
        anomalies += Math.floor(count * 0.2); // 20% considered anomalies
      }
    });

    return anomalies;
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = [
      'id',
      'timestamp',
      'userId',
      'organizationId',
      'action',
      'resource',
      'resourceId',
      'outcome',
      'severity',
      'risk_score',
      'ip',
      'userAgent',
      'sessionId',
      'details',
    ];

    const rows = events.map((event) =>
      headers
        .map((header) => {
          const value = event[header as keyof AuditEvent];
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    const xmlEvents = events
      .map((event) => {
        const fields = Object.entries(event)
          .map(([key, value]) => {
            const xmlValue =
              typeof value === 'object' && value !== null
                ? `<![CDATA[${JSON.stringify(value)}]]>`
                : String(value || '');
            return `<${key}>${xmlValue}</${key}>`;
          })
          .join('');
        return `<event>${fields}</event>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?><audit_events>${xmlEvents}</audit_events>`;
  }

  private async convertToXLSX(events: AuditEvent[]): Promise<Buffer> {
    // Implementation would require xlsx library
    // For now, return CSV as bytes
    const csv = this.convertToCSV(events);
    return Buffer.from(csv, 'utf8');
  }

  private calculateEventHash(event: Partial<AuditEvent>): string {
    const hashableFields = {
      userId: event.userId,
      organizationId: event.organizationId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      outcome: event.outcome,
      timestamp: event.timestamp?.toISOString(),
    };

    const hashString = JSON.stringify(hashableFields);
    return createHash('sha256').update(hashString).digest('hex');
  }

  private getSeverityPriority(severity: string): number {
    const priorities = { critical: 1, high: 2, medium: 3, low: 4 };
    return priorities[severity] || 4;
  }

  private hashFilter(filter: AuditFilter): string {
    return createHash('md5').update(JSON.stringify(filter)).digest('hex');
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleComplianceViolation(data: any): void {
    logger.warn('Compliance violation detected:', {
      event: data.event.id,
      violations: data.violations.map((v: ComplianceRule) => v.name),
    });

    // Emit high-priority alert for critical violations
    const criticalViolations = data.violations.filter(
      (v: ComplianceRule) => v.severity === 'critical'
    );
    if (criticalViolations.length > 0) {
      this.emit('critical.violation', {
        event: data.event,
        violations: criticalViolations,
      });
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.retentionWorker.close();
      await this.alertWorker.close();
      await this.auditQueue.close();

      logger.info('AuditService shutdown completed');
    } catch (error) {
      logger.error('Error during AuditService shutdown:', error);
      throw error;
    }
  }
}

export * from './compliance';
export * from './retention';

import { DatabaseService } from '@reporunner/core/services/database';
import { EventBusService } from '@reporunner/core/services/eventBus';
import { RedisService } from '@reporunner/core/services/redis';
import { logger } from '@reporunner/monitoring/logger';
import { Job, Queue, Worker } from 'bullmq';
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

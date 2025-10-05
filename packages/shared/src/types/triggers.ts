/**
 * Shared Trigger Types and Constants
 * Centralized trigger-related types, enums, and validation schemas
 */

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const TRIGGER_TYPES = [
  'webhook',
  'schedule',
  'event',
  'manual',
  'api',
  'file_change',
  'database_change'
] as const;

export const TRIGGER_STATUSES = [
  'active',
  'inactive',
  'paused',
  'error'
] as const;

export const TRIGGER_CONDITIONS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'regex_match',
  'exists',
  'not_exists'
] as const;

export const WEBHOOK_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE'
] as const;

export const EVENT_TYPES = [
  'workflow_started',
  'workflow_completed',
  'workflow_failed',
  'user_created',
  'user_updated',
  'data_changed',
  'system_alert',
  'custom'
] as const;

export const EXECUTION_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TriggerType = typeof TRIGGER_TYPES[number];
export type TriggerStatus = typeof TRIGGER_STATUSES[number];
export type TriggerCondition = typeof TRIGGER_CONDITIONS[number];
export type WebhookMethod = typeof WEBHOOK_METHODS[number];
export type EventType = typeof EVENT_TYPES[number];
export type ExecutionStatus = typeof EXECUTION_STATUSES[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface TriggerConditionRule {
  field: string;
  condition: TriggerCondition;
  value: any;
  caseSensitive?: boolean;
}

export interface WebhookConfig {
  url: string;
  method: WebhookMethod;
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key';
    credentials?: Record<string, string>;
  };
  timeout?: number;
  retries?: number;
}

export interface EventConfig {
  eventType: EventType;
  source?: string;
  filters?: Record<string, any>;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface Trigger {
  id: string;
  name: string;
  description?: string;
  type: TriggerType;
  status: TriggerStatus;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;

  // Configuration based on trigger type
  webhookConfig?: WebhookConfig;
  eventConfig?: EventConfig;
  scheduleConfig?: ScheduleConfig;

  // Conditions and actions
  conditions?: TriggerConditionRule[];
  workflowId?: string;
  actionConfig?: Record<string, any>;

  // Metadata and settings
  enabled: boolean;
  priority: number;
  maxExecutions?: number;
  executionCount: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TriggerExecution {
  id: string;
  triggerId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;

  // Input and output data
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;

  // Execution context
  executedBy?: string;
  workflowExecutionId?: string;
  metadata?: Record<string, any>;
}

export interface TriggerEvent {
  id: string;
  triggerId: string;
  eventType: string;
  timestamp: Date;
  source: string;
  data: Record<string, any>;
  processed: boolean;
  processingError?: string;
}

export interface TriggerMetrics {
  triggerId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: Date;
  successRate: number;

  // Time-based metrics
  executionsToday: number;
  executionsThisWeek: number;
  executionsThisMonth: number;

  // Performance metrics
  minDuration: number;
  maxDuration: number;
  errorRate: number;
}

// ============================================================================
// API TRANSFER OBJECTS (DTOs)
// ============================================================================

export interface TriggerDTO extends Omit<Trigger, 'createdAt' | 'updatedAt' | 'lastTriggered' | 'scheduleConfig'> {
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  scheduleConfig?: ScheduleConfigDTO;
}

export interface ScheduleConfigDTO extends Omit<ScheduleConfig, 'startDate' | 'endDate'> {
  startDate?: string;
  endDate?: string;
}

export interface TriggerExecutionDTO extends Omit<TriggerExecution, 'startedAt' | 'completedAt'> {
  startedAt: string;
  completedAt?: string;
}

export interface TriggerEventDTO extends Omit<TriggerEvent, 'timestamp'> {
  timestamp: string;
}

export interface TriggerMetricsDTO extends Omit<TriggerMetrics, 'lastExecution'> {
  lastExecution?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const TriggerTypeSchema = z.enum(TRIGGER_TYPES);
export const TriggerStatusSchema = z.enum(TRIGGER_STATUSES);
export const TriggerConditionSchema = z.enum(TRIGGER_CONDITIONS);
export const WebhookMethodSchema = z.enum(WEBHOOK_METHODS);
export const EventTypeSchema = z.enum(EVENT_TYPES);
export const ExecutionStatusSchema = z.enum(EXECUTION_STATUSES);

export const TriggerConditionRuleSchema = z.object({
  field: z.string().min(1),
  condition: TriggerConditionSchema,
  value: z.any(),
  caseSensitive: z.boolean().optional()
});

export const WebhookConfigSchema = z.object({
  url: z.string().url(),
  method: WebhookMethodSchema,
  headers: z.record(z.string()).optional(),
  authentication: z.object({
    type: z.enum(['none', 'basic', 'bearer', 'api_key']),
    credentials: z.record(z.string()).optional()
  }).optional(),
  timeout: z.number().min(1000).max(300000).optional(), // 1s to 5min
  retries: z.number().min(0).max(10).optional()
});

export const EventConfigSchema = z.object({
  eventType: EventTypeSchema,
  source: z.string().optional(),
  filters: z.record(z.any()).optional()
});

export const ScheduleConfigSchema = z.object({
  cronExpression: z.string().min(1),
  timezone: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const CreateTriggerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: TriggerTypeSchema,
  organizationId: z.string().optional(),

  // Configuration based on type
  webhookConfig: WebhookConfigSchema.optional(),
  eventConfig: EventConfigSchema.optional(),
  scheduleConfig: ScheduleConfigSchema.optional(),

  // Conditions and actions
  conditions: z.array(TriggerConditionRuleSchema).optional(),
  workflowId: z.string().optional(),
  actionConfig: z.record(z.any()).optional(),

  // Settings
  enabled: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
  maxExecutions: z.number().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export const UpdateTriggerSchema = CreateTriggerSchema.partial();

export const TriggerQuerySchema = z.object({
  type: TriggerTypeSchema.optional(),
  status: TriggerStatusSchema.optional(),
  organizationId: z.string().optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const TestTriggerSchema = z.object({
  inputData: z.record(z.any()).optional()
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert backend Date objects to frontend string format
 */
export function toTriggerDTO(trigger: Trigger): TriggerDTO {
  return {
    ...trigger,
    createdAt: trigger.createdAt.toISOString(),
    updatedAt: trigger.updatedAt.toISOString(),
    lastTriggered: trigger.lastTriggered?.toISOString(),
    scheduleConfig: trigger.scheduleConfig ? {
      ...trigger.scheduleConfig,
      startDate: trigger.scheduleConfig.startDate?.toISOString(),
      endDate: trigger.scheduleConfig.endDate?.toISOString()
    } : undefined
  };
}

export function toTriggerExecutionDTO(execution: TriggerExecution): TriggerExecutionDTO {
  return {
    ...execution,
    startedAt: execution.startedAt.toISOString(),
    completedAt: execution.completedAt?.toISOString()
  };
}

export function toTriggerEventDTO(event: TriggerEvent): TriggerEventDTO {
  return {
    ...event,
    timestamp: event.timestamp.toISOString()
  };
}

export function toTriggerMetricsDTO(metrics: TriggerMetrics): TriggerMetricsDTO {
  return {
    ...metrics,
    lastExecution: metrics.lastExecution?.toISOString()
  };
}

/**
 * Convert frontend string dates to backend Date objects
 */
export function fromTriggerDTO(triggerDTO: TriggerDTO): Trigger {
  return {
    ...triggerDTO,
    createdAt: new Date(triggerDTO.createdAt),
    updatedAt: new Date(triggerDTO.updatedAt),
    lastTriggered: triggerDTO.lastTriggered ? new Date(triggerDTO.lastTriggered) : undefined,
    scheduleConfig: triggerDTO.scheduleConfig ? {
      ...triggerDTO.scheduleConfig,
      startDate: triggerDTO.scheduleConfig.startDate ? new Date(triggerDTO.scheduleConfig.startDate) : undefined,
      endDate: triggerDTO.scheduleConfig.endDate ? new Date(triggerDTO.scheduleConfig.endDate) : undefined
    } : undefined
  };
}

/**
 * Get trigger type display name
 */
export function getTriggerTypeDisplayName(type: TriggerType): string {
  const names = {
    webhook: 'Webhook',
    schedule: 'Schedule',
    event: 'Event',
    manual: 'Manual',
    api: 'API',
    file_change: 'File Change',
    database_change: 'Database Change'
  };
  return names[type];
}

/**
 * Get trigger status color for UI
 */
export function getTriggerStatusColor(status: TriggerStatus): string {
  const colors = {
    active: '#10B981',    // green
    inactive: '#6B7280',  // gray
    paused: '#F59E0B',    // yellow
    error: '#EF4444'      // red
  };
  return colors[status];
}

/**
 * Validate cron expression
 */
export function isValidCronExpression(expression: string): boolean {
  // Basic cron validation - in production, use a proper cron parser
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(expression);
}

/**
 * Calculate trigger success rate
 */
export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) { return 100; }
  return Math.round((successful / total) * 100);
}

/**
 * Evaluate trigger condition
 */
export function evaluateCondition(rule: TriggerConditionRule, data: any): boolean {
  const fieldValue = getNestedValue(data, rule.field);
  const ruleValue = rule.value;

  if (!rule.caseSensitive && typeof fieldValue === 'string' && typeof ruleValue === 'string') {
    return evaluateConditionInternal(rule.condition, fieldValue.toLowerCase(), ruleValue.toLowerCase());
  }

  return evaluateConditionInternal(rule.condition, fieldValue, ruleValue);
}

function evaluateConditionInternal(condition: TriggerCondition, fieldValue: any, ruleValue: any): boolean {
  switch (condition) {
    case 'equals':
      return fieldValue === ruleValue;
    case 'not_equals':
      return fieldValue !== ruleValue;
    case 'contains':
      return String(fieldValue).includes(String(ruleValue));
    case 'not_contains':
      return !String(fieldValue).includes(String(ruleValue));
    case 'greater_than':
      return Number(fieldValue) > Number(ruleValue);
    case 'less_than':
      return Number(fieldValue) < Number(ruleValue);
    case 'regex_match':
      return new RegExp(String(ruleValue)).test(String(fieldValue));
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}"

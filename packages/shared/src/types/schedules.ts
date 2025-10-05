/**
 * Shared Schedule Types and Constants
 * Centralized schedule-related types, enums, and validation schemas
 */

import { z } from 'zod';

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const SCHEDULE_TYPES = [
  'cron',
  'interval',
  'once',
  'recurring'
] as const;

export const SCHEDULE_STATUSES = [
  'active',
  'inactive',
  'paused',
  'completed',
  'error'
] as const;

export const RECURRENCE_PATTERNS = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom'
] as const;

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export const EXECUTION_PRIORITIES = [
  'low',
  'normal',
  'high',
  'critical'
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ScheduleType = typeof SCHEDULE_TYPES[number];
export type ScheduleStatus = typeof SCHEDULE_STATUSES[number];
export type RecurrencePattern = typeof RECURRENCE_PATTERNS[number];
export type Weekday = typeof WEEKDAYS[number];
export type ExecutionPriority = typeof EXECUTION_PRIORITIES[number];

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval?: number; // For interval-based schedules
  weekdays?: Weekday[]; // For weekly patterns
  monthDay?: number; // For monthly patterns (1-31)
  yearDay?: number; // For yearly patterns (1-365)
  customCron?: string; // For custom patterns
}

export interface ScheduleConfig {
  type: ScheduleType;
  cronExpression?: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  recurrence?: RecurrenceConfig;
  maxExecutions?: number;
  retryOnFailure?: boolean;
  retryAttempts?: number;
  retryDelay?: number; // in seconds
}

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  workflowId: string;

  // Schedule configuration
  config: ScheduleConfig;
  status: ScheduleStatus;
  priority: ExecutionPriority;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  nextExecution?: Date;

  // Execution tracking
  executionCount: number;
  successCount: number;
  failureCount: number;

  // Settings
  enabled: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ScheduledExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  workflowExecutionId?: string;

  // Execution details
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped';

  // Results
  result?: Record<string, any>;
  error?: string;
  logs?: string[];

  // Retry information
  attempt: number;
  maxAttempts: number;
  retryAt?: Date;

  // Context
  triggeredBy?: string;
  metadata?: Record<string, any>;
}

export interface ScheduleAnalytics {
  scheduleId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };

  // Execution statistics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  averageDuration: number;

  // Performance metrics
  successRate: number;
  failureRate: number;
  minDuration: number;
  maxDuration: number;

  // Trend data
  executionTrend: Array<{
    date: Date;
    executions: number;
    successes: number;
    failures: number;
  }>;

  // Resource usage
  averageResourceUsage?: {
    cpu: number;
    memory: number;
    duration: number;
  };
}

export interface ScheduleBatch {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  scheduleIds: string[];

  // Batch configuration
  executeInParallel: boolean;
  maxConcurrency?: number;
  stopOnFirstFailure?: boolean;

  // Status and tracking
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Results
  totalSchedules: number;
  completedSchedules: number;
  failedSchedules: number;
  results?: Record<string, any>;
}

// ============================================================================
// API TRANSFER OBJECTS (DTOs)
// ============================================================================

export interface ScheduleDTO extends Omit<Schedule, 'createdAt' | 'updatedAt' | 'lastExecuted' | 'nextExecution' | 'config'> {
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  nextExecution?: string;
  config: ScheduleConfigDTO;
}

export interface ScheduleConfigDTO extends Omit<ScheduleConfig, 'startDate' | 'endDate'> {
  startDate?: string;
  endDate?: string;
}

export interface ScheduledExecutionDTO extends Omit<ScheduledExecution, 'scheduledAt' | 'startedAt' | 'completedAt' | 'retryAt'> {
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  retryAt?: string;
}

export interface ScheduleAnalyticsDTO extends Omit<ScheduleAnalytics, 'period' | 'executionTrend'> {
  period: {
    startDate: string;
    endDate: string;
  };
  executionTrend: Array<{
    date: string;
    executions: number;
    successes: number;
    failures: number;
  }>;
}

export interface ScheduleBatchDTO extends Omit<ScheduleBatch, 'createdAt' | 'startedAt' | 'completedAt'> {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const ScheduleTypeSchema = z.enum(SCHEDULE_TYPES);
export const ScheduleStatusSchema = z.enum(SCHEDULE_STATUSES);
export const RecurrencePatternSchema = z.enum(RECURRENCE_PATTERNS);
export const WeekdaySchema = z.enum(WEEKDAYS);
export const ExecutionPrioritySchema = z.enum(EXECUTION_PRIORITIES);

export const RecurrenceConfigSchema = z.object({
  pattern: RecurrencePatternSchema,
  interval: z.number().min(1).optional(),
  weekdays: z.array(WeekdaySchema).optional(),
  monthDay: z.number().min(1).max(31).optional(),
  yearDay: z.number().min(1).max(365).optional(),
  customCron: z.string().optional()
});

export const ScheduleConfigSchema = z.object({
  type: ScheduleTypeSchema,
  cronExpression: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  recurrence: RecurrenceConfigSchema.optional(),
  maxExecutions: z.number().min(1).optional(),
  retryOnFailure: z.boolean().optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
  retryDelay: z.number().min(1).optional()
});

export const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().optional(),
  workflowId: z.string().min(1),
  config: ScheduleConfigSchema,
  priority: ExecutionPrioritySchema.default('normal'),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial().omit({ workflowId: true });

export const ScheduleQuerySchema = z.object({
  status: ScheduleStatusSchema.optional(),
  organizationId: z.string().optional(),
  workflowId: z.string().optional(),
  enabled: z.boolean().optional(),
  priority: ExecutionPrioritySchema.optional(),
  tags: z.array(z.string()).optional()
});

export const TriggerScheduleSchema = z.object({
  force: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const ScheduleAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).optional()
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert backend Date objects to frontend string format
 */
export function toScheduleDTO(schedule: Schedule): ScheduleDTO {
  return {
    ...schedule,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    lastExecuted: schedule.lastExecuted?.toISOString(),
    nextExecution: schedule.nextExecution?.toISOString(),
    config: {
      ...schedule.config,
      startDate: schedule.config.startDate?.toISOString(),
      endDate: schedule.config.endDate?.toISOString()
    }
  };
}

export function toScheduledExecutionDTO(execution: ScheduledExecution): ScheduledExecutionDTO {
  return {
    ...execution,
    scheduledAt: execution.scheduledAt.toISOString(),
    startedAt: execution.startedAt?.toISOString(),
    completedAt: execution.completedAt?.toISOString(),
    retryAt: execution.retryAt?.toISOString()
  };
}

export function toScheduleAnalyticsDTO(analytics: ScheduleAnalytics): ScheduleAnalyticsDTO {
  return {
    ...analytics,
    period: {
      startDate: analytics.period.startDate.toISOString(),
      endDate: analytics.period.endDate.toISOString()
    },
    executionTrend: analytics.executionTrend.map(trend => ({
      ...trend,
      date: trend.date.toISOString()
    }))
  };
}

export function toScheduleBatchDTO(batch: ScheduleBatch): ScheduleBatchDTO {
  return {
    ...batch,
    createdAt: batch.createdAt.toISOString(),
    startedAt: batch.startedAt?.toISOString(),
    completedAt: batch.completedAt?.toISOString()
  };
}

/**
 * Convert frontend string dates to backend Date objects
 */
export function fromScheduleDTO(scheduleDTO: ScheduleDTO): Schedule {
  return {
    ...scheduleDTO,
    createdAt: new Date(scheduleDTO.createdAt),
    updatedAt: new Date(scheduleDTO.updatedAt),
    lastExecuted: scheduleDTO.lastExecuted ? new Date(scheduleDTO.lastExecuted) : undefined,
    nextExecution: scheduleDTO.nextExecution ? new Date(scheduleDTO.nextExecution) : undefined,
    config: {
      ...scheduleDTO.config,
      startDate: scheduleDTO.config.startDate ? new Date(scheduleDTO.config.startDate) : undefined,
      endDate: scheduleDTO.config.endDate ? new Date(scheduleDTO.config.endDate) : undefined
    }
  };
}

/**
 * Get schedule type display name
 */
export function getScheduleTypeDisplayName(type: ScheduleType): string {
  const names = {
    cron: 'Cron Expression',
    interval: 'Interval',
    once: 'One Time',
    recurring: 'Recurring'
  };
  return names[type];
}

/**
 * Get schedule status color for UI
 */
export function getScheduleStatusColor(status: ScheduleStatus): string {
  const colors = {
    active: '#10B981',     // green
    inactive: '#6B7280',   // gray
    paused: '#F59E0B',     // yellow
    completed: '#3B82F6',  // blue
    error: '#EF4444'       // red
  };
  return colors[status];
}

/**
 * Get execution priority color for UI
 */
export function getExecutionPriorityColor(priority: ExecutionPriority): string {
  const colors = {
    low: '#6B7280',       // gray
    normal: '#3B82F6',    // blue
    high: '#F59E0B',      // yellow
    critical: '#EF4444'   // red
  };
  return colors[priority];
}

/**
 * Calculate next execution time based on cron expression
 */
export function calculateNextExecution(_cronExpression: string,_timezonee?: string): Date {
  // This is a simplified implementation
  // In production, use a proper cron parser like 'node-cron' or 'cron-parser'
  const now = new Date();

  // For demo purposes, add 1 hour to current time
  // Real implementation would parse the cron expression
  return new Date(now.getTime() + 60 * 60 * 1000);
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
 * Calculate schedule success rate
 */
export function calculateScheduleSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount === 0) { return 100; }
  return Math.round((successCount / totalCount) * 100);
}

/**
 * Generate human-readable schedule description
 */
export function getScheduleDescription(config: ScheduleConfig): string {
  if (config.type === 'cron' && config.cronExpression) {
    return `Cron: ${config.cronExpression}`;
  }

  if (config.type === 'interval' && config.recurrence?.interval) {
    return `Every ${config.recurrence.interval} ${config.recurrence.pattern}`;
  }

  if (config.type === 'once' && config.startDate) {
    return `Once at ${config.startDate.toLocaleString()}`;
  }

  if (config.type === 'recurring' && config.recurrence) {
    const { pattern, weekdays, monthDay } = config.recurrence;

    if (pattern === 'daily') {
      return 'Daily';
    }

    if (pattern === 'weekly' && weekdays) {
      return `Weekly on ${weekdays.join(', ')}`;
    }

    if (pattern === 'monthly' && monthDay) {
      return `Monthly on day ${monthDay}`;
    }

    if (pattern === 'yearly') {
      return 'Yearly';
    }
  }

  return 'Custom schedule';
}

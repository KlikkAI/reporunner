/**
 * Intelligent Workflow Scheduler
 *
 * Advanced scheduling system with cron support, intelligent optimization,
 * resource management, and conditional execution. Provides enterprise-grade
 * scheduling capabilities similar to Apache Airflow and Azure Logic Apps.
 */

import { analyticsService } from "./analyticsService";
import { performanceMonitor } from "./performanceMonitor";
import type { WorkflowNodeInstance } from "../nodes/types";
import type { WorkflowEdge } from "../stores/leanWorkflowStore";

export interface ScheduleConfiguration {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  scheduleType: "cron" | "interval" | "once" | "event-driven" | "conditional";
  configuration:
    | CronSchedule
    | IntervalSchedule
    | OnceSchedule
    | EventSchedule
    | ConditionalSchedule;
  timezone: string;
  retryPolicy: RetryPolicy;
  concurrency: ConcurrencySettings;
  conditions: ScheduleCondition[];
  notifications: NotificationSettings;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  nextExecution?: string;
}

export interface CronSchedule {
  expression: string; // Standard cron expression
  description?: string;
}

export interface IntervalSchedule {
  intervalMs: number;
  maxExecutions?: number;
  startTime?: string;
  endTime?: string;
}

export interface OnceSchedule {
  executeAt: string;
  delay?: number; // Optional delay in milliseconds
}

export interface EventSchedule {
  eventType: string;
  eventSource: string;
  filters: EventFilter[];
  debounceMs?: number;
  maxEventsPerWindow?: number;
}

export interface ConditionalSchedule {
  condition: string; // JavaScript expression
  checkIntervalMs: number;
  maxChecks?: number;
  dependencies: string[]; // Other workflow IDs to check
}

export interface EventFilter {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "starts_with"
    | "regex"
    | "greater_than"
    | "less_than";
  value: any;
}

export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  initialDelayMs: number;
  maxDelayMs: number;
  retryConditions: string[]; // Error types/patterns to retry on
}

export interface ConcurrencySettings {
  maxConcurrent: number;
  queueStrategy: "fifo" | "lifo" | "priority";
  skipIfRunning: boolean;
  timeout: number; // Execution timeout in milliseconds
}

export interface ScheduleCondition {
  type: "resource_availability" | "time_window" | "dependency" | "custom";
  configuration: any;
  required: boolean;
}

export interface NotificationSettings {
  onSuccess: NotificationChannel[];
  onFailure: NotificationChannel[];
  onSkip: NotificationChannel[];
  onRetry: NotificationChannel[];
}

export interface NotificationChannel {
  type: "email" | "webhook" | "slack" | "teams" | "sms";
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface ScheduledExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "skipped";
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

export interface ExecutionLog {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: any;
}

export interface ExecutionMetrics {
  nodesExecuted: number;
  resourceUsage: {
    memory: number;
    cpu: number;
    network: number;
  };
  cost: number;
}

export interface ScheduleAnalytics {
  scheduleId: string;
  period: { start: string; end: string };
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  averageDuration: number;
  successRate: number;
  resourceUtilization: {
    avgMemory: number;
    avgCpu: number;
    totalCost: number;
  };
  trends: {
    executionTrend: "increasing" | "stable" | "decreasing";
    performanceTrend: "improving" | "stable" | "degrading";
    errorTrend: "improving" | "stable" | "worsening";
  };
  recommendations: ScheduleRecommendation[];
}

export interface ScheduleRecommendation {
  type: "optimization" | "reliability" | "cost_reduction" | "performance";
  priority: "low" | "medium" | "high";
  description: string;
  implementation: string;
  estimatedImpact: string;
}

export interface ResourceConstraints {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxConcurrentWorkflows: number;
  maxExecutionTimeMs: number;
  costBudget?: number;
}

export class WorkflowSchedulerService {
  private schedules = new Map<string, ScheduleConfiguration>();
  private activeExecutions = new Map<string, ScheduledExecution>();
  private executionQueue: ScheduledExecution[] = [];
  private schedulerTimers = new Map<string, NodeJS.Timeout>();
  private eventListeners = new Map<
    string,
    Set<(execution: ScheduledExecution) => void>
  >();

  // Resource management
  private resourceConstraints: ResourceConstraints = {
    maxMemoryMB: 2048,
    maxCpuPercent: 80,
    maxConcurrentWorkflows: 10,
    maxExecutionTimeMs: 3600000, // 1 hour
    costBudget: 100, // $100
  };

  private isRunning = false;
  private readonly SCHEDULER_INTERVAL = 1000; // 1 second

  constructor() {
    this.startScheduler();
  }

  /**
   * Create a new schedule configuration
   */
  createSchedule(
    config: Omit<ScheduleConfiguration, "id" | "createdAt" | "updatedAt">,
  ): ScheduleConfiguration {
    const schedule: ScheduleConfiguration = {
      ...config,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextExecution: this.calculateNextExecution(
        config.scheduleType,
        config.configuration,
        config.timezone,
      ),
    };

    this.schedules.set(schedule.id, schedule);

    if (schedule.enabled) {
      this.setupScheduleTimer(schedule);
    }

    return schedule;
  }

  /**
   * Update existing schedule configuration
   */
  updateSchedule(
    scheduleId: string,
    updates: Partial<ScheduleConfiguration>,
  ): ScheduleConfiguration {
    const existing = this.schedules.get(scheduleId);
    if (!existing) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next execution if schedule changed
    if (updates.scheduleType || updates.configuration || updates.timezone) {
      updated.nextExecution = this.calculateNextExecution(
        updated.scheduleType,
        updated.configuration,
        updated.timezone,
      );
    }

    this.schedules.set(scheduleId, updated);

    // Update timer
    this.clearScheduleTimer(scheduleId);
    if (updated.enabled) {
      this.setupScheduleTimer(updated);
    }

    return updated;
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    this.clearScheduleTimer(scheduleId);
    this.schedules.delete(scheduleId);

    return true;
  }

  /**
   * Enable or disable a schedule
   */
  toggleSchedule(scheduleId: string, enabled: boolean): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    schedule.enabled = enabled;
    schedule.updatedAt = new Date().toISOString();

    if (enabled) {
      this.setupScheduleTimer(schedule);
    } else {
      this.clearScheduleTimer(scheduleId);
    }
  }

  /**
   * Manually trigger a scheduled workflow
   */
  async triggerSchedule(
    scheduleId: string,
    force = false,
  ): Promise<ScheduledExecution> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Check conditions unless forced
    if (!force && !(await this.checkScheduleConditions(schedule))) {
      throw new Error("Schedule conditions not met");
    }

    const execution = this.createExecution(schedule, "manual");
    return this.executeWorkflow(execution);
  }

  /**
   * Get schedule analytics
   */
  async getScheduleAnalytics(
    scheduleId: string,
    periodDays = 30,
  ): Promise<ScheduleAnalytics> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );

    // Get execution history for this schedule
    const executions = Array.from(this.activeExecutions.values()).filter(
      (exec) =>
        exec.scheduleId === scheduleId &&
        new Date(exec.scheduledAt) >= startDate,
    );

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      (e) => e.status === "completed",
    ).length;
    const failedExecutions = executions.filter(
      (e) => e.status === "failed",
    ).length;
    const skippedExecutions = executions.filter(
      (e) => e.status === "skipped",
    ).length;

    const completedExecutions = executions.filter((e) => e.duration);
    const averageDuration =
      completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
          completedExecutions.length
        : 0;

    const successRate =
      totalExecutions > 0
        ? (successfulExecutions / totalExecutions) * 100
        : 100;

    const resourceUtilization = this.calculateResourceUtilization(executions);
    const trends = this.calculateTrends(executions);
    const recommendations = this.generateScheduleRecommendations(
      schedule,
      executions,
    );

    return {
      scheduleId,
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      skippedExecutions,
      averageDuration,
      successRate,
      resourceUtilization,
      trends,
      recommendations,
    };
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ScheduleConfiguration[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ScheduledExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel a running execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== "running") {
      return false;
    }

    execution.status = "cancelled";
    execution.completedAt = new Date().toISOString();
    execution.logs.push({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Execution cancelled by user",
    });

    this.emitExecutionEvent("cancelled", execution);
    return true;
  }

  /**
   * Subscribe to execution events
   */
  subscribeToExecutions(
    event: "started" | "completed" | "failed" | "cancelled",
    callback: (execution: ScheduledExecution) => void,
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Set resource constraints
   */
  setResourceConstraints(constraints: Partial<ResourceConstraints>): void {
    this.resourceConstraints = { ...this.resourceConstraints, ...constraints };
  }

  // Private methods

  private startScheduler(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduleProcessing();
  }

  private scheduleProcessing(): void {
    setTimeout(() => {
      this.processSchedules();
      if (this.isRunning) {
        this.scheduleProcessing();
      }
    }, this.SCHEDULER_INTERVAL);
  }

  private async processSchedules(): Promise<void> {
    const now = new Date();

    // Process due schedules
    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled || !schedule.nextExecution) continue;

      if (new Date(schedule.nextExecution) <= now) {
        await this.executeScheduledWorkflow(schedule);
      }
    }

    // Process execution queue
    await this.processExecutionQueue();
  }

  private async executeScheduledWorkflow(
    schedule: ScheduleConfiguration,
  ): Promise<void> {
    try {
      // Check conditions
      if (!(await this.checkScheduleConditions(schedule))) {
        this.logScheduleEvent(
          schedule.id,
          "info",
          "Schedule conditions not met, skipping execution",
        );
        return;
      }

      // Check concurrency limits
      if (!this.canExecute(schedule)) {
        this.logScheduleEvent(
          schedule.id,
          "warn",
          "Concurrency limit reached, queueing execution",
        );
        const execution = this.createExecution(schedule, "scheduled");
        this.executionQueue.push(execution);
        return;
      }

      // Create and execute
      const execution = this.createExecution(schedule, "scheduled");
      await this.executeWorkflow(execution);

      // Update next execution time
      schedule.nextExecution = this.calculateNextExecution(
        schedule.scheduleType,
        schedule.configuration,
        schedule.timezone,
      );
      schedule.lastExecuted = new Date().toISOString();
    } catch (error) {
      this.logScheduleEvent(
        schedule.id,
        "error",
        `Schedule execution failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async executeWorkflow(
    execution: ScheduledExecution,
  ): Promise<ScheduledExecution> {
    execution.status = "running";
    execution.startedAt = new Date().toISOString();

    this.activeExecutions.set(execution.id, execution);
    this.emitExecutionEvent("started", execution);

    // Start performance monitoring
    const trace = performanceMonitor.startTrace(
      execution.id,
      execution.workflowId,
      { scheduleId: execution.scheduleId },
    );

    try {
      // Simulate workflow execution (in real implementation, this would trigger actual workflow execution)
      const result = await this.simulateWorkflowExecution(execution);

      execution.status = "completed";
      execution.completedAt = new Date().toISOString();
      execution.duration =
        new Date(execution.completedAt).getTime() -
        new Date(execution.startedAt!).getTime();
      execution.result = result;

      this.emitExecutionEvent("completed", execution);
    } catch (error) {
      execution.status = "failed";
      execution.completedAt = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : String(error);

      // Handle retry logic
      const schedule = this.schedules.get(execution.scheduleId);
      if (
        schedule &&
        this.shouldRetry(execution, schedule.retryPolicy, error instanceof Error ? error : new Error(String(error)))
      ) {
        await this.scheduleRetry(execution, schedule);
      } else {
        this.emitExecutionEvent("failed", execution);
      }
    } finally {
      // End performance monitoring
      performanceMonitor.endTrace(execution.id, execution.status);
    }

    return execution;
  }

  private async simulateWorkflowExecution(
    execution: ScheduledExecution,
  ): Promise<any> {
    // Simulate variable execution time and occasional failures
    const executionTime = 1000 + Math.random() * 5000; // 1-6 seconds
    const failureRate = 0.1; // 10% failure rate

    await new Promise((resolve) => setTimeout(resolve, executionTime));

    if (Math.random() < failureRate) {
      throw new Error("Simulated workflow execution failure");
    }

    return {
      nodesExecuted: Math.floor(Math.random() * 10) + 1,
      dataProcessed: Math.floor(Math.random() * 1000),
      success: true,
    };
  }

  private createExecution(
    schedule: ScheduleConfiguration,
    trigger: "scheduled" | "manual",
  ): ScheduledExecution {
    return {
      id: `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduleId: schedule.id,
      workflowId: schedule.workflowId,
      status: "pending",
      scheduledAt: new Date().toISOString(),
      retryCount: 0,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: `Execution ${trigger === "manual" ? "manually triggered" : "scheduled"}`,
          data: { trigger },
        },
      ],
      metrics: {
        nodesExecuted: 0,
        resourceUsage: { memory: 0, cpu: 0, network: 0 },
        cost: 0,
      },
    };
  }

  private calculateNextExecution(
    scheduleType: ScheduleConfiguration["scheduleType"],
    configuration: any,
    timezone: string,
  ): string | undefined {
    const now = new Date();

    switch (scheduleType) {
      case "cron":
        return this.calculateNextCronExecution(
          configuration.expression,
          timezone,
        );

      case "interval":
        const nextTime = new Date(now.getTime() + configuration.intervalMs);
        return nextTime.toISOString();

      case "once":
        return configuration.executeAt;

      case "event-driven":
      case "conditional":
        return undefined; // No fixed next execution time

      default:
        return undefined;
    }
  }

  private calculateNextCronExecution(
    expression: string,
    timezone: string,
  ): string {
    // Simplified cron calculation - in production, use a proper cron library
    const now = new Date();
    const nextExecution = new Date(now.getTime() + 60000); // Default to 1 minute from now
    return nextExecution.toISOString();
  }

  private async checkScheduleConditions(
    schedule: ScheduleConfiguration,
  ): Promise<boolean> {
    for (const condition of schedule.conditions) {
      if (!(await this.evaluateCondition(condition))) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(
    condition: ScheduleCondition,
  ): Promise<boolean> {
    switch (condition.type) {
      case "resource_availability":
        return this.checkResourceAvailability(condition.configuration);

      case "time_window":
        return this.checkTimeWindow(condition.configuration);

      case "dependency":
        return this.checkDependencies(condition.configuration);

      case "custom":
        return this.evaluateCustomCondition(condition.configuration);

      default:
        return true;
    }
  }

  private checkResourceAvailability(config: any): boolean {
    // Check if sufficient resources are available
    const activeCount = Array.from(this.activeExecutions.values()).filter(
      (e) => e.status === "running",
    ).length;

    return activeCount < this.resourceConstraints.maxConcurrentWorkflows;
  }

  private checkTimeWindow(config: any): boolean {
    // Check if current time is within allowed window
    const now = new Date();
    const currentHour = now.getHours();

    const startHour = config.startHour || 0;
    const endHour = config.endHour || 23;

    return currentHour >= startHour && currentHour <= endHour;
  }

  private checkDependencies(config: any): boolean {
    // Check if dependent workflows have completed successfully
    return true; // Simplified implementation
  }

  private evaluateCustomCondition(config: any): boolean {
    try {
      // Evaluate custom JavaScript condition (in production, use a sandboxed environment)
      const func = new Function("return " + config.expression);
      return !!func();
    } catch (error) {
      console.error("Custom condition evaluation failed:", error);
      return false;
    }
  }

  private canExecute(schedule: ScheduleConfiguration): boolean {
    const runningCount = Array.from(this.activeExecutions.values()).filter(
      (e) => e.scheduleId === schedule.id && e.status === "running",
    ).length;

    return runningCount < schedule.concurrency.maxConcurrent;
  }

  private async processExecutionQueue(): Promise<void> {
    while (this.executionQueue.length > 0 && this.canProcessQueue()) {
      const execution = this.executionQueue.shift()!;
      const schedule = this.schedules.get(execution.scheduleId);

      if (schedule && this.canExecute(schedule)) {
        await this.executeWorkflow(execution);
      } else {
        // Put back in queue
        this.executionQueue.unshift(execution);
        break;
      }
    }
  }

  private canProcessQueue(): boolean {
    const totalRunning = Array.from(this.activeExecutions.values()).filter(
      (e) => e.status === "running",
    ).length;

    return totalRunning < this.resourceConstraints.maxConcurrentWorkflows;
  }

  private shouldRetry(
    execution: ScheduledExecution,
    retryPolicy: RetryPolicy,
    error: Error,
  ): boolean {
    if (!retryPolicy.enabled) return false;
    if (execution.retryCount >= retryPolicy.maxAttempts) return false;

    // Check if error matches retry conditions
    if (retryPolicy.retryConditions.length > 0) {
      return retryPolicy.retryConditions.some(
        (condition) =>
          error.message.includes(condition) || error.name.includes(condition),
      );
    }

    return true;
  }

  private async scheduleRetry(
    execution: ScheduledExecution,
    schedule: ScheduleConfiguration,
  ): Promise<void> {
    execution.retryCount++;

    const delay = this.calculateRetryDelay(
      execution.retryCount,
      schedule.retryPolicy,
    );

    setTimeout(async () => {
      execution.logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Retry attempt ${execution.retryCount}/${schedule.retryPolicy.maxAttempts}`,
      });

      await this.executeWorkflow(execution);
    }, delay);
  }

  private calculateRetryDelay(attempt: number, policy: RetryPolicy): number {
    let delay = policy.initialDelayMs;

    switch (policy.backoffStrategy) {
      case "linear":
        delay = policy.initialDelayMs * attempt;
        break;
      case "exponential":
        delay = policy.initialDelayMs * Math.pow(2, attempt - 1);
        break;
      case "fixed":
        delay = policy.initialDelayMs;
        break;
    }

    return Math.min(delay, policy.maxDelayMs);
  }

  private setupScheduleTimer(schedule: ScheduleConfiguration): void {
    if (!schedule.nextExecution) return;

    const delay = new Date(schedule.nextExecution).getTime() - Date.now();
    if (delay <= 0) return; // Already overdue

    const timer = setTimeout(() => {
      this.executeScheduledWorkflow(schedule);
    }, delay);

    this.schedulerTimers.set(schedule.id, timer);
  }

  private clearScheduleTimer(scheduleId: string): void {
    const timer = this.schedulerTimers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.schedulerTimers.delete(scheduleId);
    }
  }

  private calculateResourceUtilization(executions: ScheduledExecution[]) {
    const completed = executions.filter((e) => e.metrics);
    if (completed.length === 0) {
      return { avgMemory: 0, avgCpu: 0, totalCost: 0 };
    }

    const avgMemory =
      completed.reduce((sum, e) => sum + e.metrics.resourceUsage.memory, 0) /
      completed.length;
    const avgCpu =
      completed.reduce((sum, e) => sum + e.metrics.resourceUsage.cpu, 0) /
      completed.length;
    const totalCost = completed.reduce((sum, e) => sum + e.metrics.cost, 0);

    return { avgMemory, avgCpu, totalCost };
  }

  private calculateTrends(executions: ScheduledExecution[]) {
    // Simplified trend calculation
    return {
      executionTrend: "stable" as const,
      performanceTrend: "stable" as const,
      errorTrend: "stable" as const,
    };
  }

  private generateScheduleRecommendations(
    schedule: ScheduleConfiguration,
    executions: ScheduledExecution[],
  ): ScheduleRecommendation[] {
    const recommendations: ScheduleRecommendation[] = [];

    // Analyze execution patterns
    const failureRate =
      executions.length > 0
        ? executions.filter((e) => e.status === "failed").length /
          executions.length
        : 0;

    if (failureRate > 0.1) {
      // 10% failure rate
      recommendations.push({
        type: "reliability",
        priority: "high",
        description: `High failure rate detected (${(failureRate * 100).toFixed(1)}%)`,
        implementation: "Review error patterns and improve retry policy",
        estimatedImpact: "20-30% reduction in failed executions",
      });
    }

    // Check for optimization opportunities
    const avgDuration =
      executions
        .filter((e) => e.duration)
        .reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length;

    if (avgDuration > 300000) {
      // 5 minutes
      recommendations.push({
        type: "performance",
        priority: "medium",
        description: "Long execution times detected",
        implementation:
          "Optimize workflow logic and consider parallel processing",
        estimatedImpact: "15-25% improvement in execution speed",
      });
    }

    return recommendations;
  }

  private logScheduleEvent(
    scheduleId: string,
    level: string,
    message: string,
  ): void {
    console.log(`[Schedule ${scheduleId}] ${level.toUpperCase()}: ${message}`);
  }

  private emitExecutionEvent(
    event: string,
    execution: ScheduledExecution,
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(execution);
        } catch (error) {
          console.error(`Error in execution event listener:`, error);
        }
      });
    }
  }

  /**
   * Stop the scheduler and cleanup resources
   */
  destroy(): void {
    this.isRunning = false;
    this.schedulerTimers.forEach((timer) => clearTimeout(timer));
    this.schedulerTimers.clear();
    this.schedules.clear();
    this.activeExecutions.clear();
    this.executionQueue = [];
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const workflowScheduler = new WorkflowSchedulerService();

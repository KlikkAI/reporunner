export interface ScheduleDefinition {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  organizationId: string;
  type: 'cron' | 'interval' | 'once' | 'webhook';
  schedule: {
    cron?: string;
    interval?: number; // milliseconds
    runAt?: Date;
    timezone?: string;
  };
  enabled: boolean;
  maxRuns?: number;
  currentRuns: number;
  lastRun?: Date;
  nextRun?: Date;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  notifications: {
    onSuccess?: string[];
    onFailure?: string[];
    onMaxRetries?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  attempts: number;
  nextRetryAt?: Date;
}

export interface SchedulerConfig {
  maxConcurrentJobs: number;
  defaultTimezone: string;
  cleanupInterval: number; // hours
  retentionDays: number;
}

export class WorkflowScheduler {
  private schedules = new Map<string, ScheduleDefinition>();
  private executions = new Map<string, ScheduleExecution>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private config: SchedulerConfig;
  private running = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxConcurrentJobs: 10,
      defaultTimezone: 'UTC',
      cleanupInterval: 24,
      retentionDays: 30,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;

    // Start all enabled schedules
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled) {
        await this.startSchedule(schedule.id);
      }
    }

    // Start cleanup interval
    setInterval(
      () => {
        this.cleanupOldExecutions();
      },
      this.config.cleanupInterval * 60 * 60 * 1000
    );
  }

  async stop(): Promise<void> {
    this.running = false;

    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  async createSchedule(
    schedule: Omit<ScheduleDefinition, 'id' | 'currentRuns' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const newSchedule: ScheduleDefinition = {
      ...schedule,
      id: this.generateId(),
      currentRuns: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate cron expression if provided
    if (newSchedule.type === 'cron' && newSchedule.schedule.cron) {
      try {
        // TODO: Use cron-parser to validate
        this.validateCronExpression(newSchedule.schedule.cron);
      } catch (_error) {
        throw new Error(`Invalid cron expression: ${newSchedule.schedule.cron}`);
      }
    }

    // Calculate next run time
    newSchedule.nextRun = this.calculateNextRun(newSchedule);

    this.schedules.set(newSchedule.id, newSchedule);

    // Start the schedule if enabled and scheduler is running
    if (newSchedule.enabled && this.running) {
      await this.startSchedule(newSchedule.id);
    }

    return newSchedule.id;
  }

  async updateSchedule(id: string, updates: Partial<ScheduleDefinition>): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    // Stop current schedule
    await this.stopSchedule(id);

    // Update schedule
    const updatedSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate next run if schedule changed
    if (updates.schedule || updates.type) {
      updatedSchedule.nextRun = this.calculateNextRun(updatedSchedule);
    }

    this.schedules.set(id, updatedSchedule);

    // Restart if enabled
    if (updatedSchedule.enabled && this.running) {
      await this.startSchedule(id);
    }

    return true;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    await this.stopSchedule(id);
    return this.schedules.delete(id);
  }

  async enableSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.enabled = true;
    schedule.updatedAt = new Date();

    if (this.running) {
      await this.startSchedule(id);
    }

    return true;
  }

  async disableSchedule(id: string): Promise<boolean> {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.enabled = false;
    schedule.updatedAt = new Date();
    await this.stopSchedule(id);

    return true;
  }

  async triggerSchedule(id: string): Promise<string> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    return this.executeWorkflow(schedule);
  }

  getSchedule(id: string): ScheduleDefinition | undefined {
    return this.schedules.get(id);
  }

  getSchedules(organizationId?: string): ScheduleDefinition[] {
    const schedules = Array.from(this.schedules.values());

    if (organizationId) {
      return schedules.filter((s) => s.organizationId === organizationId);
    }

    return schedules;
  }

  getExecution(id: string): ScheduleExecution | undefined {
    return this.executions.get(id);
  }

  getExecutions(scheduleId?: string): ScheduleExecution[] {
    const executions = Array.from(this.executions.values());

    if (scheduleId) {
      return executions.filter((e) => e.scheduleId === scheduleId);
    }

    return executions;
  }

  private async startSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) return;

    // Clear existing interval if any
    await this.stopSchedule(scheduleId);

    switch (schedule.type) {
      case 'cron':
        this.startCronSchedule(schedule);
        break;
      case 'interval':
        this.startIntervalSchedule(schedule);
        break;
      case 'once':
        this.startOnceSchedule(schedule);
        break;
      // webhook schedules are triggered externally
    }
  }

  private async stopSchedule(scheduleId: string): Promise<void> {
    const interval = this.intervals.get(scheduleId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(scheduleId);
    }
  }

  private startCronSchedule(schedule: ScheduleDefinition): void {
    if (!schedule.schedule.cron) return;

    // TODO: Use node-cron for proper cron scheduling
    // For now, simulate with a simple interval
    const interval = setInterval(async () => {
      if (this.shouldExecute(schedule)) {
        await this.executeWorkflow(schedule);
      }
    }, 60000); // Check every minute

    this.intervals.set(schedule.id, interval);
  }

  private startIntervalSchedule(schedule: ScheduleDefinition): void {
    if (!schedule.schedule.interval) return;

    const interval = setInterval(async () => {
      if (this.shouldExecute(schedule)) {
        await this.executeWorkflow(schedule);
      }
    }, schedule.schedule.interval);

    this.intervals.set(schedule.id, interval);
  }

  private startOnceSchedule(schedule: ScheduleDefinition): void {
    if (!schedule.schedule.runAt) return;

    const delay = schedule.schedule.runAt.getTime() - Date.now();

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        if (this.shouldExecute(schedule)) {
          await this.executeWorkflow(schedule);
        }
      }, delay);

      this.intervals.set(schedule.id, timeout);
    }
  }

  private shouldExecute(schedule: ScheduleDefinition): boolean {
    // Check max runs limit
    if (schedule.maxRuns && schedule.currentRuns >= schedule.maxRuns) {
      return false;
    }

    // Check if it's time to run
    if (schedule.nextRun && schedule.nextRun > new Date()) {
      return false;
    }

    return true;
  }

  private async executeWorkflow(schedule: ScheduleDefinition): Promise<string> {
    const execution: ScheduleExecution = {
      id: this.generateId(),
      scheduleId: schedule.id,
      workflowId: schedule.workflowId,
      status: 'scheduled',
      scheduledAt: new Date(),
      attempts: 0,
    };

    this.executions.set(execution.id, execution);

    try {
      execution.status = 'running';
      execution.startedAt = new Date();

      // TODO: Integrate with workflow execution engine
      // await workflowEngine.execute(schedule.workflowId);

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = { success: true };

      // Update schedule
      schedule.currentRuns++;
      schedule.lastRun = new Date();
      schedule.nextRun = this.calculateNextRun(schedule);

      // Send success notifications
      if (schedule.notifications.onSuccess) {
        await this.sendNotifications(schedule.notifications.onSuccess, 'success', execution);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();

      // Handle retries
      if (execution.attempts < schedule.retryPolicy.maxRetries) {
        execution.attempts++;
        const delay = this.calculateRetryDelay(schedule.retryPolicy, execution.attempts);
        execution.nextRetryAt = new Date(Date.now() + delay);
        execution.status = 'scheduled';

        // Schedule retry
        setTimeout(() => {
          this.retryExecution(execution.id);
        }, delay);
      } else {
        // Send failure notifications
        if (schedule.notifications.onFailure) {
          await this.sendNotifications(schedule.notifications.onFailure, 'failure', execution);
        }
      }
    }

    return execution.id;
  }

  private async retryExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    const schedule = execution ? this.schedules.get(execution.scheduleId) : undefined;

    if (!execution || !schedule) return;

    // Reset execution for retry
    execution.status = 'running';
    execution.startedAt = new Date();
    execution.error = undefined;

    try {
      // TODO: Re-execute workflow
      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
    }
  }

  private calculateNextRun(schedule: ScheduleDefinition): Date | undefined {
    const now = new Date();

    switch (schedule.type) {
      case 'cron':
        // TODO: Use cron-parser to calculate next run
        return new Date(now.getTime() + 60 * 60 * 1000); // Simplified: next hour
      case 'interval':
        return schedule.schedule.interval
          ? new Date(now.getTime() + schedule.schedule.interval)
          : undefined;
      case 'once':
        return schedule.schedule.runAt;
      default:
        return undefined;
    }
  }

  private calculateRetryDelay(
    retryPolicy: ScheduleDefinition['retryPolicy'],
    attempt: number
  ): number {
    let delay = retryPolicy.retryDelay;

    if (retryPolicy.exponentialBackoff) {
      delay = delay * 2 ** (attempt - 1);
    }

    return delay;
  }

  private async sendNotifications(
    _recipients: string[],
    _type: string,
    _execution: ScheduleExecution
  ): Promise<void> {}

  private validateCronExpression(_cron: string): void {
    // TODO: Implement proper cron validation
    // For now, just check basic format
    const parts = _cron.split(' ');
    if (parts.length < 5 || parts.length > 6) {
      throw new Error('Invalid cron expression format');
    }
  }

  private cleanupOldExecutions(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    for (const [id, execution] of this.executions.entries()) {
      if (execution.scheduledAt < cutoffDate) {
        this.executions.delete(id);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export * from './cron';
export * from './queue';

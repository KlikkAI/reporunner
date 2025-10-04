/**
 * Backend Workflow Scheduler Service
 * Handles workflow scheduling and execution timing
 */

import { EventEmitter } from 'node:events';
import { Logger } from '@reporunner/core';
import * as cron from 'node-cron';

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  schedule: string; // cron expression
  enabled: boolean;
  timezone?: string;
  nextRun?: Date;
  lastRun?: Date;
  metadata?: Record<string, any>;
}

export interface ScheduleConfiguration {
  type: 'cron' | 'interval' | 'once';
  cronExpression?: string;
  interval?: number; // milliseconds
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  maxRuns?: number;
}

export interface ScheduledExecution {
  id: string;
  workflowId: string;
  scheduledTime: Date;
  executionTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
}

export class WorkflowSchedulerService extends EventEmitter {
  private logger: Logger;
  private schedules = new Map<string, ScheduledWorkflow>();
  private cronJobs = new Map<string, cron.ScheduledTask>();
  private executions = new Map<string, ScheduledExecution>();

  constructor() {
    super();
    this.logger = new Logger('WorkflowSchedulerService');
    this.logger.info('Workflow scheduler service initialized');
  }

  /**
   * Create a new workflow schedule
   */
  async createSchedule(
    workflowId: string,
    config: ScheduleConfiguration,
    metadata: Record<string, any> = {}
  ): Promise<ScheduledWorkflow> {
    try {
      const scheduleId = this.generateScheduleId();

      let cronExpression: string;

      switch (config.type) {
        case 'cron':
          if (!config.cronExpression) {
            throw new Error('Cron expression is required for cron type');
          }
          cronExpression = config.cronExpression;
          break;

        case 'interval': {
          if (!config.interval) {
            throw new Error('Interval is required for interval type');
          }
          // Convert interval to cron expression (simplified)
          const minutes = Math.floor(config.interval / (1000 * 60));
          cronExpression = `*/${minutes} * * * *`;
          break;
        }

        case 'once': {
          if (!config.startDate) {
            throw new Error('Start date is required for once type');
          }
          // Create a cron expression for the specific date/time
          const date = config.startDate;
          cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
          break;
        }

        default:
          throw new Error(`Unsupported schedule type: ${config.type}`);
      }

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }

      const schedule: ScheduledWorkflow = {
        id: scheduleId,
        workflowId,
        schedule: cronExpression,
        enabled: true,
        timezone: config.timezone || 'UTC',
        nextRun: this.getNextRunTime(cronExpression, config.timezone),
        metadata,
      };

      this.schedules.set(scheduleId, schedule);

      // Create and start cron job
      await this.startCronJob(schedule);

      this.emit('schedule_created', schedule);

      this.logger.info('Workflow schedule created', {
        scheduleId,
        workflowId,
        cronExpression,
        nextRun: schedule.nextRun,
      });

      return schedule;
    } catch (error) {
      this.logger.error('Failed to create workflow schedule', { error, workflowId, config });
      throw error;
    }
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<ScheduledWorkflow>
  ): Promise<ScheduledWorkflow> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      // Stop existing cron job
      await this.stopCronJob(scheduleId);

      // Update schedule
      const updatedSchedule = { ...schedule, ...updates };
      this.schedules.set(scheduleId, updatedSchedule);

      // Restart cron job if enabled
      if (updatedSchedule.enabled) {
        await this.startCronJob(updatedSchedule);
      }

      this.emit('schedule_updated', updatedSchedule);

      this.logger.info('Workflow schedule updated', { scheduleId, updates });

      return updatedSchedule;
    } catch (error) {
      this.logger.error('Failed to update workflow schedule', { error, scheduleId, updates });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      // Stop and remove cron job
      await this.stopCronJob(scheduleId);

      // Remove schedule
      this.schedules.delete(scheduleId);

      this.emit('schedule_deleted', schedule);

      this.logger.info('Workflow schedule deleted', { scheduleId });
    } catch (error) {
      this.logger.error('Failed to delete workflow schedule', { error, scheduleId });
      throw error;
    }
  }

  /**
   * Get schedule by ID
   */
  getSchedule(scheduleId: string): ScheduledWorkflow | undefined {
    return this.schedules.get(scheduleId);
  }

  /**
   * List all schedules
   */
  listSchedules(workflowId?: string): ScheduledWorkflow[] {
    const schedules = Array.from(this.schedules.values());

    if (workflowId) {
      return schedules.filter((s) => s.workflowId === workflowId);
    }

    return schedules;
  }

  /**
   * Enable/disable a schedule
   */
  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      if (enabled && !schedule.enabled) {
        // Enable schedule
        schedule.enabled = true;
        await this.startCronJob(schedule);
        this.logger.info('Schedule enabled', { scheduleId });
      } else if (!enabled && schedule.enabled) {
        // Disable schedule
        schedule.enabled = false;
        await this.stopCronJob(scheduleId);
        this.logger.info('Schedule disabled', { scheduleId });
      }

      this.emit('schedule_toggled', { scheduleId, enabled });
    } catch (error) {
      this.logger.error('Failed to toggle schedule', { error, scheduleId, enabled });
      throw error;
    }
  }

  /**
   * Get scheduled executions
   */
  getScheduledExecutions(workflowId?: string): ScheduledExecution[] {
    const executions = Array.from(this.executions.values());

    if (workflowId) {
      return executions.filter((e) => e.workflowId === workflowId);
    }

    return executions.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
  }

  /**
   * Manually trigger a scheduled workflow
   */
  async triggerSchedule(scheduleId: string): Promise<string> {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }

      const executionId = await this.executeWorkflow(schedule);

      this.logger.info('Schedule manually triggered', { scheduleId, executionId });

      return executionId;
    } catch (error) {
      this.logger.error('Failed to trigger schedule', { error, scheduleId });
      throw error;
    }
  }

  /**
   * Get schedule analytics
   */
  getScheduleAnalytics(): {
    totalSchedules: number;
    activeSchedules: number;
    executionCount: number;
    successRate: number;
    upcomingExecutions: ScheduledExecution[];
  } {
    const schedules = Array.from(this.schedules.values());
    const executions = Array.from(this.executions.values());

    const totalSchedules = schedules.length;
    const activeSchedules = schedules.filter((s) => s.enabled).length;
    const executionCount = executions.length;

    const completedExecutions = executions.filter(
      (e) => e.status === 'completed' || e.status === 'failed'
    );
    const successfulExecutions = executions.filter((e) => e.status === 'completed');
    const successRate =
      completedExecutions.length > 0 ? successfulExecutions.length / completedExecutions.length : 0;

    const upcomingExecutions = executions
      .filter((e) => e.status === 'pending')
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
      .slice(0, 10);

    return {
      totalSchedules,
      activeSchedules,
      executionCount,
      successRate,
      upcomingExecutions,
    };
  }

  private async startCronJob(schedule: ScheduledWorkflow): Promise<void> {
    try {
      const task = cron.schedule(
        schedule.schedule,
        async () => {
          await this.executeWorkflow(schedule);
        },
        {
          scheduled: true,
          timezone: schedule.timezone || 'UTC',
        }
      );

      this.cronJobs.set(schedule.id, task);

      this.logger.debug('Cron job started', {
        scheduleId: schedule.id,
        cronExpression: schedule.schedule,
        timezone: schedule.timezone,
      });
    } catch (error) {
      this.logger.error('Failed to start cron job', { error, schedule });
      throw error;
    }
  }

  private async stopCronJob(scheduleId: string): Promise<void> {
    try {
      const task = this.cronJobs.get(scheduleId);
      if (task) {
        task.stop();
        task.destroy();
        this.cronJobs.delete(scheduleId);

        this.logger.debug('Cron job stopped', { scheduleId });
      }
    } catch (error) {
      this.logger.error('Failed to stop cron job', { error, scheduleId });
      throw error;
    }
  }

  private async executeWorkflow(schedule: ScheduledWorkflow): Promise<string> {
    try {
      const executionId = this.generateExecutionId();
      const now = new Date();

      // Create execution record
      const execution: ScheduledExecution = {
        id: executionId,
        workflowId: schedule.workflowId,
        scheduledTime: now,
        status: 'pending',
      };

      this.executions.set(executionId, execution);

      // Update schedule last run time
      schedule.lastRun = now;
      schedule.nextRun = this.getNextRunTime(schedule.schedule, schedule.timezone);

      this.emit('workflow_scheduled', { schedule, execution });

      // TODO: Integrate with actual workflow execution engine
      // For now, simulate execution
      setTimeout(async () => {
        try {
          execution.status = 'running';
          execution.executionTime = new Date();

          // Simulate workflow execution
          await new Promise((resolve) => setTimeout(resolve, 1000));

          execution.status = 'completed';
          execution.result = { success: true, message: 'Workflow executed successfully' };

          this.emit('workflow_execution_completed', { schedule, execution });

          this.logger.info('Scheduled workflow executed', {
            scheduleId: schedule.id,
            workflowId: schedule.workflowId,
            executionId,
          });
        } catch (error) {
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : 'Unknown error';

          this.emit('workflow_execution_failed', { schedule, execution, error });

          this.logger.error('Scheduled workflow execution failed', {
            scheduleId: schedule.id,
            workflowId: schedule.workflowId,
            executionId,
            error,
          });
        }
      }, 100);

      return executionId;
    } catch (error) {
      this.logger.error('Failed to execute scheduled workflow', { error, schedule });
      throw error;
    }
  }

  private getNextRunTime(cronExpression: string, _timezone?: string): Date {
    try {
      // This is a simplified implementation
      // In a real implementation, you'd use a proper cron parser
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour as placeholder
      return nextRun;
    } catch (error) {
      this.logger.error('Failed to calculate next run time', { error, cronExpression });
      return new Date(Date.now() + 60 * 60 * 1000); // Default to 1 hour from now
    }
  }

  private generateScheduleId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const workflowSchedulerService = new WorkflowSchedulerService();
export default workflowSchedulerService;

/**
 * Workflow Scheduler
 * 
 * Manages scheduling and execution of workflows
 */

export interface ScheduleConfig {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: {
    type: 'cron' | 'interval' | 'once';
    expression?: string; // Cron expression or interval
    startDate?: string;
    endDate?: string;
    timezone?: string;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface ScheduledExecution {
  id: string;
  scheduleId: string;
  workflowId: string;
  scheduledTime: string;
  actualStartTime?: string;
  completedTime?: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  retryCount: number;
}

class WorkflowScheduler {
  private schedules = new Map<string, ScheduleConfig>();
  private executions = new Map<string, ScheduledExecution>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Create a new schedule
   */
  createSchedule(schedule: ScheduleConfig): void {
    this.schedules.set(schedule.id, schedule);
    
    if (schedule.enabled) {
      this.activateSchedule(schedule.id);
    }
  }

  /**
   * Update schedule configuration
   */
  updateSchedule(scheduleId: string, updates: Partial<ScheduleConfig>): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(scheduleId, updatedSchedule);

    // Reactivate if necessary
    if (updatedSchedule.enabled) {
      this.deactivateSchedule(scheduleId);
      this.activateSchedule(scheduleId);
    } else {
      this.deactivateSchedule(scheduleId);
    }
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): void {
    this.deactivateSchedule(scheduleId);
    this.schedules.delete(scheduleId);
  }

  /**
   * Enable/disable schedule
   */
  setScheduleEnabled(scheduleId: string, enabled: boolean): void {
    this.updateSchedule(scheduleId, { enabled });
  }

  /**
   * Get all schedules
   */
  getSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get schedule by ID
   */
  getSchedule(scheduleId: string): ScheduleConfig | undefined {
    return this.schedules.get(scheduleId);
  }

  /**
   * Get schedules for a workflow
   */
  getWorkflowSchedules(workflowId: string): ScheduleConfig[] {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.workflowId === workflowId);
  }

  /**
   * Activate a schedule
   */
  private activateSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    // Clear existing timer
    this.deactivateSchedule(scheduleId);

    const nextExecution = this.calculateNextExecution(schedule);
    if (!nextExecution) return;

    const delay = new Date(nextExecution).getTime() - Date.now();
    
    if (delay > 0) {
      const timer = setTimeout(() => {
        this.executeScheduledWorkflow(scheduleId);
      }, delay);

      this.timers.set(scheduleId, timer);
    }
  }

  /**
   * Deactivate a schedule
   */
  private deactivateSchedule(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }
  }

  /**
   * Calculate next execution time
   */
  private calculateNextExecution(schedule: ScheduleConfig): string | null {
    const now = new Date();
    
    switch (schedule.schedule.type) {
      case 'once':
        const startDate = schedule.schedule.startDate;
        return startDate && new Date(startDate) > now ? startDate : null;

      case 'interval':
        // Simple interval implementation (in milliseconds)
        const interval = parseInt(schedule.schedule.expression || '0');
        return new Date(now.getTime() + interval).toISOString();

      case 'cron':
        // Mock cron calculation - in real implementation, use a cron library
        // For now, default to 1 hour from now
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      default:
        return null;
    }
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeScheduledWorkflow(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) return;

    const execution: ScheduledExecution = {
      id: `sched-exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scheduleId,
      workflowId: schedule.workflowId,
      scheduledTime: new Date().toISOString(),
      status: 'running',
      retryCount: 0,
    };

    this.executions.set(execution.id, execution);

    try {
      execution.actualStartTime = new Date().toISOString();
      
      // Mock workflow execution - replace with actual workflow engine call
      await this.mockWorkflowExecution(schedule.workflowId);
      
      execution.status = 'completed';
      execution.completedTime = new Date().toISOString();
      execution.result = { success: true };

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      // Handle retries
      if (schedule.retryConfig && execution.retryCount < schedule.retryConfig.maxRetries) {
        await this.scheduleRetry(execution, schedule);
      }
    }

    this.executions.set(execution.id, execution);

    // Schedule next execution if recurring
    if (schedule.schedule.type !== 'once') {
      this.activateSchedule(scheduleId);
    }
  }

  /**
   * Schedule a retry
   */
  private async scheduleRetry(execution: ScheduledExecution, schedule: ScheduleConfig): Promise<void> {
    if (!schedule.retryConfig) return;

    const delay = schedule.retryConfig.retryDelay * 
                  Math.pow(schedule.retryConfig.backoffMultiplier, execution.retryCount);

    setTimeout(() => {
      execution.retryCount++;
      execution.status = 'running';
      this.executeScheduledWorkflow(schedule.id);
    }, delay);
  }

  /**
   * Mock workflow execution
   */
  private async mockWorkflowExecution(workflowId: string): Promise<void> {
    // Mock implementation - replace with actual workflow engine integration
    console.log(`Executing scheduled workflow: ${workflowId}`);
    
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Random success/failure for testing
    if (Math.random() < 0.1) {
      throw new Error('Mock workflow execution failed');
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(scheduleId?: string): ScheduledExecution[] {
    const executions = Array.from(this.executions.values());
    
    if (scheduleId) {
      return executions.filter(exec => exec.scheduleId === scheduleId);
    }
    
    return executions.sort((a, b) => 
      b.scheduledTime.localeCompare(a.scheduledTime)
    );
  }

  /**
   * Cancel scheduled execution
   */
  cancelExecution(executionId: string): void {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'scheduled') {
      execution.status = 'cancelled';
      this.executions.set(executionId, execution);
    }
  }

  /**
   * Validate schedule configuration
   */
  validateScheduleConfig(schedule: Partial<ScheduleConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schedule.id) {
      errors.push('Schedule ID is required');
    }

    if (!schedule.workflowId) {
      errors.push('Workflow ID is required');
    }

    if (!schedule.name) {
      errors.push('Schedule name is required');
    }

    if (!schedule.schedule?.type) {
      errors.push('Schedule type is required');
    }

    if (schedule.schedule?.type === 'cron' && !schedule.schedule.expression) {
      errors.push('Cron schedule requires expression');
    }

    if (schedule.schedule?.type === 'interval' && !schedule.schedule.expression) {
      errors.push('Interval schedule requires expression');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get schedule statistics
   */
  getScheduleStats(): {
    totalSchedules: number;
    activeSchedules: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const schedules = Array.from(this.schedules.values());
    const executions = Array.from(this.executions.values());

    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.enabled).length,
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
    };
  }
}

export const workflowScheduler = new WorkflowScheduler();
export { WorkflowScheduler };